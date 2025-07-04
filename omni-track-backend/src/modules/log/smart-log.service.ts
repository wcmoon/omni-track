import { Injectable } from '@nestjs/common';
import { LogService } from './log.service';
import { LogEntry } from '../../database/entities/log-entry.entity';

export interface LogInsight {
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

export interface PatternAnalysis {
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

export interface SmartTagSuggestion {
  suggestedTags: string[];
  reasoning: string;
  confidence: number;
}

@Injectable()
export class SmartLogService {
  constructor(private logService: LogService) {}

  /**
   * 智能分析日志内容并推荐标签
   */
  async suggestTags(content: string, type: string): Promise<SmartTagSuggestion> {
    const suggestions: string[] = [];
    let reasoning = '';
    let confidence = 0.8;

    const lowerContent = content.toLowerCase();

    // 基于日志类型的基础标签
    const typeBasedTags: Record<string, string[]> = {
      work: ['工作', '职业'],
      personal: ['个人', '生活'],
      health: ['健康', '身体'],
      learning: ['学习', '成长'],
      childcare: ['育儿', '家庭'],
      finance: ['理财', '金钱'],
      exercise: ['运动', '健身'],
      social: ['社交', '人际'],
    };

    if (typeBasedTags[type]) {
      suggestions.push(...typeBasedTags[type]);
    }

    // 活动类型识别
    const activityPatterns = {
      meeting: ['会议', '开会', '讨论', '沟通', 'meeting'],
      coding: ['编程', '代码', '开发', 'coding', '调试', 'bug'],
      design: ['设计', 'ui', 'ux', '原型', '界面'],
      reading: ['阅读', '读书', '学习', '文章', '书籍'],
      writing: ['写作', '文档', '报告', '记录', '博客'],
      travel: ['旅行', '出差', '路上', '飞机', '火车'],
      food: ['吃饭', '餐厅', '美食', '烹饪', '食物'],
      shopping: ['购物', '买', '商店', '超市', '网购'],
      exercise: ['跑步', '健身', '运动', '锻炼', '瑜伽'],
      relaxation: ['休息', '放松', '娱乐', '看电影', '音乐'],
    };

    for (const [activity, keywords] of Object.entries(activityPatterns)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        suggestions.push(activity);
        reasoning += `检测到${activity}相关内容；`;
      }
    }

    // 情感状态识别
    const emotionPatterns = {
      stressed: ['压力', '焦虑', '紧张', '忙碌', '累'],
      happy: ['开心', '高兴', '愉快', '满意', '兴奋'],
      frustrated: ['沮丧', '失望', '烦躁', '困难', '挫折'],
      motivated: ['有动力', '积极', '充满干劲', '目标', '进步'],
      tired: ['疲惫', '困', '累', '没精神', '想睡觉'],
    };

    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        suggestions.push(emotion);
        reasoning += `检测到${emotion}情绪；`;
      }
    }

    // 时间相关标签
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 12) {
      suggestions.push('早晨');
    } else if (hour >= 12 && hour < 18) {
      suggestions.push('下午');
    } else if (hour >= 18 && hour < 22) {
      suggestions.push('晚上');
    } else {
      suggestions.push('深夜');
    }

    // 去重并限制数量
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

    return {
      suggestedTags: uniqueSuggestions,
      reasoning: reasoning || '基于内容和类型的智能分析',
      confidence,
    };
  }

  /**
   * 生成日志洞察报告
   */
  async generateInsights(userId: string, days: number = 30): Promise<LogInsight> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const logs = await this.logService.findAll(userId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (logs.length === 0) {
      return this.getDefaultInsight(days);
    }

    // 计算心情趋势
    const moodTrend = this.calculateMoodTrend(logs, days);
    
    // 计算能量趋势
    const energyTrend = this.calculateEnergyTrend(logs, days);
    
    // 分析生产力模式
    const productivityInsights = this.analyzeProductivityPatterns(logs);
    
    // 生成建议
    const recommendations = this.generateRecommendations(logs, moodTrend, energyTrend);

    return {
      period: `${days}天`,
      totalEntries: logs.length,
      moodTrend,
      energyTrend,
      productivityInsights,
      recommendations,
    };
  }

  /**
   * 分析用户行为模式
   */
  async analyzePatterns(userId: string, days: number = 90): Promise<PatternAnalysis> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const logs = await this.logService.findAll(userId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return {
      weeklyPatterns: this.analyzeWeeklyPatterns(logs),
      timePatterns: this.analyzeTimePatterns(logs),
      seasonalTrends: this.analyzeSeasonalTrends(logs),
    };
  }

  /**
   * 智能内容增强
   */
  async enhanceLogContent(content: string, type: string, mood?: string, energy?: string): Promise<{
    enhancedContent: string;
    extractedKeywords: string[];
    suggestedActions: string[];
    insights: string[];
  }> {
    const keywords = this.extractKeywords(content);
    const actions = this.suggestActions(content, type, mood, energy);
    const insights = this.generateContentInsights(content, type, mood, energy);
    
    // 简单的内容增强（在实际应用中可以集成更高级的NLP）
    const enhancedContent = this.addContextualInfo(content, type, mood, energy);

    return {
      enhancedContent,
      extractedKeywords: keywords,
      suggestedActions: actions,
      insights,
    };
  }

  /**
   * 获取生活质量评分
   */
  async getLifeQualityScore(userId: string, days: number = 30): Promise<{
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
  }> {
    const logs = await this.logService.findAll(userId, {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    });

    const previousPeriodLogs = await this.logService.findAll(userId, {
      startDate: new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    });

    const dimensions = this.calculateLifeQualityDimensions(logs);
    const overallScore = this.calculateOverallScore(dimensions);
    const previousScore = this.calculateOverallScore(this.calculateLifeQualityDimensions(previousPeriodLogs));
    
    const comparison = {
      previousPeriod: previousScore,
      trend: this.determineTrend(overallScore, previousScore),
    };

    const recommendations = this.generateLifeQualityRecommendations(dimensions, comparison.trend);

    return {
      overallScore,
      dimensions,
      comparison,
      recommendations,
    };
  }

  // 私有辅助方法

  private getDefaultInsight(days: number): LogInsight {
    return {
      period: `${days}天`,
      totalEntries: 0,
      moodTrend: {
        average: 0,
        trend: 'stable',
        changePercent: 0,
      },
      energyTrend: {
        average: 0,
        trend: 'stable',
        changePercent: 0,
      },
      productivityInsights: {
        mostProductiveDay: '未知',
        mostProductiveTime: '未知',
        averageTasksPerDay: 0,
      },
      recommendations: ['开始记录日志以获得个性化洞察'],
    };
  }

  private calculateMoodTrend(logs: any[], days: number) {
    const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
    const moodLogs = logs.filter(log => log.mood);
    
    if (moodLogs.length === 0) {
      return { average: 0, trend: 'stable' as const, changePercent: 0 };
    }

    const average = moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / moodLogs.length;
    
    // 简化的趋势计算
    const recentLogs = moodLogs.slice(-Math.floor(moodLogs.length / 2));
    const earlierLogs = moodLogs.slice(0, Math.floor(moodLogs.length / 2));
    
    const recentAvg = recentLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / recentLogs.length;
    const earlierAvg = earlierLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / earlierLogs.length;
    
    const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    const trend: 'improving' | 'declining' | 'stable' = changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable';

    return { average: Math.round(average * 10) / 10, trend, changePercent: Math.round(changePercent) };
  }

  private calculateEnergyTrend(logs: any[], days: number) {
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    const energyLogs = logs.filter(log => log.energy);
    
    if (energyLogs.length === 0) {
      return { average: 0, trend: 'stable' as const, changePercent: 0 };
    }

    const average = energyLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / energyLogs.length;
    
    const recentLogs = energyLogs.slice(-Math.floor(energyLogs.length / 2));
    const earlierLogs = energyLogs.slice(0, Math.floor(energyLogs.length / 2));
    
    const recentAvg = recentLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / recentLogs.length;
    const earlierAvg = earlierLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / earlierLogs.length;
    
    const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    const trend: 'improving' | 'declining' | 'stable' = changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable';

    return { average: Math.round(average * 10) / 10, trend, changePercent: Math.round(changePercent) };
  }

  private analyzeProductivityPatterns(logs: any[]) {
    const workLogs = logs.filter(log => log.type === 'work');
    
    // 按星期几分组
    const dayGroups = workLogs.reduce((groups, log) => {
      const day = new Date(log.createdAt).toLocaleDateString('zh-CN', { weekday: 'long' });
      groups[day] = (groups[day] || 0) + 1;
      return groups;
    }, {});

    const mostProductiveDay = Object.entries(dayGroups).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '未知';

    // 按小时分组
    const hourGroups = workLogs.reduce((groups, log) => {
      const hour = new Date(log.createdAt).getHours();
      groups[hour] = (groups[hour] || 0) + 1;
      return groups;
    }, {});

    const mostProductiveHour = Object.entries(hourGroups).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];
    const mostProductiveTime = mostProductiveHour ? `${mostProductiveHour}:00` : '未知';

    const averageTasksPerDay = workLogs.length / 30; // 假设30天期间

    return {
      mostProductiveDay,
      mostProductiveTime,
      averageTasksPerDay: Math.round(averageTasksPerDay * 10) / 10,
    };
  }

  private generateRecommendations(logs: any[], moodTrend: any, energyTrend: any): string[] {
    const recommendations: string[] = [];

    if (moodTrend.trend === 'declining') {
      recommendations.push('注意到心情有下降趋势，建议增加愉悦活动或寻求支持');
    }

    if (energyTrend.trend === 'declining') {
      recommendations.push('能量水平在下降，建议调整作息或增加休息时间');
    }

    if (moodTrend.average < 3) {
      recommendations.push('整体心情偏低，考虑进行压力管理或咨询专业人士');
    }

    if (energyTrend.average < 3) {
      recommendations.push('能量水平较低，建议检查睡眠质量和饮食习惯');
    }

    const workLogs = logs.filter(log => log.type === 'work');
    const personalLogs = logs.filter(log => log.type === 'personal');
    
    if (workLogs.length > personalLogs.length * 2) {
      recommendations.push('工作与生活平衡可能需要调整，建议增加个人时间');
    }

    if (recommendations.length === 0) {
      recommendations.push('保持当前的良好状态，继续记录以获得更多洞察');
    }

    return recommendations;
  }

  private analyzeWeeklyPatterns(logs: any[]) {
    const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
    const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };

    return weekdays.map(day => {
      const dayLogs = logs.filter(log => {
        const logDay = new Date(log.createdAt).toLocaleDateString('zh-CN', { weekday: 'long' });
        return logDay === day;
      });

      const moodLogs = dayLogs.filter(log => log.mood);
      const energyLogs = dayLogs.filter(log => log.energy);
      
      const averageMood = moodLogs.length > 0 
        ? moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / moodLogs.length 
        : 0;
      
      const averageEnergy = energyLogs.length > 0
        ? energyLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / energyLogs.length
        : 0;

      const commonActivities = this.extractCommonActivities(dayLogs);

      return {
        dayOfWeek: day,
        averageMood: Math.round(averageMood * 10) / 10,
        averageEnergy: Math.round(averageEnergy * 10) / 10,
        entryCount: dayLogs.length,
        commonActivities,
      };
    });
  }

  private analyzeTimePatterns(logs: any[]) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };

    return hours.map(hour => {
      const hourLogs = logs.filter(log => new Date(log.createdAt).getHours() === hour);
      
      const moodLogs = hourLogs.filter(log => log.mood);
      const energyLogs = hourLogs.filter(log => log.energy);
      
      const moodScore = moodLogs.length > 0
        ? moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / moodLogs.length
        : 0;
      
      const energyScore = energyLogs.length > 0
        ? energyLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / energyLogs.length
        : 0;

      return {
        hour,
        moodScore: Math.round(moodScore * 10) / 10,
        energyScore: Math.round(energyScore * 10) / 10,
        activityLevel: hourLogs.length,
      };
    });
  }

  private analyzeSeasonalTrends(logs: any[]) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };

    return months.map(month => {
      const monthLogs = logs.filter(log => {
        const logMonth = new Date(log.createdAt).getMonth() + 1;
        return `${logMonth}月` === month;
      });

      const moodLogs = monthLogs.filter(log => log.mood);
      const energyLogs = monthLogs.filter(log => log.energy);
      const workLogs = monthLogs.filter(log => log.type === 'work');
      
      const mood = moodLogs.length > 0
        ? moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / moodLogs.length
        : 0;
      
      const energy = energyLogs.length > 0
        ? energyLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / energyLogs.length
        : 0;

      const productivity = workLogs.length / Math.max(monthLogs.length, 1);

      return {
        month,
        mood: Math.round(mood * 10) / 10,
        energy: Math.round(energy * 10) / 10,
        productivity: Math.round(productivity * 100) / 100,
      };
    });
  }

  private extractKeywords(content: string): string[] {
    // 简单的关键词提取
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '时候'];
    const keywords = words.filter(word => word.length > 1 && !stopWords.includes(word));
    
    // 返回出现频率高的词汇
    const wordCount = keywords.reduce((count, word) => {
      count[word] = (count[word] || 0) + 1;
      return count;
    }, {});
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([word]) => word);
  }

  private suggestActions(content: string, type: string, mood?: string, energy?: string): string[] {
    const actions: string[] = [];
    
    if (mood === 'very_bad' || mood === 'bad') {
      actions.push('考虑进行放松活动', '与朋友或家人交流', '尝试深呼吸或冥想');
    }
    
    if (energy === 'very_low' || energy === 'low') {
      actions.push('适当休息', '检查睡眠质量', '考虑轻度运动');
    }
    
    if (type === 'work' && content.includes('压力')) {
      actions.push('安排工作优先级', '寻求同事帮助', '制定时间管理计划');
    }
    
    return actions.slice(0, 3);
  }

  private generateContentInsights(content: string, type: string, mood?: string, energy?: string): string[] {
    const insights: string[] = [];
    
    if (mood && energy) {
      insights.push(`当前心情${mood}，能量水平${energy}`);
    }
    
    if (content.length > 100) {
      insights.push('记录内容丰富，有助于深入分析');
    }
    
    if (type === 'work') {
      insights.push('工作相关记录，有助于职业发展追踪');
    }
    
    return insights;
  }

  private addContextualInfo(content: string, type: string, mood?: string, energy?: string): string {
    let enhanced = content;
    
    const context = [];
    if (mood) context.push(`心情: ${mood}`);
    if (energy) context.push(`能量: ${energy}`);
    
    if (context.length > 0) {
      enhanced += `\n\n[状态: ${context.join(', ')}]`;
    }
    
    return enhanced;
  }

  private extractCommonActivities(logs: any[]): string[] {
    const activities: string[] = [];
    logs.forEach(log => {
      if (log.tags) {
        activities.push(...log.tags);
      }
    });
    
    const activityCount = activities.reduce((count, activity) => {
      count[activity] = (count[activity] || 0) + 1;
      return count;
    }, {});
    
    return Object.entries(activityCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([activity]) => activity);
  }

  private calculateLifeQualityDimensions(logs: any[]) {
    const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };

    const moodLogs = logs.filter(log => log.mood);
    const energyLogs = logs.filter(log => log.energy);
    const workLogs = logs.filter(log => log.type === 'work');
    const personalLogs = logs.filter(log => log.type === 'personal');

    const mood = moodLogs.length > 0
      ? (moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / moodLogs.length) / 5 * 100
      : 0;

    const energy = energyLogs.length > 0
      ? (energyLogs.reduce((sum, log) => sum + energyValues[log.energy], 0) / energyLogs.length) / 5 * 100
      : 0;

    const productivity = workLogs.length > 0 ? Math.min(workLogs.length * 10, 100) : 0;
    
    const balance = personalLogs.length > 0 
      ? Math.max(0, 100 - Math.abs(workLogs.length - personalLogs.length) * 5)
      : 50;

    return {
      mood: Math.round(mood),
      energy: Math.round(energy),
      productivity: Math.round(productivity),
      balance: Math.round(balance),
    };
  }

  private calculateOverallScore(dimensions: any): number {
    return Math.round((dimensions.mood + dimensions.energy + dimensions.productivity + dimensions.balance) / 4);
  }

  private determineTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
    const diff = current - previous;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private generateLifeQualityRecommendations(dimensions: any, trend: string): string[] {
    const recommendations: string[] = [];

    if (dimensions.mood < 60) {
      recommendations.push('关注心理健康，考虑增加愉悦活动');
    }
    
    if (dimensions.energy < 60) {
      recommendations.push('改善睡眠质量和饮食习惯');
    }
    
    if (dimensions.productivity < 60) {
      recommendations.push('优化工作流程，提高工作效率');
    }
    
    if (dimensions.balance < 60) {
      recommendations.push('改善工作生活平衡');
    }

    if (trend === 'declining') {
      recommendations.push('整体趋势下降，建议寻求专业指导');
    }

    return recommendations.slice(0, 3);
  }
}