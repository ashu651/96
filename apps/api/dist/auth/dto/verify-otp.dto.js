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
exports.VerifyOtpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class VerifyOtpDto {
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number in international format',
        example: '+1234567890',
    }),
    (0, class_validator_1.IsString)({ message: 'Phone number must be a string' }),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{1,14}$/, {
        message: 'Please provide a valid phone number in international format (e.g., +1234567890)',
    }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'One-time password (OTP)',
        example: '123456',
        minLength: 4,
        maxLength: 8,
    }),
    (0, class_validator_1.IsString)({ message: 'OTP must be a string' }),
    (0, class_validator_1.Length)(4, 8, { message: 'OTP must be between 4 and 8 characters' }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'OTP must contain only digits' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
//# sourceMappingURL=verify-otp.dto.js.map