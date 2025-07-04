import { Module } from '@nestjs/common';
import { SmartTodoService } from './smart-todo.service';
import { SmartTodoController } from './smart-todo.controller';
import { TestDashboardController } from './test-dashboard.controller';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [SmartTodoController, TestDashboardController],
  providers: [SmartTodoService],
  exports: [SmartTodoService],
})
export class SmartTodoModule {}