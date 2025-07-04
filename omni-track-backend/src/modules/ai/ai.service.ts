import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AITaskAnalysisDto } from '../task/dto/smart-task.dto';

export interface SemanticAnalysis {
  entities: Entity[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  priority: 'low' | 'medium' | 'high';
  suggestedTags: string[];
  actionableItems: string[];
}

export interface Entity {
  text: string;
  type: 'person' | 'place' | 'date' | 'task' | 'emotion' | 'project';
  confidence: number;
}

export interface EnhancedContent {
  originalText: string;
  enhancedText: string;
  suggestedTitle?: string;
  keyPoints: string[];
  summary: string;
}

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY || '',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }

  async analyzeTaskDescription(description: string): Promise<AITaskAnalysisDto> {
    try {
      const prompt = `分析以下任务描述，并返回JSON格式的分析结果：
描述："${description}"

请提供：
1. suggestedTitle: 建议的任务标题
2. suggestedPriority: 建议的优先级（low/medium/high）
3. suggestedTags: 建议的标签数组
4. estimatedTime: 预估时间（分钟）
5. suggestedProject: 建议的项目信息
6. breakdown: 任务分解建议
7. dependencies: 可能的依赖项

返回格式：
{
  "suggestedTitle": "任务标题",
  "suggestedPriority": "medium",
  "suggestedTags": ["标签1", "标签2"],
  "estimatedTime": 60,
  "suggestedProject": {
    "name": "项目名称",
    "isNew": true
  },
  "breakdown": ["步骤1", "步骤2"],
  "dependencies": ["依赖1", "依赖2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      const result = JSON.parse(content);
      return {
        suggestedTitle: result.suggestedTitle || '新任务',
        suggestedPriority: result.suggestedPriority || 'medium',
        suggestedTags: result.suggestedTags || [],
        estimatedTime: result.estimatedTime || 30,
        suggestedProject: result.suggestedProject,
        breakdown: result.breakdown || [],
        dependencies: result.dependencies || [],
      };
    } catch (error) {
      console.error('AI分析失败:', error);
      // 返回默认值
      return {
        suggestedTitle: '新任务',
        suggestedPriority: 'medium',
        suggestedTags: [],
        estimatedTime: 30,
        breakdown: [],
        dependencies: [],
      };
    }
  }

  async analyzeLogContent(content: string): Promise<{
    suggestedType: string;
    suggestedTags: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPoints: string[];
    summary: string;
  }> {
    try {
      const prompt = `分析以下日志内容，并返回JSON格式的分析结果：
内容："${content}"

请提供：
1. suggestedType: 建议的日志类型
2. suggestedTags: 建议的标签数组
3. sentiment: 情感分析（positive/negative/neutral）
4. keyPoints: 关键要点
5. summary: 简要总结

返回格式：
{
  "suggestedType": "工作",
  "suggestedTags": ["标签1", "标签2"],
  "sentiment": "positive",
  "keyPoints": ["要点1", "要点2"],
  "summary": "总结"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('AI响应为空');
      }

      const result = JSON.parse(responseContent);
      return {
        suggestedType: result.suggestedType || '日常',
        suggestedTags: result.suggestedTags || [],
        sentiment: result.sentiment || 'neutral',
        keyPoints: result.keyPoints || [],
        summary: result.summary || content,
      };
    } catch (error) {
      console.error('AI分析失败:', error);
      // 返回默认值
      return {
        suggestedType: '日常',
        suggestedTags: [],
        sentiment: 'neutral',
        keyPoints: [],
        summary: content,
      };
    }
  }

  async generateProjectInsights(tasks: any[]): Promise<{
    suggestions: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `分析以下项目任务数据，并返回JSON格式的洞察结果：
任务数据：${JSON.stringify(tasks, null, 2)}

请提供：
1. suggestions: 改进建议
2. warnings: 风险警告
3. recommendations: 推荐行动

返回格式：
{
  "suggestions": ["建议1", "建议2"],
  "warnings": ["警告1", "警告2"],
  "recommendations": ["推荐1", "推荐2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      const result = JSON.parse(content);
      return {
        suggestions: result.suggestions || [],
        warnings: result.warnings || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error('AI分析失败:', error);
      // 返回默认值
      return {
        suggestions: [],
        warnings: [],
        recommendations: [],
      };
    }
  }

  /**
   * 分析文本的语义信息
   */
  async analyzeText(text: string): Promise<SemanticAnalysis> {
    try {
      const prompt = `请分析以下文本的语义信息，并返回JSON格式的结果：
文本："${text}"

请提供：
1. entities: 识别的实体（人物、地点、日期、任务、情感、项目）
2. sentiment: 情感分析（positive/negative/neutral）
3. topics: 主题标签
4. priority: 优先级（low/medium/high）
5. suggestedTags: 建议的标签
6. actionableItems: 可执行的项目

返回格式：
{
  "entities": [{"text": "实体文本", "type": "实体类型", "confidence": 0.95}],
  "sentiment": "positive",
  "topics": ["主题1", "主题2"],
  "priority": "medium",
  "suggestedTags": ["标签1", "标签2"],
  "actionableItems": ["行动项1", "行动项2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('分析文本失败:', error);
      // 返回默认值作为备用
      return {
        entities: [],
        sentiment: 'neutral',
        topics: [],
        priority: 'medium',
        suggestedTags: [],
        actionableItems: []
      };
    }
  }

  /**
   * 增强文本内容
   */
  async enhanceContent(text: string, context?: string): Promise<EnhancedContent> {
    try {
      const prompt = `请分析并增强以下文本内容，并返回JSON格式的结果：
文本："${text}"
${context ? `上下文：${context}` : ''}

请提供：
1. originalText: 原始文本
2. enhancedText: 增强后的文本（更清晰、更具体）
3. suggestedTitle: 建议的标题
4. keyPoints: 关键要点
5. summary: 简要总结

返回格式：
{
  "originalText": "${text}",
  "enhancedText": "增强后的文本",
  "suggestedTitle": "建议标题",
  "keyPoints": ["要点1", "要点2"],
  "summary": "简要总结"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('增强内容失败:', error);
      // 返回默认值作为备用
      return {
        originalText: text,
        enhancedText: text,
        suggestedTitle: '新内容',
        keyPoints: [],
        summary: text
      };
    }
  }

  /**
   * 智能问答
   */
  async askQuestion(question: string, context?: string): Promise<string> {
    try {
      const prompt = `你是一个专业的任务管理和生活助手。请回答以下问题：
问题："${question}"
${context ? `上下文：${context}` : ''}

请提供有用、实用的建议。回答要简洁明了。`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      return content;
    } catch (error) {
      console.error('智能问答失败:', error);
      // 返回默认回答作为备用
      return '抱歉，我现在无法回答这个问题。请稍后再试。';
    }
  }
}