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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const social_service_1 = require("./social.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SocialController = class SocialController {
    constructor(socialService) {
        this.socialService = socialService;
    }
    async followUser(followerId, followingId) {
        return this.socialService.followUser(followerId, followingId);
    }
    async unfollowUser(followerId, followingId) {
        return this.socialService.unfollowUser(followerId, followingId);
    }
    async getFollowing(userId, page = 1, limit = 20) {
        return this.socialService.getFollowing(userId, page, limit);
    }
    async getFollowers(userId, page = 1, limit = 20) {
        return this.socialService.getFollowers(userId, page, limit);
    }
    async getMutualFollowers(currentUserId, otherUserId) {
        return this.socialService.getMutualFollowers(currentUserId, otherUserId);
    }
    async getSuggestedUsers(userId, limit = 10) {
        return this.socialService.getSuggestedUsers(userId, limit);
    }
    async isFollowing(followerId, followingId) {
        const following = await this.socialService.isFollowing(followerId, followingId);
        return { following };
    }
    async blockUser(blockerId, blockedId) {
        return this.socialService.blockUser(blockerId, blockedId);
    }
    async unblockUser(blockerId, blockedId) {
        return this.socialService.unblockUser(blockerId, blockedId);
    }
    async getBlockedUsers(userId, page = 1, limit = 20) {
        return this.socialService.getBlockedUsers(userId, page, limit);
    }
    async isBlocked(currentUserId, otherUserId) {
        const blocked = await this.socialService.isBlocked(currentUserId, otherUserId);
        return { blocked };
    }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Post)('follow/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Follow a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to follow' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User followed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - already following or invalid user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "followUser", null);
__decorate([
    (0, common_1.Delete)('unfollow/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unfollow a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to unfollow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User unfollowed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - not following user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "unfollowUser", null);
__decorate([
    (0, common_1.Get)('following/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get users that a specific user is following' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Following list retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getFollowing", null);
__decorate([
    (0, common_1.Get)('followers/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get followers of a specific user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Followers list retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)('mutual/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mutual followers between current user and another user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to compare with' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mutual followers retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getMutualFollowers", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get suggested users to follow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggested users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getSuggestedUsers", null);
__decorate([
    (0, common_1.Get)('is-following/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if current user is following another user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Following status retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "isFollowing", null);
__decorate([
    (0, common_1.Post)('block/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Block a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to block' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User blocked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - already blocked or invalid user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Delete)('unblock/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to unblock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User unblocked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - user not blocked' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Get)('blocked'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of blocked users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blocked users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getBlockedUsers", null);
__decorate([
    (0, common_1.Get)('is-blocked/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if there is a block relationship between two users' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Block status retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "isBlocked", null);
exports.SocialController = SocialController = __decorate([
    (0, swagger_1.ApiTags)('Social'),
    (0, common_1.Controller)('social'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
//# sourceMappingURL=social.controller.js.map