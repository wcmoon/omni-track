#!/bin/bash

# 生产环境启动脚本
# 确保环境变量从.env文件加载

echo "🚀 启动 TimeWeave 后端服务..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在!"
    exit 1
fi

# 加载环境变量
set -a
source .env
set +a

echo "✅ 环境变量已加载"
echo "📍 NODE_ENV: $NODE_ENV"
echo "🔌 PORT: $PORT"
echo "📧 ALIYUN_MAIL_ACCOUNT: $ALIYUN_MAIL_ACCOUNT"

# 检查必要的环境变量
if [ -z "$ALIBABA_CLOUD_ACCESS_KEY_ID" ] && [ -z "$ALICLOUD_ACCESS_KEY" ]; then
    echo "⚠️ 警告: 阿里云凭据未设置"
fi

# 构建项目（如果需要）
if [ ! -d "dist" ]; then
    echo "📦 构建项目..."
    npm run build
fi

# 使用PM2启动（如果安装了PM2）
if command -v pm2 &> /dev/null; then
    echo "🔧 使用PM2启动..."
    pm2 start ecosystem.config.js
    pm2 logs
else
    # 直接启动
    echo "🔧 直接启动Node.js..."
    node dist/main.js
fi