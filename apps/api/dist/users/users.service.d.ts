import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
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
    findByUsername(username: string): Promise<{
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
    findByEmail(email: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatar: string | null;
        profilePhoto: string | null;
        isEmailVerified: boolean;
        verificationToken: string | null;
        verificationExpires: Date | null;
        lastLoginAt: Date | null;
        emailVerifiedAt: Date | null;
        resetToken: string | null;
        resetTokenExpires: Date | null;
        resetExpires: Date | null;
        passwordChangedAt: Date | null;
        isPrivate: boolean;
        isActive: boolean;
        lastSeen: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<{
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
    changePassword(id: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
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
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    deactivateAccount(id: string): Promise<{
        message: string;
    }>;
}
