import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressRing as ProgressRingType } from '../../types/dashboard';

interface Props {
  data: ProgressRingType;
  centerText?: string;
  centerSubtext?: string;
}

export const ProgressRing: React.FC<Props> = ({ data, centerText, centerSubtext }) => {
  const { value, maxValue, color, size } = data;
  const progress = Math.min(value / maxValue, 1);
  const progressAngle = progress * 360;

  // 简化版本的进度环，使用基本的圆形和遮罩
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 背景圆 */}
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      
      {/* 进度条 - 简化版本 */}
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ rotate: `${progressAngle - 90}deg` }],
          },
        ]}
      />
      
      {/* 内部圆 */}
      <View
        style={[
          styles.innerCircle,
          {
            width: size - 16,
            height: size - 16,
            borderRadius: (size - 16) / 2,
          },
        ]}
      />
      
      {/* 中心文字 */}
      <View style={styles.centerTextContainer}>
        {centerText && (
          <Text style={[styles.centerText, { color }]}>
            {centerText}
          </Text>
        )}
        {centerSubtext && (
          <Text style={styles.centerSubtext}>
            {centerSubtext}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    backgroundColor: '#f0f0f0',
    borderWidth: 8,
    borderColor: '#e0e0e0',
  },
  progressCircle: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#4CAF50',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: '#f5f5f5',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});