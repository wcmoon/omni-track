import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { QuickAction } from '../../types/dashboard';

interface Props {
  action: QuickAction;
}

export const QuickActionButton: React.FC<Props> = ({ action }) => {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: action.color + '20', borderColor: action.color }]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
        <Text style={styles.icon}>{action.icon}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    minHeight: 100,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    lineHeight: 16,
  },
});