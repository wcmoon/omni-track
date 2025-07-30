import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { SmartLogService } from './smart-log.service';
import { SmartLogController } from './smart-log.controller';
import { AIModule } from '../ai/ai.module';
import { Log } from '../../database/entities/log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log]), AIModule],
  controllers: [LogController, SmartLogController],
  providers: [LogService, SmartLogService],
  exports: [LogService, SmartLogService],
})
export class LogModule {}