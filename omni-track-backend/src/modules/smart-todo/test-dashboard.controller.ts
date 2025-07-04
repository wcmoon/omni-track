import { Controller, Get } from '@nestjs/common';

@Controller('test-dashboard')
export class TestDashboardController {
  @Get('smart-todo')
  async getSmartTodoData() {
    return {
      success: true,
      data: {
        reminders: [
          {
            taskId: '1',
            title: '测试任务',
            dueDate: new Date(),
            priority: 'medium',
            type: 'deadline',
            message: '这是一个测试提醒',
          },
        ],
        recommendedTasks: [
          {
            taskId: '2',
            title: '推荐任务',
            description: '这是一个推荐的任务',
            estimatedTime: 30,
            priority: 'high',
            category: '工作',
            reasoning: '基于您的工作模式推荐',
          },
        ],
        workflowTips: [
          '建议使用番茄工作法提高效率',
          '定期回顾和调整任务优先级',
        ],
      },
    };
  }

  @Get('smart-log')
  async getSmartLogData() {
    return {
      success: true,
      data: {
        lifeQuality: {
          overallScore: 75,
          trend: 'improving',
          dimensions: {
            mood: 80,
            energy: 70,
            productivity: 75,
            balance: 75,
          },
        },
        actionableInsights: [
          '您的心情在下午时段较佳',
          '建议增加运动时间',
        ],
        patterns: [
          '每周三和周五工作效率最高',
          '早上是您的高效时段',
        ],
      },
    };
  }

  @Get('task-stats')
  async getTaskStats() {
    return {
      success: true,
      data: {
        total: 25,
        completed: 18,
        inProgress: 5,
        overdue: 2,
        completionRate: 0.72,
      },
    };
  }

  @Get('log-stats')
  async getLogStats() {
    return {
      success: true,
      data: {
        total: 156,
        recentCount: 12,
        averagePerDay: 2.5,
        mostActiveDay: '周三',
      },
    };
  }
}
