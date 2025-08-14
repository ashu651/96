import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post content/text',
    example: 'Just had an amazing day at the beach! 🌊☀️',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Array of media URLs (images/videos)',
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
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Location where the post was created',
    example: 'Miami Beach, FL',
  })
  @IsOptional()
  @IsString()
  location?: string;
}