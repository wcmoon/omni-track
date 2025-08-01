import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>用户协议</Text>
          <Text style={styles.lastUpdated}>最后更新：2024年12月</Text>
        </View>

        {/* 引言 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>引言</Text>
          <Text style={styles.paragraph}>
            欢迎使用 TimeWeave！本用户协议（"协议"）是您与 TimeWeave（"我们"、"我方"）之间关于您使用 TimeWeave 应用程序和相关服务的法律协议。请仔细阅读本协议的所有条款。使用我们的服务即表示您同意受本协议的约束。
          </Text>
        </View>

        {/* 服务描述 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 服务描述</Text>
          <Text style={styles.paragraph}>
            TimeWeave 是一款智能时间管理与生活记录应用程序，提供以下功能：{'\n\n'}
            • 任务创建、管理和跟踪{'\n'}
            • 生活日志记录和分析{'\n'}
            • AI驱动的个性化建议{'\n'}
            • 数据可视化和洞察分析{'\n'}
            • 多设备数据同步{'\n\n'}
            我们保留随时修改、暂停或终止任何服务功能的权利。
          </Text>
        </View>

        {/* 账户注册 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 账户注册和使用</Text>
          
          <Text style={styles.subTitle}>2.1 账户创建</Text>
          <Text style={styles.paragraph}>
            • 您必须年满13岁才能使用本服务{'\n'}
            • 提供真实、准确、最新的信息{'\n'}
            • 每人只能创建一个账户{'\n'}
            • 您有责任维护账户信息的安全性
          </Text>

          <Text style={styles.subTitle}>2.2 账户安全</Text>
          <Text style={styles.paragraph}>
            • 选择强密码并定期更新{'\n'}
            • 不与他人共享账户信息{'\n'}
            • 发现未授权使用时立即通知我们{'\n'}
            • 您对账户下的所有活动承担责任
          </Text>
        </View>

        {/* 使用规则 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 可接受的使用</Text>
          
          <Text style={styles.subTitle}>3.1 允许的使用</Text>
          <Text style={styles.paragraph}>
            您可以将 TimeWeave 用于合法的个人时间管理和生活记录目的。
          </Text>

          <Text style={styles.subTitle}>3.2 禁止的使用</Text>
          <Text style={styles.paragraph}>
            您不得：{'\n\n'}
            • 上传违法、有害、诽谤或侵权内容{'\n'}
            • 尝试未授权访问我们的系统{'\n'}
            • 干扰或破坏服务的正常运行{'\n'}
            • 使用自动化工具进行滥用{'\n'}
            • 反编译或逆向工程应用程序{'\n'}
            • 将服务用于商业竞争目的
          </Text>
        </View>

        {/* 内容和数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 内容和数据所有权</Text>
          
          <Text style={styles.subTitle}>4.1 您的内容</Text>
          <Text style={styles.paragraph}>
            • 您保留对创建内容的所有权{'\n'}
            • 您授予我们处理您内容的必要许可{'\n'}
            • 您确保内容不侵犯第三方权利{'\n'}
            • 您可以随时删除或导出您的内容
          </Text>

          <Text style={styles.subTitle}>4.2 我们的内容</Text>
          <Text style={styles.paragraph}>
            TimeWeave 的软件、设计、功能和其他元素受知识产权法保护，属于我们或我们的许可方所有。
          </Text>
        </View>

        {/* 隐私保护 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 隐私保护</Text>
          <Text style={styles.paragraph}>
            我们非常重视您的隐私。我们的数据收集、使用和保护实践详见《隐私政策》。使用我们的服务即表示您同意按照隐私政策处理您的信息。
          </Text>
        </View>

        {/* 付费服务 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 付费服务和订阅</Text>
          
          <Text style={styles.subTitle}>6.1 订阅费用</Text>
          <Text style={styles.paragraph}>
            • 某些高级功能需要付费订阅{'\n'}
            • 费用按所选订阅计划收取{'\n'}
            • 订阅将自动续费，除非您取消{'\n'}
            • 价格可能会发生变化，我们会提前通知
          </Text>

          <Text style={styles.subTitle}>6.2 退款政策</Text>
          <Text style={styles.paragraph}>
            • 免费试用期内可随时取消{'\n'}
            • 按月订阅不提供退款{'\n'}
            • 按年订阅在30天内可申请按比例退款{'\n'}
            • 因违规而终止的账户不予退款
          </Text>
        </View>

        {/* AI服务 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. AI功能和限制</Text>
          <Text style={styles.paragraph}>
            • AI分析和建议仅供参考{'\n'}
            • 我们不保证AI建议的准确性或完整性{'\n'}
            • 您应独立判断并为自己的决定承担责任{'\n'}
            • AI功能可能会持续改进和更新{'\n'}
            • 您可以在设置中关闭AI功能
          </Text>
        </View>

        {/* 服务可用性 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 服务可用性</Text>
          <Text style={styles.paragraph}>
            • 我们努力提供稳定可靠的服务{'\n'}
            • 偶尔可能因维护或技术问题暂停服务{'\n'}
            • 我们不保证服务100%可用{'\n'}
            • 重要维护会提前通知用户
          </Text>
        </View>

        {/* 责任限制 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 免责声明和责任限制</Text>
          
          <Text style={styles.subTitle}>9.1 免责声明</Text>
          <Text style={styles.paragraph}>
            TimeWeave 按"现状"提供，我们不对以下方面做任何明示或暗示的保证：{'\n\n'}
            • 服务的连续性、及时性、准确性{'\n'}
            • 服务满足您的特定需求{'\n'}
            • 服务完全无错误或安全漏洞
          </Text>

          <Text style={styles.subTitle}>9.2 责任限制</Text>
          <Text style={styles.paragraph}>
            在法律允许的最大范围内，我们的总责任不超过您在过去12个月内支付给我们的费用。我们不对间接、偶然或后果性损害承担责任。
          </Text>
        </View>

        {/* 账户终止 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 账户暂停和终止</Text>
          
          <Text style={styles.subTitle}>10.1 您的终止权</Text>
          <Text style={styles.paragraph}>
            您可以随时停止使用服务并删除账户。删除账户前请导出重要数据。
          </Text>

          <Text style={styles.subTitle}>10.2 我们的终止权</Text>
          <Text style={styles.paragraph}>
            在以下情况下，我们可能暂停或终止您的账户：{'\n\n'}
            • 违反本协议的条款{'\n'}
            • 从事非法或有害活动{'\n'}
            • 长期不活跃的账户{'\n'}
            • 技术或安全原因
          </Text>
        </View>

        {/* 争议解决 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 争议解决</Text>
          <Text style={styles.paragraph}>
            • 我们鼓励通过友好协商解决争议{'\n'}
            • 首先请联系我们的客户支持{'\n'}
            • 无法协商解决的争议将提交仲裁{'\n'}
            • 本协议受中华人民共和国法律管辖
          </Text>
        </View>

        {/* 协议变更 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. 协议修改</Text>
          <Text style={styles.paragraph}>
            我们可能会不时修改本协议。重要变更将通过以下方式通知您：{'\n\n'}
            • 应用内通知{'\n'}
            • 邮件通知{'\n'}
            • 应用启动时的弹窗提醒{'\n\n'}
            继续使用服务即表示您接受修改后的协议。如不同意修改，请停止使用服务。
          </Text>
        </View>

        {/* 其他条款 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. 其他条款</Text>
          
          <Text style={styles.subTitle}>13.1 完整协议</Text>
          <Text style={styles.paragraph}>
            本协议构成您与我们之间关于使用服务的完整协议。
          </Text>

          <Text style={styles.subTitle}>13.2 可分割性</Text>
          <Text style={styles.paragraph}>
            如果协议的任何条款被认定无效，其余条款仍然有效。
          </Text>

          <Text style={styles.subTitle}>13.3 转让</Text>
          <Text style={styles.paragraph}>
            您不得转让本协议下的权利或义务。我们可以转让我们的权利和义务。
          </Text>
        </View>

        {/* 联系信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. 联系我们</Text>
          <Text style={styles.paragraph}>
            如对本用户协议有任何疑问，请联系我们：{'\n\n'}
            邮箱：support@mail.timeweave.xyz{'\n'}
            我们将在合理时间内回复您的询问。{'\n\n'}
            感谢您选择 TimeWeave！
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