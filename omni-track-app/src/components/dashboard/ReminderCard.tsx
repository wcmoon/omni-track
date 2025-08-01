import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SmartReminder } from '../../types/dashboard';

interface Props {
  reminder: SmartReminder;
  onPress?: () => void;
}

export const ReminderCard: React.FC<Props> = ({ reminder, onPress }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return '⚠️';
      case 'due_soon':
        return '⏰';
      case 'suggested_start':
        return '💡';
      case 'break_reminder':
        return '☕';
      default:
        return '📝';
    }
  };

  const getReminderTypeText = (type: string) => {
    switch (type) {
      case 'overdue':
        return '已逾期';
      case 'due_soon':
        return '即将到期';
      case 'suggested_start':
        return '建议开始';
      case 'break_reminder':
        return '休息提醒';
      default:
        return '提醒';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: getPriorityColor(reminder.priority) }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>
            {getReminderTypeIcon(reminder.reminderType)}
          </Text>
          <Text style={[styles.typeText, { color: getPriorityColor(reminder.priority) }]}>
            {getReminderTypeText(reminder.reminderType)}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(reminder.priority) }]}>
          <Text style={styles.priorityText}>
            {reminder.priority === 'high' ? '高' : reminder.priority === 'medium' ? '中' : '低'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>
        {reminder.title}
      </Text>
      
      <Text style={styles.message} numberOfLines={3}>
        {reminder.message}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});