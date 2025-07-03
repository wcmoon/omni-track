import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Task } from '../../database/entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  private tasks: Task[] = []; // 临时存储，后续会替换为数据库

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
}