import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalLogs: number;
  daysActive: number;
}


const subscriptionTiers = {
  free: { name: '免费版', color: '#9E9E9E' },
  pro: { name: '专业版', color: '#2196F3' },
  premium: { name: '高级版', color: '#FF9800' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState<UserStats>({ totalTasks: 0, completedTasks: 0, totalLogs: 0, daysActive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  // 当页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 获取真实的统计数据
      const [taskStats, logStats] = await Promise.all([
        api.get('/tasks/statistics'),
        api.get('/logs/statistics')
      ]);
      
      console.log('完整的任务响应:', taskStats);
      console.log('任务统计数据:', taskStats.data);
      console.log('日志统计数据:', logStats.data);
      console.log('任务总数:', taskStats.data?.data?.total);
      console.log('完成任务数:', taskStats.data?.data?.completed);
      console.log('日志总数:', logStats.data?.data?.total);
      
      const newStats = {
        totalTasks: taskStats.data?.data?.total || 0,
        completedTasks: taskStats.data?.data?.completed || 0,
        totalLogs: logStats.data?.data?.total || 0,
        daysActive: Math.floor((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) || 1,
      };
      
      console.log('设置的统计数据:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 如果接口失败，使用默认值
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        totalLogs: 0,
        daysActive: 1,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      '确认退出',
      '您确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '退出', 
          style: 'destructive',
          onPress: async () => {
            try {
              // 清除本地存储
              await AsyncStorage.multiRemove(['access_token', 'user', 'userSettings']);
              logout();
            } catch (error) {
              console.error('退出登录失败:', error);
              Alert.alert('错误', '退出登录失败');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '删除账号',
      '警告：此操作将永久删除您的账号和所有数据，且无法恢复。您确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '我知道风险',
          style: 'destructive',
          onPress: () => {
            Alert.alert('功能开发中', '该功能正在开发中，请联系客服');
          },
        },
      ]
    );
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100).toFixed(1) : '0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || '未知用户'}</Text>
          <Text style={styles.userEmail}>{user?.email || '未知邮箱'}</Text>
          <View style={styles.subscriptionBadge}>
            <Text
              style={[
                styles.subscriptionText,
                { color: subscriptionTiers[user?.subscriptionTier as keyof typeof subscriptionTiers]?.color || '#9E9E9E' },
              ]}
            >
              {subscriptionTiers[user?.subscriptionTier as keyof typeof subscriptionTiers]?.name || '未知版本'}
            </Text>
          </View>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>使用统计</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalTasks}</Text>
                <Text style={styles.statLabel}>总任务数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completionRate}%</Text>
                <Text style={styles.statLabel}>完成率</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalLogs}</Text>
                <Text style={styles.statLabel}>日志条数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.daysActive}</Text>
                <Text style={styles.statLabel}>活跃天数</Text>
              </View>
            </View>
          )}
        </View>


        {/* 其他操作 */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>其他</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('About' as never)}
          >
            <Text style={styles.actionText}>关于 TimeWeave</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Help' as never)}
          >
            <Text style={styles.actionText}>帮助与支持</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          >
            <Text style={styles.actionText}>隐私政策</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Terms' as never)}
          >
            <Text style={styles.actionText}>用户协议</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 危险操作 */}
        <View style={styles.dangerCard}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>删除账号</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
  },
  actionArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  bottomSpacer: {
    height: 20,
  },
});