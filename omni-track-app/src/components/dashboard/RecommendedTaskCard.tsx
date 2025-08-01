import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RecommendedTask } from '../../types/dashboard';

interface Props {
  task: RecommendedTask;
  onPress?: () => void;
}

export const RecommendedTaskCard: React.FC<Props> = ({ task, onPress }) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🎯</Text>
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {formatDuration(task.estimatedDuration)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>
      
      <Text style={styles.reason} numberOfLines={3}>
        {task.reason}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.actionText}>点击开始任务</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  icon: {
    fontSize: 20,
  },
  durationContainer: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  durationText: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  reason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
});