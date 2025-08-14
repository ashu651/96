import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const { content, mediaUrls, isPrivate } = createPostDto;

    const post = await this.prisma.post.create({
      data: {
        caption: content,
        isPrivate,
        authorId: userId,
        media: mediaUrls ? mediaUrls.map(url => ({ url })) : [],
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    return post;
  }

  async getPostById(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId && {
          likes: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.isPrivate && post.authorId !== userId) {
      throw new ForbiddenException('This post is private');
    }

    return {
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
      likes: undefined,
    };
  }

  async getPosts(getPostsDto: GetPostsDto, userId?: string) {
    const { page = 1, limit = 10, userId: authorId, search, isPrivate, hasMedia, sortBy, sortOrder } = getPostsDto;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.caption = { contains: search, mode: 'insensitive' };
    }

    if (isPrivate !== undefined) {
      where.isPrivate = isPrivate;
    } else {
      where.isPrivate = false; // Default to public posts
    }

    if (hasMedia) {
      where.media = { some: {} };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
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
              likes: true,
              comments: true,
            },
          },
          ...(userId && {
            likes: {
              where: { userId },
              select: { id: true },
            },
          }),
        },
        orderBy: this.getOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
      likes: undefined,
    }));

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getFeedPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get posts from followed users and user's own posts
    const followedUsers = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    
    const followedIds = followedUsers.map(f => f.followingId);
    followedIds.push(userId);
    
    const where = { 
      authorId: { in: followedIds },
      isPrivate: false 
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
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
              likes: true,
              comments: true,
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined,
    }));

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private getOrderBy(sortBy: string = 'createdAt', sortOrder: string = 'desc') {
    switch (sortBy) {
      case 'likes':
        return { _count: { likes: sortOrder as 'asc' | 'desc' } };
      case 'comments':
        return { _count: { comments: sortOrder as 'asc' | 'desc' } };
      case 'createdAt':
      default:
        return { createdAt: sortOrder as 'asc' | 'desc' };
    }
  }

  async updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        caption: updatePostDto.content,
        isPrivate: updatePostDto.isPrivate,
        updatedAt: new Date(),
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    return updatedPost;
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  async likePost(postId: string, userId: string) {
    const existingLike = await this.prisma.like.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    await this.prisma.like.create({
      data: { postId, userId },
    });

    return { message: 'Post liked successfully' };
  }

  async unlikePost(postId: string, userId: string) {
    const like = await this.prisma.like.findFirst({
      where: { postId, userId },
    });

    if (!like) {
      throw new BadRequestException('Post not liked');
    }

    await this.prisma.like.delete({
      where: { id: like.id },
    });

    return { message: 'Post unliked successfully' };
  }

  async getPostLikes(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.like.count({ where: { postId } }),
    ]);

    return {
      likes: likes.map(like => like.user),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPostComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async addComment(postId: string, userId: string, content: string) {
    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
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

    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
  }
}