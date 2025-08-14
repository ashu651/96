import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [PrismaModule, UsersModule, MediaModule, SocialModule],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}