import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePreferencesDto {
  [key: string]: boolean;
  @ApiPropertyOptional({
    description: 'Enable/disable follow notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  follow?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable like notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  likes?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable comment notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable mention notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable message notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable story view notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  storyViews?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable verification notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  verification?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable system notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email follow notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailFollow?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email like notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailLikes?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email comment notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailComments?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email mention notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailMentions?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email message notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailMessages?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email verification notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerification?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable email system notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailSystem?: boolean;
}