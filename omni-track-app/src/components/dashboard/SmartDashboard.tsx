import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { dashboardService } from '../../services/dashboardService';
import { DashboardData, QuickAction } from '../../types/dashboard';
import { InsightCard } from './InsightCard';
import { ProgressRing } from './ProgressRing';
import { QuickActionButton } from './QuickActionButton';
import { ReminderCard } from './ReminderCard';
import { RecommendedTaskCard } from './RecommendedTaskCard';
import { QuickCreateTaskModal } from '../modals/QuickCreateTaskModal';
import { QuickCreateLogModal } from '../modals/QuickCreateLogModal';
import { wsService } from '../../services/websocket';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SmartDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  const loadDashboardData = async () => {
    // 防止在短时间内重复调用（3秒内只允许一次）
    const now = Date.now();
    if (now - lastUpdateTime < 3000 && !refreshing) {
      console.log('仪表盘数据更新被限流，跳过请求');
      return;
    }
    
    setLastUpdateTime(now);
    
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      Alert.alert('错误', '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 当用户切换到仪表盘时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      // 只在数据已加载的情况下刷新，避免重复初始加载
      if (dashboardData && !loading) {
        loadDashboardData();
      }
    }, [dashboardData, loading])
  );

  // WebSocket实时更新
  useEffect(() => {
    // 连接WebSocket
    wsService.connect();
    
    // 监听任务更新事件（带限流）
    const handleTaskUpdate = () => {
      setTimeout(() => {
        loadDashboardData();
      }, 1000); // 延迟1秒刷新，避免频繁调用
    };
    
    // 监听AI分析完成事件（带限流）
    const handleAIAnalysisComplete = () => {
      setTimeout(() => {
        loadDashboardData();
      }, 1000); // 延迟1秒刷新，避免频繁调用
    };
    
    wsService.on('task_analysis_complete', handleAIAnalysisComplete);
    wsService.on('task_updated', handleTaskUpdate);
    wsService.on('task_created', handleTaskUpdate);
    wsService.on('task_deleted', handleTaskUpdate);
    
    return () => {
      wsService.off('task_analysis_complete', handleAIAnalysisComplete);
      wsService.off('task_updated', handleTaskUpdate);
      wsService.off('task_created', handleTaskUpdate);
      wsService.off('task_deleted', handleTaskUpdate);
      wsService.disconnect();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-task',
      title: '新建任务',
      icon: '➕',
      color: '#4CAF50',
      onPress: () => setTaskModalVisible(true),
    },
    {
      id: 'new-log',
      title: '记录日志',
      icon: '📝',
      color: '#FF9800',
      onPress: () => setLogModalVisible(true),
    },
    {
      id: 'ai-assistant',
      title: 'AI助手',
      icon: '🤖',
      color: '#2196F3',
      onPress: () => navigation.navigate('AIAssistant'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>暂无数据</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const insightCards = [
    {
      id: 'total-tasks',
      title: '总任务数',
      value: dashboardData.taskStats.total,
      color: '#2196F3',
      subtitle: `进行中: ${dashboardData.taskStats.inProgress}`,
    },
    {
      id: 'completed-tasks',
      title: '已完成',
      value: dashboardData.taskStats.completed,
      color: '#4CAF50',
      trend: 'up' as const,
    },
    {
      id: 'overdue-tasks',
      title: '逾期任务',
      value: dashboardData.taskStats.overdue,
      color: '#f44336',
      trend: dashboardData.taskStats.overdue > 0 ? 'down' as const : 'stable' as const,
    },
    {
      id: 'log-entries',
      title: '本周记录',
      value: dashboardData.logStats.recentCount,
      color: '#FF9800',
      subtitle: `总计: ${dashboardData.logStats.total}`,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 问候语 */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>早上好！</Text>
        <Text style={styles.greetingSubtext}>
          今天是美好的一天，让我们开始吧 ✨
        </Text>
      </View>

      {/* 快速操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速操作</Text>
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <QuickActionButton key={action.id} action={action} />
          ))}
        </View>
      </View>

      {/* 智能提醒 */}
      {dashboardData.smartTodo.reminders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>智能提醒</Text>
          <View style={styles.cardsContainer}>
            {dashboardData.smartTodo.reminders.slice(0, 3).map((reminder, index) => (
              <ReminderCard
                key={`reminder-${reminder.taskId}-${reminder.reminderType}-${index}`}
                reminder={reminder}
                onPress={() => {
                  // 导航到具体任务
                  navigation.navigate('Tasks' as never, { taskId: reminder.taskId } as never);
                }}
              />
            ))}
          </View>
        </View>
      )}

      {/* 数据概览卡片 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据概览</Text>
        <View style={styles.insightCardsGrid}>
          {insightCards.map((card) => (
            <View key={card.id} style={styles.insightCardItem}>
              <InsightCard data={card} />
            </View>
          ))}
        </View>
      </View>

      {/* 推荐任务 */}
      {dashboardData.smartTodo.recommendedTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推荐任务</Text>
          <View style={styles.cardsContainer}>
            {dashboardData.smartTodo.recommendedTasks.slice(0, 2).map((task, index) => (
              <RecommendedTaskCard
                key={`recommended-${task.taskId}-${index}`}
                task={task}
                onPress={() => {
                  // 导航到具体任务
                  navigation.navigate('Tasks' as never, { taskId: task.taskId } as never);
                }}
              />
            ))}
          </View>
        </View>
      )}


      <View style={styles.bottomSpacer} />

      {/* 快速新建任务弹窗 */}
      <QuickCreateTaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onSuccess={() => {
          // 创建任务后刷新仪表盘数据（延迟一点避免童步问题）
          setTimeout(() => {
            loadDashboardData();
          }, 500);
          navigation.navigate('Tasks');
        }}
      />

      {/* 快速记录日志弹窗 */}
      <QuickCreateLogModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
        onSuccess={() => {
          // 创建日志后刷新仪表盘数据（延迟一点避免童步问题）
          setTimeout(() => {
            loadDashboardData();
          }, 500);
          navigation.navigate('Logs');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  greetingContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  insightCardsGrid: {
    paddingHorizontal: 20,
  },
  insightCardItem: {
    marginBottom: 12,
    width: '100%',
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});