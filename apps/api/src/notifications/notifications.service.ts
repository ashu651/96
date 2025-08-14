import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  MENTION = 'MENTION',
  MESSAGE = 'MESSAGE',
  STORY_VIEW = 'STORY_VIEW',
  VERIFICATION = 'VERIFICATION',
  SYSTEM = 'SYSTEM',
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

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createNotification(data: NotificationData) {
    const { type, recipientId, senderId, ...metadata } = data;

    // Check if recipient exists and has notifications enabled
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
      throw new BadRequestException('Recipient not found');
    }

    // Check if notification should be created based on user preferences
    // For now, always create notifications since preferences field doesn't exist
    // TODO: Add notification preferences to User model

    // Create notification
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

    // Send email notification if user is verified
    // TODO: Add email preferences check when notification preferences are added
    if (recipient.isEmailVerified) {
      await this.sendEmailNotification(notification);
    }

    return notification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
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

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  async deleteAllNotifications(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { message: 'All notifications deleted successfully' };
  }

  async updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
    // TODO: Implement when notification preferences are added to User model
    throw new Error('Notification preferences not yet implemented');
  }

  async getNotificationPreferences(userId: string) {
    // TODO: Implement when notification preferences are added to User model
    throw new Error('Notification preferences not yet implemented');
  }

  private shouldCreateNotification(type: NotificationType, preferences: Record<string, any>): boolean {
    if (!preferences) return true;

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

  private shouldSendEmail(type: NotificationType, preferences: Record<string, any>): boolean {
    if (!preferences) return false;

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

  private async sendEmailNotification(notification: any) {
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
    } catch (error) {
      // Log error but don't fail the notification creation
      console.error('Failed to send email notification:', error);
    }
  }

  private getNotificationTitle(type: NotificationType): string {
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

  private getNotificationBody(type: NotificationType): string {
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

  // Helper methods for creating specific types of notifications
  async notifyFollow(followerId: string, followingId: string) {
    return this.createNotification({
      type: NotificationType.FOLLOW,
      recipientId: followingId,
      senderId: followerId,
    });
  }

  async notifyLike(likerId: string, postId: string, postAuthorId: string) {
    if (likerId === postAuthorId) return null; // Don't notify self-likes

    return this.createNotification({
      type: NotificationType.LIKE,
      recipientId: postAuthorId,
      senderId: likerId,
      postId,
    });
  }

  async notifyComment(commenterId: string, postId: string, postAuthorId: string, commentContent: string) {
    if (commenterId === postAuthorId) return null; // Don't notify self-comments

    return this.createNotification({
      type: NotificationType.COMMENT,
      recipientId: postAuthorId,
      senderId: commenterId,
      postId,
      content: commentContent,
    });
  }

  async notifyMention(mentionerId: string, mentionedUserId: string, postId: string, content: string) {
    if (mentionerId === mentionedUserId) return null; // Don't notify self-mentions

    return this.createNotification({
      type: NotificationType.MENTION,
      recipientId: mentionedUserId,
      senderId: mentionerId,
      postId,
      content,
    });
  }

  async notifyMessage(senderId: string, recipientId: string) {
    return this.createNotification({
      type: NotificationType.MESSAGE,
      recipientId,
      senderId,
    });
  }

  async notifyStoryView(viewerId: string, storyId: string, storyAuthorId: string) {
    if (viewerId === storyAuthorId) return null; // Don't notify self-views

    return this.createNotification({
      type: NotificationType.STORY_VIEW,
      recipientId: storyAuthorId,
      senderId: viewerId,
      storyId,
    });
  }

  async notifyVerification(userId: string) {
    return this.createNotification({
      type: NotificationType.VERIFICATION,
      recipientId: userId,
    });
  }

  async notifySystem(userId: string, content: string, metadata?: Record<string, any>) {
    return this.createNotification({
      type: NotificationType.SYSTEM,
      recipientId: userId,
      content,
      metadata,
    });
  }
}