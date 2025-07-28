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
    let retryCount = 0;
    const maxRetries = 2; // 减少重试次数以提升速度
    
    while (retryCount < maxRetries) {
      try {
        // 优化后的快速时间分析提示词
        const prompt = `快速分析任务时间因素：
"${description}"

只返回JSON，包含：
- estimatedTime: 预估时间（分钟，整数）
- suggestedTitle: 任务标题
- suggestedPriority: 优先级（low/medium/high）
- suggestedTags: 标签数组（最多3个中文标签）

格式：{"estimatedTime":30,"suggestedTitle":"任务","suggestedPriority":"medium","suggestedTags":["标签"]}`;

        const response = await this.openai.chat.completions.create({
          model: 'deepseek-r1',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, // 降低温度以获得更一致的结果
          max_tokens: 150, // 限制输出长度以提升速度
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI响应为空');
        }

        // 简化JSON提取逻辑
        let jsonContent = content.trim();
        const startIndex = jsonContent.indexOf('{');
        const endIndex = jsonContent.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          jsonContent = jsonContent.substring(startIndex, endIndex + 1);
        }
        
        const result = JSON.parse(jsonContent);
        return {
          suggestedTitle: result.suggestedTitle || description.slice(0, 20),
          suggestedPriority: result.suggestedPriority || 'medium',
          suggestedTags: result.suggestedTags || [],
          estimatedTime: result.estimatedTime || this.estimateTimeByKeywords(description),
          breakdown: [],
          dependencies: [],
        };
      } catch (error) {
        retryCount++;
        console.error(`AI时间分析失败 (尝试 ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount >= maxRetries) {
          // 使用关键词快速估算时间作为备选方案
          return {
            suggestedTitle: description.slice(0, 20),
            suggestedPriority: 'medium',
            suggestedTags: this.extractTagsByKeywords(description),
            estimatedTime: this.estimateTimeByKeywords(description),
            breakdown: [],
            dependencies: [],
          };
        }
        
        // 快速重试，减少等待时间
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 默认值
    return {
      suggestedTitle: description.slice(0, 20),
      suggestedPriority: 'medium',
      suggestedTags: [],
      estimatedTime: 30,
      breakdown: [],
      dependencies: [],
    };
  }

  // 添加基于关键词的时间估算方法（快速备选方案）
  private estimateTimeByKeywords(description: string): number {
    const desc = description.toLowerCase();
    
    // 查找明确的时间表述
    const timePatterns = [
      { pattern: /(\d+)\s*小时/, multiplier: 60 },
      { pattern: /(\d+)\s*分钟/, multiplier: 1 },
      { pattern: /半小时/, value: 30 },
      { pattern: /一小时/, value: 60 },
      { pattern: /两小时/, value: 120 },
    ];
    
    for (const { pattern, multiplier, value } of timePatterns) {
      const match = desc.match(pattern);
      if (match) {
        return value || parseInt(match[1]) * multiplier;
      }
    }
    
    // 基于任务类型的时间估算
    const taskTypes = [
      { keywords: ['会议', '开会', '讨论'], time: 60 },
      { keywords: ['学习', '阅读', '研究'], time: 45 },
      { keywords: ['写', '编写', '报告', '文档'], time: 90 },
      { keywords: ['运动', '锻炼', '健身'], time: 60 },
      { keywords: ['购物', '买', '采购'], time: 30 },
      { keywords: ['吃', '用餐', '午餐', '晚餐'], time: 30 },
      { keywords: ['整理', '清理', '收拾'], time: 45 },
      { keywords: ['电话', '通话', '联系'], time: 20 },
    ];
    
    for (const { keywords, time } of taskTypes) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return time;
      }
    }
    
    // 根据描述长度估算复杂度
    if (description.length > 50) return 60;
    if (description.length > 20) return 45;
    return 30;
  }

  // 添加基于关键词的标签提取方法
  private extractTagsByKeywords(description: string): string[] {
    const desc = description.toLowerCase();
    const tags: string[] = [];
    
    const tagMappings = [
      { keywords: ['工作', '项目', '任务', '会议', '报告'], tag: '工作' },
      { keywords: ['学习', '阅读', '研究', '课程'], tag: '学习' },
      { keywords: ['运动', '锻炼', '健身', '跑步'], tag: '健康' },
      { keywords: ['购物', '买', '采购'], tag: '生活' },
      { keywords: ['编程', '代码', '开发'], tag: '编程' },
      { keywords: ['整理', '清理', '收拾'], tag: '整理' },
    ];
    
    for (const { keywords, tag } of tagMappings) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        tags.push(tag);
        if (tags.length >= 3) break; // 最多3个标签
      }
    }
    
    return tags;
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

要求：
1. 所有标签必须使用中文，与输入语言保持一致
2. 标签要简洁明了，每个标签2-4个中文字符
3. 类型使用中文描述

请提供：
1. suggestedType: 建议的日志类型（中文）
2. suggestedTags: 建议的标签数组（中文字符串数组，最多5个）
3. sentiment: 情感分析（positive/negative/neutral）
4. keyPoints: 关键要点（中文）
5. summary: 简要总结（中文）

标签示例: ["工作", "学习", "生活", "健康", "运动", "心情", "思考", "计划"]
类型示例: "工作", "学习", "生活", "健康", "娱乐", "思考"

返回格式：
{
  "suggestedType": "工作",
  "suggestedTags": ["工作", "会议"],
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