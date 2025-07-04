import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';

class AnalyzeTextDto {
  text: string;
}

class EnhanceContentDto {
  text: string;
  context?: string;
}

class AskQuestionDto {
  question: string;
  context?: string;
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
}
