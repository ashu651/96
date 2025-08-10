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
exports.NotificationsService = exports.NotificationType = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
var NotificationType;
(function (NotificationType) {
    NotificationType["FOLLOW"] = "FOLLOW";
    NotificationType["LIKE"] = "LIKE";
    NotificationType["COMMENT"] = "COMMENT";
    NotificationType["MENTION"] = "MENTION";
    NotificationType["MESSAGE"] = "MESSAGE";
    NotificationType["STORY_VIEW"] = "STORY_VIEW";
    NotificationType["VERIFICATION"] = "VERIFICATION";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let NotificationsService = class NotificationsService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async createNotification(data) {
        const { type, recipientId, senderId, ...metadata } = data;
        const recipient = await this.prisma.user.findUnique({
            where: { id: recipientId },
            select: {
                id: true,
                email: true,
                username: true,
                isEmailVerified: true,
            },
        });
        if (!recipient) {
            throw new common_1.BadRequestException('Recipient not found');
        }
        const notification = await this.prisma.notification.create({
            data: {
                type,
                userId: recipientId,
                senderId,
                postId: metadata.postId,
                commentId: metadata.commentId,
                storyId: metadata.storyId,
                messageId: metadata.messageId,
                title: this.getNotificationTitle(type),
                body: metadata.content || this.getNotificationBody(type),
                data: metadata.metadata || {},
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                sender: senderId ? {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                } : null,
            },
        });
        if (recipient.isEmailVerified) {
            await this.sendEmailNotification(notification);
        }
        return notification;
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
            }),
            this.prisma.notification.count({
                where: { userId },
            }),
        ]);
        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        return { unreadCount: count };
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return { message: 'Notification marked as read' };
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }
    async deleteNotification(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.prisma.notification.delete({
            where: { id: notificationId },
        });
        return { message: 'Notification deleted successfully' };
    }
    async deleteAllNotifications(userId) {
        await this.prisma.notification.deleteMany({
            where: { userId },
        });
        return { message: 'All notifications deleted successfully' };
    }
    async updateNotificationPreferences(userId, preferences) {
        throw new Error('Notification preferences not yet implemented');
    }
    async getNotificationPreferences(userId) {
        throw new Error('Notification preferences not yet implemented');
    }
    shouldCreateNotification(type, preferences) {
        if (!preferences)
            return true;
        switch (type) {
            case NotificationType.FOLLOW:
                return preferences.follow !== false;
            case NotificationType.LIKE:
                return preferences.likes !== false;
            case NotificationType.COMMENT:
                return preferences.comments !== false;
            case NotificationType.MENTION:
                return preferences.mentions !== false;
            case NotificationType.MESSAGE:
                return preferences.messages !== false;
            case NotificationType.STORY_VIEW:
                return preferences.storyViews !== false;
            case NotificationType.VERIFICATION:
                return preferences.verification !== false;
            case NotificationType.SYSTEM:
                return preferences.system !== false;
            default:
                return true;
        }
    }
    shouldSendEmail(type, preferences) {
        if (!preferences)
            return false;
        switch (type) {
            case NotificationType.FOLLOW:
                return preferences.emailFollow === true;
            case NotificationType.LIKE:
                return preferences.emailLikes === true;
            case NotificationType.COMMENT:
                return preferences.emailComments === true;
            case NotificationType.MENTION:
                return preferences.emailMentions === true;
            case NotificationType.MESSAGE:
                return preferences.emailMessages === true;
            case NotificationType.VERIFICATION:
                return preferences.emailVerification === true;
            case NotificationType.SYSTEM:
                return preferences.emailSystem === true;
            default:
                return false;
        }
    }
    async sendEmailNotification(notification) {
        try {
            const { type, recipient, sender, content } = notification;
            let subject = '';
            let emailContent = '';
            switch (type) {
                case NotificationType.FOLLOW:
                    subject = `${sender.username} started following you`;
                    emailContent = `${sender.username} started following you on Snapzy.`;
                    break;
                case NotificationType.LIKE:
                    subject = `${sender.username} liked your post`;
                    emailContent = `${sender.username} liked your post on Snapzy.`;
                    break;
                case NotificationType.COMMENT:
                    subject = `${sender.username} commented on your post`;
                    emailContent = `${sender.username} commented: "${content}"`;
                    break;
                case NotificationType.MENTION:
                    subject = `${sender.username} mentioned you in a post`;
                    emailContent = `${sender.username} mentioned you in a post: "${content}"`;
                    break;
                case NotificationType.MESSAGE:
                    subject = `New message from ${sender.username}`;
                    emailContent = `You have a new message from ${sender.username}.`;
                    break;
                case NotificationType.VERIFICATION:
                    subject = 'Email verification required';
                    emailContent = 'Please verify your email address to continue using Snapzy.';
                    break;
                case NotificationType.SYSTEM:
                    subject = 'System notification';
                    emailContent = content || 'You have a new system notification.';
                    break;
                default:
                    return;
            }
            await this.emailService.sendEmail({
                to: recipient.email,
                subject,
                text: emailContent,
                html: `<p>${emailContent}</p>`,
            });
        }
        catch (error) {
            console.error('Failed to send email notification:', error);
        }
    }
    getNotificationTitle(type) {
        switch (type) {
            case NotificationType.FOLLOW:
                return 'New Follower';
            case NotificationType.LIKE:
                return 'New Like';
            case NotificationType.COMMENT:
                return 'New Comment';
            case NotificationType.MENTION:
                return 'You were mentioned';
            case NotificationType.MESSAGE:
                return 'New Message';
            case NotificationType.STORY_VIEW:
                return 'Story View';
            case NotificationType.VERIFICATION:
                return 'Email Verification';
            case NotificationType.SYSTEM:
                return 'System Notification';
            default:
                return 'Notification';
        }
    }
    getNotificationBody(type) {
        switch (type) {
            case NotificationType.FOLLOW:
                return 'Someone started following you';
            case NotificationType.LIKE:
                return 'Someone liked your post';
            case NotificationType.COMMENT:
                return 'Someone commented on your post';
            case NotificationType.MENTION:
                return 'Someone mentioned you in a post';
            case NotificationType.MESSAGE:
                return 'You have a new message';
            case NotificationType.STORY_VIEW:
                return 'Someone viewed your story';
            case NotificationType.VERIFICATION:
                return 'Please verify your email address';
            case NotificationType.SYSTEM:
                return 'You have a new system notification';
            default:
                return 'You have a new notification';
        }
    }
    async notifyFollow(followerId, followingId) {
        return this.createNotification({
            type: NotificationType.FOLLOW,
            recipientId: followingId,
            senderId: followerId,
        });
    }
    async notifyLike(likerId, postId, postAuthorId) {
        if (likerId === postAuthorId)
            return null;
        return this.createNotification({
            type: NotificationType.LIKE,
            recipientId: postAuthorId,
            senderId: likerId,
            postId,
        });
    }
    async notifyComment(commenterId, postId, postAuthorId, commentContent) {
        if (commenterId === postAuthorId)
            return null;
        return this.createNotification({
            type: NotificationType.COMMENT,
            recipientId: postAuthorId,
            senderId: commenterId,
            postId,
            content: commentContent,
        });
    }
    async notifyMention(mentionerId, mentionedUserId, postId, content) {
        if (mentionerId === mentionedUserId)
            return null;
        return this.createNotification({
            type: NotificationType.MENTION,
            recipientId: mentionedUserId,
            senderId: mentionerId,
            postId,
            content,
        });
    }
    async notifyMessage(senderId, recipientId) {
        return this.createNotification({
            type: NotificationType.MESSAGE,
            recipientId,
            senderId,
        });
    }
    async notifyStoryView(viewerId, storyId, storyAuthorId) {
        if (viewerId === storyAuthorId)
            return null;
        return this.createNotification({
            type: NotificationType.STORY_VIEW,
            recipientId: storyAuthorId,
            senderId: viewerId,
            storyId,
        });
    }
    async notifyVerification(userId) {
        return this.createNotification({
            type: NotificationType.VERIFICATION,
            recipientId: userId,
        });
    }
    async notifySystem(userId, content, metadata) {
        return this.createNotification({
            type: NotificationType.SYSTEM,
            recipientId: userId,
            content,
            metadata,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map