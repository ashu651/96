import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class SocialService {
    private prisma;
    private usersService;
    constructor(prisma: PrismaService, usersService: UsersService);
    followUser(followerId: string, followingId: string): Promise<{
        following: {
            id: string;
            username: string;
            avatar: string;
        };
        follower: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        isAccepted: boolean;
        followedAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowers(userId: string, page?: number, limit?: number): Promise<{
        followers: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getFollowing(userId: string, page?: number, limit?: number): Promise<{
        following: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getMutualFollowers(userId1: string, userId2: string): Promise<{
        mutualFollowers: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
        }[];
        count: number;
    }>;
    getSuggestedUsers(userId: string, limit?: number): Promise<{
        id: string;
        username: string;
        bio: string;
        avatar: string;
    }[]>;
    blockUser(blockerId: string, blockedId: string): Promise<void>;
    unblockUser(blockerId: string, blockedId: string): Promise<void>;
    isBlocked(userId1: string, userId2: string): Promise<boolean>;
    getBlockedUsers(userId: string, page?: number, limit?: number): Promise<{
        blocked: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
