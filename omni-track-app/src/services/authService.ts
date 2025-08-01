import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  verificationCode: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    user: User;
  };
}

class AuthService {
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', loginData);
      
      if (response.data.success && response.data.data) {
        // 保存令牌和用户信息
        await AsyncStorage.setItem('access_token', response.data.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', registerData);
      
      if (response.data.success && response.data.data) {
        // 保存令牌和用户信息
        await AsyncStorage.setItem('access_token', response.data.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '注册失败');
    }
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/send-verification-code', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '发送验证码失败');
    }
  }

  async verifyCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '验证码验证失败');
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // 无论API调用是否成功，都清除本地存储
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.warn('Failed to get access token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户信息失败');
    }
  }

  async clearLocalStorage(): Promise<void> {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.warn('Failed to clear local storage:', error);
    }
  }
}

export const authService = new AuthService();