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
exports.StoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stories_service_1 = require("./stories.service");
const create_story_dto_1 = require("./dto/create-story.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let StoriesController = class StoriesController {
    constructor(storiesService) {
        this.storiesService = storiesService;
    }
    async createStory(userId, createStoryDto) {
        const { mediaUrl, caption } = createStoryDto;
        return this.storiesService.createStory(userId, mediaUrl, caption);
    }
    async getFeedStories(userId) {
        return this.storiesService.getFeedStories(userId);
    }
    async getUserStories(viewerId, userId) {
        return this.storiesService.getUserStories(userId, viewerId);
    }
    async viewStory(viewerId, storyId) {
        return this.storiesService.viewStory(storyId, viewerId);
    }
    async deleteStory(userId, storyId) {
        return this.storiesService.deleteStory(storyId, userId);
    }
    async getStoryViews(userId, storyId) {
        return this.storiesService.getStoryViews(storyId, userId);
    }
    async getStoryStats(userId, days = 7) {
        return this.storiesService.getStoryStats(userId, days);
    }
    async getTrendingStories(limit = 10) {
        return this.storiesService.getTrendingStories(limit);
    }
    async cleanupExpiredStories() {
        return this.storiesService.cleanupExpiredStories();
    }
};
exports.StoriesController = StoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new story' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Story created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_story_dto_1.CreateStoryDto]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "createStory", null);
__decorate([
    (0, common_1.Get)('feed'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stories from followed users and self' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feed stories retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "getFeedStories", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stories from a specific user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User stories retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - blocked user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "getUserStories", null);
__decorate([
    (0, common_1.Post)('view/:storyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a story as viewed' }),
    (0, swagger_1.ApiParam)({ name: 'storyId', description: 'Story ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Story marked as viewed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - blocked user' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Story not found or expired' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('storyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "viewStory", null);
__decorate([
    (0, common_1.Delete)(':storyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a story' }),
    (0, swagger_1.ApiParam)({ name: 'storyId', description: 'Story ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Story deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not your story' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Story not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('storyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "deleteStory", null);
__decorate([
    (0, common_1.Get)(':storyId/views'),
    (0, swagger_1.ApiOperation)({ summary: 'Get views for a specific story' }),
    (0, swagger_1.ApiParam)({ name: 'storyId', description: 'Story ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Story views retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not your story' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Story not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('storyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "getStoryViews", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get story statistics for the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Story stats retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "getStoryStats", null);
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trending stories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trending stories retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "getTrendingStories", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Clean up expired stories (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Expired stories cleaned up successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StoriesController.prototype, "cleanupExpiredStories", null);
exports.StoriesController = StoriesController = __decorate([
    (0, swagger_1.ApiTags)('Stories'),
    (0, common_1.Controller)('stories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [stories_service_1.StoriesService])
], StoriesController);
//# sourceMappingURL=stories.controller.js.map