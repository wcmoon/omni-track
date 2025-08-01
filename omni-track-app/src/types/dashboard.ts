export interface DashboardData {
  // 任务仪表盘数据
  smartTodo: {
    reminders: SmartReminder[];
    recommendedTasks: RecommendedTask[];
    workflowTips: string[];
    summary: {
      totalReminders: number;
      urgentReminders: number;
      recommendedTasksCount: number;
    };
  };
  // 日志仪表盘数据
  smartLog: {
    quickInsights: {
      totalEntries: number;
      moodTrend: 'improving' | 'declining' | 'stable';
      energyTrend: 'improving' | 'declining' | 'stable';
      topRecommendation: string;
    };
    lifeQuality: {
      overallScore: number;
      trend: 'improving' | 'declining' | 'stable';
      weakestDimension: string;
      strongestDimension: string;
    };
    weeklyHighlights: {
      bestDay: string;
      mostActiveTime: string;
      commonActivities: string[];
    };
    actionableInsights: string[];
  };
  // 任务统计
  taskStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
  // 日志统计  
  logStats: {
    total: number;
    typeBreakdown: Record<string, number>;
    moodBreakdown: Record<string, number>;
    energyBreakdown: Record<string, number>;
    recentCount: number;
  };
}

export interface SmartReminder {
  taskId: string;
  title: string;
  reminderType: 'overdue' | 'due_soon' | 'suggested_start' | 'break_reminder';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RecommendedTask {
  taskId: string;
  title: string;
  reason: string;
  estimatedDuration: number;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export interface InsightCard {
  id: string;
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color: string;
  subtitle?: string;
}

export interface ProgressRing {
  value: number;
  maxValue: number;
  color: string;
  size: number;
  strokeWidth: number;
}