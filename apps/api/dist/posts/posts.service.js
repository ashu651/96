"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(userId, createPostDto) {
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
    async getPostById(postId, userId) {
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
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.isPrivate && post.authorId !== userId) {
            throw new common_1.ForbiddenException('This post is private');
        }
        return {
            ...post,
            isLiked: userId ? post.likes.length > 0 : false,
            likes: undefined,
        };
    }
    async getPosts(getPostsDto, userId) {
        const { page = 1, limit = 10, userId: authorId, search, isPrivate, hasMedia, sortBy, sortOrder } = getPostsDto;
        const skip = (page - 1) * limit;
        let where = {};
        if (authorId) {
            where.authorId = authorId;
        }
        if (search) {
            where.caption = { contains: search, mode: 'insensitive' };
        }
        if (isPrivate !== undefined) {
            where.isPrivate = isPrivate;
        }
        else {
            where.isPrivate = false;
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
    async getFeedPosts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
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
    getOrderBy(sortBy = 'createdAt', sortOrder = 'desc') {
        switch (sortBy) {
            case 'likes':
                return { _count: { likes: sortOrder } };
            case 'comments':
                return { _count: { comments: sortOrder } };
            case 'createdAt':
            default:
                return { createdAt: sortOrder };
        }
    }
    async updatePost(postId, userId, updatePostDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own posts');
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
    async deletePost(postId, userId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.prisma.post.delete({
            where: { id: postId },
        });
        return { message: 'Post deleted successfully' };
    }
    async likePost(postId, userId) {
        const existingLike = await this.prisma.like.findFirst({
            where: { postId, userId },
        });
        if (existingLike) {
            throw new common_1.BadRequestException('Post already liked');
        }
        await this.prisma.like.create({
            data: { postId, userId },
        });
        return { message: 'Post liked successfully' };
    }
    async unlikePost(postId, userId) {
        const like = await this.prisma.like.findFirst({
            where: { postId, userId },
        });
        if (!like) {
            throw new common_1.BadRequestException('Post not liked');
        }
        await this.prisma.like.delete({
            where: { id: like.id },
        });
        return { message: 'Post unliked successfully' };
    }
    async getPostLikes(postId, page = 1, limit = 20) {
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
    async getPostComments(postId, page = 1, limit = 20) {
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
    async addComment(postId, userId, content) {
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
    async deleteComment(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.prisma.comment.delete({
            where: { id: commentId },
        });
        return { message: 'Comment deleted successfully' };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map