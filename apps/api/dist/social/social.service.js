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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let SocialService = class SocialService {
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async followUser(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.BadRequestException('You cannot follow yourself');
        }
        const [follower, following] = await Promise.all([
            this.usersService.findById(followerId),
            this.usersService.findById(followingId),
        ]);
        if (!follower || !following) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!following.isActive) {
            throw new common_1.BadRequestException('Cannot follow inactive user');
        }
        const existingFollow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        if (existingFollow) {
            throw new common_1.BadRequestException('Already following this user');
        }
        const follow = await this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                following: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        return follow;
    }
    async unfollowUser(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.BadRequestException('You cannot unfollow yourself');
        }
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        if (!follow) {
            throw new common_1.BadRequestException('Not following this user');
        }
        await this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        return { message: 'Unfollowed successfully' };
    }
    async isFollowing(followerId, followingId) {
        if (followerId === followingId) {
            return false;
        }
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        return !!follow;
    }
    async getFollowers(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId },
                skip,
                take: limit,
                orderBy: { followedAt: 'desc' },
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            bio: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({
                where: { followingId: userId },
            }),
        ]);
        return {
            followers: followers.map(f => f.follower),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getFollowing(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                skip,
                take: limit,
                orderBy: { followedAt: 'desc' },
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            bio: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({
                where: { followerId: userId },
            }),
        ]);
        return {
            following: following.map(f => f.following),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getMutualFollowers(userId1, userId2) {
        const [user1Followers, user2Followers] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId1 },
                select: { followerId: true },
            }),
            this.prisma.follow.findMany({
                where: { followingId: userId2 },
                select: { followerId: true },
            }),
        ]);
        const user1FollowerIds = new Set(user1Followers.map(f => f.followerId));
        const mutualIds = user2Followers
            .map(f => f.followerId)
            .filter(id => user1FollowerIds.has(id));
        if (mutualIds.length === 0) {
            return { mutualFollowers: [], count: 0 };
        }
        const mutualFollowers = await this.prisma.user.findMany({
            where: { id: { in: mutualIds } },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
            },
        });
        return {
            mutualFollowers,
            count: mutualFollowers.length,
        };
    }
    async getSuggestedUsers(userId, limit = 10) {
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);
        const excludeIds = [...followingIds, userId];
        const suggestedUsers = await this.prisma.user.findMany({
            where: {
                id: { notIn: excludeIds },
                isActive: true,
                isEmailVerified: true,
            },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
            },
            orderBy: [
                { createdAt: 'desc' },
            ],
            take: limit,
        });
        return suggestedUsers;
    }
    async blockUser(blockerId, blockedId) {
        throw new Error('Block functionality not yet implemented');
    }
    async unblockUser(blockerId, blockedId) {
        throw new Error('Block functionality not yet implemented');
    }
    async isBlocked(userId1, userId2) {
        return false;
    }
    async getBlockedUsers(userId, page = 1, limit = 20) {
        return {
            blocked: [],
            pagination: {
                page,
                limit,
                total: 0,
                pages: 0,
            },
        };
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], SocialService);
//# sourceMappingURL=social.service.js.map