# 博客系统部署与设置指南

## 项目简介

本项目是一个基于NestJS和Vue3开发的个人博客系统，包含前台展示和后台管理两部分。项目采用前后端分离开发模式，使用TypeScript作为主要开发语言。

## 项目结构

- `blog-nest`: 后端API服务，基于NestJS框架
- `blog-vue/conder-blog`: 博客前台，基于Vue3
- `blog-vue/conder-admin`: 博客管理后台，基于Vue3 + Element Plus

## 本地开发

### 安装依赖

```bash
# 安装后端依赖
cd blog-nest
pnpm install

# 安装前台依赖
cd ../blog-vue/conder-blog
pnpm install

# 安装后台依赖
cd ../conder-admin
pnpm install
```

### 开发环境运行

```bash
# 运行后端服务
cd blog-nest
pnpm run start:dev

# 运行前台
cd ../blog-vue/conder-blog
pnpm run dev

# 运行后台
cd ../blog-vue/conder-admin
pnpm run dev
```

## 数据库初始化

项目使用TypeORM进行数据库迁移和初始化，提供了几种方式来初始化数据库：

### 本地开发环境

```bash
# 运行数据库初始化和迁移脚本
npm run db:init
```

这个命令会执行以下操作：
1. 修复访问日志表结构
2. 初始化基础数据（创建管理员角色和管理员用户）
3. 初始化菜单数据和角色菜单关联

### Docker环境

在Docker环境中，数据库初始化会在容器启动时自动执行。Docker入口脚本（`docker-entrypoint.sh`）会：

1. 等待MySQL数据库启动并可用
2. 执行数据库初始化程序
3. 启动应用程序

如果您需要手动初始化数据库，可以在应用容器中运行：

```bash
docker-compose exec app node dist/database-init.js
```

### 其他初始化命令

```bash
# 同步数据库表结构（根据实体定义）
npm run db:sync

# 构建并初始化数据库（用于Docker环境）
npm run db:docker-init

# 使用TypeORM迁移命令
npm run migration:run
npm run migration:revert
```

## 管理员账户

初始化数据库后，将创建以下默认管理员账户：

- 用户名: admin@blog.com
- 密码: admin123

出于安全考虑，请在首次登录后修改默认密码。

## 数据表结构

本项目使用以下主要数据表：

- `users` - 用户表
- `roles` - 角色表
- `user_roles` - 用户角色关联表
- `menus` - 菜单表
- `role_menus` - 角色菜单关联表
- `articles` - 文章表
- `categories` - 分类表
- `tags` - 标签表
- `article_tags` - 文章标签关联表
- `comments` - 评论表
- `site_config` - 站点配置表
- `visit_logs` - 访问日志表

## 生产环境部署

本项目提供多种部署方式，包括传统服务器部署、Docker容器部署和云服务部署。选择符合您需求的方式进行部署。

### 阿里云 CentOS 7.6 部署指南

#### 1. 服务器初始化配置

首先需要对新创建的CentOS 7.6服务器进行基本配置：

```bash
# 更新系统包
sudo yum update -y

# 安装常用工具
sudo yum install -y wget curl vim git unzip net-tools

# 配置防火墙，开放必要端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3300/tcp  # NestJS应用端口
sudo firewall-cmd --reload

# 检查防火墙状态
sudo firewall-cmd --list-all
```

#### 2. 安装Node.js环境

CentOS 7.6上安装Node.js v16：

```bash
# 添加NodeSource源
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -

# 安装Node.js
sudo yum install -y nodejs

# 确认安装版本
node -v  # 应显示v16.x.x
npm -v   # 确认npm已安装

# 安装pnpm
sudo npm install -g pnpm

# 确认pnpm安装成功
pnpm -v
```

#### 3. 安装MySQL 8

CentOS 7.6上安装MySQL数据库：

```bash
# 添加MySQL源
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022

# 安装MySQL服务器
sudo yum install -y mysql-community-server

# 启动MySQL服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 检查MySQL状态
sudo systemctl status mysqld

# 获取MySQL临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# 执行MySQL安全配置向导
sudo mysql_secure_installation
# 按提示操作：
# 1. 输入临时密码
# 2. 设置新密码
# 3. 移除匿名用户
# 4. 禁止root远程登录
# 5. 移除测试数据库
# 6. 重新加载权限表
```

为博客创建专用数据库和用户：

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库和用户
mysql> CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> CREATE USER 'bloguser'@'localhost' IDENTIFIED BY 'your_secure_password';
mysql> GRANT ALL PRIVILEGES ON blog.* TO 'bloguser'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> EXIT;
```

#### 4. 安装Redis (用于消息队列)

```bash
# 安装EPEL源
sudo yum install -y epel-release

# 安装Redis
sudo yum install -y redis

# 启动Redis并设置开机自启
sudo systemctl start redis
sudo systemctl enable redis

# 检查Redis状态
sudo systemctl status redis
```

#### 5. 部署后端应用 (blog-nest)

```bash
# 创建应用目录
sudo mkdir -p /var/www/blog
sudo chown -R $USER:$USER /var/www/blog

# 安装Git
sudo yum install git -y

# 克隆代码仓库
cd /var/www/blog
git clone <repository-url> .
cd blog-nest

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
vim .env

# 编辑.env文件，配置关键信息
# PORT=3300
# NODE_ENV=production
# DB_HOST=localhost
# DB_PORT=3306
# DB_USERNAME=bloguser
# DB_PASSWORD=your_secure_password
# DB_DATABASE=blog
# JWT_SECRET=your_strong_random_jwt_secret
# REDIS_HOST=localhost
# REDIS_PORT=6379

# 编译项目
pnpm build

# 初始化数据库
pnpm db:init

# 安装PM2进程管理器
sudo npm install -g pm2

# 使用PM2启动应用
pm2 start dist/main.js --name blog-nest

# 设置PM2开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

#### 6. 部署前端应用 (blog-vue)

```bash
# 进入前端目录
cd /var/www/blog/blog-vue

# 配置前台应用
cd conder-blog
pnpm install

# 修改环境变量配置
vim .env.production
# 设置API地址，例如：VITE_APP_BASE_API=http://your_server_ip:3300/api

# 构建前台应用
pnpm build

# 配置管理后台
cd ../conder-admin
pnpm install

# 修改环境变量配置
vim .env.production
# 设置API地址，例如：VITE_APP_BASE_API=http://your_server_ip:3300/admin-api

# 构建管理后台
pnpm build
```

#### 7. 安装并配置Nginx

```bash
# 安装Nginx源
sudo yum install -y epel-release

# 安装Nginx
sudo yum install -y nginx

# 启动Nginx并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建博客站点配置
sudo vim /etc/nginx/conf.d/blog.conf
```

在`blog.conf`文件中添加以下配置：

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为您的域名或服务器IP
    
    # 博客前台
    location / {
        root /var/www/blog/blog-vue/conder-blog/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # 管理后台
    location /admin {
        alias /var/www/blog/blog-vue/conder-admin/dist;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # API反向代理 - 前台
    location /api/ {
        proxy_pass http://localhost:3300/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API反向代理 - 后台
    location /admin-api/ {
        proxy_pass http://localhost:3300/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 检查Nginx配置
sudo nginx -t

# 如果配置正确，重新加载Nginx
sudo systemctl reload nginx
```

#### 8. 配置HTTPS（可选）

如果您有域名并想启用HTTPS，可以使用Let's Encrypt的Certbot：

```bash
# 安装Certbot
sudo yum install -y certbot python2-certbot-nginx

# 获取并安装SSL证书
sudo certbot --nginx -d your_domain.com

# 证书自动续期设置
sudo certbot renew --dry-run
```

#### 9. 上传文件目录配置

创建上传文件的目录并设置权限：

```bash
# 创建上传目录
sudo mkdir -p /var/www/blog/public/uploads
sudo chown -R nginx:nginx /var/www/blog/public

# 在Nginx配置中添加上传文件的访问路径
sudo vim /etc/nginx/conf.d/blog.conf
```

在Nginx配置中添加：

```nginx
# 上传文件访问
location /uploads/ {
    alias /var/www/blog/public/uploads/;
}
```

```bash
# 重新加载Nginx配置
sudo nginx -t
sudo systemctl reload nginx
```

#### 10. 系统监控和日志管理

```bash
# 查看应用日志
pm2 logs blog-nest

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 设置PM2日志轮转
pm2 install pm2-logrotate
```

#### 11. 系统维护

定期更新和备份：

```bash
# 备份数据库
mysqldump -u root -p blog > /var/backups/blog_$(date +%Y%m%d).sql

# 定期更新系统
sudo yum update -y

# 重启服务
sudo systemctl restart mysqld
sudo systemctl restart nginx
pm2 restart blog-nest
```

#### 12. 故障排查

如果遇到问题，检查以下几点：

1. **检查服务状态**：
   ```bash
   sudo systemctl status mysqld
   sudo systemctl status nginx
   sudo systemctl status redis
   pm2 status
   ```

2. **检查防火墙**：
   ```bash
   sudo firewall-cmd --list-all
   ```

3. **检查日志**：
   ```bash
   pm2 logs blog-nest
   sudo tail -f /var/log/nginx/error.log
   sudo journalctl -u mysqld
   ```

4. **检查SELinux**：
   ```bash
   # 如果遇到权限问题，可能需要调整SELinux
   sudo sestatus
   
   # 临时禁用SELinux
   sudo setenforce 0
   
   # 永久禁用SELinux（需重启）
   sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
   ```

5. **网络连接测试**：
   ```bash
   # 检查端口是否开放
   sudo netstat -tulpn | grep LISTEN
   
   # 测试数据库连接
   mysql -u bloguser -p -h localhost blog
   ```

6. **内存和磁盘空间检查**：
   ```bash
   free -h
   df -h
   ```

