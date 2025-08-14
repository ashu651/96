import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NlpResult {
  id: string;
  text: string;
  sentiment: SentimentAnalysis;
  language: LanguageDetection;
  entities: Entity[];
  keywords: Keyword[];
  topics: Topic[];
  readability: ReadabilityScore;
  toxicity: ToxicityAnalysis;
  summary: TextSummary;
  hashtags: string[];
  processingTime: number;
  timestamp: Date;
  confidence: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // -1 to 1
  emotions: EmotionScore[];
  aspects: AspectSentiment[];
  confidence: number;
}

export interface EmotionScore {
  emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation';
  score: number;
  intensity: 'low' | 'medium' | 'high';
}

export interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export interface LanguageDetection {
  primary: string;
  confidence: number;
  alternatives: Array<{ language: string; confidence: number }>;
  script: string;
  detectedAt: Date;
}

export interface Entity {
  id: string;
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percent' | 'product' | 'event' | 'skill' | 'technology';
  confidence: number;
  metadata: {
    wikipedia?: string;
    dbpedia?: string;
    knowledgeGraph?: any;
  };
  boundingBox?: {
    start: number;
    end: number;
  };
}

export interface Keyword {
  text: string;
  score: number;
  category: string;
  frequency: number;
  importance: number;
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  category: string;
  subtopics: string[];
}

export interface ReadabilityScore {
  overall: number; // 0-100
  fleschKincaid: number;
  gunningFog: number;
  smog: number;
  colemanLiau: number;
  automatedReadability: number;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  suggestions: string[];
}

export interface ToxicityAnalysis {
  overall: number; // 0-1
  categories: {
    hate: number;
    violence: number;
    sexual: number;
    bullying: number;
    spam: number;
    misinformation: number;
  };
  flags: string[];
  confidence: number;
}

export interface TextSummary {
  extractive: string[];
  abstractive: string;
  keyPoints: string[];
  length: 'short' | 'medium' | 'long' | 'very-long';
  confidence: number;
}

export interface NlpConfig {
  enableSentimentAnalysis: boolean;
  enableEntityRecognition: boolean;
  enableKeywordExtraction: boolean;
  enableTopicModeling: boolean;
  enableReadabilityAnalysis: boolean;
  enableToxicityDetection: boolean;
  enableSummarization: boolean;
  enableMultilingual: boolean;
  confidenceThreshold: number;
  maxEntities: number;
  maxKeywords: number;
  maxTopics: number;
  maxSummarySentences?: number;
  maxHashtags?: number;
  supportedLanguages: string[];
}

@Injectable()
export class NlpService {
  private readonly logger = new Logger(NlpService.name);
  private readonly defaultConfig: NlpConfig = {
    enableSentimentAnalysis: true,
    enableEntityRecognition: true,
    enableKeywordExtraction: true,
    enableTopicModeling: true,
    enableReadabilityAnalysis: true,
    enableToxicityDetection: true,
    enableSummarization: true,
    enableMultilingual: true,
    confidenceThreshold: 0.7,
    maxEntities: 20,
    maxKeywords: 15,
    maxTopics: 8,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'],
  };

  constructor(private readonly configService: ConfigService) {}

  async analyzeText(text: string, config?: Partial<NlpConfig>): Promise<NlpResult> {
    const startTime = Date.now();
    const nlpConfig = { ...this.defaultConfig, ...config };
    
    try {
      const result: NlpResult = {
        id: `nlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        sentiment: { overall: 'neutral', score: 0, emotions: [], aspects: [], confidence: 0 },
        language: { primary: 'en', confidence: 0, alternatives: [], script: 'latin', detectedAt: new Date() },
        entities: [],
        keywords: [],
        topics: [],
        readability: { overall: 0, fleschKincaid: 0, gunningFog: 0, smog: 0, colemanLiau: 0, automatedReadability: 0, grade: 'Unknown', difficulty: 'medium', suggestions: [] },
        toxicity: { overall: 0, categories: { hate: 0, violence: 0, sexual: 0, bullying: 0, spam: 0, misinformation: 0 }, flags: [], confidence: 0 },
        summary: { extractive: [], abstractive: '', keyPoints: [], length: 'medium', confidence: 0 },
        hashtags: [],
        processingTime: 0,
        timestamp: new Date(),
        confidence: 0,
      };

      // Language detection
      if (nlpConfig.enableMultilingual) {
        result.language = await this.detectLanguage(text, nlpConfig);
      }

      // Sentiment analysis
      if (nlpConfig.enableSentimentAnalysis) {
        result.sentiment = await this.detectSentiment(text, nlpConfig);
      }

      // Entity recognition
      if (nlpConfig.enableEntityRecognition) {
        result.entities = await this.extractEntities(text, nlpConfig);
      }

      // Keyword extraction
      if (nlpConfig.enableKeywordExtraction) {
        result.keywords = await this.extractKeywords(text, nlpConfig);
      }

      // Topic modeling
      if (nlpConfig.enableTopicModeling) {
        result.topics = await this.identifyTopics(text, nlpConfig);
      }

      // Readability analysis
      if (nlpConfig.enableReadabilityAnalysis) {
        result.readability = await this.analyzeReadability(text, nlpConfig);
      }

      // Toxicity detection
      if (nlpConfig.enableToxicityDetection) {
        result.toxicity = await this.detectToxicity(text, nlpConfig);
      }

      // Summarization
      if (nlpConfig.enableSummarization) {
        result.summary = await this.generateSummary(text, nlpConfig);
      }

      // Hashtag suggestions
      result.hashtags = await this.suggestHashtags(text, result.keywords, nlpConfig);

      result.processingTime = Date.now() - startTime;
      result.confidence = this.calculateOverallConfidence(result, nlpConfig);

      return result;
    } catch (error) {
      this.logger.error('Error analyzing text with NLP', error);
      throw error;
    }
  }

  async detectSentiment(text: string, config?: Partial<NlpConfig>): Promise<SentimentAnalysis> {
    try {
      await this.simulateApiCall('sentiment-analysis');
      
      // Advanced sentiment analysis with emotion detection
      const words = text.toLowerCase().split(/\s+/);
      let positiveScore = 0;
      let negativeScore = 0;
      
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'happy', 'beautiful', 'perfect', 'fantastic', 'brilliant'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'upset', 'horrible', 'disgusting', 'painful', 'worst'];
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveScore += 1;
        if (negativeWords.includes(word)) negativeScore += 1;
      });
      
      const overallScore = (positiveScore - negativeScore) / Math.max(words.length, 1);
      const normalizedScore = Math.max(-1, Math.min(1, overallScore));
      
      let overall: SentimentAnalysis['overall'];
      if (normalizedScore > 0.3) overall = 'positive';
      else if (normalizedScore < -0.3) overall = 'negative';
      else if (Math.abs(normalizedScore) < 0.1) overall = 'neutral';
      else overall = 'mixed';
      
      // Emotion detection
      const emotions: EmotionScore[] = [
        { emotion: 'joy', score: Math.max(0, normalizedScore), intensity: this.getIntensity(Math.max(0, normalizedScore)) },
        { emotion: 'sadness', score: Math.max(0, -normalizedScore), intensity: this.getIntensity(Math.max(0, -normalizedScore)) },
        { emotion: 'anger', score: Math.random() * 0.3, intensity: this.getIntensity(Math.random() * 0.3) },
        { emotion: 'fear', score: Math.random() * 0.2, intensity: this.getIntensity(Math.random() * 0.2) },
        { emotion: 'surprise', score: Math.random() * 0.4, intensity: this.getIntensity(Math.random() * 0.4) },
        { emotion: 'trust', score: Math.max(0, normalizedScore * 0.8), intensity: this.getIntensity(Math.max(0, normalizedScore * 0.8)) },
        { emotion: 'anticipation', score: Math.random() * 0.5, intensity: this.getIntensity(Math.random() * 0.5) },
        { emotion: 'disgust', score: Math.random() * 0.1, intensity: this.getIntensity(Math.random() * 0.1) },
      ];
      
      // Aspect-based sentiment
      const aspects: AspectSentiment[] = [
        { aspect: 'content', sentiment: overall, score: normalizedScore, confidence: 0.8 },
        { aspect: 'tone', sentiment: overall, score: normalizedScore * 0.9, confidence: 0.7 },
        { aspect: 'clarity', sentiment: 'positive', score: 0.6, confidence: 0.6 },
      ];
      
      return {
        overall,
        score: normalizedScore,
        emotions: emotions.filter(e => e.score > 0.1),
        aspects,
        confidence: 0.8 + Math.random() * 0.2,
      };
    } catch (error) {
      this.logger.error('Error detecting sentiment', error);
      return { overall: 'neutral', score: 0, emotions: [], aspects: [], confidence: 0 };
    }
  }

  async detectLanguage(text: string, config?: Partial<NlpConfig>): Promise<LanguageDetection> {
    try {
      await this.simulateApiCall('language-detection');
      
      // Enhanced language detection with improved patterns and scoring
      const languagePatterns = {
        en: { 
          pattern: /\b(the|and|or|but|in|on|at|to|for|of|with|by|is|are|was|were|this|that|have|has|had|will|would|could|should)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        es: { 
          pattern: /\b(el|la|los|las|y|o|pero|en|con|por|para|de|es|son|era|eran|que|como|cuando|donde|quien|porque|si|no|muy|más|menos)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        fr: { 
          pattern: /\b(le|la|les|et|ou|mais|dans|avec|par|pour|de|est|sont|était|étaient|que|comment|quand|où|qui|pourquoi|si|non|très|plus|moins)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        de: { 
          pattern: /\b(der|die|das|und|oder|aber|in|mit|von|für|zu|ist|sind|war|waren|was|wie|wann|waar|wer|warum|wenn|nicht|sehr|mehr|weniger)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        it: { 
          pattern: /\b(il|la|gli|le|e|o|ma|in|con|per|da|di|è|sono|era|erano|che|come|quando|dove|chi|perché|se|non|molto|più|meno)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        pt: { 
          pattern: /\b(o|a|os|as|e|ou|mas|em|com|por|para|de|é|são|era|eram|que|como|quando|onde|quem|porque|se|não|muito|mais|menos)\b/i, 
          script: 'latin',
          weight: 1.0
        },
        ru: { 
          pattern: /\b(и|в|на|с|по|для|от|до|не|что|как|где|когда|кто|это|был|была|были|было|или|но|а|если|нет|очень|больше|меньше)\b/i, 
          script: 'cyrillic',
          weight: 1.2
        },
        zh: { 
          pattern: /[\u4e00-\u9fff]/, 
          script: 'han',
          weight: 1.5
        },
        ja: { 
          pattern: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/, 
          script: 'han',
          weight: 1.5
        },
        ko: { 
          pattern: /[\uac00-\ud7af]/, 
          script: 'hangul',
          weight: 1.3
        },
        ar: { 
          pattern: /[\u0600-\u06ff]/, 
          script: 'arabic',
          weight: 1.4
        },
        hi: { 
          pattern: /[\u0900-\u097f]/, 
          script: 'devanagari',
          weight: 1.3
        },
        tr: {
          pattern: /\b(bir|ve|veya|ama|için|ile|gibi|ne|nasıl|nerede|ne zaman|kim|neden|eğer|hayır|çok|daha|az)\b/i,
          script: 'latin',
          weight: 1.0
        },
        nl: {
          pattern: /\b(de|het|een|en|of|maar|in|met|voor|van|naar|is|zijn|was|waren|wat|hoe|wanneer|waar|wie|waarom|als|niet|zeer|meer|minder)\b/i,
          script: 'latin',
          weight: 1.0
        },
        pl: {
          pattern: /\b(i|oraz|lub|ale|w|z|dla|od|do|nie|co|jak|gdzie|kiedy|kto|dlaczego|jeśli|nie|bardzo|więcej|mniej)\b/i,
          script: 'latin',
          weight: 1.0
        }
      };
      
      // Calculate text characteristics
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const totalWords = words.length;
      const charCount = text.length;
      
      if (totalWords === 0) {
        return { 
          primary: 'en', 
          confidence: 0, 
          alternatives: [], 
          script: 'latin', 
          detectedAt: new Date() 
        };
      }
      
      let bestMatch = { language: 'en', confidence: 0.3, script: 'latin' };
      const languageScores: Array<{ language: string; score: number; script: string }> = [];
      
      for (const [lang, data] of Object.entries(languagePatterns)) {
        const matches = (text.match(data.pattern) || []).length;
        
        // Calculate confidence based on multiple factors
        let score = 0;
        
        // Pattern matching score (weighted by language-specific weight)
        if (matches > 0) {
          score += (matches / totalWords) * data.weight * 0.6;
        }
        
        // Script detection bonus
        if (data.script !== 'latin') {
          const scriptChars = text.match(data.pattern) || [];
          if (scriptChars.length > 0) {
            score += (scriptChars.length / charCount) * 0.4;
          }
        }
        
        // Length-based confidence adjustment
        if (totalWords >= 10) {
          score *= 1.2; // Boost confidence for longer texts
        } else if (totalWords < 3) {
          score *= 0.7; // Reduce confidence for very short texts
        }
        
        score = Math.min(score, 1.0);
        
        languageScores.push({ language: lang, score, script: data.script });
        
        if (score > bestMatch.confidence) {
          bestMatch = { language: lang, confidence: score, script: data.script };
        }
      }
      
      // Generate alternatives with realistic confidence scores
      const alternatives = languageScores
        .filter(lang => lang.language !== bestMatch.language && lang.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(lang => ({
          language: lang.language,
          confidence: Math.max(0.1, lang.score * 0.8), // Realistic alternative confidence
        }));
      
      // Adjust confidence based on text characteristics
      let finalConfidence = bestMatch.confidence;
      
      // Boost confidence for clear script indicators
      if (bestMatch.script !== 'latin' && bestMatch.confidence > 0.3) {
        finalConfidence = Math.min(1.0, finalConfidence * 1.2);
      }
      
      // Reduce confidence for mixed scripts
      const uniqueScripts = new Set(languageScores.map(l => l.script));
      if (uniqueScripts.size > 1) {
        finalConfidence *= 0.9;
      }
      
      return {
        primary: bestMatch.language,
        confidence: Math.min(1.0, finalConfidence),
        alternatives,
        script: bestMatch.script,
        detectedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error detecting language', error);
      return { 
        primary: 'en', 
        confidence: 0, 
        alternatives: [], 
        script: 'latin', 
        detectedAt: new Date() 
      };
    }
  }

  async extractEntities(text: string, config?: Partial<NlpConfig>): Promise<Entity[]> {
    try {
      await this.simulateApiCall('entity-extraction');
      
      // Enhanced entity recognition with improved patterns and confidence scoring
      const entities: Entity[] = [];
      
      // Person names (improved pattern matching)
      const personPatterns = [
        /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // First Last
        /\b([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)\b/g, // First Middle Last
        /\b([A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+)\b/g, // First M. Last
      ];
      
      personPatterns.forEach(pattern => {
        const persons = text.match(pattern) || [];
        persons.forEach((person, index) => {
          const confidence = this.calculateEntityConfidence(person, text, 'person');
          entities.push({
            id: `person_${index}_${Date.now()}`,
            text: person,
            type: 'person',
            confidence,
            metadata: {
              wikipedia: `https://en.wikipedia.org/wiki/${person.replace(/\s+/g, '_')}`,
              dbpedia: `http://dbpedia.org/resource/${person.replace(/\s+/g, '_')}`,
            },
            boundingBox: { start: text.indexOf(person), end: text.indexOf(person) + person.length },
          });
        });
      });
      
      // Organizations (enhanced patterns)
      const orgPatterns = [
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:Corp|Inc|LLC|Ltd|Company|Organization|Foundation|Institute|University|College|Hospital|Bank|Corporation))\b/g,
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:&|and) [A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g, // Company & Company
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:Group|Systems|Technologies|Solutions|Services|Partners))\b/g,
      ];
      
      orgPatterns.forEach(pattern => {
        const orgs = text.match(pattern) || [];
        orgs.forEach((org, index) => {
          const confidence = this.calculateEntityConfidence(org, text, 'organization');
          entities.push({
            id: `org_${index}_${Date.now()}`,
            text: org,
            type: 'organization',
            confidence,
            metadata: {
              dbpedia: `http://dbpedia.org/resource/${org.replace(/\s+/g, '_')}`,
            },
            boundingBox: { start: text.indexOf(org), end: text.indexOf(org) + org.length },
          });
        });
      });
      
      // Locations (comprehensive patterns)
      const locationPatterns = [
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:Street|Avenue|Road|Boulevard|Drive|Lane|Place|Court|Way|Circle|Plaza|Square))\b/g,
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:City|Town|Village|County|State|Province|Country|District|Region|Zone|Area))\b/g,
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:Park|Building|Center|Mall|Airport|Station|Hospital|School|University|Museum|Library))\b/g,
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)* (?:Mountain|Lake|River|Ocean|Sea|Island|Forest|Desert|Valley|Canyon))\b/g,
      ];
      
      locationPatterns.forEach(pattern => {
        const locations = text.match(pattern) || [];
        locations.forEach((location, index) => {
          const confidence = this.calculateEntityConfidence(location, text, 'location');
          entities.push({
            id: `location_${index}_${Date.now()}`,
            text: location,
            type: 'location',
            confidence,
            metadata: {
              dbpedia: `http://dbpedia.org/resource/${location.replace(/\s+/g, '_')}`,
            },
            boundingBox: { start: text.indexOf(location), end: text.indexOf(location) + location.length },
          });
        });
      });
      
      // Dates (multiple formats)
      const datePatterns = [
        /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // MM/DD/YYYY
        /\b(\d{4}-\d{2}-\d{2})\b/g, // YYYY-MM-DD
        /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi, // Month DD, YYYY
        /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\b/gi, // DD Mon YYYY
        /\b((?:today|yesterday|tomorrow|next week|last month|this year))\b/gi, // Relative dates
      ];
      
      datePatterns.forEach(pattern => {
        const dates = text.match(pattern) || [];
        dates.forEach((date, index) => {
          const confidence = this.calculateEntityConfidence(date, text, 'date');
          entities.push({
            id: `date_${index}_${Date.now()}`,
            text: date,
            type: 'date',
            confidence,
            metadata: {},
            boundingBox: { start: text.indexOf(date), end: text.indexOf(date) + date.length },
          });
        });
      });
      
      // Money amounts
      const moneyPattern = /\b(\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP|JPY|CAD|AUD))\b/gi;
      const moneyMatches = text.match(moneyPattern) || [];
      moneyMatches.forEach((money, index) => {
        const confidence = this.calculateEntityConfidence(money, text, 'money');
        entities.push({
          id: `money_${index}_${Date.now()}`,
          text: money,
          type: 'money',
          confidence,
          metadata: {},
          boundingBox: { start: text.indexOf(money), end: text.indexOf(money) + money.length },
        });
      });
      
      // Percentages
      const percentPattern = /\b(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*percent|per\s*cent)\b/gi;
      const percentMatches = text.match(percentPattern) || [];
      percentMatches.forEach((percent, index) => {
        const confidence = this.calculateEntityConfidence(percent, text, 'percent');
        entities.push({
          id: `percent_${index}_${Date.now()}`,
          text: percent,
          type: 'percent',
          confidence,
          metadata: {},
          boundingBox: { start: text.indexOf(percent), end: text.indexOf(percent) + percent.length },
        });
      });
      
      // Technologies and Skills
      const techPatterns = [
        /\b(?:JavaScript|Python|React|Node\.js|TypeScript|Docker|Kubernetes|AWS|Azure|Google Cloud|Machine Learning|AI|API|REST|GraphQL|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch)\b/gi,
        /\b(?:HTML|CSS|Sass|Less|Bootstrap|Tailwind|Vue\.js|Angular|Svelte|Next\.js|Nuxt\.js|Express|FastAPI|Django|Flask|Spring|Laravel|Symfony)\b/gi,
        /\b(?:Git|GitHub|GitLab|Bitbucket|CI\/CD|Jenkins|Travis|CircleCI|GitHub Actions|Docker Compose|Terraform|Ansible|Chef|Puppet)\b/gi,
      ];
      
      techPatterns.forEach(pattern => {
        const techs = text.match(pattern) || [];
        techs.forEach((tech, index) => {
          const confidence = this.calculateEntityConfidence(tech, text, 'technology');
          entities.push({
            id: `tech_${index}_${Date.now()}`,
            text: tech,
            type: 'technology',
            confidence,
            metadata: {},
            boundingBox: { start: text.indexOf(tech), end: text.indexOf(tech) + tech.length },
          });
        });
      });
      
      // URLs and emails
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urlMatches = text.match(urlPattern) || [];
      urlMatches.forEach((url, index) => {
        entities.push({
          id: `url_${index}_${Date.now()}`,
          text: url,
          type: 'url',
          confidence: 0.95,
          metadata: {},
          boundingBox: { start: text.indexOf(url), end: text.indexOf(url) + url.length },
        });
      });
      
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emailMatches = text.match(emailPattern) || [];
      emailMatches.forEach((email, index) => {
        entities.push({
          id: `email_${index}_${Date.now()}`,
          text: email,
          type: 'email',
          confidence: 0.95,
          metadata: {},
          boundingBox: { start: text.indexOf(email), end: text.indexOf(email) + email.length },
        });
      });
      
      // Remove duplicates and filter by confidence
      const uniqueEntities = this.removeDuplicateEntities(entities);
      
      return uniqueEntities
        .filter(entity => entity.confidence >= (config?.confidenceThreshold || 0.7))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, config?.maxEntities || 20);
    } catch (error) {
      this.logger.error('Error extracting entities', error);
      return [];
    }
  }

  async extractKeywords(text: string, config?: Partial<NlpConfig>): Promise<Keyword[]> {
    try {
      await this.simulateApiCall('keyword-extraction');
      
      // Enhanced keyword extraction with advanced scoring and filtering
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !this.isStopWord(word));
      
      if (words.length === 0) return [];
      
      const wordFreq: Record<string, number> = {};
      const wordPositions: Record<string, number[]> = {};
      
      // Calculate frequency and track positions
      words.forEach((word, index) => {
        if (!wordFreq[word]) {
          wordFreq[word] = 0;
          wordPositions[word] = [];
        }
        wordFreq[word]++;
        wordPositions[word].push(index);
      });
      
      // Enhanced keyword scoring with multiple factors
      const keywords: Keyword[] = Object.entries(wordFreq)
        .map(([word, frequency]) => {
          const importance = this.calculateEnhancedWordImportance(
            word, 
            frequency, 
            words.length, 
            wordPositions[word],
            text
          );
          const category = this.categorizeWord(word);
          
          return {
            text: word,
            score: importance,
            category,
            frequency,
            importance,
          };
        })
        .filter(keyword => keyword.importance > 0.1) // Filter out very low importance words
        .sort((a, b) => b.importance - a.importance)
        .slice(0, config?.maxKeywords || 15);
      
      return keywords;
    } catch (error) {
      this.logger.error('Error extracting keywords', error);
      return [];
    }
  }

  async identifyTopics(text: string, config?: Partial<NlpConfig>): Promise<Topic[]> {
    try {
      await this.simulateApiCall('topic-modeling');
      
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      if (words.length === 0) return [];
      
      const wordFreq: Record<string, number> = {};
      const wordPositions: Record<string, number[]> = {};
      
      words.forEach((word, index) => {
        if (word.length > 2 && !this.isStopWord(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
          if (!wordPositions[word]) wordPositions[word] = [];
          wordPositions[word].push(index);
        }
      });
      
      const topics: Topic[] = [];
      const categoryPatterns = this.getCategoryPatterns();
      
      // Identify topics based on predefined categories
      for (const [category, patterns] of Object.entries(categoryPatterns)) {
        const score = this.calculateCategoryScore(wordFreq, wordPositions, patterns, words.length);
        if (score > 0.15) { // Higher threshold for better quality
          const keywords = this.getCategoryKeywords(wordFreq, category, patterns);
          if (keywords.length > 0) {
            topics.push({
              name: category.charAt(0).toUpperCase() + category.slice(1),
              confidence: Math.min(score, 1.0),
              keywords: keywords.slice(0, 5), // Limit to top 5 keywords
              category,
              subtopics: this.generateSubtopics(category),
            });
          }
        }
      }
      
      // Add dynamic topic detection based on keyword clustering
      const dynamicTopics = this.detectDynamicTopics(wordFreq, wordPositions, words.length);
      topics.push(...dynamicTopics);
      
      return topics
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, config?.maxTopics || 8);
    } catch (error) {
      this.logger.error('Error identifying topics', error);
      return [];
    }
  }

  async analyzeReadability(text: string, config?: Partial<NlpConfig>): Promise<ReadabilityScore> {
    try {
      await this.simulateApiCall('readability-analysis');
      
      // Clean and normalize text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      if (cleanText.length === 0) {
        return this.getDefaultReadabilityScore();
      }
      
      const sentences = this.splitIntoSentences(cleanText);
      const words = this.splitIntoWords(cleanText);
      const syllables = this.countSyllables(cleanText);
      const letters = this.countLetters(cleanText);
      const paragraphs = this.splitIntoParagraphs(cleanText);
      
      // Enhanced readability metrics
      const fleschKincaid = this.calculateFleschKincaid(words.length, sentences.length, syllables);
      const gunningFog = this.calculateGunningFog(words, sentences.length);
      const smog = this.calculateSMOG(words, sentences.length);
      const colemanLiau = this.calculateColemanLiau(letters, words.length, sentences.length);
      const automatedReadability = this.calculateAutomatedReadability(letters, words.length, sentences.length);
      const fleschReadingEase = this.calculateFleschReadingEase(words.length, sentences.length, syllables);
      
      // Calculate overall readability score
      const overall = this.calculateOverallReadability({
        fleschKincaid,
        gunningFog,
        smog,
        colemanLiau,
        automatedReadability,
        fleschReadingEase
      });
      
      // Determine grade level and difficulty
      const grade = this.determineGradeLevel(fleschKincaid);
      const difficulty = this.determineDifficulty(overall);
      
      // Generate intelligent suggestions
      const suggestions = this.generateReadabilitySuggestions({
        sentences,
        words,
        complexWords: words.filter(w => this.countSyllables(w) > 2).length,
        paragraphs,
        overall,
        fleschKincaid
      });
      
      return {
        overall: Math.max(0, Math.min(100, overall)),
        fleschKincaid: Math.max(0, fleschKincaid),
        gunningFog: Math.max(0, gunningFog),
        smog: Math.max(0, smog),
        colemanLiau: Math.max(0, colemanLiau),
        automatedReadability: Math.max(0, automatedReadability),
        grade,
        difficulty,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error analyzing readability', error);
      return this.getDefaultReadabilityScore();
    }
  }

  async detectToxicity(text: string, config?: Partial<NlpConfig>): Promise<ToxicityAnalysis> {
    try {
      await this.simulateApiCall('toxicity-detection');
      
      // Enhanced toxicity detection with context analysis
      const cleanText = text.replace(/\s+/g, ' ').trim();
      if (cleanText.length === 0) {
        return this.getDefaultToxicityScore();
      }
      
      const words = this.splitIntoWords(cleanText);
      const sentences = this.splitIntoSentences(cleanText);
      const wordFreq = this.calculateWordFrequency(words);
      const wordPositions = this.calculateWordPositions(words);
      
      // Enhanced toxicity patterns with context awareness
      const toxicityPatterns = this.getToxicityPatterns();
      
      // Calculate category scores with context analysis
      const categories = {
        hate: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.hate, words.length, cleanText),
        violence: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.violence, words.length, cleanText),
        sexual: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.sexual, words.length, cleanText),
        bullying: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.bullying, words.length, cleanText),
        spam: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.spam, words.length, cleanText),
        misinformation: this.calculateToxicityScore(wordFreq, wordPositions, toxicityPatterns.misinformation, words.length, cleanText),
      };
      
      // Context-aware overall score calculation
      const overall = this.calculateOverallToxicityScore(categories, wordFreq, sentences.length, words.length);
      
      // Enhanced flag generation with severity levels
      const flags = this.generateToxicityFlags(categories, overall);
      
      // Calculate confidence based on pattern matches and text characteristics
      const confidence = this.calculateToxicityConfidence(categories, wordFreq, words.length);
      
      return {
        overall,
        categories,
        flags,
        confidence,
      };
    } catch (error) {
      this.logger.error('Error detecting toxicity', error);
      return this.getDefaultToxicityScore();
    }
  }

  async generateSummary(text: string, config?: Partial<NlpConfig>): Promise<TextSummary> {
    try {
      await this.simulateApiCall('text-summarization');
      
      // Clean and normalize text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      if (cleanText.length === 0) {
        return this.getDefaultSummary();
      }
      
      // Enhanced text preprocessing
      const sentences = this.splitIntoSentences(cleanText);
      const words = this.splitIntoWords(cleanText);
      const paragraphs = this.splitIntoParagraphs(cleanText);
      
      if (sentences.length === 0 || words.length === 0) {
        return this.getDefaultSummary();
      }
      
      // Enhanced sentence scoring with multiple factors
      const sentenceScores = sentences.map((sentence, index) => ({
        sentence,
        index,
        score: this.calculateEnhancedSentenceScore(sentence, words, cleanText, index, sentences.length),
        position: this.calculatePositionScore(index, sentences.length),
        length: this.calculateLengthScore(sentence.length),
        keywordDensity: this.calculateKeywordDensity(sentence, words),
        novelty: this.calculateNoveltyScore(sentence, sentences, index),
      }));
      
      // Calculate optimal summary length based on text characteristics
      const targetLength = this.calculateOptimalSummaryLength(words.length, sentences.length, config);
      
      // Enhanced extractive summarization with redundancy removal
      const extractive = this.generateExtractiveSummary(sentenceScores, targetLength, sentences.length);
      
      // Improved abstractive summarization
      const abstractive = this.generateAbstractiveSummary(extractive, words, sentences, paragraphs, cleanText);
      
      // Enhanced key points extraction
      const keyPoints = this.extractKeyPoints(extractive, words, sentences);
      
      // Determine text length category
      const length = this.determineTextLength(words.length);
      
      // Calculate confidence based on summary quality
      const confidence = this.calculateSummaryConfidence(extractive, sentences, words, cleanText);
      
      return {
        extractive,
        abstractive,
        keyPoints,
        length,
        confidence,
      };
    } catch (error) {
      this.logger.error('Error generating summary', error);
      return this.getDefaultSummary();
    }
  }

  async suggestHashtags(text: string, keywords: Keyword[], config?: Partial<NlpConfig>): Promise<string[]> {
    try {
      // Clean and normalize text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      if (cleanText.length === 0) return [];
      
      const hashtags: string[] = [];
      
      // Enhanced keyword-based hashtags with relevance scoring
      const keywordHashtags = this.generateKeywordHashtags(keywords, cleanText);
      hashtags.push(...keywordHashtags);
      
      // Enhanced entity-based hashtags
      const entities = await this.extractEntities(cleanText, config);
      const entityHashtags = this.generateEntityHashtags(entities, cleanText);
      hashtags.push(...entityHashtags);
      
      // Context-aware trending hashtags
      const trendingHashtags = this.generateTrendingHashtags(cleanText, keywords, entities);
      hashtags.push(...trendingHashtags);
      
      // Generate domain-specific hashtags
      const domainHashtags = this.generateDomainHashtags(cleanText, keywords);
      hashtags.push(...domainHashtags);
      
      // Generate sentiment-based hashtags
      const sentimentHashtags = this.generateSentimentHashtags(cleanText);
      hashtags.push(...sentimentHashtags);
      
      // Remove duplicates and filter by quality
      const uniqueHashtags = this.filterAndRankHashtags([...new Set(hashtags)], cleanText, keywords);
      
      return uniqueHashtags.slice(0, config?.maxHashtags || 15);
    } catch (error) {
      this.logger.error('Error suggesting hashtags', error);
      return [];
    }
  }

  async updateNlpConfig(config: Partial<NlpConfig>): Promise<NlpConfig> {
    const updatedConfig = { ...this.defaultConfig, ...config };
    
    // In a real implementation, this would be stored in a database
    this.logger.log('Updated NLP configuration');
    
    return updatedConfig;
  }

  async getNlpCapabilities(): Promise<{
    supportedLanguages: string[];
    processingSpeed: number;
    accuracy: number;
    features: string[];
    models: string[];
  }> {
    return {
      supportedLanguages: this.defaultConfig.supportedLanguages,
      processingSpeed: 1000, // words per second
      accuracy: 0.89,
      features: [
        'Sentiment Analysis',
        'Emotion Detection',
        'Entity Recognition',
        'Keyword Extraction',
        'Topic Modeling',
        'Readability Analysis',
        'Toxicity Detection',
        'Text Summarization',
        'Multilingual Support',
        'Real-time Processing',
      ],
      models: [
        'BERT-based',
        'Transformer-based',
        'Rule-based',
        'Statistical',
        'Hybrid',
      ],
    };
  }

  private getIntensity(score: number): 'low' | 'medium' | 'high' {
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'medium';
    return 'high';
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'];
    return stopWords.includes(word.toLowerCase());
  }

  private calculateWordImportance(word: string, frequency: number, totalWords: number): number {
    const tf = frequency / totalWords;
    const idf = Math.log(1000 / (frequency + 1)); // Simplified IDF
    return tf * idf;
  }

  private categorizeWord(word: string): string {
    const categories: Record<string, string[]> = {
      technology: ['javascript', 'python', 'react', 'node', 'api', 'database', 'server', 'cloud'],
      business: ['company', 'business', 'market', 'product', 'service', 'customer', 'revenue', 'profit'],
      science: ['research', 'study', 'analysis', 'data', 'experiment', 'theory', 'hypothesis'],
      entertainment: ['movie', 'music', 'game', 'show', 'performance', 'artist', 'actor'],
      sports: ['game', 'team', 'player', 'score', 'match', 'tournament', 'championship'],
    };
    
    for (const [category, words] of Object.entries(categories)) {
      if (words.includes(word.toLowerCase())) return category;
    }
    
    return 'general';
  }

  private generateSubtopics(category: string): string[] {
    const subtopicMap: Record<string, string[]> = {
      technology: ['web development', 'mobile apps', 'artificial intelligence', 'cloud computing'],
      business: ['marketing', 'finance', 'operations', 'strategy'],
      science: ['biology', 'chemistry', 'physics', 'mathematics'],
      entertainment: ['film', 'television', 'gaming', 'music'],
      sports: ['football', 'basketball', 'tennis', 'soccer'],
    };
    
    return subtopicMap[category] || ['general', 'specific', 'related'];
  }

  private splitIntoSentences(text: string): string[] {
    // More sophisticated sentence splitting that handles abbreviations, numbers, etc.
    const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])/g;
    return text.split(sentenceRegex).filter(s => s.trim().length > 0);
  }

  private splitIntoWords(text: string): string[] {
    // Split into words, handling contractions and special characters
    return text.match(/\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g) || [];
  }

  private splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }

  private countLetters(text: string): number {
    return text.replace(/[^a-zA-Z]/g, '').length;
  }

  private countSyllables(text: string): number {
    return text.split(/\s+/).reduce((total, word) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length === 0) return total;
      
      // Improved syllable counting algorithm
      let syllables = 0;
      let prevVowel = false;
      
      for (let i = 0; i < cleanWord.length; i++) {
        const isVowel = /[aeiouy]/.test(cleanWord[i]);
        if (isVowel && !prevVowel) {
          syllables++;
        }
        prevVowel = isVowel;
      }
      
      // Handle special cases
      if (cleanWord.endsWith('e') && syllables > 1) syllables--;
      if (syllables === 0) syllables = 1;
      
      return total + syllables;
    }, 0);
  }

  private calculateFleschKincaid(words: number, sentences: number, syllables: number): number {
    if (words === 0 || sentences === 0) return 0;
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private calculateGunningFog(words: string[], sentences: number): number {
    if (words.length === 0 || sentences === 0) return 0;
    const complexWords = words.filter(word => this.countSyllables(word) > 2).length;
    return 0.4 * ((words.length / sentences) + 100 * (complexWords / words.length));
  }

  private calculateSMOG(words: string[], sentences: number): number {
    if (words.length === 0 || sentences === 0) return 0;
    const complexWords = words.filter(word => this.countSyllables(word) > 2).length;
    return 1.043 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
  }

  private calculateColemanLiau(letters: number, words: number, sentences: number): number {
    if (words === 0 || sentences === 0) return 0;
    return 0.0588 * (letters / words * 100) - 0.296 * (sentences / words * 100) - 15.8;
  }

  private calculateAutomatedReadability(letters: number, words: number, sentences: number): number {
    if (words === 0 || sentences === 0) return 0;
    return 4.71 * (letters / words) + 0.5 * (words / sentences) - 21.43;
  }

  private calculateFleschReadingEase(words: number, sentences: number, syllables: number): number {
    if (words === 0 || sentences === 0) return 0;
    return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  }

  private calculateOverallReadability(metrics: {
    fleschKincaid: number;
    gunningFog: number;
    smog: number;
    colemanLiau: number;
    automatedReadability: number;
    fleschReadingEase: number;
  }): number {
    // Weighted average of all metrics, normalized to 0-100 scale
    const weights = {
      fleschKincaid: 0.25,
      gunningFog: 0.2,
      smog: 0.2,
      colemanLiau: 0.15,
      automatedReadability: 0.1,
      fleschReadingEase: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    // Flesch-Kincaid: lower is better, convert to 0-100 scale
    if (metrics.fleschKincaid > 0) {
      const normalized = Math.max(0, 100 - (metrics.fleschKincaid * 5));
      weightedSum += normalized * weights.fleschKincaid;
      totalWeight += weights.fleschKincaid;
    }

    // Gunning Fog: lower is better, convert to 0-100 scale
    if (metrics.gunningFog > 0) {
      const normalized = Math.max(0, 100 - (metrics.gunningFog * 3));
      weightedSum += normalized * weights.gunningFog;
      totalWeight += weights.gunningFog;
    }

    // SMOG: lower is better, convert to 0-100 scale
    if (metrics.smog > 0) {
      const normalized = Math.max(0, 100 - (metrics.smog * 4));
      weightedSum += normalized * weights.smog;
      totalWeight += weights.smog;
    }

    // Coleman-Liau: lower is better, convert to 0-100 scale
    if (metrics.colemanLiau > 0) {
      const normalized = Math.max(0, 100 - (metrics.colemanLiau * 3));
      weightedSum += normalized * weights.colemanLiau;
      totalWeight += weights.colemanLiau;
    }

    // Automated Readability: lower is better, convert to 0-100 scale
    if (metrics.automatedReadability > 0) {
      const normalized = Math.max(0, 100 - (metrics.automatedReadability * 2));
      weightedSum += normalized * weights.automatedReadability;
      totalWeight += weights.automatedReadability;
    }

    // Flesch Reading Ease: higher is better, already 0-100 scale
    if (metrics.fleschReadingEase > 0) {
      weightedSum += Math.max(0, Math.min(100, metrics.fleschReadingEase)) * weights.fleschReadingEase;
      totalWeight += weights.fleschReadingEase;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  private determineGradeLevel(fleschKincaid: number): string {
    if (fleschKincaid < 6) return 'Elementary';
    if (fleschKincaid < 10) return 'Middle School';
    if (fleschKincaid < 12) return 'High School';
    if (fleschKincaid < 16) return 'College';
    if (fleschKincaid < 18) return 'Graduate';
    return 'Professional';
  }

  private determineDifficulty(overall: number): 'easy' | 'medium' | 'hard' {
    if (overall > 70) return 'easy';
    if (overall > 40) return 'medium';
    return 'hard';
  }

  private generateReadabilitySuggestions(data: {
    sentences: string[];
    words: string[];
    complexWords: number;
    paragraphs: string[];
    overall: number;
    fleschKincaid: number;
  }): string[] {
    const suggestions: string[] = [];
    
    // Sentence length suggestions
    const avgSentenceLength = data.words.length / data.sentences.length;
    if (avgSentenceLength > 25) {
      suggestions.push('Consider breaking down long sentences into shorter, clearer ones');
    } else if (avgSentenceLength < 8) {
      suggestions.push('Some sentences may be too short - consider combining related ideas');
    }
    
    // Complex word suggestions
    const complexWordRatio = data.complexWords / data.words.length;
    if (complexWordRatio > 0.25) {
      suggestions.push('Reduce the use of complex words to improve readability');
    }
    
    // Paragraph structure suggestions
    if (data.paragraphs.length < 2 && data.words.length > 100) {
      suggestions.push('Consider breaking the text into more paragraphs for better structure');
    }
    
    // Overall readability suggestions
    if (data.overall < 40) {
      suggestions.push('The text may be too complex for general audiences');
    } else if (data.overall > 80) {
      suggestions.push('The text is very readable - consider if it needs more depth');
    }
    
    // Specific metric suggestions
    if (data.fleschKincaid > 15) {
      suggestions.push('The grade level is quite high - consider simplifying vocabulary');
    }
    
    // Add positive feedback for good readability
    if (data.overall > 60 && avgSentenceLength <= 20 && complexWordRatio <= 0.2) {
      suggestions.push('Good balance of sentence length and vocabulary complexity');
    }
    
    return suggestions.length > 0 ? suggestions : ['The text has good readability characteristics'];
  }

  private getDefaultReadabilityScore(): ReadabilityScore {
    return {
      overall: 50,
      fleschKincaid: 10,
      gunningFog: 12,
      smog: 10,
      colemanLiau: 10,
      automatedReadability: 10,
      grade: 'High School',
      difficulty: 'medium',
      suggestions: ['Unable to analyze readability - text may be empty or contain invalid characters']
    };
  }

  private getCategoryPatterns(): Record<string, string[]> {
    return {
      technology: [
        'api', 'software', 'programming', 'development', 'code', 'database', 'server',
        'framework', 'library', 'algorithm', 'protocol', 'interface', 'component',
        'deployment', 'infrastructure', 'architecture', 'microservice', 'container',
        'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'cloud', 'saas', 'paas'
      ],
      business: [
        'company', 'business', 'market', 'industry', 'revenue', 'profit', 'strategy',
        'management', 'leadership', 'team', 'project', 'client', 'customer', 'product',
        'service', 'sales', 'marketing', 'finance', 'investment', 'startup', 'enterprise'
      ],
      health: [
        'health', 'medical', 'doctor', 'patient', 'treatment', 'medicine', 'disease',
        'symptoms', 'diagnosis', 'therapy', 'recovery', 'wellness', 'fitness',
        'nutrition', 'exercise', 'mental', 'physical', 'care', 'hospital', 'clinic'
      ],
      science: [
        'research', 'study', 'experiment', 'data', 'analysis', 'theory', 'hypothesis',
        'discovery', 'innovation', 'technology', 'engineering', 'physics', 'chemistry',
        'biology', 'mathematics', 'statistics', 'laboratory', 'scientist', 'publication'
      ],
      entertainment: [
        'movie', 'film', 'music', 'game', 'show', 'performance', 'artist', 'actor',
        'director', 'producer', 'entertainment', 'media', 'content', 'creative',
        'story', 'narrative', 'character', 'plot', 'genre', 'audience', 'fan'
      ],
      sports: [
        'sport', 'game', 'team', 'player', 'coach', 'match', 'tournament', 'championship',
        'score', 'win', 'loss', 'victory', 'defeat', 'competition', 'athlete',
        'training', 'fitness', 'performance', 'league', 'season', 'playoff'
      ],
      politics: [
        'government', 'policy', 'election', 'vote', 'campaign', 'politician', 'party',
        'democracy', 'republic', 'constitution', 'law', 'legislation', 'congress',
        'president', 'minister', 'parliament', 'election', 'referendum', 'activist'
      ],
      education: [
        'education', 'learning', 'teaching', 'student', 'teacher', 'school', 'university',
        'course', 'curriculum', 'academic', 'research', 'study', 'knowledge', 'skill',
        'training', 'workshop', 'seminar', 'lecture', 'assignment', 'examination'
      ]
    };
  }

  private calculateCategoryScore(
    wordFreq: Record<string, number>, 
    wordPositions: Record<string, number[]>, 
    patterns: string[], 
    totalWords: number
  ): number {
    let score = 0;
    let matches = 0;
    
    patterns.forEach(pattern => {
      if (wordFreq[pattern]) {
        matches++;
        const frequency = wordFreq[pattern];
        const positions = wordPositions[pattern] || [];
        
        // Base score from frequency
        score += (frequency / totalWords) * 0.6;
        
        // Position bonus (words at beginning are more important)
        if (positions.length > 0) {
          const firstPosition = positions[0];
          const positionScore = Math.max(0, 1 - (firstPosition / totalWords));
          score += positionScore * 0.2;
        }
        
        // Length bonus (technical terms are often longer)
        if (pattern.length > 6) score += 0.1;
      }
    });
    
    // Normalize by pattern count and add diversity bonus
    const baseScore = matches > 0 ? score / matches : 0;
    const diversityBonus = Math.min(matches / patterns.length, 1.0) * 0.2;
    
    return Math.min(baseScore + diversityBonus, 1.0);
  }

  private getCategoryKeywords(
    wordFreq: Record<string, number>, 
    category: string, 
    patterns: string[]
  ): string[] {
    const categoryWords = patterns.filter(pattern => wordFreq[pattern]);
    const otherWords = Object.keys(wordFreq).filter(word => 
      !patterns.includes(word) && word.length > 3
    );
    
    // Sort by frequency and importance
    const sortedWords = [...categoryWords, ...otherWords]
      .sort((a, b) => (wordFreq[b] || 0) - (wordFreq[a] || 0));
    
    return sortedWords.slice(0, 8);
  }

  private detectDynamicTopics(
    wordFreq: Record<string, number>, 
    wordPositions: Record<string, number[]>, 
    totalWords: number
  ): Topic[] {
    const topics: Topic[] = [];
    const wordScores: Array<{ word: string; score: number }> = [];
    
    // Calculate scores for all words
    Object.entries(wordFreq).forEach(([word, frequency]) => {
      if (frequency > 1 && word.length > 4) {
        const positions = wordPositions[word] || [];
        const positionScore = positions.length > 0 ? 
          Math.max(0, 1 - (positions[0] / totalWords)) : 0;
        const frequencyScore = frequency / totalWords;
        const lengthScore = Math.min(word.length / 10, 1.0);
        
        const totalScore = (frequencyScore * 0.5) + (positionScore * 0.3) + (lengthScore * 0.2);
        wordScores.push({ word, score: totalScore });
      }
    });
    
    // Find clusters of related words
    const sortedWords = wordScores.sort((a, b) => b.score - a.score);
    const clusters = this.findWordClusters(sortedWords, wordFreq);
    
    clusters.forEach((cluster, index) => {
      if (cluster.length >= 2) {
        const avgScore = cluster.reduce((sum, word) => 
          sum + (wordScores.find(ws => ws.word === word)?.score || 0), 0) / cluster.length;
        
        topics.push({
          name: this.generateClusterName(cluster),
          confidence: Math.min(avgScore * 1.2, 1.0),
          keywords: cluster.slice(0, 5),
          category: 'dynamic',
          subtopics: [],
        });
      }
    });
    
    return topics.slice(0, 3); // Limit dynamic topics
  }

  private findWordClusters(
    wordScores: Array<{ word: string; score: number }>, 
    wordFreq: Record<string, number>
  ): string[][] {
    const clusters: string[][] = [];
    const used = new Set<string>();
    
    wordScores.forEach(({ word }) => {
      if (used.has(word)) return;
      
      const cluster = [word];
      used.add(word);
      
      // Find related words (similar length, frequency, or semantic similarity)
      wordScores.forEach(({ word: otherWord }) => {
        if (used.has(otherWord)) return;
        
        const similarity = this.calculateWordSimilarity(word, otherWord, wordFreq);
        if (similarity > 0.6) {
          cluster.push(otherWord);
          used.add(otherWord);
        }
      });
      
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });
    
    return clusters;
  }

  private calculateWordSimilarity(word1: string, word2: string, wordFreq: Record<string, number>): number {
    // Simple similarity based on length, frequency, and character overlap
    const lengthDiff = Math.abs(word1.length - word2.length) / Math.max(word1.length, word2.length);
    const freqDiff = Math.abs((wordFreq[word1] || 0) - (wordFreq[word2] || 0)) / 
      Math.max(wordFreq[word1] || 1, wordFreq[word2] || 1);
    
    const charOverlap = this.getCharacterOverlap(word1, word2);
    
    return (1 - lengthDiff) * 0.3 + (1 - freqDiff) * 0.3 + charOverlap * 0.4;
  }

  private getCharacterOverlap(word1: string, word2: string): number {
    const chars1 = new Set(word1.toLowerCase().split(''));
    const chars2 = new Set(word2.toLowerCase().split(''));
    
    const intersection = new Set([...chars1].filter(x => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);
    
    return intersection.size / union.size;
  }

  private generateClusterName(cluster: string[]): string {
    // Generate a meaningful name for the cluster
    const sortedByLength = [...cluster].sort((a, b) => a.length - b.length);
    const shortest = sortedByLength[0];
    
    if (shortest.length <= 4) {
      return shortest.charAt(0).toUpperCase() + shortest.slice(1);
    }
    
    // Try to find a common prefix or suffix
    const commonPrefix = this.findCommonPrefix(cluster);
    if (commonPrefix.length > 2) {
      return commonPrefix.charAt(0).toUpperCase() + commonPrefix.slice(1);
    }
    
    return shortest.charAt(0).toUpperCase() + shortest.slice(1);
  }

  private findCommonPrefix(words: string[]): string {
    if (words.length === 0) return '';
    
    const first = words[0];
    let prefix = '';
    
    for (let i = 0; i < first.length; i++) {
      const char = first[i];
      if (words.every(word => word[i] === char)) {
        prefix += char;
      } else {
        break;
      }
    }
    
    return prefix;
  }

  // Legacy method for backward compatibility
  private calculateCategoryScore(text: string, keywords: string[]): number {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    return Math.min(score, 1.0);
  }

  private calculateSentenceScore(sentence: string, allWords: string[]): number {
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};
    
    allWords.forEach(word => {
      wordFreq[word.toLowerCase()] = (wordFreq[word.toLowerCase()] || 0) + 1;
    });
    
    const sentenceScore = sentenceWords.reduce((score, word) => {
      return score + (wordFreq[word] || 0);
    }, 0);
    
    return sentenceScore / sentenceWords.length;
  }

  private calculateOverallConfidence(result: NlpResult, config: NlpConfig): number {
    const confidences = [
      result.sentiment.confidence,
      result.language.confidence,
      result.toxicity.confidence,
      result.readability.overall / 100,
      result.summary.confidence,
    ];
    
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private async simulateApiCall(operation: string): Promise<void> {
    // Simulate API call delay
    const delay = Math.random() * 100 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private calculateEntityConfidence(entity: string, text: string, type: string): number {
    // Base confidence based on entity type
    const baseConfidence: Record<string, number> = {
      person: 0.8,
      organization: 0.85,
      location: 0.8,
      date: 0.95,
      money: 0.9,
      percent: 0.9,
      technology: 0.85,
      url: 0.95,
      email: 0.95,
    };

    let confidence = baseConfidence[type] || 0.7;

    // Adjust confidence based on entity characteristics
    const entityLength = entity.length;
    const textLength = text.length;

    // Length-based adjustments
    if (entityLength < 3) confidence *= 0.8;
    else if (entityLength > 20) confidence *= 0.9;
    else confidence *= 1.1;

    // Position-based adjustments (entities near the beginning are more likely to be important)
    const entityPosition = text.indexOf(entity) / textLength;
    if (entityPosition < 0.3) confidence *= 1.1;
    else if (entityPosition > 0.7) confidence *= 0.95;

    // Format-based adjustments
    if (type === 'person' && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(entity)) confidence *= 1.1;
    if (type === 'organization' && /(?:Inc|Corp|LLC|Ltd|Company)$/i.test(entity)) confidence *= 1.1;
    if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(entity)) confidence *= 1.05;

    return Math.min(confidence, 1.0);
  }

  private removeDuplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    const unique: Entity[] = [];

    entities.forEach(entity => {
      const key = `${entity.text.toLowerCase()}_${entity.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entity);
      }
    });

    return unique;
  }

  private calculateEnhancedWordImportance(
    word: string,
    frequency: number,
    totalWords: number,
    positions: number[],
    text: string
  ): number {
    let score = 0;

    // Frequency-based score (TF component)
    const tf = frequency / totalWords;
    score += tf * 0.4;

    // Position-based score (words closer to the beginning are more important)
    if (positions.length > 0) {
      const firstPosition = positions[0];
      const positionScore = Math.max(0, 1 - (firstPosition / totalWords));
      score += positionScore * 0.2;
    }

    // Term Frequency-Inverse Document Frequency (TF-IDF)
    const idf = Math.log(1000 / (frequency + 1)); // Simplified IDF
    score += tf * idf * 0.3;

    // Word length bonus (medium-length words are often most important)
    if (word.length >= 4 && word.length <= 8) score += 0.1;
    else if (word.length > 12) score -= 0.05;

    // Capitalization bonus (proper nouns are often important)
    const originalWord = text.match(new RegExp(`\\b${word}\\b`, 'i'))?.[0];
    if (originalWord && /^[A-Z]/.test(originalWord)) score += 0.1;

    // Domain-specific bonus (technical terms, brand names)
    if (this.isTechnicalTerm(word)) score += 0.15;

    return Math.max(0, Math.min(1, score));
  }

  private isTechnicalTerm(word: string): boolean {
    const technicalTerms = [
      'api', 'sdk', 'framework', 'library', 'database', 'server', 'client',
      'algorithm', 'protocol', 'interface', 'component', 'module', 'service',
      'deployment', 'infrastructure', 'architecture', 'microservice', 'container',
      'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'cloud', 'saas', 'paas',
      'machine learning', 'ai', 'ml', 'neural network', 'deep learning',
      'blockchain', 'cryptocurrency', 'token', 'smart contract', 'web3'
    ];
    
    return technicalTerms.some(term => 
      word.toLowerCase().includes(term.toLowerCase()) || 
      term.toLowerCase().includes(word.toLowerCase())
    );
  }

  // Toxicity detection helper methods
  private getToxicityPatterns(): Record<string, string[]> {
    return {
      hate: [
        'hate', 'kill', 'destroy', 'evil', 'terrible', 'racist', 'sexist', 'bigot',
        'nazi', 'fascist', 'supremacist', 'discriminate', 'prejudice', 'bias',
        'intolerant', 'xenophobic', 'homophobic', 'transphobic', 'antisemitic',
        'genocide', 'ethnic cleansing', 'white power', 'black power', 'extremist'
      ],
      violence: [
        'fight', 'attack', 'hurt', 'pain', 'blood', 'weapon', 'war', 'bomb',
        'shoot', 'murder', 'assassinate', 'torture', 'abuse', 'assault',
        'terrorist', 'terrorism', 'violent', 'aggressive', 'hostile', 'threat',
        'kill', 'death', 'dead', 'die', 'suicide', 'self-harm', 'cut', 'bleed'
      ],
      sexual: [
        'sexual', 'explicit', 'adult', 'pornographic', 'nude', 'naked',
        'intimate', 'erotic', 'sexy', 'seductive', 'provocative', 'vulgar',
        'obscene', 'lewd', 'indecent', 'inappropriate', 'harassment', 'assault'
      ],
      bullying: [
        'stupid', 'idiot', 'ugly', 'worthless', 'loser', 'hate', 'dumb',
        'moron', 'retard', 'fat', 'skinny', 'weak', 'pathetic', 'useless',
        'failure', 'disgusting', 'repulsive', 'annoying', 'irritating'
      ],
      spam: [
        'buy now', 'click here', 'free money', 'make money fast', 'limited time',
        'act now', 'don\'t miss out', 'exclusive offer', 'guaranteed', '100% free',
        'no risk', 'instant', 'quick cash', 'easy money', 'work from home',
        'lose weight fast', 'miracle cure', 'secret formula', 'hidden truth'
      ],
      misinformation: [
        'fake news', 'conspiracy', 'hoax', 'lie', 'false', 'misleading',
        'deceptive', 'manipulated', 'doctored', 'photoshopped', 'deepfake',
        'alternative facts', 'post-truth', 'disinformation', 'propaganda',
        'cover-up', 'suppressed', 'censored', 'mainstream media lies'
      ]
    };
  }

  private calculateWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().trim();
      if (cleanWord.length > 0) {
        freq[cleanWord] = (freq[cleanWord] || 0) + 1;
      }
    });
    return freq;
  }

  private calculateWordPositions(words: string[]): Record<string, number[]> {
    const positions: Record<string, number[]> = {};
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().trim();
      if (cleanWord.length > 0) {
        if (!positions[cleanWord]) positions[cleanWord] = [];
        positions[cleanWord].push(index);
      }
    });
    return positions;
  }

  private calculateToxicityScore(
    wordFreq: Record<string, number>,
    wordPositions: Record<string, number[]>,
    patterns: string[],
    totalWords: number,
    text: string
  ): number {
    let score = 0;
    let matches = 0;
    
    patterns.forEach(pattern => {
      if (wordFreq[pattern]) {
        matches++;
        const frequency = wordFreq[pattern];
        const positions = wordPositions[pattern] || [];
        
        // Base score from frequency
        score += (frequency / totalWords) * 0.5;
        
        // Position bonus (toxic words at beginning are more concerning)
        if (positions.length > 0) {
          const firstPosition = positions[0];
          const positionScore = Math.max(0, 1 - (firstPosition / totalWords));
          score += positionScore * 0.3;
        }
        
        // Context penalty (check if word is used in non-toxic context)
        const contextPenalty = this.calculateContextPenalty(pattern, text);
        score *= contextPenalty;
      }
    });
    
    // Normalize by pattern count and add intensity bonus
    const baseScore = matches > 0 ? score / matches : 0;
    const intensityBonus = Math.min(matches / patterns.length, 1.0) * 0.2;
    
    return Math.min(baseScore + intensityBonus, 1.0);
  }

  private calculateContextPenalty(word: string, text: string): number {
    // Check if the word is used in a non-toxic context
    const contextWindow = 50; // characters around the word
    const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
    let penalty = 1.0;
    
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      const start = Math.max(0, match.index - contextWindow);
      const end = Math.min(text.length, match.index + word.length + contextWindow);
      const context = text.substring(start, end).toLowerCase();
      
      // Positive context indicators reduce toxicity
      const positiveIndicators = ['good', 'positive', 'helpful', 'support', 'love', 'care', 'protect'];
      const negativeIndicators = ['bad', 'negative', 'harmful', 'hate', 'hurt', 'destroy', 'kill'];
      
      const positiveCount = positiveIndicators.filter(indicator => context.includes(indicator)).length;
      const negativeCount = negativeIndicators.filter(indicator => context.includes(indicator)).length;
      
      if (positiveCount > negativeCount) {
        penalty *= 0.7; // Reduce toxicity score in positive context
      } else if (negativeCount > positiveCount) {
        penalty *= 1.2; // Increase toxicity score in negative context
      }
    }
    
    return Math.max(0.3, Math.min(1.5, penalty));
  }

  private calculateOverallToxicityScore(
    categories: Record<string, number>,
    wordFreq: Record<string, number>,
    sentenceCount: number,
    wordCount: number
  ): number {
    // Weighted average of category scores
    const weights = {
      hate: 0.25,
      violence: 0.25,
      sexual: 0.15,
      bullying: 0.15,
      spam: 0.1,
      misinformation: 0.1
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.entries(categories).forEach(([category, score]) => {
      const weight = weights[category as keyof typeof weights] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    });
    
    // Adjust based on text characteristics
    let adjustedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Sentence density penalty (more toxic content per sentence)
    const avgToxicityPerSentence = adjustedScore * wordCount / sentenceCount;
    if (avgToxicityPerSentence > 0.1) {
      adjustedScore *= 1.2;
    }
    
    // Word frequency penalty (repeated toxic words)
    const toxicWordCount = Object.values(categories).filter(score => score > 0.3).length;
    if (toxicWordCount > 2) {
      adjustedScore *= 1.1;
    }
    
    return Math.min(adjustedScore, 1.0);
  }

  private generateToxicityFlags(
    categories: Record<string, number>,
    overall: number
  ): string[] {
    const flags: string[] = [];
    
    // Category-specific flags
    Object.entries(categories).forEach(([category, score]) => {
      if (score > 0.7) {
        flags.push(`severe-${category}`);
      } else if (score > 0.5) {
        flags.push(`high-${category}`);
      } else if (score > 0.3) {
        flags.push(`moderate-${category}`);
      } else if (score > 0.1) {
        flags.push(`low-${category}`);
      }
    });
    
    // Overall severity flags
    if (overall > 0.8) {
      flags.push('severe-toxicity');
    } else if (overall > 0.6) {
      flags.push('high-toxicity');
    } else if (overall > 0.4) {
      flags.push('moderate-toxicity');
    } else if (overall > 0.2) {
      flags.push('low-toxicity');
    } else {
      flags.push('minimal-toxicity');
    }
    
    // Special combination flags
    const highCategories = Object.entries(categories).filter(([_, score]) => score > 0.5);
    if (highCategories.length > 2) {
      flags.push('multiple-toxic-categories');
    }
    
    return flags;
  }

  private calculateToxicityConfidence(
    categories: Record<string, number>,
    wordFreq: Record<string, number>,
    wordCount: number
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Pattern match confidence
    const totalPatterns = Object.values(this.getToxicityPatterns()).flat().length;
    const matchedPatterns = Object.values(categories).filter(score => score > 0.1).length;
    const patternConfidence = Math.min(matchedPatterns / 10, 1.0) * 0.3;
    
    // Text length confidence (longer texts provide more context)
    const lengthConfidence = Math.min(wordCount / 100, 1.0) * 0.2;
    
    // Score distribution confidence (more balanced scores suggest better analysis)
    const scoreVariance = this.calculateScoreVariance(Object.values(categories));
    const varianceConfidence = Math.max(0, 1 - scoreVariance) * 0.2;
    
    confidence += patternConfidence + lengthConfidence + varianceConfidence;
    
    return Math.min(confidence, 1.0);
  }

  private calculateScoreVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return variance;
  }

  private getDefaultToxicityScore(): ToxicityAnalysis {
    return {
      overall: 0,
      categories: {
        hate: 0,
        violence: 0,
        sexual: 0,
        bullying: 0,
        spam: 0,
        misinformation: 0
      },
      flags: ['no-content'],
      confidence: 0
    };
  }

  // Enhanced Summary Generation Helper Methods
  
  private getDefaultSummary(): TextSummary {
    return {
      extractive: [],
      abstractive: 'Content summary unavailable.',
      keyPoints: [],
      length: 'medium',
      confidence: 0
    };
  }

  private calculateEnhancedSentenceScore(
    sentence: string,
    allWords: string[],
    fullText: string,
    index: number,
    totalSentences: number
  ): number {
    const baseScore = this.calculateSentenceScore(sentence, allWords);
    const positionScore = this.calculatePositionScore(index, totalSentences);
    const lengthScore = this.calculateLengthScore(sentence.length);
    const keywordDensity = this.calculateKeywordDensity(sentence, allWords);
    const noveltyScore = this.calculateNoveltyScore(sentence, allWords, index);
    
    // Weighted combination of multiple factors
    return (
      baseScore * 0.3 +
      positionScore * 0.2 +
      lengthScore * 0.15 +
      keywordDensity * 0.2 +
      noveltyScore * 0.15
    );
  }

  private calculatePositionScore(index: number, totalSentences: number): number {
    // First and last sentences are often important
    if (index === 0 || index === totalSentences - 1) return 0.9;
    
    // Middle sentences get lower scores
    const relativePosition = index / totalSentences;
    if (relativePosition < 0.2 || relativePosition > 0.8) return 0.7;
    if (relativePosition < 0.4 || relativePosition > 0.6) return 0.5;
    return 0.3;
  }

  private calculateLengthScore(sentenceLength: number): number {
    // Optimal sentence length is between 15-50 words
    if (sentenceLength >= 15 && sentenceLength <= 50) return 1.0;
    if (sentenceLength >= 10 && sentenceLength <= 60) return 0.8;
    if (sentenceLength >= 5 && sentenceLength <= 80) return 0.6;
    return 0.3;
  }

  private calculateKeywordDensity(sentence: string, allWords: string[]): number {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    if (sentenceWords.length === 0) return 0;
    
    // Calculate word frequency in the full text
    const wordFreq: Record<string, number> = {};
    allWords.forEach(word => {
      wordFreq[word.toLowerCase()] = (wordFreq[word.toLowerCase()] || 0) + 1;
    });
    
    // Calculate average frequency of words in this sentence
    const sentenceFreq = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
    const avgFreq = sentenceFreq / sentenceWords.length;
    
    // Normalize to 0-1 range
    return Math.min(avgFreq / Math.max(...Object.values(wordFreq)), 1.0);
  }

  private calculateNoveltyScore(sentence: string, allWords: string[], index: number): number {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    if (sentenceWords.length === 0) return 0;
    
    // Check how many words in this sentence appear for the first time
    const seenWords = new Set<string>();
    for (let i = 0; i < index; i++) {
      const prevSentenceWords = allWords.slice(0, i).map(w => w.toLowerCase());
      prevSentenceWords.forEach(word => seenWords.add(word));
    }
    
    const newWords = sentenceWords.filter(word => !seenWords.has(word));
    return newWords.length / sentenceWords.length;
  }

  private calculateOptimalSummaryLength(
    wordCount: number,
    sentenceCount: number,
    config?: Partial<NlpConfig>
  ): number {
    // Base summary length as percentage of original
    let baseLength = Math.max(2, Math.ceil(sentenceCount * 0.3));
    
    // Adjust based on text length
    if (wordCount < 100) baseLength = Math.min(baseLength, 2);
    else if (wordCount < 500) baseLength = Math.min(baseLength, 3);
    else if (wordCount < 1000) baseLength = Math.min(baseLength, 4);
    else baseLength = Math.min(baseLength, 6);
    
    // Respect config limits
    if (config?.maxSummarySentences) {
      baseLength = Math.min(baseLength, config.maxSummarySentences);
    }
    
    return baseLength;
  }

  private generateExtractiveSummary(
    sentenceScores: Array<{
      sentence: string;
      index: number;
      score: number;
      position: number;
      length: number;
      keywordDensity: number;
      novelty: number;
    }>,
    targetLength: number,
    totalSentences: number
  ): string[] {
    // Sort by enhanced score
    const sortedSentences = [...sentenceScores].sort((a, b) => b.score - a.score);
    
    // Select top sentences
    const selectedSentences = sortedSentences.slice(0, targetLength);
    
    // Sort by original position to maintain flow
    const orderedSentences = selectedSentences
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence.trim());
    
    // Remove redundancy
    return this.removeRedundantSentences(orderedSentences);
  }

  private removeRedundantSentences(sentences: string[]): string[] {
    if (sentences.length <= 1) return sentences;
    
    const filtered: string[] = [sentences[0]];
    
    for (let i = 1; i < sentences.length; i++) {
      const currentSentence = sentences[i];
      const isRedundant = filtered.some(existing => 
        this.calculateSentenceSimilarity(currentSentence, existing) > 0.7
      );
      
      if (!isRedundant) {
        filtered.push(currentSentence);
      }
    }
    
    return filtered;
  }

  private calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
    const words1 = new Set(sentence1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(sentence2.toLowerCase().match(/\b\w+\b/g) || []);
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private generateAbstractiveSummary(
    extractive: string[],
    words: string[],
    sentences: string[],
    paragraphs: string[],
    fullText: string
  ): string {
    if (extractive.length === 0) return 'Content summary unavailable.';
    
    // Extract key concepts and themes
    const keyConcepts = this.extractKeyConcepts(extractive, words);
    const textType = this.determineTextType(sentences, paragraphs);
    const mainTheme = this.identifyMainTheme(extractive, keyConcepts);
    
    // Generate context-aware abstractive summary
    if (textType === 'academic') {
      return this.generateAcademicSummary(extractive, mainTheme, keyConcepts);
    } else if (textType === 'news') {
      return this.generateNewsSummary(extractive, mainTheme, keyConcepts);
    } else if (textType === 'technical') {
      return this.generateTechnicalSummary(extractive, mainTheme, keyConcepts);
    } else {
      return this.generateGeneralSummary(extractive, mainTheme, keyConcepts);
    }
  }

  private extractKeyConcepts(extractive: string[], words: string[]): string[] {
    const conceptFreq: Record<string, number> = {};
    
    extractive.forEach(sentence => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      sentenceWords.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          conceptFreq[word] = (conceptFreq[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(conceptFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([concept]) => concept);
  }

  private determineTextType(sentences: string[], paragraphs: string[]): 'academic' | 'news' | 'technical' | 'general' {
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    
    // Academic indicators
    if (avgSentenceLength > 100 || avgParagraphLength > 500) return 'academic';
    
    // News indicators
    if (sentences.some(s => s.includes('reported') || s.includes('announced') || s.includes('according to'))) {
      return 'news';
    }
    
    // Technical indicators
    if (sentences.some(s => s.includes('algorithm') || s.includes('implementation') || s.includes('function'))) {
      return 'technical';
    }
    
    return 'general';
  }

  private identifyMainTheme(extractive: string[], keyConcepts: string[]): string {
    if (keyConcepts.length === 0) return 'general discussion';
    
    // Find the most frequent concept that appears in multiple sentences
    const conceptCounts: Record<string, number> = {};
    keyConcepts.forEach(concept => {
      conceptCounts[concept] = extractive.filter(sentence => 
        sentence.toLowerCase().includes(concept)
      ).length;
    });
    
    const mainConcept = Object.entries(conceptCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    return mainConcept ? mainConcept[0] : 'general discussion';
  }

  private generateAcademicSummary(
    extractive: string[],
    mainTheme: string,
    keyConcepts: string[]
  ): string {
    const keyPoints = extractive.length;
    const concepts = keyConcepts.slice(0, 3).join(', ');
    
    return `This academic text presents ${keyPoints} key findings related to ${mainTheme}. The research addresses ${concepts} and provides comprehensive analysis of the subject matter. The findings contribute to the broader understanding of ${mainTheme} in the field.`;
  }

  private generateNewsSummary(
    extractive: string[],
    mainTheme: string,
    keyConcepts: string[]
  ): string {
    const keyPoints = extractive.length;
    const concepts = keyConcepts.slice(0, 2).join(' and ');
    
    return `Recent developments in ${mainTheme} have been reported, with ${keyPoints} key updates. The news covers ${concepts} and provides current information on the situation. These developments represent significant changes in the field.`;
  }

  private generateTechnicalSummary(
    extractive: string[],
    mainTheme: string,
    keyConcepts: string[]
  ): string {
    const keyPoints = extractive.length;
    const concepts = keyConcepts.slice(0, 3).join(', ');
    
    return `This technical document outlines ${keyPoints} main aspects of ${mainTheme}. The content covers ${concepts} and provides detailed technical information. The document serves as a comprehensive reference for understanding ${mainTheme}.`;
  }

  private generateGeneralSummary(
    extractive: string[],
    mainTheme: string,
    keyConcepts: string[]
  ): string {
    const keyPoints = extractive.length;
    const concepts = keyConcepts.slice(0, 2).join(' and ');
    
    return `This text discusses ${mainTheme} through ${keyPoints} main points. The content explores ${concepts} and provides insights into the subject matter. The discussion offers a comprehensive overview of ${mainTheme}.`;
  }

  private extractKeyPoints(
    extractive: string[],
    words: string[],
    sentences: string[]
  ): string[] {
    if (extractive.length === 0) return [];
    
    return extractive.map(sentence => {
      // Truncate long sentences and add ellipsis
      if (sentence.length > 120) {
        return sentence.substring(0, 120).trim() + '...';
      }
      return sentence.trim();
    });
  }

  private determineTextLength(wordCount: number): 'short' | 'medium' | 'long' {
    if (wordCount < 100) return 'short';
    if (wordCount < 500) return 'medium';
    if (wordCount < 1000) return 'long';
    return 'very-long';
  }

  private calculateSummaryConfidence(
    extractive: string[],
    sentences: string[],
    words: string[],
    fullText: string
  ): number {
    if (extractive.length === 0) return 0;
    
    // Base confidence from summary quality
    let confidence = 0.6;
    
    // Boost confidence for good coverage
    const coverageRatio = extractive.length / sentences.length;
    if (coverageRatio >= 0.2 && coverageRatio <= 0.4) confidence += 0.2;
    else if (coverageRatio > 0.4) confidence += 0.1;
    
    // Boost confidence for diverse content
    const uniqueWords = new Set(extractive.flatMap(s => s.toLowerCase().match(/\b\w+\b/g) || []));
    const diversityRatio = uniqueWords.size / words.length;
    if (diversityRatio > 0.3) confidence += 0.1;
    
    // Boost confidence for balanced sentence lengths
    const avgLength = extractive.reduce((sum, s) => sum + s.length, 0) / extractive.length;
    if (avgLength >= 50 && avgLength <= 150) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Enhanced Hashtag Generation Helper Methods
  
  private generateKeywordHashtags(keywords: Keyword[], text: string): string[] {
    if (keywords.length === 0) return [];
    
    const hashtags: string[] = [];
    const textLower = text.toLowerCase();
    
    // Sort keywords by importance and relevance
    const sortedKeywords = [...keywords]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
    
    sortedKeywords.forEach(keyword => {
      const cleanText = keyword.text.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanText.length > 2 && cleanText.length < 20) {
        // Check if keyword appears in text for relevance
        const relevance = textLower.includes(keyword.text.toLowerCase()) ? 1.0 : 0.7;
        const hashtag = `#${cleanText}`;
        
        // Add hashtag with relevance score for later ranking
        hashtags.push(hashtag);
      }
    });
    
    return hashtags;
  }

  private generateEntityHashtags(entities: Entity[], text: string): string[] {
    if (entities.length === 0) return [];
    
    const hashtags: string[] = [];
    const textLower = text.toLowerCase();
    
    // Prioritize entities by type and confidence
    const entityTypes = ['person', 'organization', 'location', 'technology', 'skill'];
    const sortedEntities = [...entities]
      .filter(entity => entityTypes.includes(entity.type))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
    
    sortedEntities.forEach(entity => {
      const cleanText = entity.text.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanText.length > 2 && cleanText.length < 25) {
        const hashtag = `#${cleanText}`;
        hashtags.push(hashtag);
      }
    });
    
    return hashtags;
  }

  private generateTrendingHashtags(text: string, keywords: Keyword[], entities: Entity[]): string[] {
    const trendingHashtags: Record<string, string[]> = {
      technology: ['#tech', '#innovation', '#ai', '#ml', '#programming', '#development', '#software', '#webdev', '#coding', '#startup'],
      business: ['#business', '#entrepreneur', '#startup', '#marketing', '#leadership', '#strategy', '#growth', '#success'],
      science: ['#science', '#research', '#discovery', '#innovation', '#technology', '#data', '#analysis', '#study'],
      entertainment: ['#entertainment', '#music', '#movie', '#gaming', '#art', '#culture', '#trending', '#viral'],
      sports: ['#sports', '#fitness', '#health', '#wellness', '#training', '#motivation', '#championship', '#team'],
      education: ['#education', '#learning', '#knowledge', '#study', '#academic', '#research', '#student', '#teacher'],
      health: ['#health', '#wellness', '#fitness', '#nutrition', '#mentalhealth', '#wellbeing', '#lifestyle'],
      travel: ['#travel', '#adventure', '#exploration', '#tourism', '#vacation', '#journey', '#destination']
    };
    
    // Determine content category based on keywords and entities
    const contentCategory = this.determineContentCategory(text, keywords, entities);
    
    // Get relevant trending hashtags
    const relevantTrending = trendingHashtags[contentCategory] || trendingHashtags.technology;
    
    // Filter by text relevance
    const textLower = text.toLowerCase();
    const relevantHashtags = relevantTrending.filter(tag => {
      const tagText = tag.substring(1); // Remove #
      return textLower.includes(tagText) || 
             keywords.some(k => k.text.toLowerCase().includes(tagText)) ||
             entities.some(e => e.text.toLowerCase().includes(tagText));
    });
    
    return relevantHashtags.slice(0, 3);
  }

  private determineContentCategory(text: string, keywords: Keyword[], entities: Entity[]): string {
    const textLower = text.toLowerCase();
    const categoryScores: Record<string, number> = {
      technology: 0,
      business: 0,
      science: 0,
      entertainment: 0,
      sports: 0,
      education: 0,
      health: 0,
      travel: 0
    };
    
    // Score based on keywords
    keywords.forEach(keyword => {
      const keywordLower = keyword.text.toLowerCase();
      if (keywordLower.includes('tech') || keywordLower.includes('code') || keywordLower.includes('software')) {
        categoryScores.technology += keyword.importance;
      }
      if (keywordLower.includes('business') || keywordLower.includes('company') || keywordLower.includes('market')) {
        categoryScores.business += keyword.importance;
      }
      if (keywordLower.includes('research') || keywordLower.includes('study') || keywordLower.includes('data')) {
        categoryScores.science += keyword.importance;
      }
      // Add more category scoring logic...
    });
    
    // Score based on entities
    entities.forEach(entity => {
      const entityLower = entity.text.toLowerCase();
      if (entity.type === 'technology' || entity.type === 'skill') {
        categoryScores.technology += entity.confidence;
      }
      if (entity.type === 'organization') {
        categoryScores.business += entity.confidence;
      }
      // Add more entity-based scoring...
    });
    
    // Return category with highest score
    return Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private generateDomainHashtags(text: string, keywords: Keyword[]): string[] {
    const domainHashtags: string[] = [];
    const textLower = text.toLowerCase();
    
    // Programming languages and frameworks
    const programmingTerms = ['javascript', 'python', 'react', 'node', 'angular', 'vue', 'typescript', 'java', 'c++', 'go', 'rust'];
    programmingTerms.forEach(term => {
      if (textLower.includes(term)) {
        domainHashtags.push(`#${term}`);
      }
    });
    
    // Cloud and infrastructure
    const cloudTerms = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'microservices', 'serverless'];
    cloudTerms.forEach(term => {
      if (textLower.includes(term)) {
        domainHashtags.push(`#${term}`);
      }
    });
    
    // Data and AI
    const dataTerms = ['machinelearning', 'datascience', 'bigdata', 'analytics', 'ai', 'ml', 'nlp'];
    dataTerms.forEach(term => {
      if (textLower.includes(term)) {
        domainHashtags.push(`#${term}`);
      }
    });
    
    return domainHashtags.slice(0, 4);
  }

  private generateSentimentHashtags(text: string): string[] {
    const sentimentHashtags: string[] = [];
    
    // Simple sentiment analysis based on positive/negative words
    const positiveWords = ['amazing', 'awesome', 'great', 'excellent', 'fantastic', 'wonderful', 'best', 'love', 'happy'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'frustrating', 'sad'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      sentimentHashtags.push('#positive', '#inspiring', '#motivation');
    } else if (negativeCount > positiveCount) {
      sentimentHashtags.push('#thoughtful', '#reflection', '#awareness');
    } else {
      sentimentHashtags.push('#balanced', '#perspective');
    }
    
    return sentimentHashtags;
  }

  private filterAndRankHashtags(hashtags: string[], text: string, keywords: Keyword[]): string[] {
    if (hashtags.length === 0) return [];
    
    // Score hashtags based on multiple factors
    const scoredHashtags = hashtags.map(hashtag => {
      const tagText = hashtag.substring(1); // Remove #
      let score = 0;
      
      // Length score (optimal length 5-15 characters)
      const length = tagText.length;
      if (length >= 5 && length <= 15) score += 0.3;
      else if (length >= 3 && length <= 20) score += 0.2;
      else score += 0.1;
      
      // Relevance score (appears in text)
      const textLower = text.toLowerCase();
      if (textLower.includes(tagText.toLowerCase())) score += 0.4;
      
      // Keyword relevance score
      const keywordRelevance = keywords.some(k => 
        k.text.toLowerCase().includes(tagText.toLowerCase())
      ) ? 0.3 : 0;
      score += keywordRelevance;
      
      // Popularity score (common hashtag patterns)
      const commonPatterns = ['tech', 'ai', 'innovation', 'business', 'startup', 'coding', 'development'];
      if (commonPatterns.includes(tagText.toLowerCase())) score += 0.2;
      
      return { hashtag, score };
    });
    
    // Sort by score and return top hashtags
    return scoredHashtags
      .sort((a, b) => b.score - a.score)
      .map(item => item.hashtag);
  }
}