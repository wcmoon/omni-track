import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // 启用CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
    credentials: true,
  });
  
  // 设置全局路径前缀
  app.setGlobalPrefix('api');
  
  await app.listen(3001);
  console.log('TimeWeave API is running on http://localhost:3001');
}
bootstrap();