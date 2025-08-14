import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(userId, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getPosts(
    @Query() getPostsDto: GetPostsDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.postsService.getPosts(getPostsDto, userId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed (posts from followed users and own posts)' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.postsService.getFeedPosts(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Post is private' })
  async getPost(
    @Param('id') postId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.postsService.getPostById(postId, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, userId, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.deletePost(postId, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post liked successfully' })
  @ApiResponse({ status: 400, description: 'Post already liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async likePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.likePost(postId, userId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  @ApiResponse({ status: 400, description: 'Post not liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async unlikePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.unlikePost(postId, userId);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostLikes(
    @Param('id') postId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.postsService.getPostLikes(postId, page, limit);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostComments(
    @Param('id') postId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.postsService.getPostComments(postId, page, limit);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() addCommentDto: AddCommentDto,
  ) {
    return this.postsService.addComment(postId, userId, addCommentDto.content);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.deleteComment(commentId, userId);
  }
}