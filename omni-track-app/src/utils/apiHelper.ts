import { api } from '../services/api';
import { errorHandler } from '../services/errorHandler';

// API帮助工具类
class ApiHelper {
  // 通用的API请求方法，带有错误处理
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await api.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      // 在这里可以做额外的错误处理
      throw error;
    }
  }

  // GET请求
  async get<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  // DELETE请求
  async delete<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  // 获取用户友好的错误消息
  getErrorMessage(error: any): string {
    return errorHandler.getUserFriendlyMessage(error);
  }
}

export const apiHelper = new ApiHelper();