#!/bin/bash

echo "🔍 检查服务器环境配置"
echo "======================"
echo ""

echo "1. 检查 Node.js 版本:"
node --version
echo ""

echo "2. 检查当前目录:"
pwd
echo ""

echo "3. 检查环境变量文件:"
if [ -f .env ]; then
    echo "   ✅ .env 文件存在"
    echo "   文件内容预览（隐藏敏感信息）:"
    grep -E "^[^#]" .env | sed 's/=.*/=***/'
else
    echo "   ❌ .env 文件不存在"
fi
echo ""

echo "4. 检查邮件相关环境变量:"
echo "   ALIBABA_CLOUD_ACCESS_KEY_ID: $(if [ -z "$ALIBABA_CLOUD_ACCESS_KEY_ID" ]; then echo "❌ 未设置"; else echo "✅ 已设置"; fi)"
echo "   ALIBABA_CLOUD_ACCESS_KEY_SECRET: $(if [ -z "$ALIBABA_CLOUD_ACCESS_KEY_SECRET" ]; then echo "❌ 未设置"; else echo "✅ 已设置"; fi)"
echo "   ALICLOUD_ACCESS_KEY: $(if [ -z "$ALICLOUD_ACCESS_KEY" ]; then echo "❌ 未设置"; else echo "✅ 已设置"; fi)"
echo "   ALICLOUD_SECRET_KEY: $(if [ -z "$ALICLOUD_SECRET_KEY" ]; then echo "❌ 未设置"; else echo "✅ 已设置"; fi)"
echo "   ALIYUN_MAIL_ACCOUNT: ${ALIYUN_MAIL_ACCOUNT:-未设置}"
echo ""

echo "5. 检查必要的npm包:"
if [ -f package.json ]; then
    echo "   检查阿里云相关包:"
    grep -E "@alicloud/(dm20151123|openapi-client|tea-util|credentials)" package.json || echo "   ⚠️  未找到阿里云SDK包"
fi
echo ""

echo "📌 提示:"
echo "   - 如果环境变量未设置，请在 .env 文件中添加"
echo "   - 或者通过 export 命令设置环境变量"
echo "   - 确保发信地址已在阿里云邮件推送控制台验证"
echo ""
echo "测试邮件服务: node test-email.js your-email@example.com"