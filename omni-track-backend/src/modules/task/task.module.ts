import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AIService } from '../ai/ai.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { LogModule } from '../log/log.module';
import { Task } from '../../database/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    WebSocketModule,
    forwardRef(() => LogModule)
  ],
  controllers: [TaskController],
  providers: [TaskService, AIService],
  exports: [TaskService],
})
export class TaskModule {}