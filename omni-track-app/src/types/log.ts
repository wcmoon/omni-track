export interface Log {
  id: string;
  content: string;
  type: string; // 改为字符串，支持自定义类型
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export type LogType = 'work' | 'daily' | 'learning' | 'health' | 'travel' | 'other';

export interface LogTypeConfig {
  value: string;
  label: string;
  color: string;
  icon: string;
  isCustom?: boolean;
}

export interface LogFormData {
  content: string;
  type?: string;
  tags?: string[];
}

export interface AILogAnalysis {
  suggestedType: string;
  suggestedTags: string[];
  summary?: string;
}

export interface LogFilter {
  types?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
}

export interface LogDisplayGroup {
  date: string; // YYYY-MM-DD 格式
  logs: Log[];
}

export const DEFAULT_LOG_TYPES: LogTypeConfig[] = [
  { value: 'work', label: '工作', color: '#FF9800', icon: '💼' },
  { value: 'daily', label: '日常', color: '#2196F3', icon: '📋' },
  { value: 'learning', label: '学习', color: '#9C27B0', icon: '📚' },
  { value: 'health', label: '健康', color: '#4CAF50', icon: '🏃' },
  { value: 'travel', label: '出行', color: '#FF5722', icon: '✈️' },
  { value: 'other', label: '其他', color: '#607D8B', icon: '📝' },
];

// 用于生成随机颜色的调色板
export const TYPE_COLORS = [
  '#FF9800', '#2196F3', '#9C27B0', '#4CAF50', '#FF5722', '#607D8B',
  '#E91E63', '#673AB7', '#3F51B5', '#009688', '#8BC34A', '#CDDC39',
  '#FFC107', '#795548', '#9E9E9E', '#F44336', '#00BCD4', '#FFEB3B'
];

// 常用图标 - 包括小动物和人群分类
export const TYPE_ICONS = [
  // 基础图标
  '📝', '💼', '📚', '🏃', '✈️', '🍽️', '🎬', '🎵', '🎮', '💡',
  '🔧', '🎨', '💰', '🏠', '🚗', '📱', '💻', '📊', '🎯', '⭐',
  
  // 小动物
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐸', '🐵', '🐷', '🐮', '🐴', '🦄', '🐺', '🐙', '🐬',
  '🐧', '🦅', '🦆', '🐝', '🦋', '🐞', '🐌', '🐢', '🐍', '🦎',
  
  // 人群和年龄分类
  '👶', '🧒', '👦', '👧', '👨', '👩', '🧑', '👴', '👵', '🧓',
  '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️',
  '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨', '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔧',
  
  // 家庭和关系
  '👪', '👨‍👩‍👧‍👦', '👨‍👨‍👧', '👩‍👩‍👦', '💑', '💏', '🤱', '🤰',
  '🧑‍🤝‍🧑', '👭', '👫', '👬', '👥', '👤',
  
  // 情感和表情
  '😊', '😍', '🤗', '😴', '😎', '🤔', '😊', '🥰', '😂', '🤣',
  '😭', '😔', '😩', '😤', '🥱', '😋', '🤤', '🤗', '🤩', '😌'
];