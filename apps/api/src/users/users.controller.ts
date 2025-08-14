import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users found successfully' })
  async searchUsers(@Query() searchUsersDto: SearchUsersDto) {
    return this.usersService.searchUsers(searchUsersDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.changePassword(userId, currentPassword, newPassword);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowers(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.usersService.getFollowers(id, page, limit);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get user following' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Following retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.usersService.getFollowing(id, page, limit);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', description: 'User ID to follow' })
  @ApiResponse({ status: 200, description: 'User followed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.usersService.followUser(followerId, followingId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', description: 'User ID to unfollow' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.usersService.unfollowUser(followerId, followingId);
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user is following another user' })
  @ApiParam({ name: 'id', description: 'User ID to check' })
  @ApiResponse({ status: 200, description: 'Following status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isFollowing(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    const isFollowing = await this.usersService.isFollowing(followerId, followingId);
    return { isFollowing };
  }

  @Delete('deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deactivateAccount(userId);
  }
}