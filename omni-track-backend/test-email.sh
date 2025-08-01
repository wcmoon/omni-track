#!/bin/bash

# 测试邮件服务脚本
# 使用方法: ./test-email.sh [目标邮箱]

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ 已加载 .env 文件"
else
    echo "❌ .env 文件不存在"
    exit 1
fi

# 检查参数
if [ -z "$1" ]; then
    echo "使用方法: ./test-email.sh your-email@example.com"
    exit 1
fi

# 运行测试
echo "开始测试邮件发送到: $1"
node test-email.js $1