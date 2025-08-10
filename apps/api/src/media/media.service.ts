import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UploadMediaDto, MediaType, MediaCategory } from './dto/upload-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import * as cloudinary from 'cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
}

@Injectable()
export class MediaService {
  private cloudinary: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Cloudinary
    this.cloudinary = cloudinary.v2;
    this.cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    uploadData: UploadMediaDto,
  ) {
    try {
      // Validate file type
      this.validateFileType(file, uploadData.type);

      // Upload to Cloudinary
      const uploadResult = await this.uploadToCloudinary(file, uploadData);

      // Save media record to database
      const media = await this.prisma.media.create({
        data: {
          userId,
          type: uploadData.type,
          category: uploadData.category,
          title: uploadData.title,
          description: uploadData.description,
          tags: uploadData.tags || [],
          location: uploadData.location,
          isPublic: uploadData.isPublic ?? true,
          url: uploadResult.secure_url,
          cloudinaryId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes,
          postId: uploadData.postId,
          storyId: uploadData.storyId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      return media;
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Get media by ID
   */
  async findOne(id: string, currentUserId?: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { userId: currentUserId }, // Allow owner to see their private media
        ],
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
        story: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  /**
   * Get user's media
   */
  async getUserMedia(
    userId: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ) {
    const skip = (page - 1) * limit;

    // Check if current user can see private media
    const canSeePrivate = currentUserId === userId;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (!canSeePrivate) {
      where.isPublic = true;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
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
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update media metadata
   */
  async update(id: string, userId: string, updateMediaDto: UpdateMediaDto) {
    // Check if media exists and user owns it
    const existingMedia = await this.prisma.media.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingMedia) {
      throw new NotFoundException('Media not found or you do not have permission to edit it');
    }

    // Update media
    const updatedMedia = await this.prisma.media.update({
      where: { id },
      data: {
        ...updateMediaDto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return updatedMedia;
  }

  /**
   * Delete media (soft delete)
   */
  async remove(id: string, userId: string) {
    // Check if media exists and user owns it
    const existingMedia = await this.prisma.media.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingMedia) {
      throw new NotFoundException('Media not found or you do not have permission to delete it');
    }

    // Delete from Cloudinary
    try {
      await this.cloudinary.uploader.destroy(existingMedia.cloudinaryId);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Failed to delete from Cloudinary:', error);
    }

    // Soft delete from database
    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Media deleted successfully' };
  }

  /**
   * Get media by category
   */
  async getByCategory(
    category: MediaCategory,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      category,
      deletedAt: null,
    };

    // Only show public media unless user is viewing their own
    if (currentUserId) {
      where.OR = [
        { isPublic: true },
        { userId: currentUserId },
      ];
    } else {
      where.isPublic = true;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
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
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get media by tags
   */
  async getByTags(
    tags: string[],
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      tags: { hasSome: tags },
      deletedAt: null,
    };

    // Only show public media unless user is viewing their own
    if (currentUserId) {
      where.OR = [
        { isPublic: true },
        { userId: currentUserId },
      ];
    } else {
      where.isPublic = true;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
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
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Generate signed upload URL for direct uploads
   */
  async generateUploadUrl(userId: string, uploadData: UploadMediaDto) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = this.cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `snapzy/${userId}/${uploadData.category}`,
        resource_type: uploadData.type === MediaType.VIDEO ? 'video' : 'image',
        allowed_formats: this.getAllowedFormats(uploadData.type),
        max_bytes: this.getMaxFileSize(uploadData.type),
      },
      this.configService.get('CLOUDINARY_API_SECRET'),
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.configService.get('CLOUDINARY_CLOUD_NAME')}/auto/upload`,
      params: {
        timestamp,
        signature,
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        folder: `snapzy/${userId}/${uploadData.category}`,
        resource_type: uploadData.type === MediaType.VIDEO ? 'video' : 'image',
        allowed_formats: this.getAllowedFormats(uploadData.type),
        max_bytes: this.getMaxFileSize(uploadData.type),
      },
    };
  }

  /**
   * Process uploaded media (resize, optimize, etc.)
   */
  async processMedia(cloudinaryId: string, type: MediaType) {
    try {
      if (type === MediaType.IMAGE) {
        // Generate different sizes for images
        const transformations = [
          { width: 150, height: 150, crop: 'fill', quality: 'auto' }, // Thumbnail
          { width: 400, height: 400, crop: 'limit', quality: 'auto' }, // Medium
          { width: 800, height: 800, crop: 'limit', quality: 'auto' }, // Large
        ];

        const processedUrls = await Promise.all(
          transformations.map(async (transformation) => {
            const result = await this.cloudinary.url(cloudinaryId, {
              transformation,
              secure: true,
            });
            return result;
          }),
        );

        return {
          thumbnail: processedUrls[0],
          medium: processedUrls[1],
          large: processedUrls[2],
        };
      }

      return null;
    } catch (error) {
      console.error('Media processing failed:', error);
      return null;
    }
  }

  /**
   * Validate file type against expected media type
   */
  private validateFileType(file: Express.Multer.File, expectedType: MediaType): void {
    const allowedMimeTypes = this.getAllowedMimeTypes(expectedType);
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Expected ${expectedType}, got ${file.mimetype}`,
      );
    }

    // Check file size
    const maxSize = this.getMaxFileSize(expectedType);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size for ${expectedType} is ${maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  /**
   * Get allowed MIME types for media type
   */
  private getAllowedMimeTypes(type: MediaType): string[] {
    switch (type) {
      case MediaType.IMAGE:
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case MediaType.VIDEO:
        return ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
      case MediaType.AUDIO:
        return ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      case MediaType.DOCUMENT:
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      default:
        return [];
    }
  }

  /**
   * Get allowed file formats for Cloudinary
   */
  private getAllowedFormats(type: MediaType): string {
    switch (type) {
      case MediaType.IMAGE:
        return 'jpg,png,gif,webp';
      case MediaType.VIDEO:
        return 'mp4,avi,mov,wmv';
      case MediaType.AUDIO:
        return 'mp3,wav,ogg,m4a';
      case MediaType.DOCUMENT:
        return 'pdf,doc,docx';
      default:
        return '';
    }
  }

  /**
   * Get maximum file size for media type (in bytes)
   */
  private getMaxFileSize(type: MediaType): number {
    switch (type) {
      case MediaType.IMAGE:
        return 10 * 1024 * 1024; // 10MB
      case MediaType.VIDEO:
        return 100 * 1024 * 1024; // 100MB
      case MediaType.AUDIO:
        return 50 * 1024 * 1024; // 50MB
      case MediaType.DOCUMENT:
        return 25 * 1024 * 1024; // 25MB
      default:
        return 10 * 1024 * 1024; // 10MB default
    }
  }

  /**
   * Upload file to Cloudinary
   */
  private async uploadToCloudinary(
    file: Express.Multer.File,
    uploadData: UploadMediaDto,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: `snapzy/${uploadData.category}`,
          resource_type: uploadData.type === MediaType.VIDEO ? 'video' : 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error: any, result: CloudinaryUploadResult) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}