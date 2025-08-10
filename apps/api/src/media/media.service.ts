import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async uploadMedia(
    userId: string,
    file: Express.Multer.File,
    type: 'avatar' | 'post' | 'story' = 'post',
  ) {
    // Validate file type
    if (!this.isValidFileType(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Validate file size
    if (file.size > this.configService.maxFileSize) {
      throw new BadRequestException('File size too large');
    }

    // In a real implementation, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll simulate by storing the file info
    const mediaUrl = await this.uploadToCloudStorage(file);

    // Save media record to database
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

  async getMediaById(mediaId: string, userId?: string) {
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
      throw new NotFoundException('Media not found');
    }

    // Check if user has access to this media
    if (media.user.id !== userId) {
      // In a real app, you might have different access rules
      // For now, we'll allow public access to post media
      if (media.type === 'avatar') {
        throw new ForbiddenException('Access denied');
      }
    }

    return media;
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      select: { user: { select: { id: true } }, url: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own media');
    }

    // Delete from cloud storage
    await this.deleteFromCloudStorage(media.url);

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId },
    });

    return { message: 'Media deleted successfully' };
  }

  async getUserMedia(userId: string, type?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = { uploadedBy: userId };
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

  private isValidFileType(mimetype: string): boolean {
    const allowedTypes = this.configService.allowedFileTypes;
    return allowedTypes.includes(mimetype);
  }

  private async uploadToCloudStorage(file: Express.Multer.File): Promise<string> {
    // TODO: Implement actual cloud storage upload
    // This is a placeholder implementation
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    
    // Simulate cloud storage URL
    return `https://storage.example.com/uploads/${filename}`;
  }

  private async deleteFromCloudStorage(url: string): Promise<void> {
    // TODO: Implement actual cloud storage deletion
    // This is a placeholder implementation
    console.log(`Deleting file from cloud storage: ${url}`);
  }

  async getMediaStats(userId: string) {
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
      }, {} as Record<string, number>),
      totalSize: totalSize._sum.size || 0,
    };
  }
}