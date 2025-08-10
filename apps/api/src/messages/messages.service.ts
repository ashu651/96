import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocialService } from '../social/social.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private socialService: SocialService,
  ) {}

  async sendMessage(senderId: string, recipientId: string, content: string) {
    if (senderId === recipientId) {
      throw new BadRequestException('You cannot send a message to yourself');
    }

    // Check if recipient exists and is active
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isActive: true },
    });

    if (!recipient || !recipient.isActive) {
      throw new NotFoundException('Recipient not found or inactive');
    }

    // Check if sender is blocked by recipient
    const isBlocked = await this.socialService.isBlocked(senderId, recipientId);
    if (isBlocked) {
      throw new ForbiddenException('Cannot send message to this user');
    }

    // Create or get conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [senderId, recipientId]
            }
          }
        },
        type: 'direct'
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      // Create conversation and participants
      conversation = await this.prisma.conversation.create({
        data: {
          type: 'direct',
          participants: {
            create: [
              { userId: senderId },
              { userId: recipientId }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                }
              }
            }
          }
        }
      });
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        recipientId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation last message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessage: message.id,
      },
    });

    return message;
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: userId
            }
          }
        },
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  AND: [
                    { senderId: { not: userId } },
                    { isRead: false },
                  ],
                },
              },
            },
          },
        },
      }),
      this.prisma.conversation.count({
        where: {
          participants: {
            some: {
              userId: userId
            }
          }
        },
      }),
    ]);

    // Format conversations to show the other participant
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.user.id !== userId)?.user;
      
      return {
        id: conv.id,
        otherParticipant,
        lastMessage: conv.messages[0],
        unreadCount: conv._count.messages,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return {
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verify user is part of the conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
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
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    // Mark messages as read if they're from the other participant
    const unreadMessages = messages.filter(
      msg => msg.senderId !== userId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await this.prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map(msg => msg.id) },
        },
        data: { isRead: true },
      });
    }

    return {
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender or part of the conversation
    if (message.senderId !== userId) {
      const isParticipant = await this.prisma.conversationParticipant.findFirst({
        where: {
          conversationId: message.conversationId,
          userId: userId
        }
      });
      
      if (!isParticipant) {
        throw new ForbiddenException('Access denied to this message');
      }
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // Delete all messages in the conversation
    await this.prisma.message.deleteMany({
      where: { conversationId },
    });

    // Delete the conversation
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully' };
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return { message: 'Conversation marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        AND: [
          { senderId: { not: userId } },
          { isRead: false },
                  {
          conversation: {
            participants: {
              some: {
                userId: userId
              }
            }
          },
        },
        ],
      },
    });

    return { unreadCount: count };
  }

  async searchMessages(userId: string, query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get conversations where user is a participant
    const userConversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      select: { id: true },
    });

    const conversationIds = userConversations.map(c => c.id);

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          content: { contains: query, mode: 'insensitive' },
        },
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
          conversation: {
            select: {
              id: true,
              participants: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId: { in: conversationIds },
          content: { contains: query, mode: 'insensitive' },
        },
      }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}