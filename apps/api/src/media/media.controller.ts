import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadMediaDto, MediaType, MediaCategory } from './dto/upload-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user-uuid',
          type: 'image',
          category: 'post',
          title: 'My vacation photo',
          description: 'Beautiful sunset at the beach',
          tags: ['beach', 'sunset', 'vacation'],
          location: 'Maldives',
          isPublic: true,
          url: 'https://res.cloudinary.com/example/image/upload/v123/photo.jpg',
          cloudinaryId: 'snapzy/post/photo',
          width: 1920,
          height: 1080,
          format: 'jpg',
          size: 2048576,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          user: {
            id: 'user-uuid',
            username: 'johndoe',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/media/upload',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB max
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|mp3|wav|ogg|m4a|pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadData: UploadMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.uploadFile(file, userId, uploadData);
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate signed upload URL for direct uploads' })
  @ApiResponse({
    status: 200,
    description: 'Upload URL generated successfully',
    schema: {
      example: {
        data: {
          uploadUrl: 'https://api.cloudinary.com/v1_1/example/auto/upload',
          params: {
            timestamp: 1704067200,
            signature: 'signed-signature',
            api_key: 'cloudinary-api-key',
            folder: 'snapzy/user-uuid/post',
            resource_type: 'image',
            allowed_formats: 'jpg,png,gif,webp',
            max_bytes: 10485760,
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/media/upload-url',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateUploadUrl(
    @Body() uploadData: UploadMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.generateUploadUrl(userId, uploadData);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all media with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Media per page' })
  @ApiQuery({ name: 'category', required: false, enum: MediaCategory, description: 'Filter by category' })
  @ApiQuery({ name: 'type', required: false, enum: MediaType, description: 'Filter by type' })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Filter by tags (comma-separated)' })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category?: MediaCategory,
    @Query('type') type?: MediaType,
    @Query('tags') tags?: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    if (category) {
      return this.mediaService.getByCategory(category, page, limit, currentUserId);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      return this.mediaService.getByTags(tagArray, page, limit, currentUserId);
    }

    // Default: get user's media if authenticated, otherwise get public media
    if (currentUserId) {
      return this.mediaService.getUserMedia(currentUserId, page, limit, currentUserId);
    }

    // For public access, get media by category (default to 'post')
    return this.mediaService.getByCategory(MediaCategory.POST, page, limit);
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get media by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Media per page' })
  @ApiResponse({
    status: 200,
    description: 'User media retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserMedia(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.mediaService.getUserMedia(userId, page, limit, currentUserId);
  }

  @Get('category/:category')
  @Public()
  @ApiOperation({ summary: 'Get media by category' })
  @ApiParam({ name: 'category', enum: MediaCategory, description: 'Media category' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Media per page' })
  @ApiResponse({
    status: 200,
    description: 'Media by category retrieved successfully',
  })
  async getByCategory(
    @Param('category') category: MediaCategory,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.mediaService.getByCategory(category, page, limit, currentUserId);
  }

  @Get('tags')
  @Public()
  @ApiOperation({ summary: 'Get media by tags' })
  @ApiQuery({ name: 'tags', required: true, type: String, description: 'Tags to search for (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Media per page' })
  @ApiResponse({
    status: 200,
    description: 'Media by tags retrieved successfully',
  })
  async getByTags(
    @Query('tags') tags: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    return this.mediaService.getByTags(tagArray, page, limit, currentUserId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single media by ID' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user-uuid',
          type: 'image',
          category: 'post',
          title: 'My vacation photo',
          description: 'Beautiful sunset at the beach',
          tags: ['beach', 'sunset', 'vacation'],
          location: 'Maldives',
          isPublic: true,
          url: 'https://res.cloudinary.com/example/image/upload/v123/photo.jpg',
          cloudinaryId: 'snapzy/post/photo',
          width: 1920,
          height: 1080,
          format: 'jpg',
          size: 2048576,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          user: {
            id: 'user-uuid',
            username: 'johndoe',
            avatar: 'https://example.com/avatar.jpg',
          },
          post: {
            id: 'post-uuid',
            content: 'Amazing sunset!',
            authorId: 'user-uuid',
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/media/123e4567-e89b-12d3-a456-426614174000',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async findOne(@Param('id') id: string, @CurrentUser('id') currentUserId?: string) {
    return this.mediaService.findOne(id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update media metadata' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Media not found or no permission' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, userId, updateMediaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media (soft delete)' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media deleted successfully',
    schema: {
      example: {
        data: { message: 'Media deleted successfully' },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/media/123e4567-e89b-12d3-a456-426614174000',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Media not found or no permission' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.remove(id, userId);
  }

  @Post(':id/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process media (generate different sizes, optimize)' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media processed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async processMedia(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const media = await this.mediaService.findOne(id, userId);
    const processedUrls = await this.mediaService.processMedia(media.cloudinaryId, media.type as MediaType);
    
    return {
      message: 'Media processed successfully',
      processedUrls,
    };
  }
}