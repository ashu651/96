import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createStory(
    @CurrentUser('id') userId: string,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    const { mediaUrl, caption } = createStoryDto;
    return this.storiesService.createStory(userId, mediaUrl, caption);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get stories from followed users and self' })
  @ApiResponse({ status: 200, description: 'Feed stories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFeedStories(@CurrentUser('id') userId: string) {
    return this.storiesService.getFeedStories(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get stories from a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User stories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - blocked user' })
  async getUserStories(
    @CurrentUser('id') viewerId: string,
    @Param('userId') userId: string,
  ) {
    return this.storiesService.getUserStories(userId, viewerId);
  }

  @Post('view/:storyId')
  @ApiOperation({ summary: 'Mark a story as viewed' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story marked as viewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - blocked user' })
  @ApiResponse({ status: 404, description: 'Story not found or expired' })
  async viewStory(
    @CurrentUser('id') viewerId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.storiesService.viewStory(storyId, viewerId);
  }

  @Delete(':storyId')
  @ApiOperation({ summary: 'Delete a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your story' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async deleteStory(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.storiesService.deleteStory(storyId, userId);
  }

  @Get(':storyId/views')
  @ApiOperation({ summary: 'Get views for a specific story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Story views retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your story' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async getStoryViews(
    @CurrentUser('id') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.storiesService.getStoryViews(storyId, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get story statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Story stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoryStats(
    @CurrentUser('id') userId: string,
    @Query('days', new ParseIntPipe({ optional: true })) days = 7,
  ) {
    return this.storiesService.getStoryStats(userId, days);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending stories' })
  @ApiResponse({ status: 200, description: 'Trending stories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrendingStories(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.storiesService.getTrendingStories(limit);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up expired stories (admin only)' })
  @ApiResponse({ status: 200, description: 'Expired stories cleaned up successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupExpiredStories() {
    return this.storiesService.cleanupExpiredStories();
  }
}