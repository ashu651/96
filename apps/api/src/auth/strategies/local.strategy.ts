import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

/**
 * Local strategy for username/password authentication
 * Validates credentials against database
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * Validates user credentials
   * @param email - User's email address
   * @param password - User's password
   * @returns User object if credentials are valid
   */
  async validate(email: string, password: string) {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
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

      // Update last login timestamp
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}