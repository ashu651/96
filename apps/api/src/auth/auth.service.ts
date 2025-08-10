import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';

/**
 * Authentication service handling user registration, login, and token management
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private redisService: RedisService,
  ) {}

  /**
   * Registers a new user
   * @param registerDto - Registration data
   * @returns User information without sensitive data
   */
  async register(registerDto: RegisterDto) {
    const { email, username, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
      timeCost: 3,
      parallelism: 1,
    });

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          verificationToken,
          verificationExpires,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      // Send verification email
      await this.emailService.sendEmailVerification(
        user.email,
        verificationToken,
      );

      return {
        message: 'Registration successful. Please check your email to verify your account.',
        user,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  /**
   * Authenticates user and generates tokens
   * @param loginDto - Login credentials
   * @param response - Express response object for setting cookies
   * @returns User information and tokens
   */
  async login(loginDto: LoginDto, response: Response) {
    const { username, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: username.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        isActive: true,
        isEmailVerified: true,
        avatar: true,
        bio: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    // Create or update session
    await this.createOrUpdateSession(user.id, refreshToken);

    // Set refresh token as HTTP-only cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
              secure: this.configService.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
              expiresIn: this.configService.jwtAccessExpiresIn,
    };
  }

  /**
   * Refreshes access token using refresh token
   * @param refreshDto - Refresh token data
   * @param response - Express response object
   * @returns New access token
   */
  async refresh(refreshDto: RefreshDto, response: Response) {
    const { refreshToken } = refreshDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.jwtRefreshSecret,
      });

      // Check if session exists and is valid
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!session.user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        session.user.id,
      );

      // Update session with new refresh token
      await this.updateSession(session.id, newRefreshToken);

      // Set new refresh token cookie
      response.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: this.configService.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        accessToken,
        expiresIn: this.configService.jwtAccessExpiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logs out user and invalidates session
   * @param userId - User ID
   * @param response - Express response object
   */
  async logout(userId: string, response: Response) {
    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    // Invalidate all user sessions
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Verifies user email using verification token
   * @param token - Verification token
   * @returns Success message
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() },
        isEmailVerified: false,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationExpires: null,
        emailVerifiedAt: new Date(),
      },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Sends password reset email
   * @param email - User's email address
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
    );

    return { message: 'Password reset email sent' };
  }

  /**
   * Resets user password using reset token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Success message
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    // Invalidate all user sessions
    await this.prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Generates access and refresh tokens
   * @param userId - User ID
   * @returns Object containing access and refresh tokens
   */
  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.jwtSecret,
      expiresIn: this.configService.jwtExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.jwtSecret,
      expiresIn: this.configService.jwtExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Creates or updates user session
   * @param userId - User ID
   * @param refreshToken - Refresh token
   */
  private async createOrUpdateSession(userId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // First try to find an existing session for this user
    const existingSession = await this.prisma.session.findFirst({
      where: { userId },
    });

    if (existingSession) {
      // Update existing session
      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: {
          refreshToken,
          expiresAt,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Create new session
      await this.prisma.session.create({
        data: {
          userId,
          refreshToken,
          expiresAt,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }
  }

  /**
   * Updates existing session with new refresh token
   * @param sessionId - Session ID
   * @param refreshToken - New refresh token
   */
  private async updateSession(sessionId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }
}