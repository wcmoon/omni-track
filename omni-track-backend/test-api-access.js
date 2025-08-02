/**
 * API访问测试脚本
 * 用于诊断前端请求远端服务器失败的问题
 * 使用方法: node test-api-access.js
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://api.timeweave.xyz';
const TEST_EMAIL = 'test@example.com';

console.log('🔍 开始诊断API访问问题...\n');

// 测试配置
const tests = [
  {
    name: '健康检查',
    method: 'GET',
    path: '/api/health',
    headers: {}
  },
  {
    name: '获取测试凭据（无认证）',
    method: 'GET',
    path: '/api/auth/test-credentials',
    headers: {}
  },
  {
    name: '发送验证码（POST请求）',
    method: 'POST',
    path: '/api/auth/send-verification-code',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: TEST_EMAIL })
  },
  {
    name: 'CORS预检请求',
    method: 'OPTIONS',
    path: '/api/auth/send-verification-code',
    headers: {
      'Origin': 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  }
];

// 运行测试
async function runTests() {
  for (const test of tests) {
    console.log(`\n📋 测试: ${test.name}`);
    console.log(`   方法: ${test.method} ${test.path}`);
    
    await runSingleTest(test);
    
    // 等待一秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n📊 测试总结:');
  console.log('1. 如果健康检查失败 → Nginx配置或服务器网络问题');
  console.log('2. 如果CORS预检失败 → CORS配置问题');
  console.log('3. 如果POST请求失败但GET成功 → 可能是请求体大小限制或Content-Type问题');
  console.log('4. 如果所有测试都失败 → 检查防火墙、SSL证书或Nginx配置');
}

function runSingleTest(test) {
  return new Promise((resolve) => {
    const url = new URL(API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: test.path,
      method: test.method,
      headers: {
        'User-Agent': 'API-Test-Script',
        ...test.headers
      }
    };
    
    if (test.body) {
      options.headers['Content-Length'] = Buffer.byteLength(test.body);
    }
    
    console.log('   请求头:', JSON.stringify(options.headers, null, 2));
    
    const startTime = Date.now();
    const req = https.request(options, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   ✅ 状态码: ${res.statusCode}`);
        console.log(`   ⏱️  耗时: ${duration}ms`);
        console.log('   响应头:', JSON.stringify(res.headers, null, 2));
        
        // 特别检查CORS头
        if (res.headers['access-control-allow-origin']) {
          console.log(`   🌐 CORS: ${res.headers['access-control-allow-origin']}`);
        }
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log('   响应数据:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('   响应数据:', data.substring(0, 200));
          }
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 请求失败: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(10000, () => {
      console.log('   ❌ 请求超时');
      req.abort();
    });
    
    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

// 测试从不同来源的请求
async function testDifferentOrigins() {
  console.log('\n\n🌐 测试不同来源的CORS请求...');
  
  const origins = [
    'http://localhost:8081',
    'http://localhost:3000',
    'https://app.timeweave.xyz',
    'capacitor://localhost',
    'http://localhost'
  ];
  
  for (const origin of origins) {
    console.log(`\n测试来源: ${origin}`);
    
    const url = new URL(API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/api/auth/send-verification-code',
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    };
    
    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        const allowOrigin = res.headers['access-control-allow-origin'];
        const allowMethods = res.headers['access-control-allow-methods'];
        const allowHeaders = res.headers['access-control-allow-headers'];
        
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log(`   ✅ CORS允许`);
          console.log(`   Allow-Origin: ${allowOrigin || '未设置'}`);
          console.log(`   Allow-Methods: ${allowMethods || '未设置'}`);
          console.log(`   Allow-Headers: ${allowHeaders || '未设置'}`);
        } else {
          console.log(`   ❌ CORS拒绝 (状态码: ${res.statusCode})`);
        }
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ 请求失败: ${error.message}`);
        resolve();
      });
      
      req.end();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 测试实际的邮件发送请求
async function testEmailSending() {
  console.log('\n\n📧 测试实际的邮件发送请求...');
  
  const testEmail = 'wcy19960411@gmail.com';
  const url = new URL(API_BASE_URL);
  
  const postData = JSON.stringify({ email: testEmail });
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: '/api/auth/send-verification-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': 'http://localhost:8081',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    }
  };
  
  return new Promise((resolve) => {
    console.log('发送请求到:', `${API_BASE_URL}${options.path}`);
    console.log('请求数据:', postData);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n响应状态: ${res.statusCode}`);
        console.log('响应头:');
        Object.entries(res.headers).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        console.log('\n响应内容:');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          if (parsed.success) {
            console.log('\n✅ 邮件发送成功！');
          } else {
            console.log('\n❌ 邮件发送失败:', parsed.message);
          }
        } catch (e) {
          console.log(data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('\n❌ 请求错误:', error.message);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

// 运行所有测试
async function runAllTests() {
  await runTests();
  await testDifferentOrigins();
  await testEmailSending();
  
  console.log('\n\n✅ 所有测试完成！');
  console.log('\n💡 如果测试都成功但前端仍然失败，请检查:');
  console.log('1. 前端是否使用了正确的API地址');
  console.log('2. 前端请求是否包含了正确的Content-Type');
  console.log('3. 是否有浏览器安全策略限制（如混合内容）');
  console.log('4. 移动应用是否配置了正确的网络权限');
}

runAllTests().catch(console.error);