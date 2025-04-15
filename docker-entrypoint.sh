#!/bin/sh
set -e

echo "准备启动应用..."

# 等待MySQL数据库可用
echo "等待MySQL数据库启动..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
  echo "尝试连接MySQL数据库 (尝试 $attempt/$max_attempts)..."
  if node -e "
    const mysql = require('mysql2/promise');
    async function checkConnection() {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST || 'db',
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || 'root'
        });
        await connection.ping();
        await connection.end();
        return true;
      } catch (err) {
        return false;
      }
    }
    checkConnection().then(success => process.exit(success ? 0 : 1));
  "; then
    echo "MySQL数据库连接成功!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "MySQL数据库未就绪，等待5秒后重试..."
  sleep 5
done

if [ $attempt -gt $max_attempts ]; then
  echo "无法连接到MySQL数据库，超过最大尝试次数!"
  exit 1
fi

# 运行数据库初始化
echo "初始化数据库..."
node dist/database-init.js

# 启动应用
echo "启动NestJS应用..."
exec node dist/main.js 