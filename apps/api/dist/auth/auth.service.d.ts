import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private emailService;
    private redisService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, emailService: EmailService, redisService: RedisService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: string;
            createdAt: Date;
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    login(loginDto: LoginDto, response: Response): Promise<{
        user: {
            id: string;
            avatar: string;
            username: string;
            email: string;
            bio: string;
            isEmailVerified: boolean;
            isActive: boolean;
        };
        accessToken: string;
        expiresIn: string;
    }>;
    refresh(refreshDto: RefreshDto, response: Response): Promise<{
        accessToken: string;
        expiresIn: string;
    }>;
    logout(userId: string, response: Response): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private createOrUpdateSession;
    private updateSession;
}
