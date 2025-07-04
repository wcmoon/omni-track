import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Task } from '../../database/entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './dto/task.dto';
import { SmartCreateTaskDto, BatchCreateTaskDto, AITaskAnalysisDto } from './dto/smart-task.dto';
import { AIService } from '../ai/ai.service';

@Injectable()
export class TaskService {
  private tasks: Task[] = []; // 临时存储，后续会替换为数据库

  constructor(private readonly aiService: AIService) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    const task: Task = {
      id: Date.now().toString(),
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      status: 'pending',
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      estimatedDuration: createTaskDto.estimatedDuration,
      projectId: createTaskDto.projectId,
      userId,
      parentTaskId: createTaskDto.parentTaskId,
      tags: createTaskDto.tags || [],
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.push(task);
    return this.toResponseDto(task);
  }

  async findAll(userId: string, projectId?: string): Promise<TaskResponseDto[]> {
    let userTasks = this.tasks.filter(t => t.userId === userId);
    
    if (projectId) {
      userTasks = userTasks.filter(t => t.projectId === projectId);
    }

    return userTasks.map(t => this.toResponseDto(t));
  }

  async findOne(id: string, userId: string): Promise<TaskResponseDto> {
    const task = this.tasks.find(t => t.id === id && t.userId === userId);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return this.toResponseDto(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<TaskResponseDto> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new NotFoundException('任务不存在');
    }

    const task = this.tasks[taskIndex];
    if (task.userId !== userId) {
      throw new ForbiddenException('无权限修改此任务');
    }

    // 处理状态变更
    let completedAt = task.completedAt;
    if (updateTaskDto.status === 'completed' && task.status !== 'completed') {
      completedAt = new Date();
    } else if (updateTaskDto.status !== 'completed' && task.status === 'completed') {
      completedAt = undefined;
    }

    // 更新任务
    this.tasks[taskIndex] = {
      ...task,
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
      updatedAt: new Date(),
      completedAt,
    };

    return this.toResponseDto(this.tasks[taskIndex]);
  }

  async remove(id: string, userId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new NotFoundException('任务不存在');
    }

    const task = this.tasks[taskIndex];
    if (task.userId !== userId) {
      throw new ForbiddenException('无权限删除此任务');
    }

    this.tasks.splice(taskIndex, 1);
  }

  async findByStatus(userId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<TaskResponseDto[]> {
    const userTasks = this.tasks.filter(t => t.userId === userId && t.status === status);
    return userTasks.map(t => this.toResponseDto(t));
  }

  async findByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Promise<TaskResponseDto[]> {
    const userTasks = this.tasks.filter(t => t.userId === userId && t.priority === priority);
    return userTasks.map(t => this.toResponseDto(t));
  }

  async findOverdueTasks(userId: string): Promise<TaskResponseDto[]> {
    const now = new Date();
    const overdueTasks = this.tasks.filter(t => 
      t.userId === userId && 
      t.dueDate && 
      t.dueDate < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    );
    return overdueTasks.map(t => this.toResponseDto(t));
  }

  async findSubTasks(parentTaskId: string, userId: string): Promise<TaskResponseDto[]> {
    const subTasks = this.tasks.filter(t => t.parentTaskId === parentTaskId && t.userId === userId);
    return subTasks.map(t => this.toResponseDto(t));
  }

  async getTaskStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    const userTasks = this.tasks.filter(t => t.userId === userId);
    const now = new Date();
    
    return {
      total: userTasks.length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length,
      cancelled: userTasks.filter(t => t.status === 'cancelled').length,
      overdue: userTasks.filter(t => 
        t.dueDate && 
        t.dueDate < now && 
        t.status !== 'completed' && 
        t.status !== 'cancelled'
      ).length,
    };
  }

  async smartCreate(smartCreateTaskDto: SmartCreateTaskDto, userId: string): Promise<{
    task: TaskResponseDto;
    suggestions?: any;
    subtasks?: TaskResponseDto[];
  }> {
    // 导入 SmartTodoService (为了避免循环依赖，这里使用简化的智能逻辑)
    const suggestions = await this.analyzeTaskForSuggestions(
      smartCreateTaskDto.title,
      smartCreateTaskDto.description,
      smartCreateTaskDto.dueDate ? new Date(smartCreateTaskDto.dueDate) : undefined
    );

    // 创建主任务，应用智能建议
    const taskData: CreateTaskDto = {
      title: smartCreateTaskDto.title,
      description: smartCreateTaskDto.description,
      priority: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions.suggestedPriority : 'medium',
      dueDate: smartCreateTaskDto.dueDate,
      estimatedDuration: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions.estimatedDuration : undefined,
      projectId: smartCreateTaskDto.projectId,
      parentTaskId: undefined,
      tags: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions.tags : [],
    };

    const mainTask = await this.create(taskData, userId);

    let subtasks: TaskResponseDto[] = [];

    // 如果启用自动分解
    if (smartCreateTaskDto.autoBreakdown) {
      const breakdown = await this.breakdownTaskLogic(smartCreateTaskDto.title, smartCreateTaskDto.description);
      
      for (const subtaskData of breakdown.subtasks) {
        const subtask = await this.create({
          title: subtaskData.title,
          description: subtaskData.description,
          priority: subtaskData.priority,
          estimatedDuration: subtaskData.estimatedDuration,
          projectId: smartCreateTaskDto.projectId,
          parentTaskId: mainTask.id,
          tags: [],
        }, userId);
        subtasks.push(subtask);
      }
    }

    return {
      task: mainTask,
      suggestions: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    };
  }

  async batchCreate(batchCreateTaskDto: BatchCreateTaskDto, userId: string): Promise<{
    created: TaskResponseDto[];
    failed: Array<{ task: SmartCreateTaskDto; error: string }>;
  }> {
    const created: TaskResponseDto[] = [];
    const failed: Array<{ task: SmartCreateTaskDto; error: string }> = [];

    for (const taskDto of batchCreateTaskDto.tasks) {
      try {
        const enrichedTaskDto = {
          ...taskDto,
          projectId: taskDto.projectId || batchCreateTaskDto.projectId,
          useSmartSuggestions: taskDto.useSmartSuggestions ?? batchCreateTaskDto.useSmartSuggestions,
        };

        const result = await this.smartCreate(enrichedTaskDto, userId);
        created.push(result.task);
        
        // 如果有子任务，也加入到创建列表中
        if (result.subtasks) {
          created.push(...result.subtasks);
        }
      } catch (error) {
        failed.push({
          task: taskDto,
          error: error.message || '创建任务失败',
        });
      }
    }

    return { created, failed };
  }

  async autoBreakdownTask(taskId: string, userId: string): Promise<{
    originalTask: TaskResponseDto;
    subtasks: TaskResponseDto[];
    breakdown: any;
  }> {
    const originalTask = await this.findOne(taskId, userId);
    const breakdown = await this.breakdownTaskLogic(originalTask.title, originalTask.description);

    const subtasks: TaskResponseDto[] = [];
    
    for (const subtaskData of breakdown.subtasks) {
      const subtask = await this.create({
        title: subtaskData.title,
        description: subtaskData.description,
        priority: subtaskData.priority,
        estimatedDuration: subtaskData.estimatedDuration,
        projectId: originalTask.projectId,
        parentTaskId: originalTask.id,
        tags: [],
      }, userId);
      subtasks.push(subtask);
    }

    return {
      originalTask,
      subtasks,
      breakdown,
    };
  }

  private async analyzeTaskForSuggestions(title: string, description?: string, dueDate?: Date): Promise<{
    suggestedPriority: 'low' | 'medium' | 'high';
    reasoning: string;
    estimatedDuration: number;
    tags: string[];
  }> {
    const content = (title + ' ' + (description || '')).toLowerCase();
    
    let priorityScore = 0;
    let reasoning = '';
    let estimatedDuration = 60;
    const tags: string[] = [];

    // 关键词分析
    const urgentKeywords = ['紧急', '急', 'urgent', 'asap', '马上', '立即', '今天'];
    const importantKeywords = ['重要', 'important', '关键', '核心', '主要'];
    const complexKeywords = ['设计', '开发', '研究', '分析', '规划', '架构', '系统'];
    const simpleKeywords = ['修复', '更新', '检查', '测试', '简单', '快速'];

    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      priorityScore += 2;
      reasoning += '检测到紧急关键词；';
    }
    
    if (importantKeywords.some(keyword => content.includes(keyword))) {
      priorityScore += 1;
      reasoning += '检测到重要关键词；';
    }

    if (dueDate) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        priorityScore += 2;
        reasoning += '截止日期临近；';
      } else if (daysUntilDue <= 3) {
        priorityScore += 1;
        reasoning += '截止日期较近；';
      }
    }

    // 时间估算
    if (complexKeywords.some(keyword => content.includes(keyword))) {
      estimatedDuration = 240;
      reasoning += '检测到复杂任务；';
    } else if (simpleKeywords.some(keyword => content.includes(keyword))) {
      estimatedDuration = 30;
      reasoning += '检测到简单任务；';
    }

    // 标签生成
    if (content.includes('开发') || content.includes('代码') || content.includes('编程')) {
      tags.push('开发');
    }
    if (content.includes('设计') || content.includes('ui') || content.includes('界面')) {
      tags.push('设计');
    }
    if (content.includes('会议') || content.includes('讨论')) {
      tags.push('会议');
    }
    if (content.includes('文档') || content.includes('报告')) {
      tags.push('文档');
    }

    const suggestedPriority = priorityScore >= 3 ? 'high' : priorityScore >= 1 ? 'medium' : 'low';

    return {
      suggestedPriority,
      reasoning: reasoning || '基于任务内容的分析',
      estimatedDuration,
      tags,
    };
  }

  private async breakdownTaskLogic(title: string, description?: string): Promise<{
    subtasks: Array<{
      title: string;
      description?: string;
      estimatedDuration?: number;
      priority: 'low' | 'medium' | 'high';
    }>;
    reasoning: string;
  }> {
    const content = (title + ' ' + (description || '')).toLowerCase();
    
    // 开发任务分解
    if (content.includes('开发') || content.includes('编程') || content.includes('代码')) {
      return {
        subtasks: [
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
            title: '测试验证',
            description: '进行功能测试和验证',
            estimatedDuration: 60,
            priority: 'medium',
          },
        ],
        reasoning: '检测到开发任务，按软件开发流程分解',
      };
    }
    
    // 设计任务分解
    if (content.includes('设计') || content.includes('ui') || content.includes('界面')) {
      return {
        subtasks: [
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
        ],
        reasoning: '检测到设计任务，按设计流程分解',
      };
    }
    
    // 通用分解
    return {
      subtasks: [
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
      ],
      reasoning: '通用任务分解',
    };
  }

  private toResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      estimatedDuration: task.estimatedDuration,
      actualDuration: task.actualDuration,
      projectId: task.projectId,
      userId: task.userId,
      parentTaskId: task.parentTaskId,
      tags: task.tags,
      aiGenerated: task.aiGenerated,
      aiContext: task.aiContext,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    };
  }

  async analyzeTask(description: string, userId: string): Promise<AITaskAnalysisDto> {
    return await this.aiService.analyzeTaskDescription(description);
  }

  async getProjectsSummary(userId: string): Promise<any[]> {
    const userTasks = this.tasks.filter(task => task.userId === userId);
    
    // 按项目分组任务
    const projectsMap = new Map();
    
    userTasks.forEach(task => {
      const projectId = task.projectId || 'default';
      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: projectId,
          name: projectId === 'default' ? '默认项目' : `项目 ${projectId}`,
          description: '',
          color: '#4F46E5',
          userId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
        });
      }
      projectsMap.get(projectId).tasks.push(task);
    });

    // 为每个项目计算汇总信息
    const projectsSummary = [];
    
    for (const [projectId, project] of projectsMap) {
      const tasks = project.tasks;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalEstimatedTime = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
      const totalActualTime = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 生成AI洞察
      const aiInsights = await this.aiService.generateProjectInsights(tasks);

      // 计算预计完成时间
      const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      const remainingTime = pendingTasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
      const scheduledEndDate = remainingTime > 0 ? 
        new Date(Date.now() + remainingTime * 60 * 1000).toISOString() : undefined;

      projectsSummary.push({
        ...project,
        totalTasks,
        completedTasks,
        totalEstimatedTime,
        totalActualTime,
        scheduledEndDate,
        progress,
        aiInsights,
        tasks: tasks.map(t => this.toResponseDto(t)),
      });
    }

    return projectsSummary;
  }
}