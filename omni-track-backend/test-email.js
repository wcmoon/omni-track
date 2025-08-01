/**
 * 邮件服务测试脚本
 * 使用方法: node test-email.js [目标邮箱]
 * 例如: node test-email.js test@example.com
 */

// 尝试加载.env文件
try {
  require('dotenv').config();
  console.log('📄 已加载 .env 文件');
} catch (e) {
  // 如果没有dotenv，尝试手动加载
  try {
    const fs = require('fs');
    const path = require('path');
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=').trim();
          if (key && value) {
            process.env[key.trim()] = value;
          }
        }
      });
      console.log('📄 手动加载 .env 文件成功');
    }
  } catch (err) {
    console.log('⚠️ 无法加载 .env 文件，使用系统环境变量');
  }
}

const Dm20151123 = require('@alicloud/dm20151123');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Credential = require('@alicloud/credentials');

async function testEmailService() {
  console.log('🧪 开始测试邮件服务...\n');
  
  // 检查环境变量
  console.log('1️⃣ 检查环境变量配置:');
  const requiredEnvVars = [
    'ALIBABA_CLOUD_ACCESS_KEY_ID',
    'ALIBABA_CLOUD_ACCESS_KEY_SECRET',
    'ALIYUN_MAIL_ACCOUNT'
  ];
  
  const altEnvVars = [
    'ALICLOUD_ACCESS_KEY',
    'ALICLOUD_SECRET_KEY'
  ];
  
  let hasCredentials = false;
  
  // 检查主要环境变量
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const masked = value ? value.substring(0, 4) + '****' : '未设置';
    console.log(`   ${varName}: ${masked}`);
    if (varName.includes('ACCESS_KEY') && value) {
      hasCredentials = true;
    }
  });
  
  // 如果主要凭据不存在，检查备用环境变量
  if (!hasCredentials) {
    console.log('\n   检查备用环境变量:');
    altEnvVars.forEach(varName => {
      const value = process.env[varName];
      const masked = value ? value.substring(0, 4) + '****' : '未设置';
      console.log(`   ${varName}: ${masked}`);
      if (value) hasCredentials = true;
    });
  }
  
  if (!hasCredentials) {
    console.error('\n❌ 错误: 未找到阿里云访问凭据!');
    console.error('请设置以下环境变量之一:');
    console.error('- ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET');
    console.error('- 或 ALICLOUD_ACCESS_KEY 和 ALICLOUD_SECRET_KEY');
    process.exit(1);
  }
  
  // 获取测试邮箱
  const testEmail = process.argv[2] || 'test@example.com';
  console.log(`\n2️⃣ 测试发送邮件到: ${testEmail}`);
  
  try {
    // 创建凭据对象
    const credential = new Credential.default();
    
    // 验证凭据
    console.log('\n3️⃣ 验证阿里云凭据...');
    try {
      const cred = await credential.getCredential();
      console.log('   ✅ 凭据加载成功');
    } catch (err) {
      console.error('   ❌ 凭据验证失败:', err.message);
      throw err;
    }
    
    // 创建邮件客户端
    const config = new OpenApi.Config({
      credential: credential,
    });
    config.endpoint = 'dm.aliyuncs.com';
    const client = new Dm20151123.default(config);
    
    // 生成测试验证码
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n4️⃣ 生成测试验证码: ${testCode}`);
    
    // 准备邮件内容
    const singleSendMailRequest = new Dm20151123.SingleSendMailRequest({
      accountName: process.env.ALIYUN_MAIL_ACCOUNT || 'noreply@mail.timeweave.xyz',
      addressType: 1,
      replyToAddress: false,
      toAddress: testEmail,
      subject: 'TimeWeave 邮件服务测试',
      htmlBody: getTestEmailTemplate(testCode),
      textBody: `这是一封测试邮件。验证码: ${testCode}`,
    });
    
    const runtime = new Util.RuntimeOptions({});
    
    // 发送邮件
    console.log('\n5️⃣ 发送测试邮件...');
    console.log(`   发件人: ${singleSendMailRequest.accountName}`);
    console.log(`   收件人: ${singleSendMailRequest.toAddress}`);
    
    const response = await client.singleSendMailWithOptions(singleSendMailRequest, runtime);
    
    console.log('\n✅ 邮件发送成功!');
    console.log('   响应:', JSON.stringify(response, null, 2));
    console.log(`\n📧 请检查邮箱 ${testEmail} 是否收到测试邮件`);
    
  } catch (error) {
    console.error('\n❌ 邮件发送失败!');
    console.error('错误详情:');
    console.error('- 错误码:', error.code || '无');
    console.error('- 错误信息:', error.message || error);
    console.error('- 错误数据:', error.data || '无');
    
    // 针对常见错误提供解决方案
    if (error.code === 'InvalidAccessKeyId') {
      console.error('\n💡 解决方案: Access Key ID 无效，请检查环境变量配置');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('\n💡 解决方案: Access Key Secret 错误，请检查环境变量配置');
    } else if (error.code === 'InvalidSendMail.Address') {
      console.error('\n💡 解决方案: 发件人地址未验证，请在阿里云邮件推送控制台验证发信地址');
    } else if (error.code === 'InvalidAccountName') {
      console.error('\n💡 解决方案: 发件人账户名无效，请检查 ALIYUN_MAIL_ACCOUNT 配置');
    }
    
    process.exit(1);
  }
}

function getTestEmailTemplate(code) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TimeWeave 邮件服务测试</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ff6b35; }
        .content { padding: 20px 0; }
        .code { background-color: #ff6b35; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #ff6b35; margin: 0;">TimeWeave 邮件服务测试</h1>
        </div>
        <div class="content">
          <p>这是一封测试邮件，用于验证邮件服务是否正常工作。</p>
          <p>测试验证码：</p>
          <div class="code">${code}</div>
          <p>如果您收到这封邮件，说明邮件服务配置正确！</p>
          <p style="color: #666; font-size: 14px;">
            测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
          </p>
        </div>
        <div class="footer">
          <p>此邮件由 TimeWeave 邮件服务测试脚本发送</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 运行测试
testEmailService().catch(console.error);