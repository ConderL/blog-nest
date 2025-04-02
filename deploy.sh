#!/bin/bash

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 重启应用
pm2 restart ecosystem.config.js 