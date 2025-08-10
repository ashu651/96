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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Just had an amazing coffee! ☕️',
          hashtags: ['coffee', 'morning'],
          media: ['https://example.com/coffee.jpg'],
          location: 'Downtown Coffee Shop',
          isPublic: true,
          allowComments: true,
          authorId: 'user-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          author: {
            id: 'user-uuid',
            username: 'johndoe',
            avatar: 'https://example.com/avatar.jpg',
            isVerified: true,
          },
          _count: {
            likes: 0,
            comments: 0,
            shares: 0,
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/posts',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@CurrentUser('id') userId: string, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(userId, createPostDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all posts with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'username', required: false, type: String, description: 'Filter by username' })
  @ApiQuery({ name: 'hashtag', required: false, type: String, description: 'Filter by hashtag' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'hasMedia', required: false, type: Boolean, description: 'Filter by media presence' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    schema: {
      example: {
        data: {
          posts: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              content: 'Just had an amazing coffee! ☕️',
              hashtags: ['coffee', 'morning'],
              media: ['https://example.com/coffee.jpg'],
              location: 'Downtown Coffee Shop',
              isPublic: true,
              allowComments: true,
              authorId: 'user-uuid',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              author: {
                id: 'user-uuid',
                username: 'johndoe',
                avatar: 'https://example.com/avatar.jpg',
                isVerified: true,
              },
              _count: {
                likes: 5,
                comments: 2,
                shares: 1,
              },
              isLiked: false,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/posts',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  async findAll(@Query() query: QueryPostsDto, @CurrentUser('id') currentUserId?: string) {
    return this.postsService.findAll(query, currentUserId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed (posts from followed users and own posts)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiResponse({
    status: 200,
    description: 'Feed retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.postsService.getFeed(userId, page, limit);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending posts (most liked/commented in recent time)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of posts' })
  @ApiResponse({
    status: 200,
    description: 'Trending posts retrieved successfully',
  })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.postsService.getTrending(limit);
  }

  @Get('hashtag/:hashtag')
  @Public()
  @ApiOperation({ summary: 'Get posts by hashtag' })
  @ApiParam({ name: 'hashtag', description: 'Hashtag to search for' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiResponse({
    status: 200,
    description: 'Posts by hashtag retrieved successfully',
  })
  async getByHashtag(
    @Param('hashtag') hashtag: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.postsService.getByHashtag(hashtag, page, limit);
  }

  @Get('location/:location')
  @Public()
  @ApiOperation({ summary: 'Get posts by location' })
  @ApiParam({ name: 'location', description: 'Location to search for' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiResponse({
    status: 200,
    description: 'Posts by location retrieved successfully',
  })
  async getByLocation(
    @Param('location') location: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.postsService.getByLocation(location, page, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Just had an amazing coffee! ☕️',
          hashtags: ['coffee', 'morning'],
          media: ['https://example.com/coffee.jpg'],
          location: 'Downtown Coffee Shop',
          isPublic: true,
          allowComments: true,
          authorId: 'user-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          author: {
            id: 'user-uuid',
            username: 'johndoe',
            avatar: 'https://example.com/avatar.jpg',
            isVerified: true,
          },
          _count: {
            likes: 5,
            comments: 2,
            shares: 1,
          },
          isLiked: false,
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/posts/123e4567-e89b-12d3-a456-426614174000',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string, @CurrentUser('id') currentUserId?: string) {
    return this.postsService.findOne(id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found or no permission' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, userId, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post (soft delete)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully',
    schema: {
      example: {
        data: { message: 'Post deleted successfully' },
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/posts/123e4567-e89b-12d3-a456-426614174000',
        correlationId: 'correlation-uuid',
        success: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found or no permission' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postsService.remove(id, userId);
  }
}