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
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const prisma_service_1 = require("../../prisma/prisma.service");
const argon2 = require("argon2");
let LocalStrategy = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    constructor(prisma) {
        super({
            usernameField: 'email',
        });
        this.prisma = prisma;
    }
    async validate(email, password) {
        try {
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
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map