export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface Task {
  id: string;
  description: string; // 任务描述(必填)
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high'; // 优先级
  completionTime?: Date; // 任务需要完成的时间(可选)
  dueDate?: Date; // 截止日期
  isRecurring?: boolean; // 是否周期循环任务(可选)
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
  }; // 循环周期(可选)
  estimatedDuration?: number; // AI分析预估的花费时间(分钟)(可选)
  tags?: string[]; // 任务标签(可选)
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  aiAnalyzed?: boolean; // 是否已经过AI分析
  userSetPriority?: boolean; // 优先级是否由用户手动设置
  userSetDuration?: boolean; // 时长是否由用户手动设置
  userSetDueDate?: boolean; // 截止日期是否由用户手动设置
}

export interface LogEntry {
  id: string;
  type: 'work' | 'personal' | 'health' | 'learning' | 'childcare';
  content: string;
  metadata?: Record<string, any>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RootStackParamList = {
  Home: undefined;
  Tasks: undefined;
  Logs: undefined;
  Profile: undefined;
  AIAssistant: undefined;
  About: undefined;
  Help: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Logs: undefined;
  Profile: undefined;
};