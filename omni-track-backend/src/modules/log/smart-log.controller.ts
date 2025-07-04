import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SmartLogService } from './smart-log.service';
import { 
  EnhanceContentDto, 
  GenerateInsightsDto, 
  AnalyzePatternsDto 
} from './dto/smart-log.dto';

@Controller('smart-log')
@UseGuards(JwtAuthGuard)
export class SmartLogController {
  constructor(private readonly smartLogService: SmartLogService) {}

  @Post('suggest-tags')
  async suggestTags(@Body() body: { content: string; type: string }) {
    const result = await this.smartLogService.suggestTags(
      body.content,
      body.type
    );
    
    return {
      success: true,
      message: '标签建议生成成功',
      data: result,
    };
  }

  @Post('enhance-content')
  async enhanceContent(@Body() enhanceContentDto: EnhanceContentDto) {
    const result = await this.smartLogService.enhanceLogContent(
      enhanceContentDto.content,
      enhanceContentDto.type,
      enhanceContentDto.mood,
      enhanceContentDto.energy
    );
    
    return {
      success: true,
      message: '内容增强完成',
      data: result,
    };
  }

  @Get('insights')
  async generateInsights(
    @Request() req, 
    @Query('days') days?: string
  ) {
    const dayCount = days ? parseInt(days) : 30;
    const result = await this.smartLogService.generateInsights(req.user.id, dayCount);
    
    return {
      success: true,
      message: '日志洞察生成成功',
      data: result,
    };
  }

  @Get('patterns')
  async analyzePatterns(
    @Request() req,
    @Query('days') days?: string
  ) {
    const dayCount = days ? parseInt(days) : 90;
    const result = await this.smartLogService.analyzePatterns(req.user.id, dayCount);
    
    return {
      success: true,
      message: '行为模式分析完成',
      data: result,
    };
  }

  @Get('life-quality-score')
  async getLifeQualityScore(
    @Request() req,
    @Query('days') days?: string
  ) {
    const dayCount = days ? parseInt(days) : 30;
    const result = await this.smartLogService.getLifeQualityScore(req.user.id, dayCount);
    
    return {
      success: true,
      message: '生活质量评分计算完成',
      data: result,
    };
  }

  @Get('dashboard')
  async getSmartLogDashboard(@Request() req) {
    const [insights, patterns, lifeQuality] = await Promise.all([
      this.smartLogService.generateInsights(req.user.id, 7), // 最近7天
      this.smartLogService.analyzePatterns(req.user.id, 30), // 最近30天
      this.smartLogService.getLifeQualityScore(req.user.id, 30), // 最近30天
    ]);

    // 提取关键信息用于仪表盘
    const dashboard = {
      quickInsights: {
        totalEntries: insights.totalEntries,
        moodTrend: insights.moodTrend.trend,
        energyTrend: insights.energyTrend.trend,
        topRecommendation: insights.recommendations[0] || '继续保持记录习惯',
      },
      lifeQuality: {
        overallScore: lifeQuality.overallScore,
        trend: lifeQuality.comparison.trend,
        weakestDimension: this.findWeakestDimension(lifeQuality.dimensions),
        strongestDimension: this.findStrongestDimension(lifeQuality.dimensions),
      },
      weeklyHighlights: {
        bestDay: this.findBestDay(patterns.weeklyPatterns),
        mostActiveTime: this.findMostActiveTime(patterns.timePatterns),
        commonActivities: this.extractTopActivities(patterns.weeklyPatterns),
      },
      actionableInsights: [
        ...insights.recommendations.slice(0, 2),
        ...lifeQuality.recommendations.slice(0, 1),
      ].slice(0, 3),
    };

    return {
      success: true,
      message: '智能日志仪表盘数据获取成功',
      data: dashboard,
    };
  }

  @Get('monthly-report')
  async getMonthlyReport(@Request() req) {
    const [insights, patterns, lifeQuality] = await Promise.all([
      this.smartLogService.generateInsights(req.user.id, 30),
      this.smartLogService.analyzePatterns(req.user.id, 30),
      this.smartLogService.getLifeQualityScore(req.user.id, 30),
    ]);

    const report = {
      summary: {
        period: '最近30天',
        totalEntries: insights.totalEntries,
        overallScore: lifeQuality.overallScore,
        trend: lifeQuality.comparison.trend,
      },
      moodAndEnergy: {
        moodTrend: insights.moodTrend,
        energyTrend: insights.energyTrend,
        correlation: this.calculateMoodEnergyCorrelation(patterns.weeklyPatterns),
      },
      productivity: {
        insights: insights.productivityInsights,
        bestPerformanceDay: this.findBestDay(patterns.weeklyPatterns),
        optimalWorkingHours: this.findOptimalWorkingHours(patterns.timePatterns),
      },
      lifeBalance: {
        dimensions: lifeQuality.dimensions,
        recommendations: lifeQuality.recommendations,
        improvementAreas: this.identifyImprovementAreas(lifeQuality.dimensions),
      },
      actionPlan: {
        priorities: this.generateActionPriorities(insights, lifeQuality),
        nextSteps: this.generateNextSteps(insights, patterns, lifeQuality),
      },
    };

    return {
      success: true,
      message: '月度报告生成成功',
      data: report,
    };
  }

  // 私有辅助方法
  private findWeakestDimension(dimensions: any): string {
    const entries = Object.entries(dimensions);
    const weakest = entries.reduce((min, [key, value]) => 
      (value as number) < (min[1] as number) ? [key, value] : min
    );
    return weakest[0];
  }

  private findStrongestDimension(dimensions: any): string {
    const entries = Object.entries(dimensions);
    const strongest = entries.reduce((max, [key, value]) => 
      (value as number) > (max[1] as number) ? [key, value] : max
    );
    return strongest[0];
  }

  private findBestDay(weeklyPatterns: any[]): string {
    const bestDay = weeklyPatterns.reduce((best, day) => 
      (day.averageMood + day.averageEnergy) > (best.averageMood + best.averageEnergy) ? day : best
    );
    return bestDay.dayOfWeek;
  }

  private findMostActiveTime(timePatterns: any[]): string {
    const mostActive = timePatterns.reduce((max, time) => 
      time.activityLevel > max.activityLevel ? time : max
    );
    return `${mostActive.hour}:00`;
  }

  private extractTopActivities(weeklyPatterns: any[]): string[] {
    const allActivities = weeklyPatterns.flatMap(day => day.commonActivities);
    const activityCount = allActivities.reduce((count, activity) => {
      count[activity] = (count[activity] || 0) + 1;
      return count;
    }, {});
    
    return Object.entries(activityCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([activity]) => activity);
  }

  private calculateMoodEnergyCorrelation(weeklyPatterns: any[]): string {
    // 简化的相关性分析
    const validDays = weeklyPatterns.filter(day => day.averageMood > 0 && day.averageEnergy > 0);
    if (validDays.length < 3) return '数据不足';
    
    const correlation = validDays.reduce((sum, day) => {
      return sum + Math.abs(day.averageMood - day.averageEnergy);
    }, 0) / validDays.length;
    
    if (correlation < 0.5) return '强正相关';
    if (correlation < 1.0) return '中等相关';
    return '弱相关';
  }

  private findOptimalWorkingHours(timePatterns: any[]): string {
    const workingHours = timePatterns.filter(time => time.hour >= 8 && time.hour <= 18);
    const optimal = workingHours.reduce((best, time) => 
      (time.moodScore + time.energyScore) > (best.moodScore + best.energyScore) ? time : best
    );
    return `${optimal.hour}:00-${optimal.hour + 1}:00`;
  }

  private identifyImprovementAreas(dimensions: any): string[] {
    const threshold = 70;
    return Object.entries(dimensions)
      .filter(([key, value]) => (value as number) < threshold)
      .map(([key]) => key)
      .slice(0, 2);
  }

  private generateActionPriorities(insights: any, lifeQuality: any): string[] {
    const priorities: string[] = [];
    
    if (lifeQuality.overallScore < 60) {
      priorities.push('提升整体生活质量');
    }
    
    if (insights.moodTrend.trend === 'declining') {
      priorities.push('改善心情状态');
    }
    
    if (insights.energyTrend.trend === 'declining') {
      priorities.push('提高能量水平');
    }
    
    return priorities.slice(0, 3);
  }

  private generateNextSteps(insights: any, patterns: any, lifeQuality: any): string[] {
    const steps: string[] = [];
    
    steps.push('继续坚持日志记录习惯');
    
    if (lifeQuality.dimensions.balance < 60) {
      steps.push('调整工作与生活的平衡');
    }
    
    if (insights.energyTrend.average < 3) {
      steps.push('优化睡眠和运动计划');
    }
    
    steps.push('定期回顾和调整个人目标');
    
    return steps.slice(0, 4);
  }
}