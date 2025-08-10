import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto, PostSortBy, PostSortOrder } from './dto/query-posts.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new post
   */
  async create(userId: string, createPostDto: CreatePostDto) {
    const { hashtags, media, ...postData } = createPostDto;

    // Process hashtags - extract from content and merge with provided hashtags
    const extractedHashtags = this.extractHashtagsFromContent(postData.content);
    const allHashtags = [...new Set([...extractedHashtags, ...(hashtags || [])])];

    // Create post with hashtags and media
    const post = await this.prisma.post.create({
      data: {
        ...postData,
        authorId: userId,
        hashtags: allHashtags,
        media: media || [],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    return post;
  }

  /**
   * Get all posts with filtering and pagination
   */
  async findAll(query: QueryPostsDto, currentUserId?: string) {
    const { page = 1, limit = 20, search, userId, username, hashtag, location, sortBy, sortOrder, hasMedia, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublic: true, // Only show public posts by default
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { hashtags: { hasSome: [search] } },
      ];
    }

    if (userId) {
      where.authorId = userId;
    }

    if (username) {
      where.author = { username };
    }

    if (hashtag) {
      where.hashtags = { has: hashtag };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (hasMedia !== undefined) {
      if (hasMedia) {
        where.media = { isEmpty: false };
      } else {
        where.media = { isEmpty: true };
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Build order clause
    const orderBy: any = {};
    if (sortBy === PostSortBy.LIKES_COUNT) {
      orderBy.likes = { _count: sortOrder };
    } else if (sortBy === PostSortBy.COMMENTS_COUNT) {
      orderBy.comments = { _count: sortOrder };
    } else if (sortBy === PostSortBy.SHARES_COUNT) {
      orderBy.shares = { _count: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
          // Include user's like status if authenticated
          ...(currentUserId && {
            likes: {
              where: { userId: currentUserId },
              select: { id: true },
            },
          }),
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Transform posts to include like status
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: currentUserId ? post.likes.length > 0 : false,
      likes: undefined, // Remove likes array from response
    }));

    return {
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single post by ID
   */
  async findOne(id: string, currentUserId?: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { authorId: currentUserId }, // Allow author to see their private posts
        ],
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
        // Include user's like status if authenticated
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Transform post to include like status
    const transformedPost = {
      ...post,
      isLiked: currentUserId ? post.likes.length > 0 : false,
      likes: undefined, // Remove likes array from response
    };

    return transformedPost;
  }

  /**
   * Update a post
   */
  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    // Check if post exists and user owns it
    const existingPost = await this.prisma.post.findFirst({
      where: { id, authorId: userId, deletedAt: null },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found or you do not have permission to edit it');
    }

    const { hashtags, media, ...postData } = updatePostDto;

    // Process hashtags if content is being updated
    let processedHashtags = existingPost.hashtags;
    if (postData.content) {
      const extractedHashtags = this.extractHashtagsFromContent(postData.content);
      processedHashtags = [...new Set([...extractedHashtags, ...(hashtags || [])])];
    } else if (hashtags) {
      processedHashtags = hashtags;
    }

    // Update post
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        hashtags: processedHashtags,
        media: media !== undefined ? media : existingPost.media,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    return updatedPost;
  }

  /**
   * Delete a post (soft delete)
   */
  async remove(id: string, userId: string) {
    // Check if post exists and user owns it
    const existingPost = await this.prisma.post.findFirst({
      where: { id, authorId: userId, deletedAt: null },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found or you do not have permission to delete it');
    }

    // Soft delete the post
    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Post deleted successfully' };
  }

  /**
   * Get user's feed (posts from followed users and own posts)
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get user's following list
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Get posts from followed users and own posts
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          OR: [
            { authorId: { in: followingIds } },
            { authorId: userId },
          ],
          isPublic: true,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          OR: [
            { authorId: { in: followingIds } },
            { authorId: userId },
          ],
          isPublic: true,
          deletedAt: null,
        },
      }),
    ]);

    // Transform posts to include like status
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined, // Remove likes array from response
    }));

    return {
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get trending posts (most liked/commented in recent time)
   */
  async getTrending(limit: number = 10) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: { gte: oneWeekAgo },
        isPublic: true,
        deletedAt: null,
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    return posts;
  }

  /**
   * Extract hashtags from post content
   */
  private extractHashtagsFromContent(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }

  /**
   * Get posts by hashtag
   */
  async getByHashtag(hashtag: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          hashtags: { has: hashtag },
          isPublic: true,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          hashtags: { has: hashtag },
          isPublic: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get posts by location
   */
  async getByLocation(location: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          location: { contains: location, mode: 'insensitive' },
          isPublic: true,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          location: { contains: location, mode: 'insensitive' },
          isPublic: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}