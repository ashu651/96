import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ModerationResult {
  isApproved: boolean;
  toxicityScore: number;
  categories: string[];
  language: string;
  flags: string[];
  suggestions: string[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
  metadata: {
    wordCount: number;
    characterCount: number;
    hasLinks: boolean;
    hasEmojis: boolean;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
}

export interface ModerationRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  action: 'block' | 'flag' | 'review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
}

export interface ModerationConfig {
  autoModeration: boolean;
  toxicityThreshold: number;
  customRules: ModerationRule[];
  languageFilter: string[];
  linkFilter: boolean;
  emojiFilter: boolean;
  profanityFilter: boolean;
  hateSpeechFilter: boolean;
  spamFilter: boolean;
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly defaultConfig: ModerationConfig = {
    autoModeration: true,
    toxicityThreshold: 0.7,
    customRules: [],
    languageFilter: ['en', 'es', 'fr', 'de', 'it', 'pt'],
    linkFilter: true,
    emojiFilter: false,
    profanityFilter: true,
    hateSpeechFilter: true,
    spamFilter: true,
  };

  constructor(private readonly configService: ConfigService) {}

  async moderateText(content: string, config?: Partial<ModerationConfig>): Promise<ModerationResult> {
    const startTime = Date.now();
    const moderationConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Basic content analysis
      const wordCount = content.split(/\s+/).length;
      const characterCount = content.length;
      const hasLinks = /https?:\/\/[^\s]+/.test(content);
      const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content);
      
      // Toxicity analysis
      const toxicityScore = await this.analyzeToxicity(content, moderationConfig);
      
      // Category detection
      const categories = await this.detectCategories(content, moderationConfig);
      
      // Language detection
      const language = await this.detectLanguage(content);
      
      // Flag detection
      const flags = await this.detectFlags(content, moderationConfig);
      
      // Generate suggestions
      const suggestions = await this.generateSuggestions(content, flags, toxicityScore);
      
      // Sentiment analysis
      const sentiment = await this.analyzeSentiment(content);
      
      const processingTime = Date.now() - startTime;
      
      return {
        isApproved: toxicityScore < moderationConfig.toxicityThreshold && flags.length === 0,
        toxicityScore,
        categories,
        language,
        flags,
        suggestions,
        confidence: this.calculateConfidence(toxicityScore, flags.length),
        processingTime,
        timestamp: new Date(),
        metadata: {
          wordCount,
          characterCount,
          hasLinks,
          hasEmojis,
          sentiment,
        },
      };
    } catch (error) {
      this.logger.error('Error moderating text content', error);
      throw error;
    }
  }

  async moderateImage(imageUrl: string, config?: Partial<ModerationConfig>): Promise<ModerationResult> {
    const startTime = Date.now();
    const moderationConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Simulate image analysis API call
      await this.simulateApiCall('image-moderation');
      
      // Placeholder image moderation logic
      const toxicityScore = Math.random() * 0.3; // Most images are safe
      const categories = ['image', 'visual-content'];
      const language = 'visual';
      const flags: string[] = [];
      
      if (Math.random() < 0.1) {
        flags.push('potential-nsfw');
        categories.push('adult-content');
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        isApproved: toxicityScore < moderationConfig.toxicityThreshold && flags.length === 0,
        toxicityScore,
        categories,
        language,
        flags,
        suggestions: flags.length > 0 ? ['Review image content manually'] : [],
        confidence: this.calculateConfidence(toxicityScore, flags.length),
        processingTime,
        timestamp: new Date(),
        metadata: {
          wordCount: 0,
          characterCount: 0,
          hasLinks: false,
          hasEmojis: false,
          sentiment: 'neutral',
        },
      };
    } catch (error) {
      this.logger.error('Error moderating image content', error);
      throw error;
    }
  }

  async moderateBatch(contentList: string[], config?: Partial<ModerationConfig>): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];
    
    for (const content of contentList) {
      try {
        const result = await this.moderateText(content, config);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error moderating batch content: ${content}`, error);
        // Add error result
        results.push({
          isApproved: false,
          toxicityScore: 1.0,
          categories: ['error'],
          language: 'unknown',
          flags: ['processing-error'],
          suggestions: ['Retry moderation'],
          confidence: 0,
          processingTime: 0,
          timestamp: new Date(),
          metadata: {
            wordCount: 0,
            characterCount: 0,
            hasLinks: false,
            hasEmojis: false,
            sentiment: 'neutral',
          },
        });
      }
    }
    
    return results;
  }

  async createCustomRule(rule: Omit<ModerationRule, 'id'>): Promise<ModerationRule> {
    const newRule: ModerationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // In a real implementation, this would be stored in a database
    this.logger.log(`Created custom moderation rule: ${newRule.name}`);
    
    return newRule;
  }

  async updateModerationConfig(config: Partial<ModerationConfig>): Promise<ModerationConfig> {
    const updatedConfig = { ...this.defaultConfig, ...config };
    
    // In a real implementation, this would be stored in a database
    this.logger.log('Updated moderation configuration');
    
    return updatedConfig;
  }

  async getModerationStats(): Promise<{
    totalModerated: number;
    approvedCount: number;
    rejectedCount: number;
    averageProcessingTime: number;
    topFlags: Array<{ flag: string; count: number }>;
    toxicityDistribution: Array<{ range: string; count: number }>;
  }> {
    // Placeholder statistics
    return {
      totalModerated: 1000,
      approvedCount: 850,
      rejectedCount: 150,
      averageProcessingTime: 45,
      topFlags: [
        { flag: 'profanity', count: 45 },
        { flag: 'hate-speech', count: 30 },
        { flag: 'spam', count: 25 },
        { flag: 'inappropriate-content', count: 20 },
      ],
      toxicityDistribution: [
        { range: '0.0-0.2', count: 600 },
        { range: '0.2-0.4', count: 200 },
        { range: '0.4-0.6', count: 100 },
        { range: '0.6-0.8', count: 70 },
        { range: '0.8-1.0', count: 30 },
      ],
    };
  }

  private async analyzeToxicity(content: string, config: ModerationConfig): Promise<number> {
    let toxicityScore = 0;
    
    // Profanity detection
    if (config.profanityFilter) {
      const profanityWords = ['badword1', 'badword2', 'badword3']; // Placeholder
      const profanityCount = profanityWords.filter(word => 
        content.toLowerCase().includes(word)
      ).length;
      toxicityScore += profanityCount * 0.3;
    }
    
    // Hate speech detection
    if (config.hateSpeechFilter) {
      const hatePatterns = [
        /\b(hate|kill|destroy)\s+(all|every|the)\s+(people|humans|race)\b/i,
        /\b(white|black|asian|hispanic)\s+(supremacy|power|control)\b/i,
      ];
      
      const hateMatches = hatePatterns.filter(pattern => pattern.test(content)).length;
      toxicityScore += hateMatches * 0.5;
    }
    
    // Spam detection
    if (config.spamFilter) {
      const repeatedChars = /(.)\1{4,}/g;
      const repeatedMatches = (content.match(repeatedChars) || []).length;
      toxicityScore += repeatedMatches * 0.1;
      
      const excessiveLinks = (content.match(/https?:\/\/[^\s]+/g) || []).length;
      if (excessiveLinks > 3) {
        toxicityScore += 0.3;
      }
    }
    
    // Custom rules
    for (const rule of config.customRules) {
      if (rule.enabled) {
        const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;
        if (pattern.test(content)) {
          const severityMultiplier = {
            low: 0.2,
            medium: 0.4,
            high: 0.6,
            critical: 0.8,
          }[rule.severity];
          toxicityScore += severityMultiplier;
        }
      }
    }
    
    return Math.min(toxicityScore, 1.0);
  }

  private async detectCategories(content: string, config: ModerationConfig): Promise<string[]> {
    const categories: string[] = ['text-content'];
    
    // Content type detection
    if (/https?:\/\/[^\s]+/.test(content)) {
      categories.push('contains-links');
    }
    
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content)) {
      categories.push('contains-emojis');
    }
    
    // Topic detection (basic)
    const topics = {
      politics: /\b(politics|election|vote|government|president|minister)\b/i,
      sports: /\b(sports|football|basketball|soccer|game|match|team)\b/i,
      technology: /\b(tech|technology|computer|software|app|programming)\b/i,
      entertainment: /\b(movie|film|music|celebrity|actor|singer)\b/i,
      business: /\b(business|company|work|job|career|money)\b/i,
    };
    
    for (const [topic, pattern] of Object.entries(topics)) {
      if (pattern.test(content)) {
        categories.push(topic);
      }
    }
    
    return categories;
  }

  private async detectLanguage(content: string): Promise<string> {
    // Basic language detection (placeholder)
    const languagePatterns = {
      en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i,
      es: /\b(el|la|los|las|y|o|pero|en|con|por|para|de)\b/i,
      fr: /\b(le|la|les|et|ou|mais|dans|avec|par|pour|de)\b/i,
      de: /\b(der|die|das|und|oder|aber|in|mit|von|für|zu)\b/i,
    };
    
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(content)) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
  }

  private async detectFlags(content: string, config: ModerationConfig): Promise<string[]> {
    const flags: string[] = [];
    
    // Link filtering
    if (config.linkFilter && /https?:\/\/[^\s]+/.test(content)) {
      const links = content.match(/https?:\/\/[^\s]+/g) || [];
      for (const link of links) {
        if (this.isSuspiciousLink(link)) {
          flags.push('suspicious-link');
          break;
        }
      }
    }
    
    // Emoji filtering
    if (config.emojiFilter) {
      const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
      if (emojiCount > 10) {
        flags.push('excessive-emojis');
      }
    }
    
    // Length filtering
    if (content.length > 1000) {
      flags.push('content-too-long');
    }
    
    return flags;
  }

  private async generateSuggestions(content: string, flags: string[], toxicityScore: number): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (toxicityScore > 0.7) {
      suggestions.push('Consider rewording to be more respectful');
    }
    
    if (flags.includes('suspicious-link')) {
      suggestions.push('Remove or verify suspicious links');
    }
    
    if (flags.includes('excessive-emojis')) {
      suggestions.push('Reduce the number of emojis');
    }
    
    if (flags.includes('content-too-long')) {
      suggestions.push('Consider breaking content into smaller parts');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Content looks good!');
    }
    
    return suggestions;
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'upset'];
    
    const positiveCount = positiveWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(toxicityScore: number, flagCount: number): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on toxicity score
    if (toxicityScore > 0.8 || toxicityScore < 0.2) {
      confidence += 0.15; // High confidence for extreme scores
    } else if (toxicityScore > 0.6 || toxicityScore < 0.4) {
      confidence += 0.05; // Medium confidence for moderate scores
    }
    
    // Adjust based on flag count
    if (flagCount === 0) {
      confidence += 0.05;
    } else if (flagCount > 3) {
      confidence -= 0.1;
    }
    
    return Math.min(Math.max(confidence, 0.5), 1.0);
  }

  private isSuspiciousLink(link: string): boolean {
    const suspiciousPatterns = [
      /bit\.ly/i,
      /tinyurl\.com/i,
      /goo\.gl/i,
      /t\.co/i,
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(link));
  }

  private async simulateApiCall(operation: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }
}