import { Controller, Post, Body, UseGuards, Request, Res, Sse, MessageEvent } from '@nestjs/common';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { Response } from 'express';
import { Observable } from 'rxjs';

class AnalyzeTextDto {
  @IsString()
  text: string;
}

class EnhanceContentDto {
  @IsString()
  text: string;
  
  @IsOptional()
  @IsString()
  context?: string;
}

class AskQuestionDto {
  @IsString()
  question: string;
  
  @IsOptional()
  @IsString()
  context?: string;
}

class BreakdownTaskDto {
  @IsString()
  taskDescription: string;
  
  @IsOptional()
  @IsIn(['deepseek-v3', 'deepseek-r1'])
  modelType?: 'deepseek-v3' | 'deepseek-r1';
}

class SimpleChatDto {
  @IsString()
  message: string;
  
  @IsOptional()
  @IsIn(['deepseek-v3', 'deepseek-r1'])
  modelType?: 'deepseek-v3' | 'deepseek-r1';
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('analyze')
  async analyzeText(@Body() analyzeTextDto: AnalyzeTextDto) {
    const { text } = analyzeTextDto;
    const analysis = await this.aiService.analyzeText(text);
    
    return {
      success: true,
      data: analysis,
    };
  }

  @Post('enhance')
  async enhanceContent(@Body() enhanceContentDto: EnhanceContentDto) {
    const { text, context } = enhanceContentDto;
    const enhanced = await this.aiService.enhanceContent(text, context);
    
    return {
      success: true,
      data: enhanced,
    };
  }

  @Post('ask')
  async askQuestion(@Body() askQuestionDto: AskQuestionDto) {
    const { question, context } = askQuestionDto;
    const answer = await this.aiService.askQuestion(question, context);
    
    return {
      success: true,
      data: {
        question,
        answer,
      },
    };
  }

  @Post('subscription-status')
  async getSubscriptionStatus(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    
    try {
      const subscription = await this.aiService.getUserSubscriptionStatus(userId);
      
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取订阅状态失败',
        data: null,
      };
    }
  }

  @Post('breakdown-task')
  async breakdownTask(@Body() breakdownTaskDto: BreakdownTaskDto, @Request() req: any) {
    const { taskDescription, modelType = 'deepseek-v3' } = breakdownTaskDto;
    const userId = req.user.sub || req.user.id;
    
    console.log('🚀 AI breakdown request - userId:', userId, 'user:', req.user);
    
    if (!userId) {
      return {
        success: false,
        message: '用户身份验证失败',
        data: null,
      };
    }
    
    try {
      const breakdown = await this.aiService.analyzeAndBreakdownTask(taskDescription, userId, modelType);
      
      return {
        success: true,
        data: breakdown,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '任务分析失败',
        data: null,
      };
    }
  }

  @Post('simple-chat')
  async simpleChat(@Body() simpleChatDto: SimpleChatDto, @Request() req: any) {
    const { message, modelType = 'deepseek-v3' } = simpleChatDto;
    const userId = req.user.sub || req.user.id;
    
    console.log('🚀 AI simple chat request - userId:', userId, 'user:', req.user);
    
    if (!userId) {
      return {
        success: false,
        message: '用户身份验证失败',
        data: null,
      };
    }
    
    try {
      const response = await this.aiService.simpleChat(message, userId, modelType);
      
      return {
        success: true,
        data: {
          content: response,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '聊天失败',
        data: null,
      };
    }
  }

  @Post('stream-breakdown-task')
  async streamBreakdownTask(@Body() breakdownTaskDto: BreakdownTaskDto, @Request() req: any, @Res() res: Response) {
    const { taskDescription, modelType = 'deepseek-v3' } = breakdownTaskDto;
    const userId = req.user.sub || req.user.id;
    
    console.log('🚀 AI stream breakdown request - userId:', userId, 'user:', req.user);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户身份验证失败',
        data: null,
      });
      return;
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    
    try {
      const stream = this.aiService.streamTaskBreakdown(taskDescription, userId, modelType);
      
      for await (const chunk of stream) {
        const data = JSON.stringify(chunk);
        res.write(`data: ${data}\n\n`);
        
        if (chunk.type === 'complete' || chunk.type === 'error') {
          break;
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const errorData = JSON.stringify({
        type: 'error',
        error: error.message || '任务分析失败'
      });
      res.write(`data: ${errorData}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  @Post('stream-simple-chat')
  async streamSimpleChat(@Body() simpleChatDto: SimpleChatDto, @Request() req: any, @Res() res: Response) {
    const { message, modelType = 'deepseek-v3' } = simpleChatDto;
    const userId = req.user.sub || req.user.id;
    
    console.log('🚀 AI stream simple chat request - userId:', userId, 'user:', req.user);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户身份验证失败',
        data: null,
      });
      return;
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    
    try {
      const stream = this.aiService.streamSimpleChat(message, userId, modelType);
      
      for await (const chunk of stream) {
        const data = JSON.stringify(chunk);
        res.write(`data: ${data}\n\n`);
        
        if (chunk.type === 'complete' || chunk.type === 'error') {
          break;
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const errorData = JSON.stringify({
        type: 'error',
        error: error.message || '聊天失败'
      });
      res.write(`data: ${errorData}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
