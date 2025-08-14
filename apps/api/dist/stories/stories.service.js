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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const social_service_1 = require("../social/social.service");
let StoriesService = class StoriesService {
    constructor(prisma, socialService) {
        this.prisma = prisma;
        this.socialService = socialService;
    }
    async createStory(userId, mediaUrl, caption) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new common_1.BadRequestException('User not found or inactive');
        }
        const story = await this.prisma.story.create({
            data: {
                media: { url: mediaUrl },
                caption,
                authorId: userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        return story;
    }
    async getUserStories(userId, viewerId) {
        if (viewerId && viewerId !== userId) {
            const isBlocked = await this.socialService.isBlocked(viewerId, userId);
            if (isBlocked) {
                throw new common_1.ForbiddenException('Cannot view stories from blocked user');
            }
        }
        const stories = await this.prisma.story.findMany({
            where: {
                authorId: userId,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                views: viewerId ? {
                    where: { viewerId },
                    select: { id: true, viewedAt: true },
                } : false,
            },
        });
        return stories;
    }
    async getFeedStories(userId) {
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId);
        const stories = await this.prisma.story.findMany({
            where: {
                authorId: { in: followingIds },
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                views: {
                    where: { viewerId: userId },
                    select: { id: true, viewedAt: true },
                },
            },
        });
        const storiesByAuthor = stories.reduce((acc, story) => {
            const authorId = story.author.id;
            if (!acc[authorId]) {
                acc[authorId] = {
                    author: story.author,
                    stories: [],
                };
            }
            acc[authorId].stories.push(story);
            return acc;
        }, {});
        return Object.values(storiesByAuthor);
    }
    async viewStory(storyId, viewerId) {
        const story = await this.prisma.story.findFirst({
            where: {
                id: storyId,
                expiresAt: { gt: new Date() },
            },
            include: {
                author: {
                    select: { id: true },
                },
            },
        });
        if (!story) {
            throw new common_1.NotFoundException('Story not found or expired');
        }
        if (story.author.id !== viewerId) {
            const isBlocked = await this.socialService.isBlocked(viewerId, story.author.id);
            if (isBlocked) {
                throw new common_1.ForbiddenException('Cannot view story from blocked user');
            }
        }
        const existingView = await this.prisma.storyView.findUnique({
            where: {
                storyId_viewerId: {
                    storyId,
                    viewerId,
                },
            },
        });
        if (!existingView) {
            await this.prisma.storyView.create({
                data: {
                    storyId,
                    viewerId,
                },
            });
        }
        return { message: 'Story viewed successfully' };
    }
    async deleteStory(storyId, userId) {
        const story = await this.prisma.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new common_1.NotFoundException('Story not found');
        }
        if (story.authorId !== userId) {
            throw new common_1.ForbiddenException('Cannot delete another user\'s story');
        }
        await this.prisma.storyView.deleteMany({
            where: { storyId },
        });
        await this.prisma.story.delete({
            where: { id: storyId },
        });
        return { message: 'Story deleted successfully' };
    }
    async getStoryViews(storyId, userId) {
        const story = await this.prisma.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new common_1.NotFoundException('Story not found');
        }
        if (story.authorId !== userId) {
            throw new common_1.ForbiddenException('Cannot view story analytics for another user\'s story');
        }
        const views = await this.prisma.storyView.findMany({
            where: { storyId },
            orderBy: { viewedAt: 'desc' },
        });
        return views;
    }
    async getStoryStats(userId, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [totalStories, totalViews, storiesByDay] = await Promise.all([
            this.prisma.story.count({
                where: {
                    authorId: userId,
                    createdAt: { gte: startDate },
                },
            }),
            this.prisma.storyView.count({
                where: {
                    story: {
                        authorId: userId,
                        createdAt: { gte: startDate },
                    },
                },
            }),
            this.prisma.story.groupBy({
                by: ['createdAt'],
                where: {
                    authorId: userId,
                    createdAt: { gte: startDate },
                },
                _count: {
                    id: true,
                },
            }),
        ]);
        const dailyStats = storiesByDay.map(day => ({
            date: day.createdAt.toISOString().split('T')[0],
            count: day._count.id,
        }));
        return {
            totalStories,
            totalViews,
            averageViews: totalStories > 0 ? Math.round(totalViews / totalStories) : 0,
            dailyStats,
        };
    }
    async cleanupExpiredStories() {
        const expiredStories = await this.prisma.story.findMany({
            where: {
                expiresAt: { lte: new Date() },
            },
            select: { id: true },
        });
        if (expiredStories.length > 0) {
            const storyIds = expiredStories.map(story => story.id);
            await this.prisma.storyView.deleteMany({
                where: {
                    storyId: { in: storyIds },
                },
            });
            await this.prisma.story.deleteMany({
                where: {
                    id: { in: storyIds },
                },
            });
        }
        return { deletedCount: expiredStories.length };
    }
    async getTrendingStories(limit = 10) {
        const trendingStories = await this.prisma.story.findMany({
            where: {
                expiresAt: { gt: new Date() },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        views: true,
                    },
                },
            },
            orderBy: [
                { createdAt: 'desc' },
            ],
            take: limit,
        });
        return trendingStories;
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        social_service_1.SocialService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map