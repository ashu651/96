import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

/**
 * JWT refresh strategy for validating refresh tokens
 * Extracts token from cookies and validates it
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * Validates the refresh token and returns user information
   * @param req - Express request object
   * @param payload - Decoded JWT payload
   * @returns User object if valid
   */
  async validate(req: Request, payload: any) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Check if refresh token exists in database and is valid
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isActive: true,
              isEmailVerified: true,
            },
          },
        },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      if (!session.user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      if (!session.user.isEmailVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      return {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        sessionId: session.id,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}