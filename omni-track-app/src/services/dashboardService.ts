import { api } from './api';
import { DashboardData } from '../types/dashboard';

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      // 使用真实的认证接口
      const [smartTodoData, smartLogData, taskStats, logStats] = await Promise.all([
        api.get('/smart-todo/dashboard'),
        api.get('/smart-log/dashboard'),
        api.get('/tasks/statistics'),
        api.get('/logs/statistics'),
      ]);

      return {
        smartTodo: smartTodoData.data.data,
        smartLog: smartLogData.data.data,
        taskStats: taskStats.data.data,
        logStats: logStats.data.data,
      };
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      // 如果API调用失败，回退到测试数据以确保应用可用性
      console.log('回退到测试数据');
      try {
        const [smartTodoData, smartLogData, taskStats, logStats] = await Promise.all([
          api.get('/test-dashboard/smart-todo'),
          api.get('/test-dashboard/smart-log'),
          api.get('/test-dashboard/task-stats'),
          api.get('/test-dashboard/log-stats'),
        ]);

        return {
          smartTodo: smartTodoData.data.data,
          smartLog: smartLogData.data.data,
          taskStats: taskStats.data.data,
          logStats: logStats.data.data,
        };
      } catch (fallbackError) {
        console.error('测试数据也获取失败:', fallbackError);
        throw error; // 抛出原始错误
      }
    }
  }

  async getSmartTodoInsights() {
    try {
      const response = await api.get('/smart-todo/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('获取任务洞察失败:', error);
      throw error;
    }
  }

  async getSmartLogInsights() {
    try {
      const response = await api.get('/smart-log/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('获取日志洞察失败:', error);
      throw error;
    }
  }

  async getLifeQualityScore(days: number = 30) {
    try {
      const response = await api.get(`/smart-log/life-quality-score?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取生活质量评分失败:', error);
      throw error;
    }
  }

  async getWorkflowSuggestions() {
    try {
      const response = await api.get('/smart-todo/workflow-suggestions');
      return response.data.data;
    } catch (error) {
      console.error('获取工作流程建议失败:', error);
      throw error;
    }
  }

  async getLogInsights(days: number = 30) {
    try {
      const response = await api.get(`/smart-log/insights?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取日志洞察失败:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();