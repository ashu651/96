import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LIKES_COUNT = 'likesCount',
  COMMENTS_COUNT = 'commentsCount',
  SHARES_COUNT = 'sharesCount',
}

export enum PostSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO for querying posts with filters and pagination
 */
export class QueryPostsDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of posts per page',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;

  @ApiProperty({
    description: 'Search query for post content',
    example: 'coffee',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @ApiProperty({
    description: 'User ID to filter posts by author',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'UserId must be a valid UUID' })
  userId?: string;

  @ApiProperty({
    description: 'Username to filter posts by author',
    example: 'johndoe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  username?: string;

  @ApiProperty({
    description: 'Hashtag to filter posts',
    example: 'coffee',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Hashtag must be a string' })
  hashtag?: string;

  @ApiProperty({
    description: 'Location to filter posts',
    example: 'New York',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiProperty({
    description: 'Field to sort posts by',
    enum: PostSortBy,
    example: PostSortBy.CREATED_AT,
    required: false,
    default: PostSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(PostSortBy, { message: 'SortBy must be a valid sort field' })
  sortBy?: PostSortBy = PostSortBy.CREATED_AT;

  @ApiProperty({
    description: 'Sort order for posts',
    enum: PostSortOrder,
    example: PostSortOrder.DESC,
    required: false,
    default: PostSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(PostSortOrder, { message: 'SortOrder must be a valid sort order' })
  sortOrder?: PostSortOrder = PostSortOrder.DESC;

  @ApiProperty({
    description: 'Filter posts with media only',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  hasMedia?: boolean;

  @ApiProperty({
    description: 'Filter posts by date range (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'DateFrom must be a valid date string' })
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter posts by date range (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'DateTo must be a valid date string' })
  dateTo?: string;
}