import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIAssistant } from '../components/ai';

export default function AIAssistantScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AIAssistant />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
