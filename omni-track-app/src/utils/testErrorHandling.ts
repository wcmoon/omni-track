// 测试错误处理功能的工具函数
// 这个文件仅用于开发测试，不应该在生产环境中使用

import { api } from '../services/api';

export const testErrorHandling = {
  // 测试401错误处理
  async test401Error() {
    try {
      // 发送一个会返回401错误的请求
      await api.get('/auth/profile', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
    } catch (error) {
      console.log('401 Error handling test completed');
    }
  },

  // 测试网络错误处理
  async testNetworkError() {
    try {
      // 发送一个会导致网络错误的请求
      await api.get('http://nonexistent-domain.com/api/test');
    } catch (error) {
      console.log('Network error handling test completed');
    }
  },

  // 测试服务器错误处理
  async testServerError() {
    try {
      // 发送一个会返回500错误的请求
      await api.get('/api/test-500-error');
    } catch (error) {
      console.log('Server error handling test completed');
    }
  },

  // 测试验证错误处理
  async testValidationError() {
    try {
      // 发送一个会返回422错误的请求
      await api.post('/api/test-validation', {
        invalidData: 'test'
      });
    } catch (error) {
      console.log('Validation error handling test completed');
    }
  }
};

// 在开发环境中可以通过以下方式测试:
// import { testErrorHandling } from '../utils/testErrorHandling';
// testErrorHandling.test401Error();