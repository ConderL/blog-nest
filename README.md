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

## 服务器部署

### 环境准备

1. **安装Node.js（推荐v16+）**
   ```bash
   # 使用nvm安装Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   source ~/.bashrc
   nvm install 16
   nvm use 16
   ```

2. **安装MySQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   
   # CentOS/RHEL
   sudo yum install mysql-server
   sudo systemctl start mysqld
   sudo systemctl enable mysqld
   
   # 配置MySQL
   sudo mysql_secure_installation
   ```

3. **安装PNPM**
   ```bash
   npm install -g pnpm
   ```

### 后端部署（blog-nest）

1. **克隆代码并进入目录**
   ```bash
   git clone <repository-url>
   cd blog/blog-nest
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   # 创建.env文件
   cp .env.example .env
   
   # 编辑配置
   nano .env
   ```
   
   基本配置内容：
   ```
   NODE_ENV=production
   PORT=3000
   
   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_DATABASE=blog
   
   # JWT配置
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=24h
   ```

4. **编译项目**
   ```bash
   pnpm build
   ```

5. **运行数据库初始化脚本**
   ```bash
   mysql -u root -p blog < fix-db.sql
   ```

6. **使用PM2运行项目**
   ```bash
   # 安装PM2
   npm install -g pm2
   
   # 启动服务
   pm2 start dist/main.js --name blog-nest
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

### 前端部署（blog-vue）

1. **进入前端目录**
   ```bash
   cd ../blog-vue
   ```

2. **安装依赖**
   ```bash
   # 博客前台
   cd conder-blog
   pnpm install
   
   # 管理后台
   cd ../conder-admin
   pnpm install
   ```

3. **配置API地址**
   
   修改前台配置文件（`.env.production`）：
   ```
   VITE_APP_BASE_API=/api
   ```
   
   修改后台配置文件（`.env.production`）：
   ```
   VITE_APP_BASE_API=/admin-api
   ```

4. **构建前端项目**
   ```bash
   # 博客前台
   cd ../conder-blog
   pnpm build
   
   # 管理后台
   cd ../conder-admin
   pnpm build
   ```

5. **使用Nginx部署**
   
   安装Nginx：
   ```bash
   sudo apt install nginx
   ```
   
   配置Nginx：
   ```bash
   sudo nano /etc/nginx/sites-available/blog
   ```
   
   配置内容：
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # 博客前台
       location / {
           root /path/to/blog/blog-vue/conder-blog/dist;
           try_files $uri $uri/ /index.html;
           index index.html;
       }
       
       # 管理后台
       location /admin {
           alias /path/to/blog/blog-vue/conder-admin/dist;
           try_files $uri $uri/ /admin/index.html;
           index index.html;
       }
       
       # API代理 - 博客前台
       location /api/ {
           proxy_pass http://localhost:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # API代理 - 管理后台
       location /admin-api/ {
           proxy_pass http://localhost:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   启用配置并重启Nginx：
   ```bash
   sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **配置HTTPS（可选）**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取并配置SSL证书
   sudo certbot --nginx -d yourdomain.com
   ```

## 常见问题排查

### 管理员登录问题

如果出现"您没有管理员权限"的提示，请确保：

1. 已执行管理员角色设置的SQL脚本
2. 确认用户已被分配管理员角色
3. 临时解决方案：修改`blog-nest/src/modules/auth/auth.service.ts`文件，注释掉`adminLogin`方法中的角色检查代码

### 数据库连接问题

1. 检查MySQL服务是否运行：`sudo systemctl status mysql`
2. 确认数据库用户名和密码正确
3. 检查数据库连接权限：`GRANT ALL PRIVILEGES ON blog.* TO 'user'@'localhost';`

### 服务启动失败

1. 检查日志：`pm2 logs blog-nest`
2. 确保端口未被占用：`netstat -tulpn | grep 3000`
3. 检查环境变量配置是否正确

### 前端访问问题

1. 确认Nginx配置是否正确：`nginx -t`
2. 检查Nginx错误日志：`tail -f /var/log/nginx/error.log`
3. 确保API代理配置正确指向后端服务

## 系统维护

### 备份数据库

```bash
# 创建备份
mysqldump -u root -p blog > blog_backup_$(date +%Y%m%d).sql

# 定期备份（Cron任务）
echo "0 2 * * * mysqldump -u root -p'password' blog > /path/to/backups/blog_backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

### 更新系统

```bash
# 拉取最新代码
git pull

# 更新依赖
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart blog-nest
```

### 日志管理

```bash
# 查看应用日志
pm2 logs blog-nest

# 日志轮转
pm2 install pm2-logrotate
```

## 技术支持

如有任何问题，请提交Issue或联系项目维护者。

## 许可证

项目使用MIT许可证，详情请查看LICENSE文件。
