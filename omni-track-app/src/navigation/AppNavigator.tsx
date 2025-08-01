import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from '../services/navigationService';

import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import LogsScreen from '../screens/LogsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';

import { TabParamList, RootStackParamList } from '../types';
import { DashboardIcon, TasksIcon, LogsIcon, ProfileIcon } from '../components/icons/TabIcons';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: '仪表盘',
          tabBarIcon: ({ focused, color, size }) => (
            <DashboardIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{
          tabBarLabel: '任务',
          tabBarIcon: ({ focused, color, size }) => (
            <TasksIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={LogsScreen}
        options={{
          tabBarLabel: '日志',
          tabBarIcon: ({ focused, color, size }) => (
            <LogsIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: '个人',
          tabBarIcon: ({ focused, color, size }) => (
            <ProfileIcon focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen 
          name="AIAssistant" 
          component={AIAssistantScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ 
            headerShown: true,
            title: '关于 TimeWeave',
            headerBackTitleVisible: false
          }}
        />
        <Stack.Screen 
          name="Help" 
          component={HelpScreen}
          options={{ 
            headerShown: true,
            title: '帮助与支持',
            headerBackTitleVisible: false
          }}
        />
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen}
          options={{ 
            headerShown: true,
            title: '隐私政策',
            headerBackTitleVisible: false
          }}
        />
        <Stack.Screen 
          name="Terms" 
          component={TermsScreen}
          options={{ 
            headerShown: true,
            title: '用户协议',
            headerBackTitleVisible: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}