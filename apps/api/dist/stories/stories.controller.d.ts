import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesController {
    private readonly storiesService;
    constructor(storiesService: StoriesService);
    createStory(userId: string, createStoryDto: CreateStoryDto): Promise<{
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
    getFeedStories(userId: string): Promise<unknown[]>;
    getUserStories(viewerId: string, userId: string): Promise<({
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
    viewStory(viewerId: string, storyId: string): Promise<{
        message: string;
    }>;
    deleteStory(userId: string, storyId: string): Promise<{
        message: string;
    }>;
    getStoryViews(userId: string, storyId: string): Promise<{
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
    cleanupExpiredStories(): Promise<{
        deletedCount: number;
    }>;
}
