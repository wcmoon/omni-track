import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function AboutScreen() {
  const navigation = useNavigation();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('无法打开链接:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 应用信息 */}
        <View style={styles.appInfoCard}>
          <View style={styles.logoContainer}>
            <Text style={styles.appLogo}>⏰</Text>
          </View>
          <Text style={styles.appName}>TimeWeave</Text>
          <Text style={styles.appVersion}>版本 1.0.0</Text>
          <Text style={styles.appDescription}>
            智能时间管理与生活记录应用，帮助您更好地规划时间、管理任务和记录生活轨迹。
          </Text>
        </View>

        {/* 功能特色 */}
        <View style={styles.featuresCard}>
          <Text style={styles.cardTitle}>功能特色</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📝</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>智能任务管理</Text>
              <Text style={styles.featureDescription}>AI驱动的任务分析与优先级推荐</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>数据洞察分析</Text>
              <Text style={styles.featureDescription}>深入了解您的时间使用习惯</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI智能助手</Text>
              <Text style={styles.featureDescription}>个性化建议和自动化工作流程</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☁️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>云端同步</Text>
              <Text style={styles.featureDescription}>多设备数据安全同步</Text>
            </View>
          </View>
        </View>

        {/* 团队信息 */}
        <View style={styles.teamCard}>
          <Text style={styles.cardTitle}>开发团队</Text>
          <Text style={styles.teamDescription}>
            TimeWeave 由一群热爱效率与生活的开发者精心打造，致力于为用户提供最优质的时间管理体验。
          </Text>
          <Text style={styles.teamMission}>
            我们的使命：让每个人都能更好地掌控自己的时间，创造更有意义的生活。
          </Text>
        </View>

        {/* 联系信息 */}
        <View style={styles.contactCard}>
          <Text style={styles.cardTitle}>联系我们</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleLink('mailto:support@mail.timeweave.xyz')}
          >
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>邮箱支持</Text>
              <Text style={styles.contactValue}>support@mail.timeweave.xyz</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleLink('https://timeweave.xyz')}
          >
            <Text style={styles.contactIcon}>🌐</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>官方网站</Text>
              <Text style={styles.contactValue}>timeweave.xyz</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightCard}>
          <Text style={styles.copyrightText}>
            © 2024 TimeWeave. 保留所有权利。
          </Text>
          <Text style={styles.copyrightSubtext}>
            本应用遵循相关隐私政策和用户协议
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogo: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  teamMission: {
    fontSize: 16,
    color: '#2196F3',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#2196F3',
  },
  copyrightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyrightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});