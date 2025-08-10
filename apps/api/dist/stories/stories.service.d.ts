import { PrismaService } from '../prisma/prisma.service';
import { SocialService } from '../social/social.service';
export declare class StoriesService {
    private prisma;
    private socialService;
    constructor(prisma: PrismaService, socialService: SocialService);
    createStory(userId: string, mediaUrl: string, caption?: string): Promise<{
        author: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        expiresAt: Date;
        authorId: string;
    }>;
    getUserStories(userId: string, viewerId?: string): Promise<({
        author: {
            id: string;
            username: string;
            avatar: string;
        };
        views: {
            id: string;
            storyId: string;
            viewerId: string;
            viewedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        expiresAt: Date;
        authorId: string;
    })[]>;
    getFeedStories(userId: string): Promise<unknown[]>;
    viewStory(storyId: string, viewerId: string): Promise<{
        message: string;
    }>;
    deleteStory(storyId: string, userId: string): Promise<{
        message: string;
    }>;
    getStoryViews(storyId: string, userId: string): Promise<{
        id: string;
        storyId: string;
        viewerId: string;
        viewedAt: Date;
    }[]>;
    getStoryStats(userId: string, days?: number): Promise<{
        totalStories: number;
        totalViews: number;
        averageViews: number;
        dailyStats: {
            date: string;
            count: number;
        }[];
    }>;
    cleanupExpiredStories(): Promise<{
        deletedCount: number;
    }>;
    getTrendingStories(limit?: number): Promise<({
        _count: {
            views: number;
        };
        author: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        expiresAt: Date;
        authorId: string;
    })[]>;
}
