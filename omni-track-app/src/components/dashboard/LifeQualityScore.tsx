import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressRing } from './ProgressRing';

interface Props {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  dimensions: {
    mood: number;
    energy: number;
    productivity: number;
    balance: number;
  };
}

export const LifeQualityScore: React.FC<Props> = ({ score, trend, dimensions }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
    }
  };

  const getTrendText = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return '改善中';
      case 'declining':
        return '需关注';
      case 'stable':
        return '保持稳定';
    }
  };

  const getDimensionName = (key: string) => {
    const names = {
      mood: '心情',
      energy: '能量',
      productivity: '生产力',
      balance: '平衡',
    };
    return names[key] || key;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>生活质量评分</Text>
        <View style={styles.trendContainer}>
          <Text style={styles.trendIcon}>{getTrendIcon(trend)}</Text>
          <Text style={[styles.trendText, { color: getScoreColor(score) }]}>
            {getTrendText(trend)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.scoreContainer}>
          <ProgressRing
            data={{
              value: score,
              maxValue: 100,
              color: getScoreColor(score),
              size: 120,
              strokeWidth: 8,
            }}
            centerText={`${score}`}
            centerSubtext="分"
          />
        </View>

        <View style={styles.dimensionsContainer}>
          {Object.entries(dimensions).map(([key, value]) => (
            <View key={key} style={styles.dimensionItem}>
              <View style={styles.dimensionHeader}>
                <Text style={styles.dimensionName}>
                  {getDimensionName(key)}
                </Text>
                <Text style={[styles.dimensionValue, { color: getScoreColor(value) }]}>
                  {value}
                </Text>
              </View>
              <View style={styles.dimensionBar}>
                <View
                  style={[
                    styles.dimensionProgress,
                    {
                      width: `${value}%`,
                      backgroundColor: getScoreColor(value),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    marginRight: 24,
  },
  dimensionsContainer: {
    flex: 1,
  },
  dimensionItem: {
    marginBottom: 16,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dimensionName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dimensionValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dimensionBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dimensionProgress: {
    height: '100%',
    borderRadius: 3,
  },
});