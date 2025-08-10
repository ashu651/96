import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if both users exist
    const [follower, following] = await Promise.all([
      this.usersService.findById(followerId),
      this.usersService.findById(followingId),
    ]);

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }

    if (!following.isActive) {
      throw new BadRequestException('Cannot follow inactive user');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    // Create follow relationship
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

    // Note: Follower counts are derived from Follow relations
    // No need to update separate count fields

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    // Check if follow relationship exists
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new BadRequestException('Not following this user');
    }

    // Delete follow relationship
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // Note: Follower counts are derived from Follow relations
    // No need to update separate count fields

    return { message: 'Unfollowed successfully' };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
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

  async getFollowers(userId: string, page = 1, limit = 20) {
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

  async getFollowing(userId: string, page = 1, limit = 20) {
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

  async getMutualFollowers(userId1: string, userId2: string) {
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

  async getSuggestedUsers(userId: string, limit = 10) {
    // Get users that the current user is not following
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    const excludeIds = [...followingIds, userId];

    // Get suggested users based on mutual connections and activity
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

  // TODO: Implement when Block model is added to schema
  async blockUser(blockerId: string, blockedId: string) {
    throw new Error('Block functionality not yet implemented');
  }

  // TODO: Implement when Block model is added to schema
  async unblockUser(blockerId: string, blockedId: string) {
    throw new Error('Block functionality not yet implemented');
  }

  // TODO: Implement when Block model is added to schema
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    return false;
  }

  // TODO: Implement when Block model is added to schema
  async getBlockedUsers(userId: string, page = 1, limit = 20) {
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
}