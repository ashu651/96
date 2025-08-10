import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to follow' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already following or invalid user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async followUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.followUser(followerId, followingId);
  }

  @Delete('unfollow/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unfollow' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - not following user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.unfollowUser(followerId, followingId);
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get users that a specific user is following' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Following list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.socialService.getFollowing(userId, page, limit);
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers of a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Followers list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.socialService.getFollowers(userId, page, limit);
  }

  @Get('mutual/:userId')
  @ApiOperation({ summary: 'Get mutual followers between current user and another user' })
  @ApiParam({ name: 'userId', description: 'User ID to compare with' })
  @ApiResponse({ status: 200, description: 'Mutual followers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMutualFollowers(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.socialService.getMutualFollowers(currentUserId, otherUserId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested users to follow' })
  @ApiResponse({ status: 200, description: 'Suggested users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSuggestedUsers(
    @CurrentUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.socialService.getSuggestedUsers(userId, limit);
  }

  @Get('is-following/:userId')
  @ApiOperation({ summary: 'Check if current user is following another user' })
  @ApiParam({ name: 'userId', description: 'User ID to check' })
  @ApiResponse({ status: 200, description: 'Following status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isFollowing(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    const following = await this.socialService.isFollowing(followerId, followingId);
    return { following };
  }

  @Post('block/:userId')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'userId', description: 'User ID to block' })
  @ApiResponse({ status: 201, description: 'User blocked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already blocked or invalid user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(
    @CurrentUser('id') blockerId: string,
    @Param('userId') blockedId: string,
  ) {
    return this.socialService.blockUser(blockerId, blockedId);
  }

  @Delete('unblock/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unblock' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user not blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unblockUser(
    @CurrentUser('id') blockerId: string,
    @Param('userId') blockedId: string,
  ) {
    return this.socialService.unblockUser(blockerId, blockedId);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get list of blocked users' })
  @ApiResponse({ status: 200, description: 'Blocked users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBlockedUsers(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.socialService.getBlockedUsers(userId, page, limit);
  }

  @Get('is-blocked/:userId')
  @ApiOperation({ summary: 'Check if there is a block relationship between two users' })
  @ApiParam({ name: 'userId', description: 'User ID to check' })
  @ApiResponse({ status: 200, description: 'Block status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isBlocked(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    const blocked = await this.socialService.isBlocked(currentUserId, otherUserId);
    return { blocked };
  }
}