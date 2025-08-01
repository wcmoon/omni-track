import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>隐私政策</Text>
          <Text style={styles.lastUpdated}>最后更新：2024年12月</Text>
        </View>

        {/* 引言 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>引言</Text>
          <Text style={styles.paragraph}>
            TimeWeave（"我们"、"我方"）非常重视用户的隐私保护。本隐私政策详细说明了我们如何收集、使用、存储和保护您的个人信息。使用 TimeWeave 应用程序即表示您同意本政策的条款。
          </Text>
        </View>

        {/* 信息收集 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 信息收集</Text>
          
          <Text style={styles.subTitle}>1.1 主动提供的信息</Text>
          <Text style={styles.paragraph}>
            • 账户信息：用户名、邮箱地址、密码{'\n'}
            • 任务和日志内容：您创建的任务、日志记录等内容{'\n'}
            • 偏好设置：应用设置、通知偏好等
          </Text>

          <Text style={styles.subTitle}>1.2 自动收集的信息</Text>
          <Text style={styles.paragraph}>
            • 设备信息：设备型号、操作系统版本{'\n'}
            • 使用数据：应用使用时间、功能使用频率{'\n'}
            • 技术信息：IP地址、设备标识符（匿名化处理）
          </Text>
        </View>

        {/* 信息使用 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 信息使用</Text>
          <Text style={styles.paragraph}>
            我们收集的信息用于以下目的：{'\n\n'}
            • 提供和维护应用服务{'\n'}
            • 个性化用户体验和AI分析{'\n'}
            • 发送重要通知和更新{'\n'}
            • 改进产品功能和服务质量{'\n'}
            • 确保账户安全和防止滥用{'\n'}
            • 遵守法律法规要求
          </Text>
        </View>

        {/* 信息共享 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 信息共享</Text>
          <Text style={styles.paragraph}>
            我们不会出售、交易或转让您的个人信息给第三方，除非：{'\n\n'}
            • 获得您的明确同意{'\n'}
            • 法律法规要求{'\n'}
            • 保护我们的权利和安全{'\n'}
            • 与可信的服务提供商合作（严格按照保密协议）
          </Text>
        </View>

        {/* 数据存储 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 数据存储与安全</Text>
          
          <Text style={styles.subTitle}>4.1 存储位置</Text>
          <Text style={styles.paragraph}>
            您的数据存储在安全的云服务器上，采用行业标准的加密技术保护。
          </Text>

          <Text style={styles.subTitle}>4.2 安全措施</Text>
          <Text style={styles.paragraph}>
            • 数据传输和存储加密{'\n'}
            • 定期安全审计和漏洞检测{'\n'}
            • 严格的访问控制和权限管理{'\n'}
            • 自动备份和灾难恢复机制
          </Text>
        </View>

        {/* AI处理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. AI数据处理</Text>
          <Text style={styles.paragraph}>
            我们使用AI技术分析您的任务和日志内容，以提供个性化建议：{'\n\n'}
            • AI分析在安全环境中进行{'\n'}
            • 不会将您的个人数据用于训练公共AI模型{'\n'}
            • 您可以在设置中关闭AI功能{'\n'}
            • AI生成的洞察仅供您个人使用
          </Text>
        </View>

        {/* 用户权利 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 您的权利</Text>
          <Text style={styles.paragraph}>
            您对个人数据享有以下权利：{'\n\n'}
            • 访问权：查看我们持有的您的个人数据{'\n'}
            • 更正权：更新或修正不准确的信息{'\n'}
            • 删除权：要求删除您的个人数据{'\n'}
            • 限制权：限制某些数据处理活动{'\n'}
            • 数据迁移权：以结构化格式获取您的数据{'\n'}
            • 撤回同意权：随时撤回之前给予的同意
          </Text>
        </View>

        {/* 数据保留 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 数据保留</Text>
          <Text style={styles.paragraph}>
            • 账户数据：账户存续期间及删除后30天内{'\n'}
            • 任务和日志：按用户设置，默认保留2年{'\n'}
            • 技术日志：通常保留90天{'\n'}
            • 法律要求的数据：按法律规定的期限保留
          </Text>
        </View>

        {/* Cookies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cookies和跟踪技术</Text>
          <Text style={styles.paragraph}>
            我们使用必要的技术手段来：{'\n\n'}
            • 维持您的登录状态{'\n'}
            • 记住您的偏好设置{'\n'}
            • 分析应用性能和使用情况{'\n'}
            • 提供个性化体验
          </Text>
        </View>

        {/* 第三方服务 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 第三方服务</Text>
          <Text style={styles.paragraph}>
            我们可能集成以下第三方服务：{'\n\n'}
            • 云存储服务提供商{'\n'}
            • 支付处理服务{'\n'}
            • 分析和监控工具{'\n'}
            • 客户支持平台{'\n\n'}
            这些服务提供商都必须遵守严格的隐私保护标准。
          </Text>
        </View>

        {/* 儿童隐私 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 儿童隐私保护</Text>
          <Text style={styles.paragraph}>
            TimeWeave 不面向13岁以下儿童。我们不会故意收集13岁以下儿童的个人信息。如果我们发现收集了此类信息，将立即删除。
          </Text>
        </View>

        {/* 国际传输 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 跨境数据传输</Text>
          <Text style={styles.paragraph}>
            您的数据可能会传输到您所在国家/地区以外的服务器。我们会采取适当措施确保您的数据在传输过程中得到充分保护，符合适用的数据保护法律。
          </Text>
        </View>

        {/* 政策更新 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. 隐私政策更新</Text>
          <Text style={styles.paragraph}>
            我们可能会定期更新本隐私政策。重大变更将通过应用内通知或邮件通知您。继续使用应用即表示您接受更新后的政策。
          </Text>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. 联系我们</Text>
          <Text style={styles.paragraph}>
            如对本隐私政策有任何疑问或需要行使您的权利，请联系我们：{'\n\n'}
            邮箱：support@mail.timeweave.xyz{'\n'}
            我们将在30天内回复您的询问。
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
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 8,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});