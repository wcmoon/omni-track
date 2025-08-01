import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const faqData = [
    {
      question: '如何开始使用 TimeWeave？',
      answer: '首次使用时，建议先创建几个任务来熟悉界面。系统会自动为您的任务进行 AI 分析，提供优先级和时间估算建议。您也可以记录日志来跟踪生活轨迹。'
    },
    {
      question: 'AI 分析功能是如何工作的？',
      answer: '我们的 AI 会分析您的任务描述，自动推荐优先级、估算完成时间，并建议相关标签。AI 分析结果会在任务创建后几秒钟内显示，您可以选择接受或修改这些建议。'
    },
    {
      question: '数据是否会同步到云端？',
      answer: '是的，您的数据会自动同步到安全的云端服务器。您可以在设置中控制同步选项。所有数据都经过加密处理，确保隐私安全。'
    },
    {
      question: '如何设置循环任务？',
      answer: '在创建或编辑任务时，点击"设为循环"选项，然后设置重复间隔和时间单位（天、周、月）。系统会根据您的设置自动创建后续任务。'
    },
    {
      question: '可以导出我的数据吗？',
      answer: '目前支持基本的数据导出功能。您可以在设置中找到"数据导出"选项，选择要导出的内容格式。我们正在开发更全面的数据导出功能。'
    },
    {
      question: '忘记密码怎么办？',
      answer: '在登录页面点击"忘记密码"，输入您的邮箱地址，我们会发送重置密码的链接到您的邮箱。如果没有收到邮件，请检查垃圾邮件文件夹。'
    },
    {
      question: '如何删除账号？',
      answer: '在个人资料页面找到"删除账号"选项。请注意，删除账号会永久删除所有数据且无法恢复。建议在删除前先导出重要数据。'
    },
    {
      question: '应用支持哪些平台？',
      answer: 'TimeWeave 目前支持 iOS 和 Android 平台，同时提供 Web 版本。我们计划在未来推出桌面应用程序。'
    }
  ];

  const contactOptions = [
    {
      title: '邮件支持',
      description: '发送详细问题描述',
      icon: '📧',
      action: () => Linking.openURL('mailto:support@mail.timeweave.xyz')
    },
    {
      title: '在线反馈',
      description: '快速反馈功能问题',
      icon: '💬',
      action: () => {
        // 这里可以集成在线客服系统
        Alert.alert('功能开发中', '在线客服功能正在开发中，请暂时使用邮件联系我们');
      }
    },
    {
      title: '用户社区',
      description: '与其他用户交流经验',
      icon: '👥',
      action: () => {
        Alert.alert('功能开发中', '用户社区功能正在开发中，敬请期待');
      }
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const sendFeedback = () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert('提示', '请填写完整的反馈信息');
      return;
    }

    const emailBody = `主题: ${contactForm.subject}\n\n内容:\n${contactForm.message}`;
    const emailUrl = `mailto:support@mail.timeweave.xyz?subject=${encodeURIComponent(contactForm.subject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.openURL(emailUrl).then(() => {
      setContactForm({ subject: '', message: '' });
      Alert.alert('成功', '邮件客户端已打开，请发送您的反馈');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 快速联系方式 */}
        <View style={styles.quickContactCard}>
          <Text style={styles.cardTitle}>快速获得帮助</Text>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactOption}
              onPress={option.action}
            >
              <Text style={styles.contactIcon}>{option.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactDescription}>{option.description}</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 常见问题 */}
        <View style={styles.faqCard}>
          <Text style={styles.cardTitle}>常见问题</Text>
          {faqData.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(index)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Text style={[
                  styles.faqToggle,
                  expandedFAQ === index && styles.faqToggleExpanded
                ]}>
                  {expandedFAQ === index ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedFAQ === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 反馈表单 */}
        <View style={styles.feedbackCard}>
          <Text style={styles.cardTitle}>意见反馈</Text>
          <Text style={styles.feedbackDescription}>
            遇到问题或有建议？请告诉我们，我们会尽快回复您。
          </Text>
          
          <Text style={styles.inputLabel}>问题主题</Text>
          <TextInput
            style={styles.textInput}
            value={contactForm.subject}
            onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            placeholder="请简要描述问题类型"
            placeholderTextColor="#999"
          />
          
          <Text style={styles.inputLabel}>详细描述</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={contactForm.message}
            onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
            placeholder="请详细描述您遇到的问题或建议..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.sendButton} onPress={sendFeedback}>
            <Text style={styles.sendButtonText}>发送反馈</Text>
          </TouchableOpacity>
        </View>

        {/* 联系信息 */}
        <View style={styles.contactInfoCard}>
          <Text style={styles.cardTitle}>联系信息</Text>
          <View style={styles.contactDetail}>
            <Text style={styles.contactDetailLabel}>客服邮箱</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@mail.timeweave.xyz')}>
              <Text style={styles.contactDetailValue}>support@mail.timeweave.xyz</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactDetail}>
            <Text style={styles.contactDetailLabel}>工作时间</Text>
            <Text style={styles.contactDetailText}>周一至周五 9:00 - 18:00 (UTC+8)</Text>
          </View>
          <View style={styles.contactDetail}>
            <Text style={styles.contactDetailLabel}>响应时间</Text>
            <Text style={styles.contactDetailText}>通常在 24 小时内回复</Text>
          </View>
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
  quickContactCard: {
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
  contactOption: {
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
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
  },
  contactArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  faqCard: {
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
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  faqToggleExpanded: {
    transform: [{ rotate: '0deg' }],
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 32,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  feedbackCard: {
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
  feedbackDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfoCard: {
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
  contactDetail: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactDetailValue: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  contactDetailText: {
    fontSize: 16,
    color: '#333',
  },
  bottomSpacer: {
    height: 20,
  },
});