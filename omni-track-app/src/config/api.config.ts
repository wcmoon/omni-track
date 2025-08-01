// API配置文件
export const API_CONFIG = {
  // 生产环境API地址
  BASE_URL: 'https://api.timeweave.xyz',

  // 获取当前环境的API基础URL
  getBaseUrl: () => {
    console.log('🚀 使用生产环境API:', API_CONFIG.BASE_URL);
    return API_CONFIG.BASE_URL;
  },

  // 获取API URL
  getApiUrl: () => `${API_CONFIG.getBaseUrl()}/api`,

  // 获取WebSocket URL
  getWebSocketUrl: () => API_CONFIG.getBaseUrl(),
};
