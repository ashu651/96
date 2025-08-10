import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Updated post content/text',
    example: 'Updated: Just had an amazing day at the beach! 🌊☀️',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated array of media URLs (images/videos)',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Whether the post is private (only visible to followers)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Updated location where the post was created',
    example: 'Miami Beach, FL',
  })
  @IsOptional()
  @IsString()
  location?: string;
}