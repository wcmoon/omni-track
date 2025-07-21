import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    
    const exceptionResponse = exception.getResponse() as any;
    const status = exception.getStatus();
    
    console.log('🚨 Validation Error Details:');
    console.log('📄 Request body:', JSON.stringify(request.body, null, 2));
    console.log('📋 Request headers:', request.headers);
    console.log('🔍 Validation errors:', exceptionResponse.message);
    
    // 格式化错误消息
    const errorMessages = Array.isArray(exceptionResponse.message) 
      ? exceptionResponse.message 
      : [exceptionResponse.message];
    
    // 分类错误
    const fieldErrors = {};
    const generalErrors = [];
    
    errorMessages.forEach(msg => {
      if (typeof msg === 'string') {
        // 尝试从错误消息中提取字段名
        if (msg.includes('任务描述')) {
          fieldErrors['description'] = msg;
        } else if (msg.includes('完成时间')) {
          fieldErrors['completionTime'] = msg;
        } else if (msg.includes('isRecurring')) {
          fieldErrors['isRecurring'] = msg;
        } else if (msg.includes('预估时长')) {
          fieldErrors['estimatedDuration'] = msg;
        } else if (msg.includes('标签')) {
          fieldErrors['tags'] = msg;
        } else if (msg.includes('should not exist')) {
          // 处理无效字段错误
          const field = msg.match(/property (\w+) should not exist/)?.[1];
          if (field) {
            fieldErrors[field] = `字段 '${field}' 不被允许`;
          } else {
            generalErrors.push(msg);
          }
        } else {
          generalErrors.push(msg);
        }
      } else {
        generalErrors.push(msg);
      }
    });
    
    const errorResponse = {
      success: false,
      statusCode: status,
      error: 'Validation Failed',
      message: '请求数据验证失败',
      details: {
        fieldErrors,
        generalErrors,
        allErrors: errorMessages
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    
    console.log('📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
    
    response.status(status).json(errorResponse);
  }
}