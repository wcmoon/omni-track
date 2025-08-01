import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InsightCard as InsightCardType } from '../../types/dashboard';

interface Props {
  data: InsightCardType;
}

export const InsightCard: React.FC<Props> = ({ data }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#f44336';
      case 'stable':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: data.color }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        {data.trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendIcon, { color: getTrendColor(data.trend) }]}>
              {getTrendIcon(data.trend)}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.value, { color: data.color }]}>
        {data.value}
      </Text>
      
      {data.subtitle && (
        <Text style={styles.subtitle}>{data.subtitle}</Text>
      )}
    </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
});