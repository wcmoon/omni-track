import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SmartDashboard } from '../components/dashboard';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <SmartDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});