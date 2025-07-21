#!/bin/bash

# Debug script to test task creation
BASE_URL="http://localhost:3001/api"

echo "🔐 Creating test user..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }'

echo -e "\n\n🔐 Logging in to get token..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "testpass123"
  }' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed, cannot get token"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

echo -e "\n🧪 Testing task creation scenarios..."

# Test 1: Valid minimal task
echo -e "\n📝 Test 1: Valid minimal task"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "测试任务"}' | jq

# Test 2: Valid task with all fields
echo -e "\n📝 Test 2: Valid task with all fields"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "完整测试任务",
    "completionTime": "2025-07-19T10:00:00.000Z",
    "isRecurring": false,
    "estimatedDuration": 60,
    "tags": ["测试", "调试"]
  }' | jq

# Test 3: Wrong data types
echo -e "\n📝 Test 3: Wrong data types"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "错误数据类型测试",
    "isRecurring": "true",
    "estimatedDuration": "60分钟",
    "tags": "测试标签"
  }' | jq

# Test 4: Empty description
echo -e "\n📝 Test 4: Empty description"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "",
    "tags": ["测试"]
  }' | jq

# Test 5: Invalid fields
echo -e "\n📝 Test 5: Invalid fields"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "无效字段测试",
    "invalidField": "test",
    "extraProperty": "should not exist"
  }' | jq