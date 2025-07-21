import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AIService } from '../ai/ai.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [TaskController],
  providers: [TaskService, AIService],
  exports: [TaskService],
})
export class TaskModule {}