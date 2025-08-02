#!/bin/bash

# 数据库问题修复脚本
echo "🔧 数据库问题修复工具"
echo "======================"

# 加载环境变量
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ 环境变量已加载"
else
    echo "❌ .env 文件不存在"
    exit 1
fi

echo ""
echo "📋 当前配置:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:\/\/.*@/:\/\/***:***@/')"

echo ""
echo "🔍 步骤1: 检查数据库状态"
node check-database.js

echo ""
echo "🛠️  步骤2: 选择修复方案"
echo "1) 初始化数据库表结构"
echo "2) 重启应用服务"
echo "3) 查看应用日志"
echo "4) 检查PostgreSQL服务状态"

read -p "请选择操作 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 正在初始化数据库..."
        node init-database.js
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ 数据库初始化完成！"
            echo "🔄 重启应用服务..."
            if command -v pm2 &> /dev/null; then
                pm2 restart omni-track-backend
                echo "✅ PM2 服务已重启"
            else
                echo "⚠️  请手动重启Node.js应用"
            fi
        else
            echo "❌ 数据库初始化失败"
        fi
        ;;
    2)
        echo ""
        echo "🔄 重启应用服务..."
        if command -v pm2 &> /dev/null; then
            pm2 restart omni-track-backend
            pm2 logs omni-track-backend --lines 20
        else
            echo "⚠️  PM2 未安装，请手动重启Node.js应用"
        fi
        ;;
    3)
        echo ""
        echo "📋 查看应用日志..."
        if command -v pm2 &> /dev/null; then
            pm2 logs omni-track-backend --lines 50
        else
            echo "⚠️  PM2 未安装，请查看应用日志文件"
        fi
        ;;
    4)
        echo ""
        echo "🔍 检查PostgreSQL服务..."
        if command -v systemctl &> /dev/null; then
            systemctl status postgresql
        elif command -v service &> /dev/null; then
            service postgresql status
        else
            echo "⚠️  请手动检查PostgreSQL服务状态"
        fi
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎯 下一步建议:"
echo "1. 测试API端点: curl -X GET https://api.timeweave.xyz/api/health"
echo "2. 测试邮件发送: ./test-email-endpoint.sh"
echo "3. 查看实时日志: pm2 logs omni-track-backend"