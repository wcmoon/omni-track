import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Task } from '../types';
import { taskService } from '../services/taskService';
import { QuickCreateTaskModal } from '../components/modals/QuickCreateTaskModal';
import { TaskEditModal } from '../components/modals/TaskEditModal';
import { NotificationBar } from '../components/NotificationBar';
import { wsService } from '../services/websocket';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TasksScreenProps {
  navigation: any;
}

interface ExpandedTasks {
  [key: string]: boolean;
}

export default function TasksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editField, setEditField] = useState<'priority' | 'duration' | 'dueDate' | 'recurrence' | 'tags' | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<ExpandedTasks>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    taskId: '',
  });

  const loadTasks = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      console.log('正在获取任务数据...');
      const data = await taskService.getTasks();
      console.log('API返回的任务数据:', data);
      console.log('任务数量:', data.length);
      setTasks(data);
      console.log('setTasks完成，当前任务状态已更新');
    } catch (error) {
      console.error('加载任务失败:', error);
      Alert.alert('错误', '加载任务失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(true);
  };

  useEffect(() => {
    loadTasks();
    
    // 连接WebSocket
    wsService.connect();
    
    // 监听AI分析完成事件
    const handleAIAnalysisComplete = (data: any) => {
      console.log('收到AI分析完成通知:', data);
      
      // 更新任务列表中的对应任务
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === data.taskId 
            ? { 
                ...task, 
                ...data.updates,
                aiAnalyzed: true 
              } 
            : task
        )
      );
      
      // 显示通知
      setNotification({
        visible: true,
        message: 'AI已完成任务分析',
        taskId: data.taskId,
      });
    };
    
    wsService.on('task_analysis_complete', handleAIAnalysisComplete);
    
    return () => {
      wsService.off('task_analysis_complete', handleAIAnalysisComplete);
      wsService.disconnect();
    };
  }, []);

  // 当页面获得焦点时刷新任务列表
  useFocusEffect(
    React.useCallback(() => {
      console.log('TasksScreen获得焦点，刷新任务列表');
      loadTasks(true); // 使用true参数表示是刷新操作
    }, [])
  );

  // 获取所有可用标签
  const getAllTags = () => {
    const allTags = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 过滤任务
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // 搜索过滤
      const matchesSearch = searchQuery === '' || 
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 标签过滤
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(selectedTag => task.tags?.includes(selectedTag));
      
      return matchesSearch && matchesTags;
    });
  };

  // 获取今天的日期字符串（YYYY-MM-DD）
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 检查任务是否是今天的
  const isToday = (date: Date) => {
    const today = getTodayString();
    const taskDate = new Date(date).toISOString().split('T')[0];
    return taskDate === today;
  };

  // 分组任务
  const getGroupedTasks = () => {
    const filteredTasks = getFilteredTasks();
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置到今天结束
    
    console.log('所有任务数量:', filteredTasks.length);
    console.log('今天的时间:', today);
    
    // 先分离已完成和未完成的任务
    const completedTasks = filteredTasks.filter(task => task.status === 'completed');
    const activeTasks = filteredTasks.filter(task => task.status !== 'completed');
    
    // 对未完成的任务进行分组
    const recurringTasks = activeTasks.filter(task => task.isRecurring);
    const todayTasks = activeTasks.filter(task => 
      !task.isRecurring && task.dueDate && isToday(task.dueDate)
    );
    const overdueTasks = activeTasks.filter(task => {
      if (!task.isRecurring && task.dueDate) {
        const now = new Date();
        const taskDueDate = new Date(task.dueDate);
        
        if (task.endTime) {
          // 如果有具体时间，精确比较到分钟
          const [hours, minutes] = task.endTime.split(':').map(Number);
          taskDueDate.setHours(hours, minutes, 0, 0);
          return taskDueDate < now;
        } else {
          // 如果没有具体时间，认为是当天23:59:59到期
          taskDueDate.setHours(23, 59, 59, 999);
          return taskDueDate < now;
        }
      }
      return false;
    });
    const upcomingTasks = activeTasks.filter(task => {
      if (!task.isRecurring && task.dueDate && !isToday(task.dueDate)) {
        // 大于今天的日期算未来任务
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return new Date(task.dueDate) > todayStart;
      }
      return false;
    });
    const noTimeTasks = activeTasks.filter(task => 
      !task.isRecurring && !task.dueDate
    );
    
    console.log('分组结果:', {
      循环任务: recurringTasks.length,
      今天任务: todayTasks.length, 
      逾期任务: overdueTasks.length,
      未来任务: upcomingTasks.length,
      无时间任务: noTimeTasks.length,
      已完成任务: completedTasks.length,
      总计: recurringTasks.length + todayTasks.length + overdueTasks.length + upcomingTasks.length + noTimeTasks.length + completedTasks.length
    });
    
    console.log('无时间任务详情:', noTimeTasks.map(task => ({
      id: task.id,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      isRecurring: task.isRecurring
    })));
    
    console.log('所有原始任务:', filteredTasks.map(task => ({
      id: task.id,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      isRecurring: task.isRecurring
    })));
    
    // 按截止时间排序今天的任务
    todayTasks.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    // 按截止时间排序逾期任务（最近的逾期在前）
    overdueTasks.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });
    
    // 按截止时间排序未来任务
    upcomingTasks.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    // 按完成时间排序已完成任务（最近完成的在前）
    completedTasks.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });
    
    return { recurringTasks, todayTasks, overdueTasks, upcomingTasks, noTimeTasks, completedTasks };
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDueDate = (date: Date, endTime?: string) => {
    const dateObj = new Date(date);
    let dateStr = '';
    
    if (isToday(dateObj)) {
      dateStr = '今天';
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (dateObj.toDateString() === yesterday.toDateString()) {
        dateStr = '昨天';
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (dateObj.toDateString() === tomorrow.toDateString()) {
          dateStr = '明天';
        } else {
          dateStr = dateObj.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
          });
        }
      }
    }
    
    // 如果有时间信息，添加到日期字符串中
    if (endTime) {
      dateStr += ` ${endTime}`;
    }
    
    return dateStr;
  };

  const getRecurrenceText = (pattern?: Task['recurrencePattern']) => {
    if (!pattern) return '';
    
    switch (pattern.type) {
      case 'daily':
        return pattern.interval === 1 ? '每天' : `每${pattern.interval}天`;
      case 'weekly':
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const days = pattern.daysOfWeek.map(day => dayNames[day]).join('、');
          return `每周${days}`;
        }
        return pattern.interval === 1 ? '每周' : `每${pattern.interval}周`;
      case 'monthly':
        return pattern.interval === 1 ? '每月' : `每${pattern.interval}月`;
      case 'yearly':
        return pattern.interval === 1 ? '每年' : `每${pattern.interval}年`;
      default:
        return '';
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // 乐观更新：立即更新UI中的任务
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    
    try {
      // 异步执行更新操作
      const updatedTask = await taskService.updateTask(taskId, updates);
      // 用服务器返回的最新数据更新任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      console.log('任务更新成功:', taskId);
    } catch (error) {
      console.error('更新任务失败:', error);
      // 如果更新失败，恢复原来的任务状态
      setTasks(originalTasks);
      Alert.alert('错误', '更新任务失败，请稍后重试');
    }
  };

  const deleteTask = async (taskId: string) => {
    // 乐观更新：立即从UI中移除任务
    const originalTasks = [...tasks];
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    
    try {
      // 异步执行删除操作
      await taskService.deleteTask(taskId);
      console.log('任务删除成功:', taskId);
    } catch (error) {
      console.error('删除任务失败:', error);
      // 如果删除失败，恢复原来的任务列表
      setTasks(originalTasks);
      Alert.alert('错误', '删除任务失败，请稍后重试');
    }
  };

  const handleQuickEdit = (task: Task, field: 'priority' | 'duration' | 'dueDate' | 'recurrence' | 'tags') => {
    setSelectedTask(task);
    setEditField(field);
    setShowEditModal(true);
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const renderTaskItem = (item: Task) => {
    const isExpanded = expandedTasks[item.id];
    // 逾期判断逻辑（与后端保持一致）
    const isOverdue = (() => {
      if (!item.dueDate || item.status === 'completed') {
        return false;
      }
      
      const now = new Date();
      const taskDueDate = new Date(item.dueDate);
      
      if (item.endTime) {
        // 如果有具体时间，精确比较到分钟
        const [hours, minutes] = item.endTime.split(':').map(Number);
        taskDueDate.setHours(hours, minutes, 0, 0);
        return taskDueDate < now;
      } else {
        // 如果没有具体时间，认为是当天23:59:59到期
        taskDueDate.setHours(23, 59, 59, 999);
        return taskDueDate < now;
      }
    })();

    const handleToggleComplete = async () => {
      try {
        if (item.status === 'completed') {
          // 重新激活任务 - 设置为pending状态
          await updateTask(item.id, { status: 'pending' });
        } else {
          // 乐观更新：立即更新UI显示任务为已完成
          const originalTasks = [...tasks];
          const completedTask = { ...item, status: 'completed' as const, completedAt: new Date() };
          const updatedTasks = tasks.map(task => 
            task.id === item.id ? completedTask : task
          );
          setTasks(updatedTasks);
          
          try {
            // 使用专门的完成任务接口
            const serverTask = await taskService.completeTask(item.id);
            // 用服务器返回的准确数据更新任务
            setTasks(prev => prev.map(task => 
              task.id === item.id ? serverTask : task
            ));
            console.log('任务完成成功:', item.id);
          } catch (error) {
            console.error('完成任务失败:', error);
            // 如果失败，恢复原状态
            setTasks(originalTasks);
            throw error;
          }
        }
      } catch (error) {
        console.error('切换任务状态失败:', error);
      }
    };

    return (
      <View style={styles.taskItem}>
        <TouchableOpacity
          style={styles.taskMainRow}
          onPress={() => toggleTaskExpanded(item.id)}
          activeOpacity={0.7}
        >
          <TouchableOpacity onPress={handleToggleComplete} style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              item.status === 'completed' && styles.checkboxChecked
            ]}>
              {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          
          <Text style={[
            styles.taskDescription,
            item.status === 'completed' && styles.completedTaskDescription,
            isOverdue && styles.overdueTaskDescription
          ]} numberOfLines={isExpanded ? undefined : 1}>
            {item.description}
          </Text>
          
          <TouchableOpacity style={styles.expandButton}>
            <Text style={styles.expandButtonText}>{isExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.taskDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>优先级：</Text>
              <TouchableOpacity
                onPress={() => handleQuickEdit(item, 'priority')}
                style={styles.detailValue}
              >
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || 'medium') + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(item.priority || 'medium') }]}>
                    {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>预估时长：</Text>
              <TouchableOpacity
                onPress={() => handleQuickEdit(item, 'duration')}
                style={styles.detailValue}
              >
                <Text style={styles.detailText}>
                  {item.estimatedDuration ? `${item.estimatedDuration} 分钟` : '未设置'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>截止日期：</Text>
              <TouchableOpacity
                onPress={() => handleQuickEdit(item, 'dueDate')}
                style={styles.detailValue}
              >
                <Text style={[styles.detailText, isOverdue && styles.overdueText]}>
                  {item.dueDate ? formatDueDate(item.dueDate, item.endTime) : '未设置'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {item.isRecurring && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>重复：</Text>
                <TouchableOpacity
                  onPress={() => handleQuickEdit(item, 'recurrence')}
                  style={styles.detailValue}
                >
                  <Text style={styles.detailText}>
                    {getRecurrenceText(item.recurrencePattern)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>标签：</Text>
              <TouchableOpacity
                onPress={() => handleQuickEdit(item, 'tags')}
                style={styles.detailValue}
              >
                {item.tags && item.tags.length > 0 ? (
                  <View style={styles.tagsContainer}>
                    {item.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailText}>未设置</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    '删除任务',
                    '确定要删除这个任务吗？',
                    [
                      { text: '取消', style: 'cancel' },
                      { 
                        text: '删除', 
                        style: 'destructive',
                        onPress: () => deleteTask(item.id)
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTaskSection = (title: string, tasks: Task[], emoji: string = '') => {
    if (tasks.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{emoji} {title} ({tasks.length})</Text>
        <View style={styles.tasksList}>
          {tasks.map((task) => (
            <View key={task.id}>
              {renderTaskItem(task)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>任务</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowQuickCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ 新建</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>加载任务数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleNotificationPress = () => {
    setNotification({ ...notification, visible: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 通知条 */}
      <NotificationBar
        visible={notification.visible}
        message={notification.message}
        type="success"
        onPress={handleNotificationPress}
        onDismiss={() => setNotification({ ...notification, visible: false })}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>任务</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowQuickCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ 新建</Text>
        </TouchableOpacity>
      </View>
      
      {/* 搜索和过滤 */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索任务或标签..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* 标签过滤 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilter}>
          {getAllTags().map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterTag,
                selectedTags.includes(tag) && styles.selectedFilterTag
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[
                styles.filterTagText,
                selectedTags.includes(tag) && styles.selectedFilterTagText
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>暂无任务</Text>
          <Text style={styles.emptySubtitle}>创建第一个任务来开始管理你的时间</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
        >
          {(() => {
            const { recurringTasks, todayTasks, overdueTasks, upcomingTasks, noTimeTasks, completedTasks } = getGroupedTasks();
            return (
              <>
                {renderTaskSection('循环任务', recurringTasks, '🔄')}
                {renderTaskSection('逾期任务', overdueTasks, '🔥')}
                {renderTaskSection('今天的任务', todayTasks, '📅')}
                {renderTaskSection('未来的任务', upcomingTasks, '⏰')}
                {renderTaskSection('未安排时间的任务', noTimeTasks, '📋')}
                {renderTaskSection('已完成任务', completedTasks, '✅')}
              </>
            );
          })()}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
      
      {/* 快速创建任务弹窗 */}
      <QuickCreateTaskModal
        visible={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        onSuccess={async (newTask) => {
          // 乐观更新：立即添加新任务到列表
          if (newTask) {
            setTasks(prev => [newTask, ...prev]);
          } else {
            // 如果没有返回新任务数据，则刷新列表
            await loadTasks(true);
          }
          setShowQuickCreateModal(false);
        }}
      />
      
      {/* 任务编辑弹窗 */}
      <TaskEditModal
        visible={showEditModal}
        task={selectedTask}
        editField={editField}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
          setEditField(null);
        }}
        onSave={updateTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  tagFilter: {
    flexDirection: 'row',
    marginTop: 4,
  },
  filterTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedFilterTag: {
    backgroundColor: '#2196F3',
  },
  filterTagText: {
    fontSize: 12,
    color: '#666',
  },
  selectedFilterTagText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  tasksList: {
    backgroundColor: '#fff',
  },
  taskItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskDescription: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  overdueTaskDescription: {
    color: '#F44336',
  },
  expandButton: {
    padding: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#666',
  },
  taskDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingLeft: 48, // Align with checkbox
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  detailValue: {
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
  overdueText: {
    color: '#F44336',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
});