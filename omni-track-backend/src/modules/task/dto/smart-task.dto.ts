import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsArray, MinLength, MaxLength, IsIn } from 'class-validator';

export class SmartCreateTaskDto {
  @IsString({ message: '任务描述不能为空' })
  @MinLength(1, { message: '任务描述至少需要1个字符' })
  @MaxLength(1000, { message: '任务描述不能超过1000个字符' })
  description: string;

  @IsOptional()
  @IsString({ message: '任务标题必须是字符串' })
  @MaxLength(200, { message: '任务标题不能超过200个字符' })
  title?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'], { message: '优先级必须是 low, medium, high 中的一个' })
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsDateString({}, { message: '截止日期格式不正确' })
  dueDate?: string;

  @IsOptional()
  @IsNumber({}, { message: '预估时间必须是数字' })
  estimatedTime?: number;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  tags?: string[];

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: '项目名称必须是字符串' })
  projectName?: string;

  @IsOptional()
  @IsArray({ message: '依赖项必须是数组' })
  @IsString({ each: true, message: '每个依赖项必须是字符串' })
  dependencies?: string[];

  @IsOptional()
  @IsNumber({}, { message: '排序必须是数字' })
  order?: number;

  @IsOptional()
  @IsBoolean({ message: '是否使用智能建议必须是布尔值' })
  useSmartSuggestions?: boolean;

  @IsOptional()
  @IsBoolean({ message: '是否自动分解任务必须是布尔值' })
  autoBreakdown?: boolean;
}

export class BatchCreateTaskDto {
  @IsArray({ message: '任务列表必须是数组' })
  tasks: SmartCreateTaskDto[];

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsBoolean({ message: '是否使用智能建议必须是布尔值' })
  useSmartSuggestions?: boolean;
}

export class AITaskAnalysisDto {
  suggestedTitle: string;
  suggestedPriority: 'low' | 'medium' | 'high';
  suggestedTags: string[];
  estimatedTime: number;
  suggestedDueDate?: string; // AI识别的截止日期
  suggestedEndTime?: string; // AI识别的具体时间 (HH:mm格式)
  timeExpression?: string; // 原始时间表达式 (如 "明天", "下周五")
  suggestedProject?: {
    id?: string;
    name: string;
    isNew: boolean;
  };
  breakdown: string[];
  dependencies: string[];
}

export class AnalyzeTaskDto {
  @IsString({ message: '任务描述不能为空' })
  @MinLength(1, { message: '任务描述至少需要1个字符' })
  description: string;
}