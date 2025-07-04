import { IsString, IsOptional, IsEnum, IsArray, IsObject, MinLength, MaxLength } from 'class-validator';

export class CreateLogEntryDto {
  @IsOptional()
  @IsString({ message: '日志类型必须是字符串' })
  type?: string;

  @IsString({ message: '日志内容不能为空' })
  @MinLength(1, { message: '日志内容至少需要1个字符' })
  @MaxLength(5000, { message: '日志内容不能超过5000个字符' })
  content: string;

  @IsOptional()
  @IsObject({ message: '元数据必须是对象' })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '标签必须是字符串' })
  tags?: string[];

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

  @IsOptional()
  @IsString({ message: '位置必须是字符串' })
  @MaxLength(200, { message: '位置不能超过200个字符' })
  location?: string;

  @IsOptional()
  @IsString({ message: '天气必须是字符串' })
  @MaxLength(100, { message: '天气不能超过100个字符' })
  weather?: string;

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: '相关任务ID必须是字符串' })
  relatedTaskId?: string;
}

export class UpdateLogEntryDto {
  @IsOptional()
  @IsEnum(['work', 'personal', 'health', 'learning', 'childcare', 'finance', 'exercise', 'social'], { 
    message: '日志类型必须是 work、personal、health、learning、childcare、finance、exercise 或 social' 
  })
  type?: 'work' | 'personal' | 'health' | 'learning' | 'childcare' | 'finance' | 'exercise' | 'social';

  @IsOptional()
  @IsString({ message: '日志内容必须是字符串' })
  @MinLength(1, { message: '日志内容至少需要1个字符' })
  @MaxLength(5000, { message: '日志内容不能超过5000个字符' })
  content?: string;

  @IsOptional()
  @IsObject({ message: '元数据必须是对象' })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '标签必须是字符串' })
  tags?: string[];

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

  @IsOptional()
  @IsString({ message: '位置必须是字符串' })
  @MaxLength(200, { message: '位置不能超过200个字符' })
  location?: string;

  @IsOptional()
  @IsString({ message: '天气必须是字符串' })
  @MaxLength(100, { message: '天气不能超过100个字符' })
  weather?: string;

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: '相关任务ID必须是字符串' })
  relatedTaskId?: string;
}

export class LogEntryResponseDto {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  tags?: string[];
  mood?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  energy?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  location?: string;
  weather?: string;
  userId: string;
  projectId?: string;
  relatedTaskId?: string;
  aiEnhanced: boolean;
  aiSuggestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}