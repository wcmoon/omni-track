import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private url: string = 'http://localhost:3001'; // socket.io服务器地址
  private isConnecting = false; // 防止重复连接

  connect() {
    // 防止重复连接
    if (this.socket?.connected || this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    this.disconnect(); // 确保先断开之前的连接
    
    this.socket = io(this.url, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    this.socket.on('connect', async () => {
      console.log('🔗 WebSocket连接已建立');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // 发送认证信息
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        this.socket?.emit('auth', { token });
      }
    });
    
    this.socket.on('auth_success', (data) => {
      console.log('👤 WebSocket认证成功');
    });
    
    this.socket.on('auth_error', (error) => {
      console.error('❌ WebSocket认证失败:', error);
    });
    
    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket连接已断开');
      this.isConnecting = false;
      this.handleReconnect();
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket连接错误:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });
    
    // 监听任务分析完成事件
    this.socket.on('task_analysis_complete', (data) => {
      const handlers = this.messageHandlers.get('task_analysis_complete') || [];
      handlers.forEach(handler => handler(data));
    });
    
    // 监听任务更新事件
    this.socket.on('task_updated', (data) => {
      const handlers = this.messageHandlers.get('task_updated') || [];
      handlers.forEach(handler => handler(data));
    });
    
    // 监听任务创建事件
    this.socket.on('task_created', (data) => {
      const handlers = this.messageHandlers.get('task_created') || [];
      handlers.forEach(handler => handler(data));
    });
    
    // 监听任务删除事件
    this.socket.on('task_deleted', (data) => {
      const handlers = this.messageHandlers.get('task_deleted') || [];
      handlers.forEach(handler => handler(data));
    });
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isConnecting) {
      this.reconnectAttempts++;
      console.log(`🔄 尝试重连 WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ WebSocket重连失败，已达到最大尝试次数');
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }
  
  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO未连接，无法发送消息');
    }
  }
  
  // 注册消息处理器
  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }
  
  // 移除消息处理器
  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}

export const wsService = new WebSocketService();