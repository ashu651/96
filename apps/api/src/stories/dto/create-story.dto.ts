import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty({
    description: 'URL of the media file (image/video)',
    example: 'https://example.com/story-image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  mediaUrl: string;

  @ApiPropertyOptional({
    description: 'Story caption or text',
    example: 'Beautiful sunset at the beach! 🌅',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}