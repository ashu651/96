import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentModerationService } from './content-moderation.service';
import { RecommendationService } from './recommendation.service';
import { ComputerVisionService } from './computer-vision.service';
import { NlpService } from './nlp.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly contentModerationService: ContentModerationService,
    private readonly recommendationService: RecommendationService,
    private readonly computerVisionService: ComputerVisionService,
    private readonly nlpService: NlpService,
  ) {}

  async analyzeContent(content: string, mediaUrls?: string[]) {
    const results = {
      moderation: null,
      vision: null,
      nlp: null,
      recommendations: null,
    };

    try {
      // Content moderation
      if (content) {
        results.moderation = await this.contentModerationService.moderateText(content);
      }

      // Computer vision analysis
      if (mediaUrls && mediaUrls.length > 0) {
        results.vision = await this.computerVisionService.analyzeImages(mediaUrls);
      }

      // NLP analysis
      if (content) {
        results.nlp = await this.nlpService.analyzeText(content);
      }

      // Generate recommendations
      results.recommendations = await this.recommendationService.generateRecommendations({
        content,
        mediaUrls,
        moderation: results.moderation,
        vision: results.vision,
        nlp: results.nlp,
      });

      return results;
    } catch (error) {
      this.logger.error('Error analyzing content with AI', error);
      throw error;
    }
  }

  async getAiCapabilities() {
    return {
      contentModeration: true,
      computerVision: true,
      nlp: true,
      recommendations: true,
      realTime: true,
      multilingual: true,
    };
  }
}