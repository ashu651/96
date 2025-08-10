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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const social_service_1 = require("../social/social.service");
let MessagesService = class MessagesService {
    constructor(prisma, socialService) {
        this.prisma = prisma;
        this.socialService = socialService;
    }
    async sendMessage(senderId, recipientId, content) {
        if (senderId === recipientId) {
            throw new common_1.BadRequestException('You cannot send a message to yourself');
        }
        const recipient = await this.prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true, isActive: true },
        });
        if (!recipient || !recipient.isActive) {
            throw new common_1.NotFoundException('Recipient not found or inactive');
        }
        const isBlocked = await this.socialService.isBlocked(senderId, recipientId);
        if (isBlocked) {
            throw new common_1.ForbiddenException('Cannot send message to this user');
        }
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
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                lastMessage: message.id,
            },
        });
        return message;
    }
    async getConversations(userId, page = 1, limit = 20) {
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
    async getMessages(conversationId, userId, page = 1, limit = 50) {
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
            throw new common_1.ForbiddenException('Access denied to this conversation');
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
        const unreadMessages = messages.filter(msg => msg.senderId !== userId && !msg.isRead);
        if (unreadMessages.length > 0) {
            await this.prisma.message.updateMany({
                where: {
                    id: { in: unreadMessages.map(msg => msg.id) },
                },
                data: { isRead: true },
            });
        }
        return {
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async deleteMessage(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            const isParticipant = await this.prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: message.conversationId,
                    userId: userId
                }
            });
            if (!isParticipant) {
                throw new common_1.ForbiddenException('Access denied to this message');
            }
        }
        await this.prisma.message.delete({
            where: { id: messageId },
        });
        return { message: 'Message deleted successfully' };
    }
    async deleteConversation(conversationId, userId) {
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
            throw new common_1.ForbiddenException('Access denied to this conversation');
        }
        await this.prisma.message.deleteMany({
            where: { conversationId },
        });
        await this.prisma.conversation.delete({
            where: { id: conversationId },
        });
        return { message: 'Conversation deleted successfully' };
    }
    async markConversationAsRead(conversationId, userId) {
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
            throw new common_1.ForbiddenException('Access denied to this conversation');
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
    async getUnreadCount(userId) {
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
    async searchMessages(userId, query, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        social_service_1.SocialService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map