import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    description: 'ID of the user to block',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Reason for blocking the user',
    example: 'Inappropriate content',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}