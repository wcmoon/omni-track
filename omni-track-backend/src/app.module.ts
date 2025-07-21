import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { LogModule } from './modules/log/log.module';
import { SmartTodoModule } from './modules/smart-todo/smart-todo.module';
import { AIModule } from './modules/ai/ai.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
// import { AnalysisQueueModule } from './modules/analysis-queue/analysis-queue.module';
import { getDatabaseConfig } from './config/database.config';
import { getRedisConfig } from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => getRedisConfig(configService),
      inject: [ConfigService],
    }),
    AuthModule,
    ProjectModule,
    TaskModule,
    LogModule,
    SmartTodoModule,
    AIModule,
    WebSocketModule,
    // AnalysisQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
