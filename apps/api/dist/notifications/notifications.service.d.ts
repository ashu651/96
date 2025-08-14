import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare enum NotificationType {
    FOLLOW = "FOLLOW",
    LIKE = "LIKE",
    COMMENT = "COMMENT",
    MENTION = "MENTION",
    MESSAGE = "MESSAGE",
    STORY_VIEW = "STORY_VIEW",
    VERIFICATION = "VERIFICATION",
    SYSTEM = "SYSTEM"
}
export interface NotificationData {
    type: NotificationType;
    recipientId: string;
    senderId?: string;
    postId?: string;
    commentId?: string;
    storyId?: string;
    messageId?: string;
    content?: string;
    metadata?: Record<string, any>;
}
export declare class NotificationsService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    createNotification(data: NotificationData): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: ({
            sender: {
                id: string;
                avatar: string;
                username: string;
            };
        } & {
            data: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            type: string;
            createdAt: Date;
            userId: string;
            title: string;
            body: string;
            postId: string | null;
            commentId: string | null;
            storyId: string | null;
            messageId: string | null;
            isRead: boolean;
            senderId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    deleteNotification(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
    deleteAllNotifications(userId: string): Promise<{
        message: string;
    }>;
    updateNotificationPreferences(userId: string, preferences: Record<string, boolean>): Promise<void>;
    getNotificationPreferences(userId: string): Promise<void>;
    private shouldCreateNotification;
    private shouldSendEmail;
    private sendEmailNotification;
    private getNotificationTitle;
    private getNotificationBody;
    notifyFollow(followerId: string, followingId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyLike(likerId: string, postId: string, postAuthorId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyComment(commenterId: string, postId: string, postAuthorId: string, commentContent: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyMention(mentionerId: string, mentionedUserId: string, postId: string, content: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyMessage(senderId: string, recipientId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyStoryView(viewerId: string, storyId: string, storyAuthorId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifyVerification(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
    notifySystem(userId: string, content: string, metadata?: Record<string, any>): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        sender: {
            id: string;
            avatar: string;
            username: string;
        };
    } & {
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        type: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        postId: string | null;
        commentId: string | null;
        storyId: string | null;
        messageId: string | null;
        isRead: boolean;
        senderId: string | null;
    }>;
}
