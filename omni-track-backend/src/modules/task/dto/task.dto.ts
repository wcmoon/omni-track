import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsNumber, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsOptional()
  @IsString({ message: '任务标题必须是字符串' })
  @MinLength(1, { message: '任务标题至少需要1个字符' })
  @MaxLength(200, { message: '任务标题不能超过200个字符' })
  title?: string;

  @IsString({ message: '任务描述不能为空' })
  @MinLength(1, { message: '任务描述至少需要1个字符' })
  @MaxLength(1000, { message: '任务描述不能超过1000个字符' })
  description: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], { message: '优先级必须是 low、medium 或 high' })
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsDateString({}, { message: '截止日期格式不正确' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: '具体时间必须是字符串' })
  endTime?: string; // HH:mm格式的具体时间

  @IsOptional()
  @IsNumber({}, { message: '预估时长必须是数字' })
  estimatedDuration?: number;

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: '父任务ID必须是字符串' })
  parentTaskId?: string;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '标签必须是字符串' })
  tags?: string[];

  @IsOptional()
  @IsBoolean({ message: 'AI生成标记必须是布尔值' })
  aiGenerated?: boolean;

  @IsOptional()
  @IsString({ message: 'AI上下文必须是字符串' })
  aiContext?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: '任务标题必须是字符串' })
  @MinLength(1, { message: '任务标题至少需要1个字符' })
  @MaxLength(200, { message: '任务标题不能超过200个字符' })
  title?: string;

  @IsOptional()
  @IsString({ message: '任务描述必须是字符串' })
  @MaxLength(1000, { message: '任务描述不能超过1000个字符' })
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], { message: '优先级必须是 low、medium 或 high' })
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'], { message: '状态必须是 pending、in_progress、completed 或 cancelled' })
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsDateString({}, { message: '截止日期格式不正确' })
  dueDate?: string;

  @IsOptional()
  @IsNumber({}, { message: '预估时长必须是数字' })
  estimatedDuration?: number;

  @IsOptional()
  @IsNumber({}, { message: '实际时长必须是数字' })
  actualDuration?: number;

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: '父任务ID必须是字符串' })
  parentTaskId?: string;

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '标签必须是字符串' })
  tags?: string[];
}

export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  endTime?: string; // HH:mm格式的具体时间
  estimatedDuration?: number;
  actualDuration?: number;
  projectId?: string;
  userId: string;
  parentTaskId?: string;
  tags?: string[];
  aiGenerated: boolean;
  aiContext?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}