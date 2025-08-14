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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPostsDto = exports.PostSortOrder = exports.PostSortBy = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var PostSortBy;
(function (PostSortBy) {
    PostSortBy["CREATED_AT"] = "createdAt";
    PostSortBy["UPDATED_AT"] = "updatedAt";
    PostSortBy["LIKES_COUNT"] = "likesCount";
    PostSortBy["COMMENTS_COUNT"] = "commentsCount";
    PostSortBy["SHARES_COUNT"] = "sharesCount";
})(PostSortBy || (exports.PostSortBy = PostSortBy = {}));
var PostSortOrder;
(function (PostSortOrder) {
    PostSortOrder["ASC"] = "asc";
    PostSortOrder["DESC"] = "desc";
})(PostSortOrder || (exports.PostSortOrder = PostSortOrder = {}));
class QueryPostsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = PostSortBy.CREATED_AT;
        this.sortOrder = PostSortOrder.DESC;
    }
}
exports.QueryPostsDto = QueryPostsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination',
        example: 1,
        required: false,
        minimum: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Page must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'Page must be at least 1' }),
    __metadata("design:type", Number)
], QueryPostsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of posts per page',
        example: 20,
        required: false,
        minimum: 1,
        maximum: 100,
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Limit must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'Limit must be at least 1' }),
    (0, class_validator_1.Max)(100, { message: 'Limit must not exceed 100' }),
    __metadata("design:type", Number)
], QueryPostsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search query for post content',
        example: 'coffee',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Search must be a string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID to filter posts by author',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'UserId must be a valid UUID' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Username to filter posts by author',
        example: 'johndoe',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Username must be a string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hashtag to filter posts',
        example: 'coffee',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Hashtag must be a string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "hashtag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Location to filter posts',
        example: 'New York',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Location must be a string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Field to sort posts by',
        enum: PostSortBy,
        example: PostSortBy.CREATED_AT,
        required: false,
        default: PostSortBy.CREATED_AT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PostSortBy, { message: 'SortBy must be a valid sort field' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order for posts',
        enum: PostSortOrder,
        example: PostSortOrder.DESC,
        required: false,
        default: PostSortOrder.DESC,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PostSortOrder, { message: 'SortOrder must be a valid sort order' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter posts with media only',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], QueryPostsDto.prototype, "hasMedia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter posts by date range (ISO string)',
        example: '2024-01-01T00:00:00.000Z',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'DateFrom must be a valid date string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter posts by date range (ISO string)',
        example: '2024-12-31T23:59:59.999Z',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'DateTo must be a valid date string' }),
    __metadata("design:type", String)
], QueryPostsDto.prototype, "dateTo", void 0);
//# sourceMappingURL=query-posts.dto.js.map