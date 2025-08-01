import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AITaskAnalysis } from '../../types/task';

interface TimeAnalysisCardProps {
  timeAnalysis: AITaskAnalysis['timeAnalysis'];
}

export const TimeAnalysisCard: React.FC<TimeAnalysisCardProps> = ({ timeAnalysis }) => {
  if (!timeAnalysis.hasTimeConstraints && !timeAnalysis.isRecurring) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ 时间分析</Text>
      
      {timeAnalysis.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>🔥 紧急任务</Text>
        </View>
      )}

      {timeAnalysis.timeKeywords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>识别的时间关键词:</Text>
          <View style={styles.tagsContainer}>
            {timeAnalysis.timeKeywords.map((keyword, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{keyword}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {timeAnalysis.suggestedSchedule && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建议时间安排:</Text>
          <Text style={styles.content}>{timeAnalysis.suggestedSchedule}</Text>
        </View>
      )}

      {(timeAnalysis.suggestedStartDate || timeAnalysis.suggestedEndDate) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建议时间:</Text>
          {timeAnalysis.suggestedStartDate && (
            <Text style={styles.timeText}>
              开始: {timeAnalysis.suggestedStartDate}
              {timeAnalysis.suggestedStartTime && ` ${timeAnalysis.suggestedStartTime}`}
            </Text>
          )}
          {timeAnalysis.suggestedEndDate && (
            <Text style={styles.timeText}>
              结束: {timeAnalysis.suggestedEndDate}
              {timeAnalysis.suggestedEndTime && ` ${timeAnalysis.suggestedEndTime}`}
            </Text>
          )}
        </View>
      )}

      {timeAnalysis.isRecurring && timeAnalysis.suggestedRecurrencePattern && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 重复模式:</Text>
          <Text style={styles.content}>{timeAnalysis.suggestedRecurrencePattern.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  urgentBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  urgentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});