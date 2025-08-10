import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great post! Thanks for sharing.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}