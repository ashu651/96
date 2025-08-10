import { SocialService } from './social.service';
export declare class SocialController {
    private readonly socialService;
    constructor(socialService: SocialService);
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
    getMutualFollowers(currentUserId: string, otherUserId: string): Promise<{
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
    isFollowing(followerId: string, followingId: string): Promise<{
        following: boolean;
    }>;
    blockUser(blockerId: string, blockedId: string): Promise<void>;
    unblockUser(blockerId: string, blockedId: string): Promise<void>;
    getBlockedUsers(userId: string, page?: number, limit?: number): Promise<{
        blocked: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    isBlocked(currentUserId: string, otherUserId: string): Promise<{
        blocked: boolean;
    }>;
}
