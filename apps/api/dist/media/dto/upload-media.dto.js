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
exports.UploadMediaDto = exports.MediaCategory = exports.MediaType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    MediaType["AUDIO"] = "audio";
    MediaType["DOCUMENT"] = "document";
})(MediaType || (exports.MediaType = MediaType = {}));
var MediaCategory;
(function (MediaCategory) {
    MediaCategory["PROFILE"] = "profile";
    MediaCategory["POST"] = "post";
    MediaCategory["STORY"] = "story";
    MediaCategory["MESSAGE"] = "message";
    MediaCategory["OTHER"] = "other";
})(MediaCategory || (exports.MediaCategory = MediaCategory = {}));
class UploadMediaDto {
}
exports.UploadMediaDto = UploadMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Media type',
        enum: MediaType,
        example: MediaType.IMAGE,
    }),
    (0, class_validator_1.IsEnum)(MediaType, { message: 'Media type must be a valid media type' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Media category',
        enum: MediaCategory,
        example: MediaCategory.POST,
    }),
    (0, class_validator_1.IsEnum)(MediaCategory, { message: 'Media category must be a valid category' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Media title/name',
        example: 'My vacation photo',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Title must be a string' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Media description',
        example: 'Beautiful sunset at the beach',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of tags for the media',
        example: ['beach', 'sunset', 'vacation'],
        required: false,
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Tags must be an array' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each tag must be a string' }),
    __metadata("design:type", Array)
], UploadMediaDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Location where media was captured',
        example: 'Maldives',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Location must be a string' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the media is public',
        example: true,
        required: false,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'IsPublic must be a string' }),
    __metadata("design:type", Boolean)
], UploadMediaDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Associated post ID if media belongs to a post',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'PostId must be a string' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Associated story ID if media belongs to a story',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'StoryId must be a string' }),
    __metadata("design:type", String)
], UploadMediaDto.prototype, "storyId", void 0);
//# sourceMappingURL=upload-media.dto.js.map