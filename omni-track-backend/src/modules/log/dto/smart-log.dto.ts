import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MinLength, MaxLength, IsArray } from 'class-validator';

export class SmartLogDto {
  @IsString({ message: '日志内容不能为空' })
  @MinLength(1, { message: '日志内容至少需要1个字符' })
  @MaxLength(5000, { message: '日志内容不能超过5000个字符' })
  content: string;

  @IsOptional()
  @IsString({ message: '日志类型必须是字符串' })
  type?: string;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  tags?: string[];
}

export class AnalyzeLogDto {
  @IsString({ message: '日志内容不能为空' })
  @MinLength(1, { message: '日志内容至少需要1个字符' })
  content: string;
}

export class EnhanceContentDto {
  @IsString({ message: '日志内容不能为空' })
  @MinLength(1, { message: '日志内容至少需要1个字符' })
  @MaxLength(5000, { message: '日志内容不能超过5000个字符' })
  content: string;

  @IsEnum(['work', 'personal', 'health', 'learning', 'childcare', 'finance', 'exercise', 'social'], { 
    message: '日志类型必须是 work、personal、health、learning、childcare、finance、exercise 或 social' 
  })
  type: 'work' | 'personal' | 'health' | 'learning' | 'childcare' | 'finance' | 'exercise' | 'social';

  @IsOptional()
  @IsEnum(['very_bad', 'bad', 'neutral', 'good', 'very_good'], { 
    message: '心情必须是 very_bad、bad、neutral、good 或 very_good' 
  })
  mood?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';

  @IsOptional()
  @IsEnum(['very_low', 'low', 'medium', 'high', 'very_high'], { 
    message: '精力必须是 very_low、low、medium、high 或 very_high' 
  })
  energy?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

export class GenerateInsightsDto {
  @IsOptional()
  @IsNumber({}, { message: '天数必须是数字' })
  days?: number;
}

export class AnalyzePatternsDto {
  @IsOptional()
  @IsNumber({}, { message: '天数必须是数字' })
  days?: number;
}

export class SmartTagSuggestionResponseDto {
  suggestedTags: string[];
  reasoning: string;
  confidence: number;
}

export class LogInsightResponseDto {
  period: string;
  totalEntries: number;
  moodTrend: {
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number;
  };
  energyTrend: {
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number;
  };
  productivityInsights: {
    mostProductiveDay: string;
    mostProductiveTime: string;
    averageTasksPerDay: number;
  };
  recommendations: string[];
}

export class PatternAnalysisResponseDto {
  weeklyPatterns: {
    dayOfWeek: string;
    averageMood: number;
    averageEnergy: number;
    entryCount: number;
    commonActivities: string[];
  }[];
  timePatterns: {
    hour: number;
    moodScore: number;
    energyScore: number;
    activityLevel: number;
  }[];
  seasonalTrends: {
    month: string;
    mood: number;
    energy: number;
    productivity: number;
  }[];
}

export class ContentEnhancementResponseDto {
  enhancedContent: string;
  extractedKeywords: string[];
  suggestedActions: string[];
  insights: string[];
}

export class LifeQualityScoreResponseDto {
  overallScore: number;
  dimensions: {
    mood: number;
    energy: number;
    productivity: number;
    balance: number;
  };
  comparison: {
    previousPeriod: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
}