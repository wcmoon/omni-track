import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Log, LogDisplayGroup, LogFilter, LogTypeConfig, DEFAULT_LOG_TYPES, TYPE_COLORS, TYPE_ICONS } from '../types/log';
import { logService } from '../services/logService';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickCreateLogModal } from '../components/modals/QuickCreateLogModal';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function LogsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [logs, setLogs] = useState<LogDisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [logTypes, setLogTypes] = useState<LogTypeConfig[]>(DEFAULT_LOG_TYPES);
  const [dynamicTypes, setDynamicTypes] = useState<Set<string>>(new Set());
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(TYPE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(TYPE_COLORS[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const searchResults = await logService.searchLogs(query.trim(), { 
          types: selectedTypes.size > 0 ? selectedTypes : undefined 
        });
        const groupedResults = logService.groupLogsByDate(searchResults);
        setLogs(groupedResults);
      } catch (error) {
        console.error('搜索日志失败:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadLogs();
    }
  };

  // 从日志数据中收集动态类型
  const collectDynamicTypesFromLogs = (logGroups: LogDisplayGroup[]) => {
    const newTypes = new Set(dynamicTypes);
    
    logGroups.forEach(group => {
      group.logs.forEach(log => {
        if (log.type && log.type.trim()) {
          newTypes.add(log.type);
        }
      });
    });
    
    setDynamicTypes(newTypes);
    
    // 将新发现的类型添加到logTypes中，新类型显示在最前面（除了默认类型）
    const existingValues = new Set(logTypes.map(t => t.value));
    const newCustomTypes: LogTypeConfig[] = [];
    
    newTypes.forEach(type => {
      if (!existingValues.has(type) && !DEFAULT_LOG_TYPES.some(t => t.value === type)) {
        // 为新类型生成配置
        newCustomTypes.push({
          value: type,
          label: type,
          color: TYPE_COLORS[newCustomTypes.length % TYPE_COLORS.length],
          icon: TYPE_ICONS[newCustomTypes.length % TYPE_ICONS.length],
          isCustom: true
        });
      }
    });
    
    if (newCustomTypes.length > 0) {
      // 获取现有的自定义类型和默认类型
      const existingCustomTypes = logTypes.filter(t => t.isCustom);
      const defaultTypes = logTypes.filter(t => !t.isCustom);
      
      // 新类型排在最前面，然后是现有自定义类型，最后是默认类型
      const updatedLogTypes = [...newCustomTypes, ...existingCustomTypes, ...defaultTypes];
      setLogTypes(updatedLogTypes);
    }
  };

  // 测试登录函数
  const testLogin = async () => {
    try {
      console.log('🔐 尝试测试登录...');
      await authService.login({
        email: 'wcy19960411@gmail.com',
        password: 'wcn4911.'
      });
      console.log('✅ 测试登录成功');
    } catch (error) {
      console.error('❌ 测试登录失败:', error);
    }
  };

  const loadLogs = async (isRefreshing = false) => {
    try {
      console.log('📱 开始加载日志数据...');
      
      // 检查是否已认证，如果没有则尝试登录
      const isAuth = await authService.isAuthenticated();
      console.log('🔍 当前认证状态:', isAuth);
      
      if (!isAuth) {
        console.log('🔐 未认证，尝试自动登录...');
        await testLogin();
      }
      
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // 如果有搜索查询，使用搜索API
      if (searchQuery.trim()) {
        const searchResults = await logService.searchLogs(searchQuery.trim(), { 
          types: selectedTypes.size > 0 ? selectedTypes : undefined 
        });
        const groupedResults = logService.groupLogsByDate(searchResults);
        setLogs(groupedResults);
      } else {
        // 调用API获取日志数据
        const data = await logService.getGroupedLogs({ 
          types: selectedTypes.size > 0 ? Array.from(selectedTypes) : undefined 
        });
        setLogs(data);
        // 从加载的日志中收集动态类型
        collectDynamicTypesFromLogs(data);
      }
      console.log('✅ 日志数据加载成功');
      return; // 成功后直接返回，跳过模拟数据
      
      // 模拟数据，实际应从API获取
      const mockLogs: Log[] = [
        {
          id: '1',
          content: '今天参加了产品设计评审会议，讨论了用户界面的改进方案。主要针对移动端的交互体验进行优化，决定采用更简洁的导航结构。',
          type: 'work',
          userId: 'user1',
          createdAt: '2024-01-15T09:30:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
          tags: ['产品设计', '会议', 'UI/UX']
        },
        {
          id: '2',
          content: '阅读了《React Native实战》第5章，学习了导航组件的高级用法。实际动手实现了一个自定义Tab导航，加深了对组件生命周期的理解。',
          type: 'learning',
          userId: 'user1',
          createdAt: '2024-01-15T14:15:00Z',
          updatedAt: '2024-01-15T14:15:00Z',
          tags: ['React Native', '学习', '编程']
        },
        {
          id: '3',
          content: '下午去健身房锻烼，进行了50分钟的力量训练。主要做了卧推、深蹲和硬拉，感觉状态不错，体能有所提升。',
          type: 'health',
          userId: 'user1',
          createdAt: '2024-01-15T18:45:00Z',
          updatedAt: '2024-01-15T18:45:00Z',
          tags: ['健身', '力量训练', '运动']
        },
        {
          id: '4',
          content: '完成了TimeWeave项目的任务管理模块开发，实现了任务的增删改查功能。同时集成了AI分析功能，可以智能生成任务标题和标签。',
          type: 'work',
          userId: 'user1',
          createdAt: '2024-01-14T16:20:00Z',
          updatedAt: '2024-01-14T16:20:00Z',
          tags: ['开发', 'TimeWeave', 'AI集成']
        },
        {
          id: '5',
          content: '与朋友一起去新开的咖啡店尝试手冲咖啡，学习了一些V60手冲技巧。环境很棒，咖啡口感也不错，是个放松的好地方。',
          type: 'daily',
          userId: 'user1',
          createdAt: '2024-01-14T15:30:00Z',
          updatedAt: '2024-01-14T15:30:00Z',
          tags: ['咖啡', '休闲', '朋友']
        },
        {
          id: '6',
          content: '准备下周的上海出差，预订了酒店和高铁票。这次主要是参加技术交流会，希望能学到一些新的技术趋势。',
          type: 'travel',
          userId: 'user1',
          createdAt: '2024-01-13T20:10:00Z',
          updatedAt: '2024-01-13T20:10:00Z',
          tags: ['出差', '上海', '技术交流']
        }
      ];
      
      // 按日期分组排序
      const filteredLogs = mockLogs.filter(log => 
        selectedTypes.size === 0 || selectedTypes.has(log.type)
      );
      const groupedLogs = logService.groupLogsByDate(filteredLogs);
      
      setLogs(groupedLogs);
    } catch (error) {
      console.error('❌ 加载日志失败:', error);
      console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
      Alert.alert('错误', '加载日志数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs(true);
  };

  const groupLogsByDate = (logs: Log[]): LogDisplayGroup[] => {
    const groups: { [key: string]: Log[] } = {};
    
    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    
    // 按日期降序排列，最新的在前
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        logs: groups[date].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }));
  };

  const loadUserTypes = async () => {
    try {
      const storedTypes = await AsyncStorage.getItem('userLogTypes');
      if (storedTypes) {
        const customTypes: LogTypeConfig[] = JSON.parse(storedTypes);
        // 自定义类型显示在前面，默认类型在后面
        setLogTypes([...customTypes, ...DEFAULT_LOG_TYPES]);
      }
    } catch (error) {
      console.error('加载用户类型失败:', error);
    }
  };

  const saveUserTypes = async (types: LogTypeConfig[]) => {
    try {
      const customTypes = types.filter(t => t.isCustom);
      await AsyncStorage.setItem('userLogTypes', JSON.stringify(customTypes));
    } catch (error) {
      console.error('保存用户类型失败:', error);
    }
  };

  useEffect(() => {
    loadUserTypes();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedTypes]);

  const toggleTypeFilter = (type: string) => {
    const newSelectedTypes = new Set(selectedTypes);
    if (newSelectedTypes.has(type)) {
      newSelectedTypes.delete(type);
    } else {
      newSelectedTypes.add(type);
    }
    setSelectedTypes(newSelectedTypes);
  };

  const handleSaveType = async () => {
    if (newTypeLabel.trim()) {
      const newType: LogTypeConfig = {
        value: newTypeLabel.trim(), // 直接使用标签作为值，保持一致性
        label: newTypeLabel.trim(),
        icon: selectedIcon,
        color: selectedColor,
        isCustom: true
      };
      
      // 获取现有的自定义类型和默认类型
      const existingCustomTypes = logTypes.filter(t => t.isCustom);
      const defaultTypes = logTypes.filter(t => !t.isCustom);
      
      // 新类型排在最前面，然后是现有自定义类型，最后是默认类型
      const updatedTypes = [newType, ...existingCustomTypes, ...defaultTypes];
      setLogTypes(updatedTypes);
      await saveUserTypes(updatedTypes);
      
      // 重置表单
      setNewTypeLabel('');
      setSelectedIcon(TYPE_ICONS[0]);
      setSelectedColor(TYPE_COLORS[0]);
      setShowAddTypeModal(false);
    }
  };

  const handleDeleteType = async (typeValue: string) => {
    try {
      // 1. 将该分类下的所有日志改为"其他"类型
      const allLogs = await logService.getAllLogs();
      const logsToUpdate = allLogs.filter(log => log.type === typeValue);
      
      for (const log of logsToUpdate) {
        await logService.updateLog(log.id, { type: 'other' });
      }
      
      // 2. 从分类列表中移除该分类
      const updatedTypes = logTypes.filter(t => t.value !== typeValue);
      setLogTypes(updatedTypes);
      await saveUserTypes(updatedTypes);
      
      // 3. 从选中的过滤器中移除该分类
      const newSelectedTypes = new Set(selectedTypes);
      newSelectedTypes.delete(typeValue);
      setSelectedTypes(newSelectedTypes);
      
      // 4. 重新加载日志列表
      await loadLogs();
      
      Alert.alert('删除成功', '分类已删除，相关日志已移至"其他"分类');
    } catch (error) {
      console.error('删除分类失败:', error);
      Alert.alert('删除失败', '删除分类时发生错误，请重试');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeConfig = (type: string) => {
    return logTypes.find(t => t.value === type) || logTypes[0];
  };

  const renderTypeFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {/* 添加自定义类型按钮 - 放在最左边 */}
      <TouchableOpacity
        style={styles.addTypeButton}
        onPress={() => setShowAddTypeModal(true)}
      >
        <Text style={styles.addTypeIcon}>+</Text>
      </TouchableOpacity>
      
      {logTypes.map((type) => {
        const isSelected = selectedTypes.has(type.value);
        return (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.filterChip,
              { borderColor: type.color },
              isSelected && { backgroundColor: type.color }
            ]}
            onPress={() => toggleTypeFilter(type.value)}
            onLongPress={() => {
              if (type.isCustom) {
                Alert.alert(
                  '删除分类',
                  `确定要删除分类"${type.label}"吗？删除后该分类下的日志将变为"其他"类型。`,
                  [
                    { text: '取消', style: 'cancel' },
                    { 
                      text: '删除', 
                      style: 'destructive',
                      onPress: () => handleDeleteType(type.value)
                    }
                  ]
                );
              }
            }}
          >
            <Text style={styles.filterIcon}>{type.icon}</Text>
            <Text
              style={[
                styles.filterText,
                { color: isSelected ? '#fff' : type.color }
              ]}
            >
              {type.label}
            </Text>
            {type.isCustom && (
              <TouchableOpacity
                style={styles.deleteTypeButton}
                onPress={() => {
                  Alert.alert(
                    '删除分类',
                    `确定要删除分类"${type.label}"吗？删除后该分类下的日志将变为"其他"类型。`,
                    [
                      { text: '取消', style: 'cancel' },
                      { 
                        text: '删除', 
                        style: 'destructive',
                        onPress: () => handleDeleteType(type.value)
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.deleteTypeText}>×</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderAddTypeModal = () => {
    if (!showAddTypeModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>添加自定义类型</Text>
            <TouchableOpacity onPress={() => setShowAddTypeModal(false)}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>类型名称</Text>
            <TextInput
              style={styles.modalInput}
              value={newTypeLabel}
              onChangeText={setNewTypeLabel}
              placeholder="输入类型名称"
              maxLength={6}
            />
          </View>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>选择图标</Text>
            <ScrollView style={styles.iconSelector} showsVerticalScrollIndicator={false}>
              <View style={styles.iconGrid}>
                {TYPE_ICONS.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.selectedIconOption
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>选择颜色</Text>
            <View style={styles.colorSelector}>
              {TYPE_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.modalPreview}>
            <Text style={styles.modalLabel}>预览</Text>
            <View style={[
              styles.previewChip,
              { borderColor: selectedColor }
            ]}>
              <Text style={styles.filterIcon}>{selectedIcon}</Text>
              <Text style={[styles.filterText, { color: selectedColor }]}>
                {newTypeLabel || '示例'}
              </Text>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddTypeModal(false)}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                !newTypeLabel.trim() && styles.modalSaveButtonDisabled
              ]}
              onPress={handleSaveType}
              disabled={!newTypeLabel.trim()}
            >
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleEditLog = (log: Log) => {
    // 创建类型选择项
    const typeOptions = logTypes.map(type => ({
      text: type.label,
      onPress: async () => {
        try {
          await logService.updateLog(log.id, { type: type.value });
          loadLogs(); // 重新加载日志列表
        } catch (error) {
          console.error('更新日志类型失败:', error);
        }
      }
    }));

    Alert.alert(
      '编辑日志分类',
      `当前分类: ${getTypeConfig(log.type).label}`,
      [
        ...typeOptions,
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteLog = (log: Log) => {
    Alert.alert(
      '删除日志',
      '确定要删除这条日志吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await logService.deleteLog(log.id);
              loadLogs(); // 重新加载日志列表
            } catch (error) {
              console.error('删除日志失败:', error);
            }
          },
        },
      ],
    );
  };

  const renderLogItem = (log: Log) => {
    const typeConfig = getTypeConfig(log.type);
    
    return (
      <View key={log.id} style={styles.logItem}>
        <View style={styles.logTimeColumn}>
          <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
          <View style={[styles.logTypeIndicator, { backgroundColor: typeConfig.color }]} />
        </View>
        
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <View style={styles.logTypeChip}>
              <Text style={styles.logTypeIcon}>{typeConfig.icon}</Text>
              <Text style={[styles.logTypeLabel, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
            
            {/* 添加操作按钮 */}
            <View style={styles.logActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditLog(log)}
              >
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteLog(log)}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.logText}>{log.content}</Text>
        </View>
      </View>
    );
  };


  const renderDateGroup = (group: LogDisplayGroup) => (
    <View key={group.date} style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDate(group.date)}</Text>
        <Text style={styles.logCount}>{group.logs.length}条记录</Text>
      </View>
      
      <View style={styles.dateContent}>
        {group.logs.map(log => renderLogItem(log))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>日志</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ 记录日志</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>加载日志数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>日志</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ 记录日志</Text>
        </TouchableOpacity>
      </View>
      
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索日志内容..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#FF9800" style={styles.searchLoader} />
        )}
      </View>
      
      {renderTypeFilters()}
      {renderAddTypeModal()}
      
      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>
            {selectedTypes.size > 0 ? '暂无相关日志' : '暂无日志'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {selectedTypes.size > 0 ? 
              '尝试选择其他类型或创建新日志' : 
              '开始记录你的第一篇日志吧'
            }
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
        >
          {logs.map(group => renderDateGroup(group))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* 快速记录日志弹窗 */}
      <QuickCreateLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          loadLogs(); // 重新加载数据
        }}
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
    padding: 20,
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
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    marginRight: 8,
    height: 28,
    position: 'relative',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteTypeButton: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  addTypeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    marginRight: 16, // 添加右侧间距
  },
  addTypeIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 3,
    borderTopColor: '#FF9800',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logCount: {
    fontSize: 14,
    color: '#666',
  },
  dateContent: {
    backgroundColor: '#fff',
  },
  logItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  logTimeColumn: {
    width: 60,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  logTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  logTypeIcon: {
    fontSize: 12,
  },
  logTypeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  logText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  logTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  logTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  logTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
  // 模态框样式
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  iconSelector: {
    maxHeight: 150,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  iconOption: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedIconOption: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconOptionText: {
    fontSize: 16,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#333',
  },
  modalPreview: {
    marginBottom: 20,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    height: 28,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalSaveButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 新增的样式
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionButtonText: {
    fontSize: 16,
  },
  // 搜索相关样式
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    fontSize: 14,
    color: '#333',
  },
  searchLoader: {
    marginLeft: 8,
  },
});