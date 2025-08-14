import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string, page?: number, limit?: number): Promise<{
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
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    deleteNotification(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    deleteAllNotifications(userId: string): Promise<{
        message: string;
    }>;
    getPreferences(userId: string): Promise<void>;
    updatePreferences(userId: string, preferences: UpdatePreferencesDto): Promise<void>;
}
