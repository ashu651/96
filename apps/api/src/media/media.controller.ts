import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadMedia(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'avatar' | 'post' | 'story' = 'post',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.mediaService.uploadMedia(userId, file, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getMedia(
    @Param('id') mediaId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.mediaService.getMediaById(mediaId, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your media' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async deleteMedia(
    @Param('id') mediaId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.deleteMedia(mediaId, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user media' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User media retrieved successfully' })
  async getUserMedia(
    @Param('userId') targetUserId: string,
    @Query('type') type?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.mediaService.getUserMedia(targetUserId, type, page, limit);
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user media statistics' })
  @ApiResponse({ status: 200, description: 'Media stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMediaStats(@CurrentUser('id') userId: string) {
    return this.mediaService.getMediaStats(userId);
  }

  @Get('my/uploads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user media' })
  @ApiResponse({ status: 200, description: 'User media retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMedia(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.mediaService.getUserMedia(userId, type, page, limit);
  }
}