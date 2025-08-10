import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by username
   * @param username - Username
   * @returns User object
   */
  async findByUsername(username: string) {
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   * @param email - Email address
   * @returns User object
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Update user profile
   * @param id - User ID
   * @param updateProfileDto - Profile update data
   * @returns Updated user object
   */
  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const { username, bio, avatar } = updateProfileDto;

    // Check if username is being changed and if it's already taken
    if (username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
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

  /**
   * Change user password
   * @param id - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success message
   */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await argon2.verify(user.password, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Search users
   * @param searchUsersDto - Search parameters
   * @returns Paginated user results
   */
  async searchUsers(searchUsersDto: SearchUsersDto) {
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

  /**
   * Get user followers
   * @param id - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated followers
   */
  async getFollowers(id: string, page = 1, limit = 10) {
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

  /**
   * Get user following
   * @param id - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated following
   */
  async getFollowing(id: string, page = 1, limit = 10) {
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

  /**
   * Follow a user
   * @param followerId - Follower user ID
   * @param followingId - User to follow ID
   * @returns Success message
   */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return { message: 'User followed successfully' };
  }

  /**
   * Unfollow a user
   * @param followerId - Follower user ID
   * @param followingId - User to unfollow ID
   * @returns Success message
   */
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (!follow) {
      throw new BadRequestException('Not following this user');
    }

    await this.prisma.follow.delete({
      where: { id: follow.id },
    });

    return { message: 'User unfollowed successfully' };
  }

  /**
   * Check if user is following another user
   * @param followerId - Follower user ID
   * @param followingId - User to check if following
   * @returns Boolean indicating if following
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    return !!follow;
  }

  /**
   * Deactivate user account
   * @param id - User ID
   * @returns Success message
   */
  async deactivateAccount(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    return { message: 'Account deactivated successfully' };
  }
}