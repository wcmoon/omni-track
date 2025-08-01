import { api } from './api';
import { Log, LogFormData, LogFilter, LogDisplayGroup } from '../types/log';

export const logService = {
  // 获取日志列表
  async getLogs(filter?: LogFilter): Promise<Log[]> {
    try {
      const params = new URLSearchParams();
      
      if (filter?.types && filter.types.length > 0) {
        params.append('type', filter.types.join(','));
      }
      
      if (filter?.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      
      if (filter?.tags && filter.tags.length > 0) {
        params.append('tags', filter.tags.join(','));
      }
      
      const queryString = params.toString();
      const url = queryString ? `/logs?${queryString}` : '/logs';
      
      console.log('🌐 API请求:', url);
      const response = await api.get(url);
      console.log('📡 API响应:', response.data);
      
      // 检查响应结构
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // 如果直接返回数组
        return response.data;
      } else {
        console.warn('⚠️ 意外的API响应格式:', response.data);
        return [];
      }
    } catch (error) {
      console.error('获取日志列表失败:', error);
      throw error;
    }
  },

  // 获取分组的日志数据（按日期分组）
  async getGroupedLogs(filter?: LogFilter): Promise<LogDisplayGroup[]> {
    try {
      console.log('🔍 正在获取日志数据...');
      const logs = await this.getLogs(filter);
      console.log('✅ 获取到日志数据:', logs?.length, '条');
      const grouped = this.groupLogsByDate(logs);
      console.log('📊 分组后数据:', grouped?.length, '组');
      return grouped;
    } catch (error) {
      console.error('❌ 获取分组日志失败:', error);
      throw error;
    }
  },

  // AI分析日志内容
  async analyzeLog(content: string): Promise<any> {
    try {
      const response = await api.post('/logs/analyze', { content });
      return response.data.data;
    } catch (error) {
      console.error('AI分析日志失败:', error);
      throw error;
    }
  },

  // 创建智能日志
  async createSmartLog(logData: LogFormData): Promise<{ log: Log; analysis: any }> {
    try {
      const response = await api.post('/logs/smart-log', logData);
      return response.data.data;
    } catch (error) {
      console.error('创建智能日志失败:', error);
      throw error;
    }
  },

  // 创建新日志
  async createLog(logData: LogFormData): Promise<Log> {
    try {
      const response = await api.post('/logs', logData);
      return response.data.data;
    } catch (error) {
      console.error('创建日志失败:', error);
      throw error;
    }
  },

  // 获取日志类型
  async getLogTypes(): Promise<string[]> {
    try {
      const response = await api.get('/logs/types');
      return response.data.data;
    } catch (error) {
      console.error('获取日志类型失败:', error);
      throw error;
    }
  },

  // 获取单个日志详情
  async getLogById(logId: string): Promise<Log> {
    try {
      const response = await api.get(`/logs/${logId}`);
      return response.data;
    } catch (error) {
      console.error('获取日志详情失败:', error);
      throw error;
    }
  },

  // 更新日志
  async updateLog(logId: string, logData: Partial<LogFormData>): Promise<Log> {
    try {
      const response = await api.patch(`/logs/${logId}`, logData);
      return response.data.data;
    } catch (error) {
      console.error('更新日志失败:', error);
      throw error;
    }
  },

  // 删除日志
  async deleteLog(logId: string): Promise<void> {
    try {
      await api.delete(`/logs/${logId}`);
    } catch (error) {
      console.error('删除日志失败:', error);
      throw error;
    }
  },

  // 搜索日志
  async searchLogs(query: string, filter?: LogFilter): Promise<Log[]> {
    try {
      const params = new URLSearchParams({ q: query });
      
      if (filter?.types && filter.types.length > 0) {
        params.append('types', filter.types.join(','));
      }
      
      const response = await api.get(`/logs/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('搜索日志失败:', error);
      throw error;
    }
  },

  // 获取日志统计信息
  async getLogStats(dateRange?: { start: string; end: string }) {
    try {
      const params = new URLSearchParams();
      
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/logs/stats?${queryString}` : '/logs/stats';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('获取日志统计失败:', error);
      throw error;
    }
  },

  // 获取热门标签
  async getPopularTags(limit: number = 20): Promise<string[]> {
    try {
      const response = await api.get(`/logs/popular-tags?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('获取热门标签失败:', error);
      throw error;
    }
  },

  // 按日期分组日志的辅助方法
  groupLogsByDate(logs: Log[]): LogDisplayGroup[] {
    const groups: { [key: string]: Log[] } = {};
    
    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    
    // 按日期降序排列，最新的在前
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        logs: groups[date].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }));
  },

  // 导出日志数据
  async exportLogs(format: 'json' | 'csv' | 'txt', filter?: LogFilter): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      
      if (filter?.types && filter.types.length > 0) {
        params.append('types', filter.types.join(','));
      }
      
      if (filter?.dateRange) {
        params.append('startDate', filter.dateRange.start);
        params.append('endDate', filter.dateRange.end);
      }
      
      const response = await api.get(`/logs/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('导出日志失败:', error);
      throw error;
    }
  },
};