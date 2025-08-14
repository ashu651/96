import { IsOptional, IsString, IsEnum, IsArray, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export enum MediaCategory {
  PROFILE = 'profile',
  POST = 'post',
  STORY = 'story',
  MESSAGE = 'message',
  OTHER = 'other',
}

/**
 * DTO for media upload metadata
 */
export class UploadMediaDto {
  @ApiProperty({
    description: 'Media type',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType, { message: 'Media type must be a valid media type' })
  type: MediaType;

  @ApiProperty({
    description: 'Media category',
    enum: MediaCategory,
    example: MediaCategory.POST,
  })
  @IsEnum(MediaCategory, { message: 'Media category must be a valid category' })
  category: MediaCategory;

  @ApiProperty({
    description: 'Media title/name',
    example: 'My vacation photo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @ApiProperty({
    description: 'Media description',
    example: 'Beautiful sunset at the beach',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Array of tags for the media',
    example: ['beach', 'sunset', 'vacation'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Location where media was captured',
    example: 'Maldives',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiProperty({
    description: 'Whether the media is public',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsString({ message: 'IsPublic must be a string' })
  isPublic?: boolean;

  @ApiProperty({
    description: 'Associated post ID if media belongs to a post',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'PostId must be a string' })
  postId?: string;

  @ApiProperty({
    description: 'Associated story ID if media belongs to a story',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'StoryId must be a string' })
  storyId?: string;
}