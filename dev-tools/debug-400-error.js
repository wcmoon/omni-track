/**
 * Debug script to test task creation and identify the exact 400 error
 */

const axios = require('axios');

async function testTaskCreation() {
  const baseURL = 'http://localhost:3001/api';
  
  // First login to get token
  const loginResponse = await axios.post(`${baseURL}/auth/login`, {
    email: 'wcy19960411@gmail.com',
    password: 'password123'
  });
  
  const token = loginResponse.data.token;
  console.log('🔐 Login successful, token:', token.substring(0, 20) + '...');
  
  // Test different task creation scenarios
  const testCases = [
    {
      name: 'Valid minimal task',
      data: {
        description: '测试任务'
      }
    },
    {
      name: 'Valid task with all fields',
      data: {
        description: '完整测试任务',
        completionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false,
        estimatedDuration: 60,
        tags: ['测试', '调试']
      }
    },
    {
      name: 'Task with wrong data types',
      data: {
        description: '错误数据类型测试',
        isRecurring: 'true', // wrong type
        estimatedDuration: '60分钟', // wrong type
        tags: '测试标签' // wrong type
      }
    },
    {
      name: 'Task with empty description',
      data: {
        description: '',
        tags: ['测试']
      }
    },
    {
      name: 'Task with invalid fields',
      data: {
        description: '无效字段测试',
        invalidField: 'test',
        extraProperty: 'should not exist'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('📝 Data:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/tasks`, testCase.data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Success:', response.data.message);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
      
      if (error.response?.data) {
        console.log('📋 Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

// Run the test
testTaskCreation().catch(console.error);