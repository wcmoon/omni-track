import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AIModule } from '../ai/ai.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { LogModule } from '../log/log.module';
import { Task } from '../../database/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    WebSocketModule,
    AIModule,
    forwardRef(() => LogModule)
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}