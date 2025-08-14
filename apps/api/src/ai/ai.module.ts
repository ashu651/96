import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { ContentModerationService } from './content-moderation.service';
import { RecommendationService } from './recommendation.service';
import { ComputerVisionService } from './computer-vision.service';
import { NlpService } from './nlp.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    ContentModerationService,
    RecommendationService,
    ComputerVisionService,
    NlpService,
  ],
  exports: [
    AiService,
    ContentModerationService,
    RecommendationService,
    ComputerVisionService,
    NlpService,
  ],
})
export class AiModule {}