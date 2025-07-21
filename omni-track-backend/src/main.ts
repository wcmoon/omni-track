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
  
  // 开发环境下启用详细错误信息
  if (process.env.NODE_ENV === 'development') {
    app.useGlobalFilters({
      catch: (exception, host) => {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        
        console.error('💥 Global Exception:', exception);
        console.error('🔍 Request URL:', request.url);
        console.error('📄 Request body:', request.body);
        console.error('📋 Request headers:', request.headers);
        
        const status = exception.getStatus ? exception.getStatus() : 500;
        
        response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: exception.message || 'Internal server error',
          error: exception.name || 'Error',
          stack: exception.stack,
        });
      }
    });
  }
  
  await app.listen(3001);
  console.log('TimeWeave API is running on http://localhost:3001');
}
bootstrap();