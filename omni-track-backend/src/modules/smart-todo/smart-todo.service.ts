import { Injectable } from '@nestjs/common';
import { TaskService } from '../task/task.service';
import { Task } from '../../database/entities/task.entity';

export interface SmartTaskSuggestion {
  suggestedPriority: 'low' | 'medium' | 'high';
  reasoning: string;
  estimatedDuration?: number;
  subtasks?: string[];
  tags?: string[];
}

export interface TaskBreakdown {
  subtasks: Array<{
    title: string;
    description?: string;
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  reasoning: string;
}

@Injectable()
export class SmartTodoService {
  constructor(private taskService: TaskService) {}

  /**
   * 智能分析任务并提供建议
   */
  async analyzeTask(title: string, description?: string, dueDate?: Date, userId?: string): Promise<SmartTaskSuggestion> {
    const suggestion: SmartTaskSuggestion = {
      suggestedPriority: 'medium',
      reasoning: '',
      estimatedDuration: 60, // 默认1小时
      subtasks: [],
      tags: [],
    };

    // 分析任务标题和描述中的关键词
    const content = (title + ' ' + (description || '')).toLowerCase();
    const urgentKeywords = ['紧急', '急', 'urgent', 'asap', '马上', '立即', '今天'];
    const importantKeywords = ['重要', 'important', '关键', '核心', '主要'];
    const complexKeywords = ['设计', '开发', '研究', '分析', '规划', '架构', '系统', '复杂'];
    const simpleKeywords = ['修复', '更新', '检查', '测试', '简单', '快速'];

    // 优先级分析
    let priorityScore = 0;
    
    // 基于关键词
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      priorityScore += 2;
      suggestion.reasoning += '检测到紧急关键词；';
    }
    
    if (importantKeywords.some(keyword => content.includes(keyword))) {
      priorityScore += 1;
      suggestion.reasoning += '检测到重要关键词；';
    }

    // 基于截止日期
    if (dueDate) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        priorityScore += 2;
        suggestion.reasoning += '截止日期临近；';
      } else if (daysUntilDue <= 3) {
        priorityScore += 1;
        suggestion.reasoning += '截止日期较近；';
      }
    }

    // 设置优先级
    if (priorityScore >= 3) {
      suggestion.suggestedPriority = 'high';
    } else if (priorityScore >= 1) {
      suggestion.suggestedPriority = 'medium';
    } else {
      suggestion.suggestedPriority = 'low';
    }

    // 时间估算
    if (complexKeywords.some(keyword => content.includes(keyword))) {
      suggestion.estimatedDuration = 240; // 4小时
      suggestion.reasoning += '检测到复杂任务，预计需要更多时间；';
    } else if (simpleKeywords.some(keyword => content.includes(keyword))) {
      suggestion.estimatedDuration = 30; // 30分钟
      suggestion.reasoning += '检测到简单任务，预计用时较短；';
    }

    // 生成标签建议
    if (content.includes('开发') || content.includes('代码') || content.includes('编程')) {
      suggestion.tags?.push('开发');
    }
    if (content.includes('设计') || content.includes('ui') || content.includes('界面')) {
      suggestion.tags?.push('设计');
    }
    if (content.includes('会议') || content.includes('讨论') || content.includes('沟通')) {
      suggestion.tags?.push('会议');
    }
    if (content.includes('文档') || content.includes('报告') || content.includes('写作')) {
      suggestion.tags?.push('文档');
    }

    // 获取用户历史数据进行优化
    if (userId) {
      const userTasks = await this.taskService.findAll(userId);
      const completedTasks = userTasks.filter(t => t.status === 'completed');
      
      // 基于历史完成时间调整预估
      if (completedTasks.length > 0) {
        const avgDuration = completedTasks
          .filter(t => t.actualDuration)
          .reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasks.length;
        
        if (avgDuration > 0) {
          suggestion.estimatedDuration = Math.round(avgDuration * 0.7 + suggestion.estimatedDuration * 0.3);
          suggestion.reasoning += '基于历史数据调整时间预估；';
        }
      }
    }

    return suggestion;
  }

  /**
   * 智能分解任务为子任务
   */
  async breakdownTask(title: string, description?: string): Promise<TaskBreakdown> {
    const content = (title + ' ' + (description || '')).toLowerCase();
    const breakdown: TaskBreakdown = {
      subtasks: [],
      reasoning: '基于任务内容的智能分解建议',
    };

    // 开发相关任务分解
    if (content.includes('开发') || content.includes('编程') || content.includes('代码')) {
      if (content.includes('功能') || content.includes('特性')) {
        breakdown.subtasks = [
          {
            title: '需求分析',
            description: '分析功能需求和技术要求',
            estimatedDuration: 60,
            priority: 'high',
          },
          {
            title: '技术设计',
            description: '设计技术架构和实现方案',
            estimatedDuration: 90,
            priority: 'high',
          },
          {
            title: '编码实现',
            description: '按照设计实现功能代码',
            estimatedDuration: 180,
            priority: 'medium',
          },
          {
            title: '单元测试',
            description: '编写和执行单元测试',
            estimatedDuration: 60,
            priority: 'medium',
          },
          {
            title: '集成测试',
            description: '进行功能集成测试',
            estimatedDuration: 45,
            priority: 'low',
          },
        ];
        breakdown.reasoning = '检测到开发任务，按软件开发流程分解';
      }
    }
    
    // 设计相关任务分解
    else if (content.includes('设计') || content.includes('ui') || content.includes('界面')) {
      breakdown.subtasks = [
        {
          title: '用户调研',
          description: '了解用户需求和使用场景',
          estimatedDuration: 120,
          priority: 'high',
        },
        {
          title: '概念设计',
          description: '制定设计概念和整体方向',
          estimatedDuration: 90,
          priority: 'high',
        },
        {
          title: '原型制作',
          description: '制作交互原型',
          estimatedDuration: 150,
          priority: 'medium',
        },
        {
          title: '视觉设计',
          description: '完成视觉设计稿',
          estimatedDuration: 180,
          priority: 'medium',
        },
        {
          title: '设计验证',
          description: '用户测试和设计优化',
          estimatedDuration: 60,
          priority: 'low',
        },
      ];
      breakdown.reasoning = '检测到设计任务，按设计流程分解';
    }
    
    // 研究相关任务分解
    else if (content.includes('研究') || content.includes('分析') || content.includes('调研')) {
      breakdown.subtasks = [
        {
          title: '确定研究范围',
          description: '明确研究目标和范围',
          estimatedDuration: 30,
          priority: 'high',
        },
        {
          title: '收集资料',
          description: '收集相关文献和数据',
          estimatedDuration: 120,
          priority: 'high',
        },
        {
          title: '数据分析',
          description: '分析收集到的数据',
          estimatedDuration: 90,
          priority: 'medium',
        },
        {
          title: '撰写报告',
          description: '整理分析结果并撰写报告',
          estimatedDuration: 120,
          priority: 'medium',
        },
        {
          title: '结果验证',
          description: '验证分析结果的准确性',
          estimatedDuration: 45,
          priority: 'low',
        },
      ];
      breakdown.reasoning = '检测到研究任务，按研究流程分解';
    }
    
    // 通用项目管理分解
    else if (content.includes('项目') || content.includes('计划')) {
      breakdown.subtasks = [
        {
          title: '项目规划',
          description: '制定项目计划和时间安排',
          estimatedDuration: 60,
          priority: 'high',
        },
        {
          title: '资源准备',
          description: '准备项目所需的资源',
          estimatedDuration: 45,
          priority: 'high',
        },
        {
          title: '执行阶段',
          description: '按计划执行项目任务',
          estimatedDuration: 240,
          priority: 'medium',
        },
        {
          title: '进度跟踪',
          description: '跟踪项目进度和质量',
          estimatedDuration: 30,
          priority: 'medium',
        },
        {
          title: '项目总结',
          description: '总结项目经验和成果',
          estimatedDuration: 30,
          priority: 'low',
        },
      ];
      breakdown.reasoning = '检测到项目管理任务，按项目管理流程分解';
    }

    // 如果没有匹配的模式，提供通用分解
    if (breakdown.subtasks.length === 0) {
      breakdown.subtasks = [
        {
          title: '准备阶段',
          description: '收集必要信息和准备工作',
          estimatedDuration: 30,
          priority: 'high',
        },
        {
          title: '执行阶段',
          description: '执行主要任务内容',
          estimatedDuration: 120,
          priority: 'medium',
        },
        {
          title: '完善阶段',
          description: '检查和完善任务结果',
          estimatedDuration: 30,
          priority: 'low',
        },
      ];
      breakdown.reasoning = '通用任务分解，可根据具体情况调整';
    }

    return breakdown;
  }

  /**
   * 获取智能提醒建议
   */
  async getSmartReminders(userId: string): Promise<Array<{
    taskId: string;
    title: string;
    reminderType: 'overdue' | 'due_soon' | 'suggested_start' | 'break_reminder';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>> {
    const userTasks = await this.taskService.findAll(userId);
    const now = new Date();
    const reminders = [];

    for (const task of userTasks) {
      // 跳过已完成的任务
      if (task.status === 'completed') {
        continue;
      }

      // 按优先级顺序检查提醒类型，每个任务只产生一个提醒
      // 1. 最高优先级：逾期提醒
      if (task.dueDate) {
        const taskDueDate = new Date(task.dueDate);
        let isOverdue = false;
        
        if (task.endTime) {
          // 如果有具体时间，精确比较到分钟
          const [hours, minutes] = task.endTime.split(':').map(Number);
          taskDueDate.setHours(hours, minutes, 0, 0);
          isOverdue = taskDueDate < now;
        } else {
          // 如果没有具体时间，认为是当天23:59:59到期
          taskDueDate.setHours(23, 59, 59, 999);
          isOverdue = taskDueDate < now;
        }
        
        if (isOverdue) {
          reminders.push({
            taskId: task.id,
            title: task.title,
            reminderType: 'overdue' as const,
            message: `任务 "${task.title}" 已逾期，请尽快完成`,
            priority: 'high' as const,
          });
          continue; // 已添加逾期提醒，跳过其他提醒类型
        }
        
        // 2. 中等优先级：即将到期提醒
        const hoursUntilDue = (taskDueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
          reminders.push({
            taskId: task.id,
            title: task.title,
            reminderType: 'due_soon' as const,
            message: `任务 "${task.title}" 将在 ${Math.round(hoursUntilDue)} 小时后到期`,
            priority: 'medium' as const,
          });
          continue; // 已添加即将到期提醒，跳过其他提醒类型
        }
      }
      // 3. 较低优先级：建议开始高优先级任务（仅当没有截止日期时）
      if (!task.dueDate && task.priority === 'high' && task.status === 'pending') {
        reminders.push({
          taskId: task.id,
          title: task.title,
          reminderType: 'suggested_start' as const,
          message: `建议优先处理高优先级任务 "${task.title}"`,
          priority: 'medium' as const,
        });
      }
    }

    // 按优先级排序
    return reminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 智能工作流程建议
   */
  async suggestWorkflow(userId: string): Promise<{
    recommendedTasks: Array<{
      taskId: string;
      title: string;
      reason: string;
      estimatedDuration: number;
    }>;
    workflowTips: string[];
  }> {
    const userTasks = await this.taskService.findAll(userId);
    const pendingTasks = userTasks.filter(t => t.status === 'pending');
    const now = new Date();

    // 按优先级和截止日期排序
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // 如果优先级相同，按截止日期排序
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      
      return 0;
    });

    const recommendedTasks = sortedTasks.slice(0, 5).map(task => ({
      taskId: task.id,
      title: task.title,
      reason: this.getTaskRecommendationReason(task, now),
      estimatedDuration: task.estimatedDuration || 60,
    }));

    const workflowTips = [
      '建议按优先级顺序处理任务',
      '高优先级任务应优先安排在精力充沛的时段',
      '可以将大任务分解为小任务，分批完成',
      '定期休息有助于保持高效率',
      '及时记录任务进展和遇到的问题',
    ];

    return {
      recommendedTasks,
      workflowTips,
    };
  }

  private getTaskRecommendationReason(task: any, now: Date): string {
    let reason = '';
    
    if (task.priority === 'high') {
      reason += '高优先级任务；';
    }
    
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        reason += '截止日期临近；';
      } else if (daysUntilDue <= 3) {
        reason += '截止日期较近；';
      }
    }
    
    if (task.estimatedDuration && task.estimatedDuration <= 60) {
      reason += '预计用时较短，可快速完成；';
    }
    
    return reason || '建议优先处理';
  }
}