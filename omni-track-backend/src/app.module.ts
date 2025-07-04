import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { LogModule } from './modules/log/log.module';
import { SmartTodoModule } from './modules/smart-todo/smart-todo.module';
import { AIModule } from './modules/ai/ai.module';
import { User } from './database/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User],
      synchronize: true, // 开发环境使用，生产环境应设为false
      logging: true,
    }),
    AuthModule,
    ProjectModule,
    TaskModule,
    LogModule,
    SmartTodoModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}