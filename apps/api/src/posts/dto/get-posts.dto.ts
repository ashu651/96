import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPostsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of posts per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'User ID to get posts from a specific user',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Search query to filter posts by content',
    example: 'beach vacation',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by post privacy (true for private, false for public)',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Filter posts that have media',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasMedia?: boolean;

  @ApiPropertyOptional({
    description: 'Sort posts by (createdAt, likes, comments)',
    example: 'createdAt',
    enum: ['createdAt', 'likes', 'comments'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'likes' | 'comments' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}