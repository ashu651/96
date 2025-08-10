import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for sending OTP requests
 */
export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number in international format',
    example: '+1234567890',
  })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number in international format (e.g., +1234567890)',
  })
  phoneNumber: string;
}