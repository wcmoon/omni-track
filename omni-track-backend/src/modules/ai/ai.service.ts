import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { AITaskAnalysisDto } from '../task/dto/smart-task.dto';
import { UserSubscription, SubscriptionTier, SubscriptionStatus } from '../../database/entities/user-subscription.entity';

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

  constructor(
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY || '',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }

  // 获取或创建用户订阅信息
  private async getUserSubscription(userId: string): Promise<UserSubscription> {
    console.log('🔍 getUserSubscription called with userId:', userId);
    
    let subscription = await this.userSubscriptionRepository.findOne({
      where: { userId }
    });

    if (!subscription) {
      console.log('📝 Creating new subscription for userId:', userId);
      // 为新用户创建免费订阅
      subscription = this.userSubscriptionRepository.create({
        userId: userId, // 明确设置userId
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        v3TokensLimit: 50000, // 免费用户V3每月5万Token
        r1TokensLimit: 10000, // 免费用户R1每月1万Token
        lastResetAt: new Date(),
      });
      console.log('💾 Saving subscription:', subscription);
      subscription = await this.userSubscriptionRepository.save(subscription);
      console.log('✅ Subscription saved:', subscription.id);
    }

    // 检查是否需要重置月度使用量
    const now = new Date();
    const lastReset = subscription.lastResetAt || subscription.createdAt;
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReset >= 30) {
      subscription.v3TokensUsed = 0;
      subscription.r1TokensUsed = 0;
      subscription.totalCost = 0;
      subscription.lastResetAt = now;
      subscription = await this.userSubscriptionRepository.save(subscription);
    }

    return subscription;
  }

  // 检查用户是否有足够的Token额度
  private async checkTokenQuota(userId: string, modelType: 'deepseek-v3' | 'deepseek-r1', estimatedTokens: number): Promise<{
    allowed: boolean;
    subscription: UserSubscription;
    message?: string;
  }> {
    const subscription = await this.getUserSubscription(userId);
    
    if (subscription.tier === SubscriptionTier.FREE) {
      const currentUsed = modelType === 'deepseek-v3' ? subscription.v3TokensUsed : subscription.r1TokensUsed;
      const limit = modelType === 'deepseek-v3' ? subscription.v3TokensLimit : subscription.r1TokensLimit;
      
      if (currentUsed + estimatedTokens > limit) {
        const modelName = modelType === 'deepseek-v3' ? 'DeepSeek V3' : 'DeepSeek R1';
        return {
          allowed: false,
          subscription,
          message: `${modelName}模型月度额度不足。已使用${currentUsed}/${limit}个Token，本次请求需要约${estimatedTokens}个Token。请升级到付费版本以获得更多额度。`
        };
      }
    }
    
    return { allowed: true, subscription };
  }

  // 记录Token使用量和成本
  private async recordTokenUsage(subscription: UserSubscription, modelType: 'deepseek-v3' | 'deepseek-r1', inputTokens: number, outputTokens: number): Promise<void> {
    const totalTokens = inputTokens + outputTokens;
    
    // 计算成本（人民币）
    let cost = 0;
    if (modelType === 'deepseek-v3') {
      cost = (inputTokens * 0.002 + outputTokens * 0.008) / 1000; // V3价格
      subscription.v3TokensUsed += totalTokens;
    } else {
      cost = (inputTokens * 0.004 + outputTokens * 0.016) / 1000; // R1价格  
      subscription.r1TokensUsed += totalTokens;
    }
    
    subscription.totalCost = Number(subscription.totalCost) + cost;
    await this.userSubscriptionRepository.save(subscription);
    
    console.log(`💰 Token使用记录: 用户${subscription.userId}, 模型${modelType}, 输入${inputTokens}, 输出${outputTokens}, 成本¥${cost.toFixed(4)}`);
  }

  // 估算Token数量（简单估算）
  private estimateTokens(text: string): number {
    // 中文大约1个字符 = 1.5个Token，英文大约4个字符 = 1个Token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars / 4);
  }

  // 获取用户订阅状态（对外API）
  async getUserSubscriptionStatus(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    
    return {
      tier: subscription.tier,
      status: subscription.status,
      v3TokensUsed: subscription.v3TokensUsed,
      v3TokensLimit: subscription.v3TokensLimit,
      r1TokensUsed: subscription.r1TokensUsed,
      r1TokensLimit: subscription.r1TokensLimit,
      totalCost: Number(subscription.totalCost),
      validUntil: subscription.validUntil,
      lastResetAt: subscription.lastResetAt,
      // 计算剩余额度
      v3TokensRemaining: subscription.v3TokensLimit - subscription.v3TokensUsed,
      r1TokensRemaining: subscription.r1TokensLimit - subscription.r1TokensUsed,
      // 使用率
      v3UsagePercentage: Math.round((subscription.v3TokensUsed / subscription.v3TokensLimit) * 100),
      r1UsagePercentage: Math.round((subscription.r1TokensUsed / subscription.r1TokensLimit) * 100),
    };
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
      // 使用关键词备选方案
      const fallbackResult = this.analyzeLabelsByKeywords(content);
      return {
        suggestedType: fallbackResult.suggestedType,
        suggestedTags: fallbackResult.suggestedTags,
        sentiment: fallbackResult.sentiment,
        keyPoints: fallbackResult.keyPoints,
        summary: content,
      };
    }
  }

  // 添加基于关键词的日志标签分析方法（备选方案）
  public analyzeLabelsByKeywords(content: string): {
    suggestedType: string;
    suggestedTags: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPoints: string[];
  } {
    const text = content.toLowerCase();
    const tags: string[] = [];
    let suggestedType = '日常';
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const keyPoints: string[] = [];

    // 工作相关关键词
    const workKeywords = ['工作', '项目', '会议', '开发', '编程', '代码', '任务', '报告', '文档', '客户', '同事', '老板', '公司', '办公', '加班'];
    if (workKeywords.some(keyword => text.includes(keyword))) {
      suggestedType = '工作';
      tags.push('工作');
      if (text.includes('会议')) tags.push('会议');
      if (text.includes('开发') || text.includes('编程') || text.includes('代码')) tags.push('编程');
      if (text.includes('项目')) tags.push('项目');
      if (text.includes('加班')) tags.push('加班');
    }

    // 学习相关关键词
    const learningKeywords = ['学习', '阅读', '读书', '课程', '教程', '研究', '笔记', '知识', '技能', '培训', '考试', '复习'];
    if (learningKeywords.some(keyword => text.includes(keyword))) {
      if (suggestedType === '日常') suggestedType = '学习';
      tags.push('学习');
      if (text.includes('阅读') || text.includes('读书')) tags.push('阅读');
      if (text.includes('课程') || text.includes('培训')) tags.push('课程');
      if (text.includes('考试') || text.includes('复习')) tags.push('考试');
    }

    // 健康相关关键词
    const healthKeywords = ['运动', '健身', '跑步', '游泳', '瑜伽', '锻炼', '医院', '看病', '体检', '健康', '饮食', '营养', '睡眠'];
    if (healthKeywords.some(keyword => text.includes(keyword))) {
      if (suggestedType === '日常') suggestedType = '健康';
      tags.push('健康');
      if (text.includes('运动') || text.includes('健身') || text.includes('跑步')) tags.push('运动');
      if (text.includes('饮食') || text.includes('营养')) tags.push('饮食');
      if (text.includes('睡眠')) tags.push('睡眠');
    }

    // 娱乐相关关键词
    const entertainmentKeywords = ['电影', '音乐', '游戏', '娱乐', '休闲', '旅游', '出行', '聚会', '朋友', '家人', '逛街', '购物'];
    if (entertainmentKeywords.some(keyword => text.includes(keyword))) {
      if (suggestedType === '日常') suggestedType = '娱乐';
      tags.push('娱乐');
      if (text.includes('电影')) tags.push('电影');
      if (text.includes('音乐')) tags.push('音乐');
      if (text.includes('游戏')) tags.push('游戏');
      if (text.includes('旅游') || text.includes('出行')) tags.push('出行');
      if (text.includes('朋友') || text.includes('聚会')) tags.push('社交');
    }

    // 生活相关关键词
    const lifeKeywords = ['家务', '做饭', '购物', '清洁', '整理', '洗衣', '维修', '搬家', '装修'];
    if (lifeKeywords.some(keyword => text.includes(keyword))) {
      if (suggestedType === '日常') suggestedType = '生活';
      tags.push('生活');
      if (text.includes('做饭')) tags.push('做饭');
      if (text.includes('购物')) tags.push('购物');
      if (text.includes('清洁') || text.includes('整理')) tags.push('整理');
    }

    // 情感分析
    const positiveKeywords = ['开心', '高兴', '快乐', '满意', '成功', '完成', '顺利', '好', '棒', '赞', '爱', '幸福', '兴奋'];
    const negativeKeywords = ['难过', '失望', '沮丧', '焦虑', '压力', '累', '疲惫', '烦躁', '生气', '痛苦', '困难', '失败', '问题'];
    
    if (positiveKeywords.some(keyword => text.includes(keyword))) {
      sentiment = 'positive';
      tags.push('心情好');
    } else if (negativeKeywords.some(keyword => text.includes(keyword))) {
      sentiment = 'negative';
      tags.push('压力');
      if (text.includes('累') || text.includes('疲惫')) tags.push('疲惫');
    }

    // 时间相关标签
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour < 12) {
      tags.push('上午');
    } else if (hour >= 12 && hour < 18) {
      tags.push('下午');
    } else if (hour >= 18 && hour < 22) {
      tags.push('晚上');
    } else {
      tags.push('深夜');
    }

    // 提取关键要点（简化版）
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));

    // 去重并限制标签数量
    const uniqueTags = [...new Set(tags)].slice(0, 5);

    return {
      suggestedType,
      suggestedTags: uniqueTags,
      sentiment,
      keyPoints,
    };
  }

  // 任务分析和拆分功能
  async analyzeAndBreakdownTask(taskDescription: string, userId: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): Promise<{
    analysis: string;
    subtasks: Array<{
      title: string;
      description: string;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high';
      dependencies?: number[]; // 依赖的子任务索引
    }>;
    suggestions: string[];
  }> {
    try {
      // 估算Token使用量
      const estimatedTokens = this.estimateTokens(taskDescription) + 1500; // 加上prompt和响应的估算
      
      // 检查用户额度
      const quotaCheck = await this.checkTokenQuota(userId, modelType, estimatedTokens);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.message);
      }

      const prompt = `请分析以下任务并将其拆分成可执行的小任务：

任务描述："${taskDescription}"

请返回JSON格式的分析结果：
{
  "analysis": "对任务的整体分析，包括复杂度、所需技能、潜在挑战等",
  "subtasks": [
    {
      "title": "子任务标题",
      "description": "详细描述该子任务需要做什么",
      "estimatedTime": 预估时间(分钟),
      "priority": "优先级(low/medium/high)",
      "dependencies": [依赖的其他子任务的索引数组，可选]
    }
  ],
  "suggestions": ["实施建议1", "实施建议2", "注意事项等"]
}

要求：
1. 子任务应该具体明确，可独立执行
2. 合理估算每个子任务的时间
3. 按逻辑顺序排列子任务
4. 提供实用的执行建议
5. 所有文本使用中文`;

      // 选择模型
      const modelName = modelType === 'deepseek-r1' ? 'deepseek-r1-0528' : 'deepseek-v3';
      
      // 添加超时控制
      const timeout = 30000; // 30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`🚀 开始AI任务分析，使用模型: ${modelName}`);
      const apiStartTime = Date.now();
      
      try {
        const response = await this.openai.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ AI任务分析完成，耗时: ${Date.now() - apiStartTime}ms`);
        
        const content = response.choices[0]?.message?.content || '';
        console.log('🤖 AI原始响应内容:', content);
        console.log('📏 响应内容长度:', content.length);
        
        // 记录实际Token使用量
        const usage = response.usage;
        if (usage) {
          console.log('📊 Token使用情况:', usage);
          await this.recordTokenUsage(
            quotaCheck.subscription,
            modelType,
            usage.prompt_tokens || 0,
            usage.completion_tokens || 0
          );
        }
        
        try {
          console.log('🔍 尝试解析JSON...');
          const result = JSON.parse(content);
          console.log('✅ JSON解析成功:', result);
          return {
            analysis: result.analysis || '任务分析完成',
            subtasks: (result.subtasks || []).map((task: any, index: number) => ({
              title: task.title || `子任务 ${index + 1}`,
              description: task.description || task.title || '待补充描述',
              estimatedTime: Math.max(15, task.estimatedTime || 30), // 最少15分钟
              priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
              dependencies: Array.isArray(task.dependencies) ? task.dependencies : []
            })),
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
          };
        } catch (parseError) {
          console.error('❌ 解析AI响应失败:', parseError);
          console.error('🔍 无法解析的内容:', content);
          console.error('📝 尝试提取JSON...');
          
          // 尝试从内容中提取JSON
          let jsonContent = content.trim();
          const jsonStart = jsonContent.indexOf('{');
          const jsonEnd = jsonContent.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const extractedJson = jsonContent.substring(jsonStart, jsonEnd + 1);
            console.log('🔧 提取的JSON内容:', extractedJson);
            
            try {
              const result = JSON.parse(extractedJson);
              console.log('✅ 提取JSON解析成功:', result);
              return {
                analysis: result.analysis || '任务分析完成',
                subtasks: (result.subtasks || []).map((task: any, index: number) => ({
                  title: task.title || `子任务 ${index + 1}`,
                  description: task.description || task.title || '待补充描述',
                  estimatedTime: Math.max(15, task.estimatedTime || 30),
                  priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
                  dependencies: Array.isArray(task.dependencies) ? task.dependencies : []
                })),
                suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
              };
            } catch (extractError) {
              console.error('❌ 提取JSON也解析失败:', extractError);
            }
          }
          
          console.log('🔄 使用fallback方案');
          // 返回简化的拆分结果
          return this.generateSimpleTaskBreakdown(taskDescription);
        }
      } catch (apiError) {
        clearTimeout(timeoutId);
        if (apiError.name === 'AbortError') {
          console.log('⏰ AI任务分析超时');
          throw new Error('AI分析请求超时，请稍后重试');
        } else {
          console.error('🔥 AI任务分析失败:', apiError);
          throw apiError;
        }
      }
    } catch (error) {
      console.error('任务分析失败:', error);
      return this.generateSimpleTaskBreakdown(taskDescription);
    }
  }

  // 简化的任务拆分备选方案
  private generateSimpleTaskBreakdown(taskDescription: string): {
    analysis: string;
    subtasks: Array<{
      title: string;
      description: string;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high';
      dependencies?: number[];
    }>;
    suggestions: string[];
  } {
    const desc = taskDescription.toLowerCase();
    const subtasks = [];

    // 基于关键词的简单拆分逻辑
    if (desc.includes('开发') || desc.includes('编程') || desc.includes('代码')) {
      subtasks.push(
        { title: '需求分析', description: '明确功能需求和技术规格', estimatedTime: 60, priority: 'high' as const },
        { title: '技术设计', description: '设计技术架构和实现方案', estimatedTime: 90, priority: 'high' as const },
        { title: '编码实现', description: '具体代码实现', estimatedTime: 180, priority: 'medium' as const },
        { title: '测试验证', description: '功能测试和bug修复', estimatedTime: 60, priority: 'medium' as const }
      );
    } else if (desc.includes('学习') || desc.includes('研究')) {
      subtasks.push(
        { title: '资料收集', description: '搜集相关学习资料和资源', estimatedTime: 45, priority: 'high' as const },
        { title: '基础学习', description: '学习基础概念和理论', estimatedTime: 120, priority: 'high' as const },
        { title: '实践练习', description: '通过练习巩固知识', estimatedTime: 90, priority: 'medium' as const },
        { title: '总结回顾', description: '整理笔记和知识点总结', estimatedTime: 30, priority: 'low' as const }
      );
    } else {
      // 通用拆分
      subtasks.push(
        { title: '任务准备', description: '收集必要资源和信息', estimatedTime: 30, priority: 'high' as const },
        { title: '执行主要工作', description: taskDescription, estimatedTime: 60, priority: 'high' as const },
        { title: '检查和完善', description: '检查结果并进行必要的调整', estimatedTime: 30, priority: 'medium' as const }
      );
    }

    return {
      analysis: `已将任务"${taskDescription}"拆分成${subtasks.length}个子任务，建议按顺序执行。`,
      subtasks,
      suggestions: [
        '建议预留额外时间应对意外情况',
        '可以根据实际情况调整任务优先级',
        '完成每个子任务后及时记录进度'
      ]
    };
  }

  // 简单聊天方法 - 直接调用模型API
  async simpleChat(message: string, userId: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): Promise<string> {
    try {
      // 估算Token使用量
      const estimatedTokens = this.estimateTokens(message) + 500; // 加上响应的估算
      
      // 检查用户额度
      const quotaCheck = await this.checkTokenQuota(userId, modelType, estimatedTokens);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.message);
      }

      // 选择模型
      const modelName = modelType === 'deepseek-r1' ? 'deepseek-r1-0528' : 'deepseek-v3';
      
      // 添加超时控制
      const timeout = 30000; // 30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`🚀 开始简单聊天，使用模型: ${modelName}`);
      const apiStartTime = Date.now();
      
      try {
        const response = await this.openai.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: message }],
          temperature: 0.7,
          max_tokens: 1000,
        }, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ 简单聊天完成，耗时: ${Date.now() - apiStartTime}ms`);
        
        const content = response.choices[0]?.message?.content || '抱歉，我无法理解您的问题。';
        
        // 记录实际Token使用量
        const usage = response.usage;
        if (usage) {
          await this.recordTokenUsage(
            quotaCheck.subscription,
            modelType,
            usage.prompt_tokens || 0,
            usage.completion_tokens || 0
          );
        }
        
        return content;
      } catch (apiError) {
        clearTimeout(timeoutId);
        if (apiError.name === 'AbortError') {
          console.log('⏰ 简单聊天超时');
          throw new Error('聊天请求超时，请稍后重试');
        } else {
          console.error('🔥 简单聊天失败:', apiError);
          throw apiError;
        }
      }
    } catch (error) {
      console.error('简单聊天失败:', error);
      throw error;
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

  /**
   * 流式任务分析和拆分功能
   */
  async *streamTaskBreakdown(taskDescription: string, userId: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): AsyncGenerator<{
    type: 'chunk' | 'complete' | 'error';
    content?: string;
    data?: any;
    error?: string;
  }> {
    try {
      // 估算Token使用量
      const estimatedTokens = this.estimateTokens(taskDescription) + 1500;
      
      // 检查用户额度
      const quotaCheck = await this.checkTokenQuota(userId, modelType, estimatedTokens);
      if (!quotaCheck.allowed) {
        yield { type: 'error', error: quotaCheck.message };
        return;
      }

      const prompt = `请分析以下任务并将其拆分成可执行的小任务：

任务描述："${taskDescription}"

请返回JSON格式的分析结果：
{
  "analysis": "对任务的整体分析，包括复杂度、所需技能、潜在挑战等",
  "subtasks": [
    {
      "title": "子任务标题",
      "description": "详细描述该子任务需要做什么",
      "estimatedTime": 预估时间(分钟),
      "priority": "优先级(low/medium/high)",
      "dependencies": [依赖的其他子任务的索引数组，可选]
    }
  ],
  "suggestions": ["实施建议1", "实施建议2", "注意事项等"]
}

要求：
1. 子任务应该具体明确，可独立执行
2. 合理估算每个子任务的时间
3. 按逻辑顺序排列子任务
4. 提供实用的执行建议
5. 所有文本使用中文`;

      // 选择模型
      const modelName = modelType === 'deepseek-r1' ? 'deepseek-r1-0528' : 'deepseek-v3';
      
      console.log(`🚀 开始流式AI任务分析，使用模型: ${modelName}`);
      const apiStartTime = Date.now();
      
      const stream = await this.openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true, // 启用流式响应
      });
      
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          outputTokens += this.estimateTokens(content);
          
          // 实时发送内容块
          yield {
            type: 'chunk',
            content: content
          };
        }
      }
      
      console.log(`✅ 流式AI任务分析完成，耗时: ${Date.now() - apiStartTime}ms`);
      
      // 记录Token使用量
      inputTokens = this.estimateTokens(prompt);
      await this.recordTokenUsage(quotaCheck.subscription, modelType, inputTokens, outputTokens);
      
      // 尝试解析完整内容
      try {
        console.log('🔍 尝试解析完整JSON...');
        let jsonContent = fullContent.trim();
        const jsonStart = jsonContent.indexOf('{');
        const jsonEnd = jsonContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const extractedJson = jsonContent.substring(jsonStart, jsonEnd + 1);
          const result = JSON.parse(extractedJson);
          
          const processedResult = {
            analysis: result.analysis || '任务分析完成',
            subtasks: (result.subtasks || []).map((task: any, index: number) => ({
              title: task.title || `子任务 ${index + 1}`,
              description: task.description || task.title || '待补充描述',
              estimatedTime: Math.max(15, task.estimatedTime || 30),
              priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
              dependencies: Array.isArray(task.dependencies) ? task.dependencies : []
            })),
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
          };
          
          yield {
            type: 'complete',
            data: processedResult
          };
        } else {
          throw new Error('无法提取有效JSON');
        }
      } catch (parseError) {
        console.error('❌ 解析流式响应失败:', parseError);
        // 使用fallback方案
        const fallbackResult = this.generateSimpleTaskBreakdown(taskDescription);
        yield {
          type: 'complete',
          data: fallbackResult
        };
      }
    } catch (error) {
      console.error('流式任务分析失败:', error);
      yield {
        type: 'error',
        error: error.message || '任务分析失败'
      };
    }
  }

  /**
   * 流式简单聊天功能
   */
  async *streamSimpleChat(message: string, userId: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): AsyncGenerator<{
    type: 'chunk' | 'complete' | 'error';
    content?: string;
    error?: string;
  }> {
    try {
      // 估算Token使用量
      const estimatedTokens = this.estimateTokens(message) + 500;
      
      // 检查用户额度
      const quotaCheck = await this.checkTokenQuota(userId, modelType, estimatedTokens);
      if (!quotaCheck.allowed) {
        yield { type: 'error', error: quotaCheck.message };
        return;
      }

      // 选择模型
      const modelName = modelType === 'deepseek-r1' ? 'deepseek-r1-0528' : 'deepseek-v3';
      
      console.log(`🚀 开始流式简单聊天，使用模型: ${modelName}`);
      const apiStartTime = Date.now();
      
      const stream = await this.openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true, // 启用流式响应
      });
      
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          outputTokens += this.estimateTokens(content);
          
          // 实时发送内容块
          yield {
            type: 'chunk',
            content: content
          };
        }
      }
      
      console.log(`✅ 流式简单聊天完成，耗时: ${Date.now() - apiStartTime}ms`);
      
      // 记录Token使用量
      inputTokens = this.estimateTokens(message);
      await this.recordTokenUsage(quotaCheck.subscription, modelType, inputTokens, outputTokens);
      
      yield {
        type: 'complete',
        content: fullContent
      };
    } catch (error) {
      console.error('流式简单聊天失败:', error);
      yield {
        type: 'error',
        error: error.message || '聊天失败'
      };
    }
  }
}