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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const argon2 = require("argon2");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                isEmailVerified: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                isEmailVerified: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }
    async updateProfile(id, updateProfileDto) {
        const { username, bio, avatar } = updateProfileDto;
        if (username) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    username: username.toLowerCase(),
                    NOT: { id },
                },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Username already taken');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...(username && { username: username.toLowerCase() }),
                ...(bio !== undefined && { bio }),
                ...(avatar !== undefined && { avatar }),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        return updatedUser;
    }
    async changePassword(id, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { password: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await argon2.verify(user.password, currentPassword);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const hashedNewPassword = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });
        await this.prisma.user.update({
            where: { id },
            data: {
                password: hashedNewPassword,
                passwordChangedAt: new Date(),
            },
        });
        return { message: 'Password changed successfully' };
    }
    async searchUsers(searchUsersDto) {
        const { query, page = 1, limit = 10 } = searchUsersDto;
        const skip = (page - 1) * limit;
        const where = query
            ? {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { bio: { contains: query, mode: 'insensitive' } },
                ],
                isActive: true,
                isEmailVerified: true,
            }
            : { isActive: true, isEmailVerified: true };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    bio: true,
                    avatar: true,
                    createdAt: true,
                    _count: {
                        select: {
                            posts: true,
                            followers: true,
                            following: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getFollowers(id, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [followers, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    following: {
                        some: { followingId: id },
                    },
                    isActive: true,
                },
                select: {
                    id: true,
                    username: true,
                    bio: true,
                    avatar: true,
                    createdAt: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({
                where: {
                    following: {
                        some: { followingId: id },
                    },
                    isActive: true,
                },
            }),
        ]);
        return {
            followers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getFollowing(id, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [following, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    followers: {
                        some: { followerId: id },
                    },
                    isActive: true,
                },
                select: {
                    id: true,
                    username: true,
                    bio: true,
                    avatar: true,
                    createdAt: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({
                where: {
                    followers: {
                        some: { followerId: id },
                    },
                    isActive: true,
                },
            }),
        ]);
        return {
            following,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async followUser(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.BadRequestException('Cannot follow yourself');
        }
        const existingFollow = await this.prisma.follow.findFirst({
            where: {
                followerId,
                followingId,
            },
        });
        if (existingFollow) {
            throw new common_1.BadRequestException('Already following this user');
        }
        await this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
        return { message: 'User followed successfully' };
    }
    async unfollowUser(followerId, followingId) {
        const follow = await this.prisma.follow.findFirst({
            where: {
                followerId,
                followingId,
            },
        });
        if (!follow) {
            throw new common_1.BadRequestException('Not following this user');
        }
        await this.prisma.follow.delete({
            where: { id: follow.id },
        });
        return { message: 'User unfollowed successfully' };
    }
    async isFollowing(followerId, followingId) {
        const follow = await this.prisma.follow.findFirst({
            where: {
                followerId,
                followingId,
            },
        });
        return !!follow;
    }
    async deactivateAccount(id) {
        await this.prisma.user.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
        return { message: 'Account deactivated successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map