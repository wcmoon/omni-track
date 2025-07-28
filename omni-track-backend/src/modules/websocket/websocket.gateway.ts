import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
    credentials: true,
  },
})
export class TaskWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    console.log('🔗 WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    // 减少连接日志，只在认证成功时显示
  }

  handleDisconnect(client: Socket) {
    // 清理用户映射
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('auth')
  async handleAuth(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const payload = this.jwtService.verify(data.token);
      const userId = payload.sub;
      
      // 保存用户ID和socket ID的映射
      this.userSocketMap.set(userId, client.id);
      
      client.emit('auth_success', { userId });
      console.log(`👤 User ${userId} connected via WebSocket`);
    } catch (error) {
      client.emit('auth_error', { message: 'Invalid token' });
      console.error('Auth error:', error);
    }
  }

  // 向特定用户发送AI分析完成通知
  notifyTaskAnalysisComplete(userId: string, taskId: string, updates: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('task_analysis_complete', {
        taskId,
        updates,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 向特定用户发送任务更新通知
  notifyTaskUpdate(userId: string, taskId: string, updates: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('task_updated', {
        taskId,
        updates,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 向特定用户发送任务创建通知
  notifyTaskCreated(userId: string, taskId: string) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('task_created', {
        taskId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 向特定用户发送任务更新通知
  notifyTaskUpdated(userId: string, taskId: string) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('task_updated', {
        taskId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 向特定用户发送任务删除通知
  notifyTaskDeleted(userId: string, taskId: string) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('task_deleted', {
        taskId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}