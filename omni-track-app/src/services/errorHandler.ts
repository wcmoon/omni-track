import { AxiosError } from 'axios';

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
}

// 错误处理服务
class ErrorHandlerService {
  // 解析错误类型和消息
  parseError(error: any): ErrorInfo {
    if (error.response) {
      // 服务器响应错误
      const statusCode = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (statusCode) {
        case 401:
          return {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: '登录已过期，请重新登录',
            statusCode,
            originalError: error,
          };
        case 403:
          return {
            type: ErrorType.AUTHORIZATION_ERROR,
            message: '没有权限访问该资源',
            statusCode,
            originalError: error,
          };
        case 422:
          return {
            type: ErrorType.VALIDATION_ERROR,
            message: message || '输入数据验证失败',
            statusCode,
            originalError: error,
          };
        case 500:
          return {
            type: ErrorType.SERVER_ERROR,
            message: '服务器内部错误，请稍后重试',
            statusCode,
            originalError: error,
          };
        default:
          return {
            type: ErrorType.SERVER_ERROR,
            message: message || '请求失败',
            statusCode,
            originalError: error,
          };
      }
    } else if (error.request) {
      // 网络错误
      return {
        type: ErrorType.NETWORK_ERROR,
        message: '网络连接失败，请检查网络设置',
        originalError: error,
      };
    } else {
      // 其他错误
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: error.message || '未知错误',
        originalError: error,
      };
    }
  }

  // 获取用户友好的错误消息
  getUserFriendlyMessage(error: any): string {
    const errorInfo = this.parseError(error);
    return errorInfo.message;
  }

  // 记录错误
  logError(error: any, context?: string) {
    const errorInfo = this.parseError(error);
    console.error(`[Error Handler] ${context || 'Unknown context'}:`, {
      type: errorInfo.type,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      originalError: errorInfo.originalError,
    });
  }
}

export const errorHandler = new ErrorHandlerService();