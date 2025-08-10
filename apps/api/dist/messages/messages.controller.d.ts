import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    sendMessage(senderId: string, sendMessageDto: SendMessageDto): Promise<{
        sender: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        media: import("@prisma/client/runtime/library").JsonValue | null;
        content: string;
        type: string;
        isRead: boolean;
        isDeleted: boolean;
        conversationId: string;
        senderId: string;
        recipientId: string;
    }>;
    getConversations(userId: string, page?: number, limit?: number): Promise<{
        conversations: {
            id: string;
            otherParticipant: {
                id: string;
                username: string;
                avatar: string;
            };
            lastMessage: {
                id: string;
                createdAt: Date;
                content: string;
                senderId: string;
            };
            unreadCount: number;
            lastMessageAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getMessages(userId: string, conversationId: string, page?: number, limit?: number): Promise<{
        messages: ({
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            media: import("@prisma/client/runtime/library").JsonValue | null;
            content: string;
            type: string;
            isRead: boolean;
            isDeleted: boolean;
            conversationId: string;
            senderId: string;
            recipientId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    deleteMessage(userId: string, messageId: string): Promise<{
        message: string;
    }>;
    deleteConversation(userId: string, conversationId: string): Promise<{
        message: string;
    }>;
    markConversationAsRead(userId: string, conversationId: string): Promise<{
        message: string;
    }>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    searchMessages(userId: string, query: string, page?: number, limit?: number): Promise<{
        messages: ({
            conversation: {
                id: string;
                participants: {
                    userId: string;
                }[];
            };
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            media: import("@prisma/client/runtime/library").JsonValue | null;
            content: string;
            type: string;
            isRead: boolean;
            isDeleted: boolean;
            conversationId: string;
            senderId: string;
            recipientId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
