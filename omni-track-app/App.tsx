import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider, useToast } from './src/components/common/ToastProvider';
import { setGlobalReferences } from './src/services/api';

function AppContent() {
  const authContext = useAuth();
  const toastContext = useToast();
  const { isAuthenticated, isLoading } = authContext;

  // 设置全局引用，让API拦截器能够访问
  useEffect(() => {
    setGlobalReferences(authContext, toastContext);
  }, [authContext, toastContext]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
      </View>
    );
  }

  return isAuthenticated ? (
    <AppNavigator />
  ) : (
    <AuthScreen onAuthSuccess={() => {}} />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <StatusBar style="auto" />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
});
