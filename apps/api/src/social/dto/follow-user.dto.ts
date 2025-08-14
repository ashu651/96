import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FollowUserDto {
  @ApiProperty({
    description: 'ID of the user to follow',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}