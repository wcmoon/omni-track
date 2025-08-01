import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface AIQuestionResponse {
  question: string;
  answer: string;
}

export interface TaskBreakdown {
  analysis: string;
  subtasks: Array<{
    title: string;
    description: string;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high';
    dependencies?: number[];
  }>;
  suggestions: string[];
}

class AIService {
  /**
   * 分析文本的语义信息
   */
  async analyzeText(text: string): Promise<SemanticAnalysis> {
    try {
      const response = await api.post('/ai/analyze', { text });
      return response.data.data;
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
      const response = await api.post('/ai/enhance', { text, context });
      return response.data.data;
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
  async askQuestion(question: string, context?: string): Promise<AIQuestionResponse> {
    try {
      const response = await api.post('/ai/ask', { question, context });
      return response.data.data;
    } catch (error) {
      console.error('智能问答失败:', error);
      // 返回默认回答作为备用
      return {
        question,
        answer: '抱歉，我现在无法回答这个问题。请稍后再试。'
      };
    }
  }

  /**
   * 获取任务建议
   */
  async getTaskSuggestions(text: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeText(text);
      return analysis.actionableItems;
    } catch (error) {
      console.error('获取任务建议失败:', error);
      return [];
    }
  }

  /**
   * 简单聊天模式 - 直接调用模型API
   */
  async simpleChat(message: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): Promise<string> {
    try {
      const response = await api.post('/ai/simple-chat', { 
        message, 
        modelType 
      });
      return response.data.data.content;
    } catch (error) {
      console.error('简单聊天失败:', error);
      return '抱歉，我现在无法回答这个问题。请稍后再试。';
    }
  }

  /**
   * 获取日志标签建议
   */
  async getLogTagSuggestions(text: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeText(text);
      return analysis.suggestedTags;
    } catch (error) {
      console.error('获取日志标签建议失败:', error);
      return [];
    }
  }

  /**
   * 任务分析和拆分
   */
  async breakdownTask(taskDescription: string, modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3'): Promise<TaskBreakdown> {
    try {
      const response = await api.post('/ai/breakdown-task', { 
        taskDescription, 
        modelType 
      });
      return response.data.data;
    } catch (error) {
      console.error('任务分析失败:', error);
      // 返回简化的拆分结果作为备用
      return {
        analysis: `任务"${taskDescription}"分析失败，已提供基础拆分建议。`,
        subtasks: [
          {
            title: '任务准备',
            description: '收集必要资源和信息',
            estimatedTime: 30,
            priority: 'high'
          },
          {
            title: '执行主要工作',
            description: taskDescription,
            estimatedTime: 60,
            priority: 'high'
          },
          {
            title: '检查和完善',
            description: '检查结果并进行必要的调整',
            estimatedTime: 30,
            priority: 'medium'
          }
        ],
        suggestions: [
          '建议预留额外时间应对意外情况',
          '可以根据实际情况调整任务优先级'
        ]
      };
    }
  }

  /**
   * 流式任务分析和拆分
   */
  async *streamBreakdownTask(
    taskDescription: string, 
    modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3',
    onChunk?: (content: string) => void,
    onComplete?: (data: TaskBreakdown) => void,
    onError?: (error: string) => void
  ): AsyncGenerator<{
    type: 'chunk' | 'complete' | 'error';
    content?: string;
    data?: TaskBreakdown;
    error?: string;
  }> {
    try {
      // 获取存储的token
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('未找到认证令牌，请重新登录');
      }

      const response = await fetch(`${api.defaults.baseURL}/ai/stream-breakdown-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskDescription,
          modelType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // React Native环境的兼容方案：模拟流式处理
      if (!response.body || typeof response.body.getReader !== 'function') {
        console.log('🔄 使用React Native兼容的模拟流式处理');
        
        // 获取完整响应文本
        const fullText = await response.text();
        const lines = fullText.split('\n');
        
        // 模拟流式处理：逐行延迟处理
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk' && parsed.content) {
                // 添加小延迟模拟流式效果
                await new Promise(resolve => setTimeout(resolve, 20));
                
                onChunk?.(parsed.content);
                yield {
                  type: 'chunk',
                  content: parsed.content
                };
              } else if (parsed.type === 'complete' && parsed.data) {
                onComplete?.(parsed.data);
                yield {
                  type: 'complete',
                  data: parsed.data
                };
                return;
              } else if (parsed.type === 'error') {
                onError?.(parsed.error);
                yield {
                  type: 'error',
                  error: parsed.error
                };
                return;
              }
            } catch (parseError) {
              console.error('解析数据失败:', parseError);
            }
          }
        }
        
        return;
      }

      // 浏览器环境的流式处理
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 移除 'data: ' 前缀
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk' && parsed.content) {
                onChunk?.(parsed.content);
                yield {
                  type: 'chunk',
                  content: parsed.content
                };
              } else if (parsed.type === 'complete' && parsed.data) {
                onComplete?.(parsed.data);
                yield {
                  type: 'complete',
                  data: parsed.data
                };
                return;
              } else if (parsed.type === 'error') {
                onError?.(parsed.error);
                yield {
                  type: 'error',
                  error: parsed.error
                };
                return;
              }
            } catch (parseError) {
              console.error('解析流数据失败:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式任务分析失败:', error);
      const errorMessage = error instanceof Error ? error.message : '任务分析失败';
      onError?.(errorMessage);
      yield {
        type: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * 流式简单聊天
   */
  async *streamSimpleChat(
    message: string, 
    modelType: 'deepseek-v3' | 'deepseek-r1' = 'deepseek-v3',
    onChunk?: (content: string) => void,
    onComplete?: (content: string) => void,
    onError?: (error: string) => void
  ): AsyncGenerator<{
    type: 'chunk' | 'complete' | 'error';
    content?: string;
    error?: string;
  }> {
    try {
      // 获取存储的token
      const token = await AsyncStorage.getItem('access_token');
      console.log('🔑 Token状态:', token ? `存在(${token.substring(0, 20)}...)` : '不存在');
      
      if (!token) {
        throw new Error('未找到认证令牌，请重新登录');
      }

      console.log('🌐 开始fetch请求到:', `${api.defaults.baseURL}/ai/stream-simple-chat`);
      const response = await fetch(`${api.defaults.baseURL}/ai/stream-simple-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          modelType
        })
      });

      console.log('📡 Response状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP错误响应:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // React Native环境的兼容方案：模拟流式处理
      if (!response.body || typeof response.body.getReader !== 'function') {
        console.log('🔄 使用React Native兼容的模拟流式处理');
        
        // 获取完整响应文本
        const fullText = await response.text();
        const lines = fullText.split('\n');
        let fullContent = '';
        
        // 模拟流式处理：逐行延迟处理
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.(fullContent);
              yield {
                type: 'complete',
                content: fullContent
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk' && parsed.content) {
                fullContent += parsed.content;
                
                // 添加小延迟模拟流式效果
                await new Promise(resolve => setTimeout(resolve, 20));
                
                onChunk?.(parsed.content);
                yield {
                  type: 'chunk',
                  content: parsed.content
                };
              } else if (parsed.type === 'complete') {
                onComplete?.(parsed.content || fullContent);
                yield {
                  type: 'complete',
                  content: parsed.content || fullContent
                };
                return;
              } else if (parsed.type === 'error') {
                onError?.(parsed.error);
                yield {
                  type: 'error',
                  error: parsed.error
                };
                return;
              }
            } catch (parseError) {
              console.error('解析数据失败:', parseError);
            }
          }
        }
        
        return;
      }

      // 浏览器环境的流式处理
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 移除 'data: ' 前缀
            
            if (data === '[DONE]') {
              onComplete?.(fullContent);
              yield {
                type: 'complete',
                content: fullContent
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk' && parsed.content) {
                fullContent += parsed.content;
                onChunk?.(parsed.content);
                yield {
                  type: 'chunk',
                  content: parsed.content
                };
              } else if (parsed.type === 'complete') {
                onComplete?.(parsed.content || fullContent);
                yield {
                  type: 'complete',
                  content: parsed.content || fullContent
                };
                return;
              } else if (parsed.type === 'error') {
                onError?.(parsed.error);
                yield {
                  type: 'error',
                  error: parsed.error
                };
                return;
              }
            } catch (parseError) {
              console.error('解析流数据失败:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式聊天失败:', error);
      const errorMessage = error instanceof Error ? error.message : '聊天失败';
      onError?.(errorMessage);
      yield {
        type: 'error',
        error: errorMessage
      };
    }
  }
}

export const aiService = new AIService();