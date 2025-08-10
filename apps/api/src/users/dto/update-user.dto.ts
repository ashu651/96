import { IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user profile
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'Username (must be unique)',
    example: 'johndoe',
    required: false,
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  username?: string;

  @ApiProperty({
    description: 'User bio/description',
    example: 'Software developer and coffee enthusiast',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;
}