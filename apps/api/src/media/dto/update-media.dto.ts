import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating media metadata
 */
export class UpdateMediaDto {
  @ApiProperty({
    description: 'Media title/name',
    example: 'Updated vacation photo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @ApiProperty({
    description: 'Media description',
    example: 'Updated description of the beautiful sunset',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Array of tags for the media',
    example: ['beach', 'sunset', 'vacation', 'updated'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Location where media was captured',
    example: 'Updated Maldives location',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiProperty({
    description: 'Whether the media is public',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'IsPublic must be a boolean' })
  isPublic?: boolean;
}