import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    searchUsers(searchUsersDto: SearchUsersDto): Promise<{
        users: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
            createdAt: Date;
            _count: {
                posts: number;
                followers: number;
                following: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        bio: string;
        avatar: string;
        isEmailVerified: boolean;
        lastLoginAt: Date;
        isActive: boolean;
        createdAt: Date;
        _count: {
            posts: number;
            followers: number;
            following: number;
        };
    }>;
    getUserByUsername(username: string): Promise<{
        id: string;
        username: string;
        email: string;
        bio: string;
        avatar: string;
        isEmailVerified: boolean;
        lastLoginAt: Date;
        createdAt: Date;
        _count: {
            posts: number;
            followers: number;
            following: number;
        };
    }>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        username: string;
        email: string;
        bio: string;
        avatar: string;
        isEmailVerified: boolean;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getFollowers(id: string, page?: number, limit?: number): Promise<{
        followers: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getFollowing(id: string, page?: number, limit?: number): Promise<{
        following: {
            id: string;
            username: string;
            bio: string;
            avatar: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    followUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    unfollowUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    isFollowing(followerId: string, followingId: string): Promise<{
        isFollowing: boolean;
    }>;
    deactivateAccount(userId: string): Promise<{
        message: string;
    }>;
}
