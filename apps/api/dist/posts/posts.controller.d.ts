import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { AddCommentDto } from './dto/add-comment.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    createPost(userId: string, createPostDto: CreatePostDto): Promise<{
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isPrivate: boolean;
        updatedAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        authorId: string;
        location: string | null;
        hashtags: string[];
        isArchived: boolean;
    }>;
    getPosts(getPostsDto: GetPostsDto, userId?: string): Promise<{
        posts: {
            isLiked: boolean;
            likes: any;
            _count: {
                comments: number;
                likes: number;
            };
            author: {
                id: string;
                avatar: string;
                username: string;
            };
            id: string;
            createdAt: Date;
            isPrivate: boolean;
            updatedAt: Date;
            media: import("@prisma/client/runtime/library").JsonValue;
            caption: string | null;
            authorId: string;
            location: string | null;
            hashtags: string[];
            isArchived: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getFeed(userId: string, page?: number, limit?: number): Promise<{
        posts: {
            isLiked: boolean;
            likes: any;
            _count: {
                comments: number;
                likes: number;
            };
            author: {
                id: string;
                avatar: string;
                username: string;
            };
            id: string;
            createdAt: Date;
            isPrivate: boolean;
            updatedAt: Date;
            media: import("@prisma/client/runtime/library").JsonValue;
            caption: string | null;
            authorId: string;
            location: string | null;
            hashtags: string[];
            isArchived: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPost(postId: string, userId?: string): Promise<{
        isLiked: boolean;
        likes: any;
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            id: string;
            avatar: string;
            username: string;
            bio: string;
        };
        id: string;
        createdAt: Date;
        isPrivate: boolean;
        updatedAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        authorId: string;
        location: string | null;
        hashtags: string[];
        isArchived: boolean;
    }>;
    updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<{
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isPrivate: boolean;
        updatedAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue;
        caption: string | null;
        authorId: string;
        location: string | null;
        hashtags: string[];
        isArchived: boolean;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    likePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unlikePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    getPostLikes(postId: string, page?: number, limit?: number): Promise<{
        likes: {
            id: string;
            avatar: string;
            username: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPostComments(postId: string, page?: number, limit?: number): Promise<{
        comments: ({
            author: {
                id: string;
                avatar: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            content: string;
            isDeleted: boolean;
            postId: string;
            parentId: string | null;
            isEdited: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    addComment(postId: string, userId: string, addCommentDto: AddCommentDto): Promise<{
        author: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        content: string;
        isDeleted: boolean;
        postId: string;
        parentId: string | null;
        isEdited: boolean;
    }>;
    deleteComment(commentId: string, userId: string): Promise<{
        message: string;
    }>;
}
