export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: string;
  estimatedTime: number; // 分钟
  actualTime?: number; // 实际花费时间
  tags: string[];
  projectId: string;
  userId: string;
  dependencies?: string[]; // 依赖的其他任务ID
  order: number; // 在项目中的排序
  
  // 新增时间相关字段
  startDate?: string; // 开始时间
  endDate?: string; // 结束时间
  startTime?: string; // 具体开始时间 (HH:mm)
  endTime?: string; // 具体结束时间 (HH:mm)
  
  // 新增重复相关字段
  isRecurring: boolean; // 是否为重复任务
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'; // 重复类型
    interval: number; // 间隔 (如每2天、每3周)
    daysOfWeek?: number[]; // 对于weekly模式，指定星期几 (0=周日, 1=周一, etc.)
    dayOfMonth?: number; // 对于monthly模式，指定每月第几天
    endDate?: string; // 重复结束日期
    occurrences?: number; // 或者指定重复次数
  };
  parentTaskId?: string; // 如果是重复任务的实例，指向父任务
  isRecurrenceInstance: boolean; // 是否为重复任务的实例
  
  // AI识别的时间信息
  timeAnalysis?: {
    hasTimeConstraints: boolean; // 是否有时间约束
    isUrgent: boolean; // 是否紧急
    suggestedSchedule?: string; // AI建议的时间安排
    timeKeywords: string[]; // 识别到的时间关键词
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  totalTasks: number;
  completedTasks: number;
  totalEstimatedTime: number; // 总预估工作量(分钟)
  totalActualTime: number; // 总实际工作量(分钟)
  scheduledEndDate?: string; // 根据任务排期计算的结束日期
  progress: number; // 0-100 完成百分比
  aiInsights: {
    suggestions: string[];
    warnings: string[];
    recommendations: string[];
  };
  tasks: Task[];
}

export interface TaskFormData {
  description: string;
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  tags?: string[];
  projectId?: string;
  projectName?: string;
}

export interface AITaskAnalysis {
  suggestedTitle: string;
  suggestedPriority: 'low' | 'medium' | 'high';
  suggestedTags: string[];
  estimatedTime: number;
  suggestedProject?: {
    id?: string;
    name: string;
    isNew: boolean;
  };
  breakdown: string[];
  dependencies: string[];
  
  // 新增时间分析
  timeAnalysis: {
    hasTimeConstraints: boolean; // 是否有时间约束
    isUrgent: boolean; // 是否紧急
    suggestedStartDate?: string; // 建议开始日期
    suggestedEndDate?: string; // 建议结束日期
    suggestedStartTime?: string; // 建议开始时间
    suggestedEndTime?: string; // 建议结束时间
    suggestedSchedule?: string; // AI建议的时间安排描述
    timeKeywords: string[]; // 识别到的时间关键词
    isRecurring: boolean; // 是否为重复任务
    suggestedRecurrencePattern?: {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      daysOfWeek?: number[];
      description: string; // 重复模式的描述
    };
  };
}
