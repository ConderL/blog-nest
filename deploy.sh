#!/bin/bash

echo "===== 开始部署 blog-nest 项目 ====="

# 创建日志目录
mkdir -p logs/pm2

# 拉取最新代码
echo "正在拉取最新代码..."
git pull origin main

# 安装依赖
echo "正在安装依赖..."
pnpm install

# 构建项目
echo "正在构建项目..."
pnpm run build

# 检查是否已经有PM2在运行该应用
if pm2 list | grep -q "blog-nest"; then
  echo "重启应用..."
  pm2 restart blog-nest
else
  echo "首次启动应用..."
  pm2 start ecosystem.config.js
fi

# 保存PM2配置，确保服务器重启后应用也会自动启动
pm2 save

echo "查看应用状态:"
pm2 status

echo "===== blog-nest 项目部署完成 =====" 