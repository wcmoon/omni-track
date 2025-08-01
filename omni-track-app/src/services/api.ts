import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorHandler, ErrorType } from './errorHandler';
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.getApiUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加到60秒，适应AI分析的响应时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 全局状态管理器引用（延迟导入避免循环依赖）
let authContextRef: any = null;
let toastContextRef: any = null;

// 设置全局引用的方法
export const setGlobalReferences = (authRef: any, toastRef: any) => {
  authContextRef = authRef;
  toastContextRef = toastRef;
};

// 响应拦截器 - 处理认证错误和其他错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 解析错误信息
    const errorInfo = errorHandler.parseError(error);
    
    // 记录错误
    errorHandler.logError(error, 'API Response');

    // 处理不同类型的错误
    switch (errorInfo.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        try {
          // 显示错误提示
          if (toastContextRef) {
            toastContextRef.showToast(errorInfo.message, 'error');
          }

          // 强制登出
          if (authContextRef) {
            await authContextRef.forceLogout();
          } else {
            // 如果没有context引用，直接清除存储
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user');
          }
          
          console.warn('Authentication failed, user logged out');
        } catch (logoutError) {
          console.error('Error during forced logout:', logoutError);
        }
        break;
      
      case ErrorType.NETWORK_ERROR:
        if (toastContextRef) {
          toastContextRef.showToast(errorInfo.message, 'error');
        }
        break;
      
      case ErrorType.SERVER_ERROR:
        if (toastContextRef) {
          toastContextRef.showToast(errorInfo.message, 'error');
        }
        break;
      
      // 其他错误类型可以在这里处理
      default:
        // 对于其他错误，不显示全局toast，让组件自己处理
        break;
    }

    return Promise.reject(error);
  }
);