import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { aiService, AIQuestionResponse, TaskBreakdown } from '../../services/aiService';
import { taskService } from '../../services/taskService';
import { MarkdownText } from '../common/MarkdownText';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'task-breakdown';
  content: string;
  timestamp: Date;
  taskBreakdown?: TaskBreakdown;
}

interface SubtaskItem {
  title: string;
  description: string;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high';
  dependencies?: number[];
  selected: boolean;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const AIAssistant: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '您好！我是您的AI助手。我可以帮您:\n\n📋 分析复杂任务并拆分成小任务 - 输入"分析任务：[任务描述]"\n💬 回答任务管理、时间安排相关问题\n🎯 提供生产力建议\n\n请告诉我您需要什么帮助！',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek-v3' | 'deepseek-r1'>('deepseek-v3');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 优化的滚动控制
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const isStreamingRef = useRef<boolean>(false);

  const scrollToBottom = (immediate: boolean = false) => {
    const now = Date.now();
    
    // 如果是立即滚动或距离上次滚动超过200ms
    if (immediate || now - lastScrollTimeRef.current > 200) {
      lastScrollTimeRef.current = now;
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: !immediate });
      });
    } else if (isStreamingRef.current) {
      // 流式过程中使用防抖滚动
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        lastScrollTimeRef.current = Date.now();
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const originalInput = inputText.trim();
    setInputText('');
    setLoading(true);

    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 检查是否选择了任务分析功能
      if (selectedFunction === 'task_analysis') {
        // 使用流式API进行任务分析
        await handleStreamTaskBreakdown(originalInput);
        // 分析完成后取消选择
        setSelectedFunction(null);
      } else {
        // 简单问答模式，使用流式聊天
        await handleStreamSimpleChat(originalInput);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，处理您的请求时出现了错误。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleStopRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      
      const stopMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '⏹️ 请求已被用户停止',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, stopMessage]);
    }
  };

  const handleAddSelectedTasks = async (breakdown: TaskBreakdown, selectedIndices: number[]) => {
    try {
      setLoading(true);
      const selectedSubtasks = selectedIndices.map(index => breakdown.subtasks[index]);
      
      for (const subtask of selectedSubtasks) {
        await taskService.createTask({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          estimatedDuration: subtask.estimatedTime,
          aiGenerated: true, // 标记为AI生成的任务
          aiContext: '由AI助手任务分析生成',
        });
      }

      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ 已成功添加 ${selectedSubtasks.length} 个子任务到您的任务列表中！您可以在任务页面查看和管理这些任务。`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      console.error('添加任务失败:', error);
      Alert.alert('错误', '添加任务失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineTask = async (taskIndex: number, taskTitle: string, taskDescription: string) => {
    try {
      setLoading(true);
      
      // 创建新的AbortController
      const controller = new AbortController();
      setAbortController(controller);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `继续拆分任务："${taskTitle}"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      const breakdown = await aiService.breakdownTask(
        `请将任务"${taskTitle}"进一步拆分为更详细的子任务。任务描述：${taskDescription}`,
        selectedModel
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'task-breakdown',
        content: `已为您进一步细化任务"${taskTitle}"：`,
        timestamp: new Date(),
        taskBreakdown: breakdown,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('任务细化失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，任务细化失败。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleRefineAllTasks = async (originalBreakdown: TaskBreakdown) => {
    try {
      setLoading(true);
      
      // 创建新的AbortController
      const controller = new AbortController();
      setAbortController(controller);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: '请将所有任务进一步细化',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 构建更详细的prompt，包含所有现有子任务
      const allTasksDescription = originalBreakdown.subtasks
        .map((task, index) => `${index + 1}. ${task.title}: ${task.description}`)
        .join('\n');
      
      const refinedPrompt = `请将以下任务列表进一步细化，为每个任务提供更详细的子步骤：

${allTasksDescription}

请为每个主要任务提供2-4个更具体的执行步骤，确保每个步骤都是可操作和可衡量的。`;

      const breakdown = await aiService.breakdownTask(refinedPrompt, selectedModel);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'task-breakdown',
        content: '已为您细化所有任务，提供了更详细的执行步骤：',
        timestamp: new Date(),
        taskBreakdown: breakdown,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('任务细化失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，任务细化失败。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 处理流式任务分析
  const handleStreamTaskBreakdown = async (taskDescription: string) => {
    // 创建一个临时的AI消息用于显示流式内容
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      type: 'ai',
      content: '🤖 正在分析任务...\n\n',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, streamingMessage]);
    isStreamingRef.current = true; // 设置流式状态
    
    try {
      const stream = aiService.streamBreakdownTask(
        taskDescription,
        selectedModel,
        // onChunk - 实时显示内容
        (chunk: string) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingMessageId) {
              // 检查是否为初始状态（包含初始提示文本）
              const isInitialState = msg.content.includes('🤖 正在分析任务...');
              return { 
                ...msg, 
                content: isInitialState ? chunk : msg.content + chunk 
              };
            }
            return msg;
          }));
          // 流式过程中使用优化的滚动
          scrollToBottom();
        },
        // onComplete - 处理完成结果
        (data: TaskBreakdown) => {
          isStreamingRef.current = false; // 结束流式状态
          
          // 替换为任务分解消息
          const taskBreakdownMessage: Message = {
            id: streamingMessageId,
            type: 'task-breakdown',
            content: `我已经为您分析了任务"${taskDescription}"，并将其拆分成${data.subtasks.length}个子任务。您可以选择需要的子任务添加到任务列表中：`,
            timestamp: new Date(),
            taskBreakdown: data,
          };
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId ? taskBreakdownMessage : msg
          ));
          // 完成时立即滚动到底部
          scrollToBottom(true);
        },
        // onError
        (error: string) => {
          isStreamingRef.current = false; // 结束流式状态
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: `❌ 分析失败: ${error}` }
              : msg
          ));
        }
      );
      
      // 消费流
      for await (const chunk of stream) {
        // 流式处理已在回调中处理
      }
    } catch (error) {
      console.error('流式任务分析失败:', error);
      isStreamingRef.current = false; // 结束流式状态
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: `❌ 分析失败: ${error instanceof Error ? error.message : '未知错误'}` }
          : msg
      ));
    }
  };

  // 处理流式简单聊天
  const handleStreamSimpleChat = async (message: string) => {
    // 创建一个临时的AI消息用于显示流式内容
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      type: 'ai',
      content: '💭 正在思考...\n\n',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, streamingMessage]);
    isStreamingRef.current = true; // 设置流式状态
    
    try {
      console.log('🚀 开始流式聊天:', message);
      
      const stream = aiService.streamSimpleChat(
        message,
        selectedModel,
        // onChunk - 实时显示内容
        (chunk: string) => {
          console.log('📡 收到chunk:', chunk);
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingMessageId) {
              // 检查是否为初始状态（包含初始提示文本）
              const isInitialState = msg.content.includes('💭 正在思考...');
              return { 
                ...msg, 
                content: isInitialState ? chunk : msg.content + chunk 
              };
            }
            return msg;
          }));
          // 流式过程中使用优化的滚动
          scrollToBottom();
        },
        // onComplete
        (content: string) => {
          console.log('✅ 聊天完成');
          isStreamingRef.current = false; // 结束流式状态
          // 内容已通过chunk更新完成，这里不需要额外处理
          // 完成时立即滚动到底部
          scrollToBottom(true);
        },
        // onError
        (error: string) => {
          console.error('❌ 聊天错误:', error);
          isStreamingRef.current = false; // 结束流式状态
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: `❌ 回复失败: ${error}` }
              : msg
          ));
        }
      );
      
      // 消费流
      for await (const chunk of stream) {
        console.log('🔄 处理流数据:', chunk.type);
        // 流式处理已在回调中处理
      }
    } catch (error) {
      console.error('流式聊天失败:', error);
      isStreamingRef.current = false; // 结束流式状态
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: `❌ 回复失败: ${error instanceof Error ? error.message : '未知错误'}` }
          : msg
      ));
    }
  };

  const TaskBreakdownComponent: React.FC<{ 
    breakdown: TaskBreakdown; 
    onAddTasks: (selectedIndices: number[]) => void;
    onRefineTask: (taskIndex: number, taskTitle: string, taskDescription: string) => void;
    onRefineAllTasks: (breakdown: TaskBreakdown) => void;
  }> = ({ breakdown, onAddTasks, onRefineTask, onRefineAllTasks }) => {
    const [selectedTasks, setSelectedTasks] = useState<boolean[]>(
      new Array(breakdown.subtasks.length).fill(true)
    );

    const toggleTask = (index: number) => {
      const newSelected = [...selectedTasks];
      newSelected[index] = !newSelected[index];
      setSelectedTasks(newSelected);
    };

    const handleAddSelected = () => {
      const selectedIndices = selectedTasks
        .map((selected, index) => selected ? index : -1)
        .filter(index => index !== -1);
      
      if (selectedIndices.length > 0) {
        onAddTasks(selectedIndices);
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#FF5722';
        case 'medium': return '#FF9800';
        case 'low': return '#4CAF50';
        default: return '#666';
      }
    };

    const getPriorityLabel = (priority: string) => {
      switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'low': return '低';
        default: return '';
      }
    };

    return (
      <View style={styles.taskBreakdownContainer}>
        {/* 分析结果 */}
        <View style={styles.analysisSection}>
          <Text style={styles.analysisTitle}>📊 任务分析</Text>
          <Text style={styles.analysisText}>{breakdown.analysis}</Text>
        </View>

        {/* 子任务列表 */}
        <View style={styles.subtasksSection}>
          <Text style={styles.subtasksTitle}>📋 拆分的子任务 ({breakdown.subtasks.length}个)</Text>
          {breakdown.subtasks.map((subtask, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.subtaskItem,
                selectedTasks[index] && styles.subtaskItemSelected
              ]}
              onPress={() => toggleTask(index)}
            >
              <View style={styles.subtaskHeader}>
                <View style={styles.subtaskCheck}>
                  <Text style={styles.subtaskCheckText}>
                    {selectedTasks[index] ? '✓' : '○'}
                  </Text>
                </View>
                <Text style={styles.subtaskTitle}>{subtask.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(subtask.priority) }
                ]}>
                  <Text style={styles.priorityText}>
                    {getPriorityLabel(subtask.priority)}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtaskDescription}>{subtask.description}</Text>
              <View style={styles.subtaskFooter}>
                <Text style={styles.subtaskTime}>
                  ⏱️ 预估: {subtask.estimatedTime}分钟
                </Text>
                <TouchableOpacity
                  style={styles.refineButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRefineTask(index, subtask.title, subtask.description);
                  }}
                >
                  <Text style={styles.refineButtonText}>🔍 继续拆分</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 建议 */}
        {breakdown.suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>💡 实施建议</Text>
            {breakdown.suggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}

        {/* 操作按钮组 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.refineAllButton}
            onPress={() => onRefineAllTasks(breakdown)}
          >
            <Text style={styles.refineAllButtonText}>
              🔍 全部细化
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.addTasksButton,
              selectedTasks.filter(Boolean).length === 0 && styles.addTasksButtonDisabled
            ]}
            onPress={handleAddSelected}
            disabled={selectedTasks.filter(Boolean).length === 0}
          >
            <Text style={styles.addTasksButtonText}>
              ➕ 添加选中的任务 ({selectedTasks.filter(Boolean).length}个)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 返回</Text>
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>AI助手</Text>
            <Text style={styles.headerSubtitle}>智能问答系统</Text>
          </View>
          <View style={styles.modelSelector}>
            <TouchableOpacity
              style={[
                styles.modelButton,
                selectedModel === 'deepseek-v3' && styles.modelButtonActive
              ]}
              onPress={() => setSelectedModel('deepseek-v3')}
            >
              <Text style={[
                styles.modelButtonText,
                selectedModel === 'deepseek-v3' && styles.modelButtonTextActive
              ]}>
                v3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modelButton,
                selectedModel === 'deepseek-r1' && styles.modelButtonActive
              ]}
              onPress={() => setSelectedModel('deepseek-r1')}
            >
              <Text style={[
                styles.modelButtonText,
                selectedModel === 'deepseek-r1' && styles.modelButtonTextActive
              ]}>
                r1
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {message.type === 'task-breakdown' ? (
              <View style={styles.taskBreakdownMessage}>
                <View style={[styles.messageBubble, styles.aiMessageBubble]}>
                  <Text style={[styles.messageText, styles.aiMessageText]}>
                    {message.content}
                  </Text>
                  <Text style={[styles.messageTime, styles.aiMessageTime]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
                {message.taskBreakdown && (
                  <TaskBreakdownComponent
                    breakdown={message.taskBreakdown}
                    onAddTasks={(selectedIndices) => 
                      handleAddSelectedTasks(message.taskBreakdown!, selectedIndices)
                    }
                    onRefineTask={(taskIndex, taskTitle, taskDescription) =>
                      handleRefineTask(taskIndex, taskTitle, taskDescription)
                    }
                    onRefineAllTasks={(breakdown) =>
                      handleRefineAllTasks(breakdown)
                    }
                  />
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user'
                    ? styles.userMessageBubble
                    : styles.aiMessageBubble,
                ]}
              >
                {message.type === 'ai' ? (
                  <MarkdownText 
                    content={message.content}
                    style={styles.aiMessageText}
                  />
                ) : (
                  <Text
                    style={[
                      styles.messageText,
                      message.type === 'user'
                        ? styles.userMessageText
                        : styles.aiMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                )}
                <Text
                  style={[
                    styles.messageTime,
                    message.type === 'user'
                      ? styles.userMessageTime
                      : styles.aiMessageTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* 功能按钮 */}
      <View style={styles.prefixButtonsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prefixButtonsContent}
        >
          <TouchableOpacity
            style={[
              styles.prefixButton,
              selectedFunction === 'task_analysis' && styles.prefixButtonActive
            ]}
            onPress={() => {
              setSelectedFunction(selectedFunction === 'task_analysis' ? null : 'task_analysis');
            }}
          >
            <Text style={[
              styles.prefixButtonText,
              selectedFunction === 'task_analysis' && styles.prefixButtonTextActive
            ]}>📋 任务分析</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入您的问题或点击上方功能按钮"
          multiline
          maxLength={500}
          editable={!loading}
        />
        {loading ? (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopRequest}
          >
            <Text style={styles.stopButtonText}>
              ⏹️ 停止
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Text
              style={[
                styles.sendButtonText,
                !inputText.trim() && styles.sendButtonTextDisabled,
              ]}
            >
              发送
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiMessageTime: {
    color: '#999',
  },
  loadingText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // 功能前缀按钮样式
  prefixButtonsContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  prefixButtonsContent: {
    alignItems: 'center',
  },
  prefixButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  prefixButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  prefixButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  prefixButtonTextActive: {
    color: '#fff',
  },
  
  // 模型选择器样式
  modelSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 2,
  },
  modelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 40,
    alignItems: 'center',
  },
  modelButtonActive: {
    backgroundColor: '#2196F3',
  },
  modelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  modelButtonTextActive: {
    color: '#fff',
  },
  
  // 任务分解样式
  taskBreakdownMessage: {
    width: '100%',
    alignItems: 'flex-start',
  },
  taskBreakdownContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    maxWidth: '100%',
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  subtasksSection: {
    marginBottom: 16,
  },
  subtasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subtaskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subtaskItemSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f8ff',
  },
  subtaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subtaskCheckText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  subtaskDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
    marginLeft: 32,
  },
  subtaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 32,
  },
  subtaskTime: {
    fontSize: 12,
    color: '#999',
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  addTasksButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTasksButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addTasksButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // 新增的按钮样式
  buttonGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  refineButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  refineButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  refineAllButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refineAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
