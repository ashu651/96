"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const config_service_1 = require("../config/config.service");
const argon2 = require("argon2");
const uuid_1 = require("uuid");
const email_service_1 = require("../email/email.service");
const redis_service_1 = require("../redis/redis.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService, emailService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
        this.redisService = redisService;
    }
    async register(registerDto) {
        const { email, username, password, firstName, lastName } = registerDto;
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
                throw new common_1.ConflictException('Email already registered');
            }
            throw new common_1.ConflictException('Username already taken');
        }
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });
        const verificationToken = (0, uuid_1.v4)();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        try {
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
            await this.emailService.sendEmailVerification(user.email, verificationToken);
            return {
                message: 'Registration successful. Please check your email to verify your account.',
                user,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to create user account');
        }
    }
    async login(loginDto, response) {
        const { username, password } = loginDto;
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
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Please verify your email first');
        }
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user.id);
        await this.createOrUpdateSession(user.id, refreshToken);
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: this.configService.isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
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
    async refresh(refreshDto, response) {
        const { refreshToken } = refreshDto;
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.jwtRefreshSecret,
            });
            const session = await this.prisma.session.findUnique({
                where: { refreshToken },
                include: { user: true },
            });
            if (!session || !session.isActive || session.expiresAt < new Date()) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (!session.user.isActive) {
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(session.user.id);
            await this.updateSession(session.id, newRefreshToken);
            response.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: this.configService.isProduction,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return {
                accessToken,
                expiresIn: this.configService.jwtAccessExpiresIn,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, response) {
        response.clearCookie('refreshToken');
        await this.prisma.session.updateMany({
            where: { userId },
            data: { isActive: false },
        });
        return { message: 'Logged out successfully' };
    }
    async verifyEmail(token) {
        const user = await this.prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationExpires: { gt: new Date() },
                isEmailVerified: false,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
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
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            return { message: 'If an account exists, a password reset email has been sent' };
        }
        const resetToken = (0, uuid_1.v4)();
        const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetExpires,
            },
        });
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);
        return { message: 'Password reset email sent' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
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
        await this.prisma.session.updateMany({
            where: { userId: user.id },
            data: { isActive: false },
        });
        return { message: 'Password reset successfully' };
    }
    async generateTokens(userId) {
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
    async createOrUpdateSession(userId, refreshToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const existingSession = await this.prisma.session.findFirst({
            where: { userId },
        });
        if (existingSession) {
            await this.prisma.session.update({
                where: { id: existingSession.id },
                data: {
                    refreshToken,
                    expiresAt,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
            });
        }
        else {
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
    async updateSession(sessionId, refreshToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                refreshToken,
                expiresAt,
                lastUsedAt: new Date(),
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_service_1.ConfigService,
        email_service_1.EmailService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map