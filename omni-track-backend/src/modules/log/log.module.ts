import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { SmartLogService } from './smart-log.service';
import { SmartLogController } from './smart-log.controller';
import { AIService } from '../ai/ai.service';

@Module({
  controllers: [LogController, SmartLogController],
  providers: [LogService, SmartLogService, AIService],
  exports: [LogService, SmartLogService],
})
export class LogModule {}