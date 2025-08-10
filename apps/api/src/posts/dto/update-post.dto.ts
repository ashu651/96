import { IsString, IsOptional, IsArray, IsUrl, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating an existing post
 */
export class UpdatePostDto {
  @ApiProperty({
    description: 'Post content/text',
    example: 'Just had an amazing coffee! ☕️',
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content?: string;

  @ApiProperty({
    description: 'Array of media URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Media must be an array' })
  @IsUrl({}, { each: true, message: 'Each media item must be a valid URL' })
  media?: string[];

  @ApiProperty({
    description: 'Array of hashtags',
    example: ['coffee', 'morning', 'lifestyle'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Hashtags must be an array' })
  @IsString({ each: true, message: 'Each hashtag must be a string' })
  hashtags?: string[];

  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Coffee Shop',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiProperty({
    description: 'Whether the post is public',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'IsPublic must be a boolean' })
  isPublic?: boolean;

  @ApiProperty({
    description: 'Whether to allow comments',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'AllowComments must be a boolean' })
  allowComments?: boolean;
}