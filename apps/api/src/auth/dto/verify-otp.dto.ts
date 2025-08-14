import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for OTP verification requests
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number in international format',
    example: '+1234567890',
  })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number in international format (e.g., +1234567890)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'One-time password (OTP)',
    example: '123456',
    minLength: 4,
    maxLength: 8,
  })
  @IsString({ message: 'OTP must be a string' })
  @Length(4, 8, { message: 'OTP must be between 4 and 8 characters' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp: string;
}