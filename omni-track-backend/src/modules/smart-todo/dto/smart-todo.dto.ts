import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class AnalyzeTaskDto {
  @IsString({ message: '任务标题不能为空' })
  @MinLength(1, { message: '任务标题至少需要1个字符' })
  @MaxLength(200, { message: '任务标题不能超过200个字符' })
  title: string;

  @IsOptional()
  @IsString({ message: '任务描述必须是字符串' })
  @MaxLength(1000, { message: '任务描述不能超过1000个字符' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: '截止日期格式不正确' })
  dueDate?: string;
}

export class BreakdownTaskDto {
  @IsString({ message: '任务标题不能为空' })
  @MinLength(1, { message: '任务标题至少需要1个字符' })
  @MaxLength(200, { message: '任务标题不能超过200个字符' })
  title: string;

  @IsOptional()
  @IsString({ message: '任务描述必须是字符串' })
  @MaxLength(1000, { message: '任务描述不能超过1000个字符' })
  description?: string;
}

export class SmartTaskSuggestionDto {
  suggestedPriority: 'low' | 'medium' | 'high';
  reasoning: string;
  estimatedDuration?: number;
  subtasks?: string[];
  tags?: string[];
}

export class TaskBreakdownDto {
  subtasks: Array<{
    title: string;
    description?: string;
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  reasoning: string;
}

export class SmartReminderDto {
  taskId: string;
  title: string;
  reminderType: 'overdue' | 'due_soon' | 'suggested_start' | 'break_reminder';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export class WorkflowSuggestionDto {
  recommendedTasks: Array<{
    taskId: string;
    title: string;
    reason: string;
    estimatedDuration: number;
  }>;
  workflowTips: string[];
}