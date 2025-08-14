import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MaxLength, IsUrl, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User bio or description',
    example: 'Software developer and coffee enthusiast',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User website URL',
    example: 'https://johndoe.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'User date of birth',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Whether the user profile is private',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show email in profile',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;
}