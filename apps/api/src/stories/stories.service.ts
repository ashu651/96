import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocialService } from '../social/social.service';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private socialService: SocialService,
  ) {}

  async createStory(userId: string, mediaUrl: string, caption?: string) {
    // Check if user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('User not found or inactive');
    }

    // Create story
    const story = await this.prisma.story.create({
      data: {
        media: { url: mediaUrl },
        caption,
        authorId: userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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

  async getUserStories(userId: string, viewerId?: string) {
    // Check if viewer can see the stories (not blocked)
    if (viewerId && viewerId !== userId) {
      const isBlocked = await this.socialService.isBlocked(viewerId, userId);
      if (isBlocked) {
        throw new ForbiddenException('Cannot view stories from blocked user');
      }
    }

    const stories = await this.prisma.story.findMany({
      where: {
        authorId: userId,
        expiresAt: { gt: new Date() }, // Only non-expired stories
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

  async getFeedStories(userId: string) {
    // Get users that the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Include own stories

    // Get stories from followed users and self
    const stories = await this.prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        expiresAt: { gt: new Date() }, // Only non-expired stories
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

    // Group stories by author
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

  async viewStory(storyId: string, viewerId: string) {
    // Check if story exists and is not expired
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
      throw new NotFoundException('Story not found or expired');
    }

    // Check if viewer is blocked by story author
    if (story.author.id !== viewerId) {
      const isBlocked = await this.socialService.isBlocked(viewerId, story.author.id);
      if (isBlocked) {
        throw new ForbiddenException('Cannot view story from blocked user');
      }
    }

    // Check if already viewed
    const existingView = await this.prisma.storyView.findUnique({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
    });

    if (!existingView) {
      // Create view
      await this.prisma.storyView.create({
        data: {
          storyId,
          viewerId,
        },
      });
    }

    return { message: 'Story viewed successfully' };
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s story');
    }

    // Delete story views first
    await this.prisma.storyView.deleteMany({
      where: { storyId },
    });

    // Delete the story
    await this.prisma.story.delete({
      where: { id: storyId },
    });

    return { message: 'Story deleted successfully' };
  }

  async getStoryViews(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('Cannot view story analytics for another user\'s story');
    }

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
    });

    return views;
  }

  async getStoryStats(userId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalStories, totalViews, storiesByDay] = await Promise.all([
      // Total stories created in the period
      this.prisma.story.count({
        where: {
          authorId: userId,
          createdAt: { gte: startDate },
        },
      }),
      // Total views received in the period
      this.prisma.storyView.count({
        where: {
          story: {
            authorId: userId,
            createdAt: { gte: startDate },
          },
        },
      }),
      // Stories created per day
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

    // Format daily stats
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

      // Delete story views first
      await this.prisma.storyView.deleteMany({
        where: {
          storyId: { in: storyIds },
        },
      });

      // Delete expired stories
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
        expiresAt: { gt: new Date() }, // Only non-expired stories
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
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
}