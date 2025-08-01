/**
 * 调试环境变量脚本
 * 用于检查后端API的环境变量状态
 */

const http = require('http');

const API_URL = process.argv[2] || 'http://localhost:3001';

console.log('🔍 检查后端环境变量状态...');
console.log(`📡 API地址: ${API_URL}`);

// 调用测试端点
const options = {
  hostname: new URL(API_URL).hostname,
  port: new URL(API_URL).port || 80,
  path: '/api/auth/test-credentials',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📋 后端环境变量状态:');
    try {
      const result = JSON.parse(data);
      console.log(JSON.stringify(result, null, 2));
      
      // 检查关键环境变量
      if (result.env) {
        const hasAliyunCreds = result.env.ALIBABA_CLOUD_ACCESS_KEY_ID !== 'Not set' || 
                               result.env.ALICLOUD_ACCESS_KEY !== 'Not set';
        const hasMailAccount = result.env.ALIYUN_MAIL_ACCOUNT !== 'Not set';
        
        console.log('\n✅ 检查结果:');
        console.log(`  阿里云凭据: ${hasAliyunCreds ? '✅ 已设置' : '❌ 未设置'}`);
        console.log(`  邮件账户: ${hasMailAccount ? '✅ 已设置' : '❌ 未设置'}`);
        
        if (!hasAliyunCreds || !hasMailAccount) {
          console.log('\n⚠️  环境变量未正确加载到后端应用!');
          console.log('💡 解决方案:');
          console.log('   1. 使用 ./start-production.sh 启动');
          console.log('   2. 或使用 PM2: pm2 start ecosystem.config.js');
          console.log('   3. 或手动加载: source .env && node dist/main.js');
        }
      }
    } catch (e) {
      console.error('解析响应失败:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.log('💡 请确保后端服务正在运行');
});

req.end();