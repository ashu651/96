import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Media module for handling file uploads and media management
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}