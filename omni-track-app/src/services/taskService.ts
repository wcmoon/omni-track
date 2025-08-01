import { api } from './api';
import { Task } from '../types';

export const taskService = {
  // 获取所有任务
  async getTasks(): Promise<Task[]> {
    try {
      console.log('发送API请求获取任务列表...');
      const response = await api.get('/tasks');
      console.log('API响应:', response.data);
      
      if (!response.data || !response.data.data) {
        console.error('API响应格式错误:', response.data);
        throw new Error('API响应格式错误');
      }
      
      // 转换日期字符串为Date对象
      const tasks = response.data.data.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
      console.log('转换后的任务数据:', tasks);
      return tasks;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    }
  },

  // AI分析任务描述
  async analyzeTask(description: string): Promise<any> {
    try {
      const response = await api.post('/tasks/analyze', { description });
      return response.data.data;
    } catch (error) {
      console.error('AI分析任务失败:', error);
      throw error;
    }
  },

  // 创建新任务
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const response = await api.post('/tasks', taskData);
      const task = response.data.data;
      return {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      };
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  },

  // 智能创建任务（使用AI分析）
  async smartCreateTask(taskData: {
    description: string;
    title?: string;
    useSmartSuggestions?: boolean;
  }): Promise<Task> {
    try {
      const response = await api.post('/tasks/smart-create', taskData);
      const task = response.data.data.task;
      return {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      };
    } catch (error) {
      console.error('智能创建任务失败:', error);
      throw error;
    }
  },

  // 更新任务
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${taskId}`, taskData);
      const task = response.data.data;
      return {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      };
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  },

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  },



  // 完成任务
  async completeTask(taskId: string): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${taskId}/complete`);
      const task = response.data.data;
      return {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      };
    } catch (error) {
      console.error('完成任务失败:', error);
      throw error;
    }
  },

  // 根据状态获取任务
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    try {
      const response = await api.get(`/tasks/status/${status}`);
      const tasks = response.data.data.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
      return tasks;
    } catch (error) {
      console.error('获取任务失败:', error);
      throw error;
    }
  },

  // 根据优先级获取任务
  async getTasksByPriority(priority: 'low' | 'medium' | 'high'): Promise<Task[]> {
    try {
      const response = await api.get(`/tasks/priority/${priority}`);
      const tasks = response.data.data.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
      return tasks;
    } catch (error) {
      console.error('获取任务失败:', error);
      throw error;
    }
  },

};