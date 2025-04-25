#!/bin/bash

echo "===== 初始化部署 blog-nest 项目 ====="

# 确保安装了必要的工具
if ! command -v pm2 &> /dev/null; then
  echo "正在安装PM2..."
  npm install -g pm2
fi

if ! command -v pnpm &> /dev/null; then
  echo "正在安装pnpm..."
  npm install -g pnpm
fi

# 创建必要的目录
mkdir -p logs/pm2

# 安装依赖
echo "正在安装依赖..."
pnpm install

# 构建项目
echo "正在构建项目..."
pnpm run build

# 如果需要，初始化数据库
echo "是否需要初始化数据库? (y/n)"
read -r init_db
if [ "$init_db" = "y" ] || [ "$init_db" = "Y" ]; then
  echo "正在初始化数据库..."
  pnpm run db:all
fi

# 启动应用
echo "正在启动应用..."
pm2 start ecosystem.config.js

# 保存PM2配置，确保服务器重启后应用也会自动启动
pm2 save

# 设置PM2开机自启动
echo "设置PM2开机自启动..."
pm2 startup

echo "应用状态:"
pm2 status

echo "===== blog-nest 项目初始化部署完成 ====="
echo "可以使用 ./deploy.sh 进行后续更新部署" 