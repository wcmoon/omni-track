#!/bin/bash

# 加载.env文件并运行命令
# 使用方法: ./run-with-env.sh <command>

if [ -f .env ]; then
    # 加载环境变量
    set -a
    source .env
    set +a
    
    # 运行传入的命令
    "$@"
else
    echo "❌ .env 文件不存在"
    exit 1
fi