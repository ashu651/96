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
exports.UpdatePostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePostDto {
}
exports.UpdatePostDto = UpdatePostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated post content/text',
        example: 'Updated: Just had an amazing day at the beach! 🌊☀️',
        maxLength: 2000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated array of media URLs (images/videos)',
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePostDto.prototype, "mediaUrls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the post is private (only visible to followers)',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePostDto.prototype, "isPrivate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated location where the post was created',
        example: 'Miami Beach, FL',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "location", void 0);
//# sourceMappingURL=update-post.dto.js.map