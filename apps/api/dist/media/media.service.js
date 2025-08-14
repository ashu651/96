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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_service_1 = require("../config/config.service");
let MediaService = class MediaService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async uploadMedia(userId, file, type = 'post') {
        if (!this.isValidFileType(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type');
        }
        if (file.size > this.configService.maxFileSize) {
            throw new common_1.BadRequestException('File size too large');
        }
        const mediaUrl = await this.uploadToCloudStorage(file);
        const media = await this.prisma.media.create({
            data: {
                publicId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: mediaUrl,
                type,
                format: file.mimetype.split('/')[1] || 'unknown',
                filename: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                user: {
                    connect: { id: userId }
                },
            },
        });
        return media;
    }
    async getMediaById(mediaId, userId) {
        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });
        if (!media) {
            throw new common_1.NotFoundException('Media not found');
        }
        if (media.user.id !== userId) {
            if (media.type === 'avatar') {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        return media;
    }
    async deleteMedia(mediaId, userId) {
        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
            select: { user: { select: { id: true } }, url: true },
        });
        if (!media) {
            throw new common_1.NotFoundException('Media not found');
        }
        if (media.user.id !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own media');
        }
        await this.deleteFromCloudStorage(media.url);
        await this.prisma.media.delete({
            where: { id: mediaId },
        });
        return { message: 'Media deleted successfully' };
    }
    async getUserMedia(userId, type, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { uploadedBy: userId };
        if (type) {
            where.type = type;
        }
        const [media, total] = await Promise.all([
            this.prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.media.count({ where }),
        ]);
        return {
            media,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    isValidFileType(mimetype) {
        const allowedTypes = this.configService.allowedFileTypes;
        return allowedTypes.includes(mimetype);
    }
    async uploadToCloudStorage(file) {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        return `https://storage.example.com/uploads/${filename}`;
    }
    async deleteFromCloudStorage(url) {
        console.log(`Deleting file from cloud storage: ${url}`);
    }
    async getMediaStats(userId) {
        const stats = await this.prisma.media.groupBy({
            by: ['type'],
            where: { uploadedBy: userId },
            _count: { type: true },
        });
        const totalSize = await this.prisma.media.aggregate({
            where: { uploadedBy: userId },
            _sum: { size: true },
        });
        return {
            byType: stats.reduce((acc, stat) => {
                acc[stat.type] = stat._count.type;
                return acc;
            }, {}),
            totalSize: totalSize._sum.size || 0,
        };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_service_1.ConfigService])
], MediaService);
//# sourceMappingURL=media.service.js.map