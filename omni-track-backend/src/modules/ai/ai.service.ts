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
    console.log(`🤖 AI分析任务描述: "${description}"`);
    let retryCount = 0;
    const maxRetries = 2; // 减少重试次数以提升速度
    
    while (retryCount < maxRetries) {
      try {
        // 获取当前日期时间作为上下文（使用本地时区）
        const now = new Date();
        const currentDate = now.getFullYear() + '-' + 
          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
          String(now.getDate()).padStart(2, '0'); // 本地日期 YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:mm
        const currentWeekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
        console.log(`📅 当前时间上下文: ${currentDate} (星期${currentWeekday}) ${currentTime}`);
        
        // 优化后的时间识别分析提示词
        const prompt = `请分析任务描述中的时间信息并返回JSON：
任务："${description}"

当前时间上下文：
- 今天：${currentDate} (星期${currentWeekday})
- 现在时间：${currentTime}

请识别并转换以下时间表达：
- 相对时间：明天、后天、下周、下个月等
- 绝对时间：具体日期和时间
- 周期性：每天、每周等

返回JSON格式：
- estimatedTime: 预估时间（分钟，整数）
- suggestedTitle: 任务标题
- suggestedPriority: 优先级（low/medium/high）
- suggestedTags: 标签数组（最多3个中文标签）
- suggestedDueDate: 截止日期（YYYY-MM-DD格式，如果识别到时间）
- suggestedEndTime: 具体时间（HH:mm格式，如果识别到时间）
- timeExpression: 原始时间表达（如识别到相对时间）

示例：
输入："明天上午9点复查出血"
输出：{"estimatedTime":30,"suggestedTitle":"复查出血","suggestedPriority":"medium","suggestedTags":["医疗","复查"],"suggestedDueDate":"2025-07-29","suggestedEndTime":"09:00","timeExpression":"明天上午9点"}

格式：{"estimatedTime":30,"suggestedTitle":"任务","suggestedPriority":"medium","suggestedTags":["标签"],"suggestedDueDate":"YYYY-MM-DD","suggestedEndTime":"HH:mm","timeExpression":"时间表达"}`;

        console.log('🔗 调用DeepSeek API...');
        const apiStartTime = Date.now();
        
        // 添加超时控制
        const timeout = 10000; // 10秒超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await this.openai.chat.completions.create({
            model: 'deepseek-r1',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3, // 降低温度以获得更一致的结果
            max_tokens: 150, // 限制输出长度以提升速度
          }, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(`✅ DeepSeek API响应，耗时: ${Date.now() - apiStartTime}ms`);
          
          const content = response.choices[0]?.message?.content;
          console.log('📝 AI原始响应:', content);
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
          
          console.log('🔧 提取的JSON:', jsonContent);
          const result = JSON.parse(jsonContent);
          console.log('📊 解析结果:', result);
          
          return {
            suggestedTitle: result.suggestedTitle || description.slice(0, 20),
            suggestedPriority: result.suggestedPriority || 'medium',
            suggestedTags: result.suggestedTags || [],
            estimatedTime: result.estimatedTime || this.estimateTimeByKeywords(description),
            suggestedDueDate: result.suggestedDueDate || undefined,
            suggestedEndTime: result.suggestedEndTime || undefined,
            timeExpression: result.timeExpression || undefined,
            breakdown: [],
            dependencies: [],
          };
        } catch (apiError) {
          clearTimeout(timeoutId);
          if (apiError.name === 'AbortError') {
            console.log('⏰ DeepSeek API超时');
          } else {
            console.error('🔥 DeepSeek API调用失败:', apiError);
          }
          throw apiError;
        }
      } catch (error) {
        retryCount++;
        console.error(`AI时间分析失败 (尝试 ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount >= maxRetries) {
          console.log('⚠️ AI分析失败，使用关键词备选方案');
          // 使用关键词快速估算时间作为备选方案
          const fallbackResult = {
            suggestedTitle: description.slice(0, 20),
            suggestedPriority: 'medium' as const,
            suggestedTags: this.extractTagsByKeywords(description),
            estimatedTime: this.estimateTimeByKeywords(description),
            suggestedDueDate: this.extractDateByKeywords(description),
            suggestedEndTime: this.extractTimeByKeywords(description),
            timeExpression: this.extractTimeExpression(description),
            breakdown: [],
            dependencies: [],
          };
          console.log('🔄 备选方案结果:', fallbackResult);
          return fallbackResult;
        }
        
        // 快速重试，减少等待时间
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 默认值
    return {
      suggestedTitle: description.slice(0, 20),
      suggestedPriority: 'medium' as const,
      suggestedTags: [],
      estimatedTime: 30,
      suggestedDueDate: undefined,
      suggestedEndTime: undefined,
      timeExpression: undefined,
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

  // 添加基于关键词的日期提取方法
  private extractDateByKeywords(description: string): string | undefined {
    const desc = description.toLowerCase();
    const now = new Date();
    
    // 相对时间表达的识别（使用本地时区）
    const formatLocalDate = (date: Date): string => {
      return date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
    };
    
    if (desc.includes('今天') || desc.includes('今日')) {
      return formatLocalDate(now);
    }
    
    if (desc.includes('明天')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return formatLocalDate(tomorrow);
    }
    
    if (desc.includes('后天')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return formatLocalDate(dayAfterTomorrow);
    }
    
    if (desc.includes('昨天')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return formatLocalDate(yesterday);
    }
    
    if (desc.includes('下周')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return formatLocalDate(nextWeek);
    }
    
    if (desc.includes('下个月') || desc.includes('下月')) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return formatLocalDate(nextMonth);
    }
    
    // 绝对日期识别（简单的模式匹配）
    const datePatterns = [
      /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/,
      /(\d{1,2})[月\-\/](\d{1,2})[日]/,
    ];
    
    for (const pattern of datePatterns) {
      const match = desc.match(pattern);
      if (match) {
        if (match.length === 4) {
          // 完整年月日
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);
          const date = new Date(year, month - 1, day);
          return date.toISOString().split('T')[0];
        } else if (match.length === 3) {
          // 只有月日，使用当前年份
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          const date = new Date(now.getFullYear(), month - 1, day);
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    return undefined;
  }
  
  // 添加基于关键词的时间提取方法
  private extractTimeByKeywords(description: string): string | undefined {
    const desc = description.toLowerCase();
    
    // 时间表达的识别
    const timePatterns = [
      /(\d{1,2})[：:](\d{2})/,  // 12:30, 12：30
      /(\d{1,2})点(\d{1,2})?分?/,  // 12点30分, 12点
      /(上午|下午)(\d{1,2})点?(\d{1,2})?分?/,  // 上午9点, 下午2点30分
      /(早上|中午|晚上)(\d{1,2})点?(\d{1,2})?分?/,  // 早上8点, 晚上7点30分
    ];
    
    for (const pattern of timePatterns) {
      const match = desc.match(pattern);
      if (match) {
        if (pattern.source.includes('：|:')) {
          // HH:mm 格式
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else if (pattern.source.includes('上午|下午')) {
          // 上午/下午格式
          const period = match[1];
          let hour = parseInt(match[2]);
          const minute = match[3] ? parseInt(match[3]) : 0;
          
          if (period === '下午' && hour < 12) {
            hour += 12;
          } else if (period === '上午' && hour === 12) {
            hour = 0;
          }
          
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else if (pattern.source.includes('早上|中午|晚上')) {
          // 早上/中午/晚上格式
          const period = match[1];
          let hour = parseInt(match[2]);
          const minute = match[3] ? parseInt(match[3]) : 0;
          
          if (period === '晚上' && hour < 12) {
            hour += 12;
          } else if (period === '中午' && hour === 12) {
            hour = 12;
          }
          
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else {
          // 简单的 X点Y分 格式
          const hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return undefined;
  }
  
  // 提取原始时间表达
  private extractTimeExpression(description: string): string | undefined {
    const timeExpressions = [
      '明天', '后天', '昨天', '今天',
      '下周', '下个月', '下月',
      '上午', '下午', '早上', '中午', '晚上',
      '明早', '明晚', '今晚'
    ];
    
    for (const expr of timeExpressions) {
      if (description.includes(expr)) {
        // 尝试提取包含时间表达的短语
        const words = description.split(/\s+/);
        for (const word of words) {
          if (word.includes(expr)) {
            return word;
          }
        }
        return expr;
      }
    }
    
    return undefined;
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