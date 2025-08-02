#!/bin/bash

# 测试邮件发送端点
echo "🔍 测试邮件发送API端点..."

# 测试邮箱
TEST_EMAIL="wcy19960411@gmail.com"

# 1. 测试健康检查
echo -e "\n1️⃣ 测试健康检查端点:"
curl -X GET https://api.timeweave.xyz/api/health -H "Content-Type: application/json" -v

# 2. 测试环境变量状态
echo -e "\n\n2️⃣ 检查环境变量状态:"
curl -X GET https://api.timeweave.xyz/api/auth/test-credentials -H "Content-Type: application/json"

# 3. 测试OPTIONS请求（CORS）
echo -e "\n\n3️⃣ 测试CORS预检请求:"
curl -X OPTIONS https://api.timeweave.xyz/api/auth/send-verification-code \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v

# 4. 测试实际的邮件发送
echo -e "\n\n4️⃣ 测试邮件发送:"
curl -X POST https://api.timeweave.xyz/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8081" \
  -d "{\"email\":\"${TEST_EMAIL}\"}" \
  -v

echo -e "\n\n✅ 测试完成!"