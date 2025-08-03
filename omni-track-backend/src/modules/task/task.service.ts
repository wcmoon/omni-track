import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../database/entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './dto/task.dto';
import { SmartCreateTaskDto, BatchCreateTaskDto, AITaskAnalysisDto } from './dto/smart-task.dto';
import { AIService } from '../ai/ai.service';
import { TaskWebSocketGateway } from '../websocket/websocket.gateway';
import { LogService } from '../log/log.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly aiService: AIService,
    private readonly wsGateway: TaskWebSocketGateway,
    @Inject(forwardRef(() => LogService))
    private readonly logService: LogService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    // 处理 tags 字段，确保它是数组或 undefined
    let tags: string[] | undefined;
    if (createTaskDto.tags === null || createTaskDto.tags === undefined || createTaskDto.tags === '') {
      tags = undefined;
    } else if (Array.isArray(createTaskDto.tags)) {
      tags = createTaskDto.tags.filter(tag => tag && tag.trim() !== '');
    } else if (typeof createTaskDto.tags === 'string') {
      // 如果前端错误地发送了字符串，尝试解析
      if (createTaskDto.tags.trim() === '') {
        tags = undefined;
      } else {
        tags = [createTaskDto.tags];
      }
    } else {
      tags = undefined;
    }

    const taskData = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority || 'medium',
      status: 'pending' as const,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      endTime: createTaskDto.endTime,
      estimatedDuration: createTaskDto.estimatedDuration,
      projectId: createTaskDto.projectId,
      userId,
      parentTaskId: createTaskDto.parentTaskId,
      tags: tags || undefined, // 使用 undefined 而不是空数组
      aiGenerated: createTaskDto.aiGenerated || false,
      aiContext: createTaskDto.aiContext,
    };
    
    const task = this.taskRepository.create(taskData);
    const savedTask = await this.taskRepository.save(task);
    
    // 发送任务创建通知
    this.wsGateway.notifyTaskCreated(userId, savedTask.id);
    
    // 异步AI分析（不阻塞返回，且只对未完成且非AI生成的任务进行）
    if (savedTask.status !== 'completed' && !savedTask.aiGenerated) {
      console.log('🧠 启动任务AI分析，任务ID:', savedTask.id);
      this.performAsyncAIAnalysis(savedTask.id, createTaskDto.description, userId);
    } else if (savedTask.aiGenerated) {
      console.log('⏭️ 跳过AI生成任务的分析，任务ID:', savedTask.id);
    }
    
    return this.toResponseDto(savedTask);
  }

  private async performAsyncAIAnalysis(taskId: string, description: string, userId: string): Promise<void> {
    try {
      console.log(`🤖 开始异步AI分析任务: ${taskId}`);
      const analysis = await this.aiService.analyzeTaskDescription(description);
      
      // 查找任务并更新AI分析结果（只更新未完成的任务）
      const task = await this.taskRepository.findOne({
        where: { id: taskId, userId }
      });
      
      if (task && task.status !== 'completed') {
        // 合并标签并去重
        const mergedTags = [...new Set([...(task.tags || []), ...(analysis.suggestedTags || [])])];
        
        await this.taskRepository.update(taskId, {
          estimatedDuration: analysis.estimatedTime || task.estimatedDuration,
          priority: analysis.suggestedPriority || task.priority,
          tags: mergedTags,
          aiContext: `AI分析：优先级 ${analysis.suggestedPriority}，预估时间 ${analysis.estimatedTime}分钟`,
        });
        
        console.log(`✅ 任务 ${taskId} AI分析完成`);
        
        // 发送WebSocket通知
        this.wsGateway.notifyTaskAnalysisComplete(userId, taskId, {
          estimatedDuration: analysis.estimatedTime,
          priority: analysis.suggestedPriority,
          tags: mergedTags,
          aiContext: `AI分析：优先级 ${analysis.suggestedPriority}，预估时间 ${analysis.estimatedTime}分钟`,
        });
      } else if (task && task.status === 'completed') {
        console.log(`⚠️ 任务 ${taskId} 已完成，跳过AI分析结果更新`);
      }
    } catch (error) {
      console.error(`❌ 任务 ${taskId} AI分析失败:`, error);
    }
  }

  async findAll(userId: string, projectId?: string): Promise<TaskResponseDto[]> {
    const where: any = { userId };
    
    if (projectId) {
      where.projectId = projectId;
    }

    const tasks = await this.taskRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });

    return tasks.map(t => this.toResponseDto(t));
  }

  async findOne(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id, userId }
    });
    
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    
    return this.toResponseDto(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id, userId }
    });
    
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 处理状态变更
    let completedAt = task.completedAt;
    if (updateTaskDto.status === 'completed' && task.status !== 'completed') {
      completedAt = new Date();
    } else if (updateTaskDto.status !== 'completed' && task.status === 'completed') {
      completedAt = undefined;
    }

    // 更新任务
    const updateData = {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
      completedAt,
    };
    
    await this.taskRepository.update(id, updateData);
    
    const updatedTask = await this.taskRepository.findOne({
      where: { id, userId }
    });

    // 如果任务状态变为已完成，自动创建完成日志
    console.log(`任务状态更新: ${task.status} -> ${updateTaskDto.status}`);
    if (updateTaskDto.status === 'completed' && task.status !== 'completed') {
      console.log(`创建任务完成日志: 任务 ${task.id} - ${task.description}`);
      try {
        const logResult = await this.logService.create({
          content: `完成任务：${task.description}`,
          type: '任务完成',
          tags: ['任务完成'],
          mood: 'neutral' as const,
          energy: 'medium' as const,
        }, userId);
        console.log('任务完成日志创建成功:', logResult);
      } catch (error) {
        console.error('创建任务完成日志失败:', error);
        // 不抛出错误，不影响任务更新的主流程
      }
    } else {
      console.log(`不满足创建日志条件: status=${updateTaskDto.status}, task.status=${task.status}`);
    }

    // 发送任务更新通知
    this.wsGateway.notifyTaskUpdated(userId, id);

    return this.toResponseDto(updatedTask!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id, userId }
    });
    
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.taskRepository.delete(id);
    
    // 发送任务删除通知
    this.wsGateway.notifyTaskDeleted(userId, id);
  }

  async findByStatus(userId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.find({
      where: { userId, status }
    });
    return tasks.map(t => this.toResponseDto(t));
  }

  async findByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.find({
      where: { userId, priority }
    });
    return tasks.map(t => this.toResponseDto(t));
  }

  async findOverdueTasks(userId: string): Promise<TaskResponseDto[]> {
    const now = new Date();
    const allTasksWithDueDate = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate IS NOT NULL')
      .andWhere('task.status NOT IN (:...statuses)', { statuses: ['completed', 'cancelled'] })
      .getMany();
    
    // 过滤出真正逾期的任务（考虑endTime）
    const overdueTasks = allTasksWithDueDate.filter(task => {
      const taskDueDate = new Date(task.dueDate!);
      
      if (task.endTime) {
        // 如果有具体时间，精确比较到分钟
        const [hours, minutes] = task.endTime.split(':').map(Number);
        taskDueDate.setHours(hours, minutes, 0, 0);
        return taskDueDate < now;
      } else {
        // 如果没有具体时间，认为是当天23:59:59到期
        taskDueDate.setHours(23, 59, 59, 999);
        return taskDueDate < now;
      }
    });
      
    return overdueTasks.map(t => this.toResponseDto(t));
  }

  async findSubTasks(parentTaskId: string, userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.find({
      where: { parentTaskId: parentTaskId, userId: userId }
    });
    return tasks.map(t => this.toResponseDto(t));
  }

  async getTaskStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    const now = new Date();
    
    const [total, pending, inProgress, completed, cancelled] = await Promise.all([
      this.taskRepository.count({ where: { userId } }),
      this.taskRepository.count({ where: { userId, status: 'pending' } }),
      this.taskRepository.count({ where: { userId, status: 'in_progress' } }),
      this.taskRepository.count({ where: { userId, status: 'completed' } }),
      this.taskRepository.count({ where: { userId, status: 'cancelled' } }),
    ]);
    
    // 获取逾期任务数量（使用与findOverdueTasks相同的逻辑）
    const overdueTasks = await this.findOverdueTasks(userId);
    const overdue = overdueTasks.length;
    
    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      overdue,
    };
  }

  async smartCreate(smartCreateTaskDto: SmartCreateTaskDto, userId: string): Promise<{
    task: TaskResponseDto;
    suggestions?: any;
    subtasks?: TaskResponseDto[];
  }> {
    console.log(`🚀 开始智能创建任务: ${smartCreateTaskDto.description}`);
    
    // 先使用关键词快速识别时间，不等待AI分析
    const quickTimeAnalysis = {
      suggestedDueDate: this.extractDateByKeywords(smartCreateTaskDto.description),
      suggestedEndTime: this.extractTimeByKeywords(smartCreateTaskDto.description),
    };
    console.log('⚡ 快速时间识别结果:', quickTimeAnalysis);
    
    // 合并用户输入的时间和快速识别的时间
    let finalDueDate = smartCreateTaskDto.dueDate;
    let finalEndTime: string | undefined;
    
    // 如果用户没有提供时间，但快速识别到了时间，则使用快速识别的时间
    if (!smartCreateTaskDto.dueDate && quickTimeAnalysis.suggestedDueDate) {
      finalDueDate = quickTimeAnalysis.suggestedDueDate;
      finalEndTime = quickTimeAnalysis.suggestedEndTime;
    }
    
    // 导入 SmartTodoService (为了避免循环依赖，这里使用简化的智能逻辑)
    const suggestions = await this.analyzeTaskForSuggestions(
      smartCreateTaskDto.title,
      smartCreateTaskDto.description,
      finalDueDate ? new Date(finalDueDate) : undefined
    );

    // 创建主任务，应用快速建议
    const taskData: CreateTaskDto = {
      title: smartCreateTaskDto.title || smartCreateTaskDto.description.slice(0, 20),
      description: smartCreateTaskDto.description,
      priority: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions.suggestedPriority : 'medium',
      dueDate: finalDueDate,
      endTime: finalEndTime, // 添加具体时间
      estimatedDuration: smartCreateTaskDto.useSmartSuggestions !== false ? suggestions.estimatedDuration : undefined,
      projectId: smartCreateTaskDto.projectId,
      parentTaskId: undefined,
      tags: (() => {
        const filteredTags = smartCreateTaskDto.useSmartSuggestions !== false 
          ? [...new Set([...(smartCreateTaskDto.tags || []), ...suggestions.tags])].filter(tag => tag && tag.trim() !== '')
          : (smartCreateTaskDto.tags || []).filter(tag => tag && tag.trim() !== '');
        return filteredTags.length > 0 ? filteredTags : undefined;
      })(),
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

    // 异步AI分析（不阻塞返回）
    if (smartCreateTaskDto.useSmartSuggestions !== false) {
      console.log('🔄 启动异步AI分析...');
      this.performAsyncAIAnalysis(mainTask.id, smartCreateTaskDto.description, userId);
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
      title: task.title || task.description, // 使用标题，如果没有标题则使用描述
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      endTime: task.endTime,
      estimatedDuration: task.estimatedDuration,
      actualDuration: task.actualDuration,
      projectId: task.projectId,
      userId: task.userId,
      parentTaskId: task.parentTaskId,
      tags: task.tags,
      aiGenerated: task.aiGenerated,
      aiContext: task.aiContext,
      isRecurring: task.isRecurring || false,
      recurrencePattern: task.recurrencePattern,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    };
  }

  async analyzeTask(description: string, userId: string): Promise<AITaskAnalysisDto> {
    return await this.aiService.analyzeTaskDescription(description);
  }

  async getProjectsSummary(userId: string): Promise<any[]> {
    const userTasks = await this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    
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

  // 快速时间识别方法（不依赖AI API）
  private extractDateByKeywords(description: string): string | undefined {
    const desc = description.toLowerCase();
    const now = new Date();
    
    // 本地日期格式化函数
    const formatLocalDate = (date: Date): string => {
      return date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
    };
    
    // 相对时间表达的识别（使用本地时区）
    if (desc.includes('今天') || desc.includes('今日')) {
      return formatLocalDate(now);
    }
    
    if (desc.includes('明天')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return formatLocalDate(tomorrow);
    }
    
    if (desc.includes('后天')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return formatLocalDate(dayAfterTomorrow);
    }
    
    if (desc.includes('昨天')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return formatLocalDate(yesterday);
    }
    
    return undefined;
  }
  
  private extractTimeByKeywords(description: string): string | undefined {
    const desc = description.toLowerCase();
    
    // 时间表达的识别
    const timePatterns = [
      /(\d{1,2})[：:](\d{2})/,  // 12:30, 12：30
      /(\d{1,2})点(\d{1,2})?分?/,  // 12点30分, 12点
      /(上午|下午)(\d{1,2})点?(\d{1,2})?分?/,  // 上午9点, 下午2点30分
      /(早上|中午|晚上)(\d{1,2})点?(\d{1,2})?分?/,  // 早上8点, 晚上7点30分
    ];
    
    for (const pattern of timePatterns) {
      const match = desc.match(pattern);
      if (match) {
        if (pattern.source.includes('：|:')) {
          // HH:mm 格式
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else if (pattern.source.includes('上午|下午')) {
          // 上午/下午格式
          const period = match[1];
          let hour = parseInt(match[2]);
          const minute = match[3] ? parseInt(match[3]) : 0;
          
          if (period === '下午' && hour < 12) {
            hour += 12;
          } else if (period === '上午' && hour === 12) {
            hour = 0;
          }
          
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else if (pattern.source.includes('早上|中午|晚上')) {
          // 早上/中午/晚上格式
          const period = match[1];
          let hour = parseInt(match[2]);
          const minute = match[3] ? parseInt(match[3]) : 0;
          
          if (period === '晚上' && hour < 12) {
            hour += 12;
          } else if (period === '中午' && hour === 12) {
            hour = 12;
          }
          
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else {
          // 简单的 X点Y分 格式
          const hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return undefined;
  }
}