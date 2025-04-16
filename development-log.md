# 博客系统开发日志

## 项目概述

本文档记录了开发博客系统 NestJS 版本（blog-nest）的开发过程。项目采用模块化设计，包含用户认证、文章管理、评论系统、文件上传、站点配置等功能。

## 开发步骤

### 1. 初始化项目结构和配置

#### 1.1 配置模块设置

- 创建配置文件 `configuration.ts` 管理应用程序配置
- 创建配置模块 `config.module.ts` 加载并全局注册配置
- 更新主应用模块，集成配置模块和数据库连接

#### 1.2 基础实体设计

- 创建 `BaseEntity` 基类，包含 ID、创建时间、更新时间等通用字段
- 设置实体继承机制，简化实体定义

### 2. 用户认证模块实现

#### 2.1 用户实体和认证服务

- 创建用户实体 `User`，定义用户信息字段
- 实现用户服务，支持用户注册、查询、验证等功能
- 创建认证服务，实现 JWT 认证逻辑

#### 2.2 认证和安全设置

- 创建 JWT 认证守卫，保护需要认证的 API
- 创建 JWT 策略，处理认证令牌验证
- 实现登录接口，生成 JWT 令牌
- 实现注册接口，创建新用户

#### 2.3 错误处理优化

- 添加详细的错误处理逻辑，提供更友好的错误信息
- 修复用户存在性检查，避免重复用户注册

### 3. 博客核心功能实现

#### 3.1 文章管理

- 创建文章实体 `Article`，包括标题、内容、封面等字段
- 实现文章服务，支持发布、查询、更新、删除文章
- 设计文章与分类、标签的关联关系
- 实现文章查询的筛选和分页功能

#### 3.2 分类和标签管理

- 创建分类 `Category` 和标签 `Tag` 实体
- 实现分类树结构，支持父子分类
- 实现标签服务，支持文章多标签关联
- 添加分类和标签的 CRUD 操作接口

#### 3.3 评论系统

- 创建评论实体 `Comment`，支持多级评论结构
- 实现评论树构建算法，支持嵌套评论查询
- 设计评论与用户、文章的关联关系
- 提供评论的发布、删除和查询接口

### 4. 文件上传功能

- 创建文件实体 `BlogFile`，记录上传文件信息
- 实现文件上传服务，支持文件存储和检索
- 使用 Multer 处理文件上传，支持文件类型验证
- 提供文件管理接口，支持文件上传、删除和查询

### 5. 邮件模块实现 (Email Module)

- 实现用于发送不同类型邮件的功能，包括验证码邮件、评论回复通知和用户注册确认
- 创建EmailService提供邮件发送的核心功能
- 支持纯文本邮件和HTML格式邮件
- 提供邮件发送的API接口

### 6. 上传模块实现 (Upload Module)

- 实现多种文件上传策略，包括本地存储、阿里云OSS、腾讯云COS和七牛云
- 使用策略模式设计不同存储方式的实现
- 集成Multer处理文件上传，支持文件类型和大小验证
- 提供图片、文件和头像上传接口

### 7. OAuth模块实现 (第三方登录)

- 实现第三方登录功能，支持GitHub、Gitee和QQ登录
- 基于OAuth 2.0认证流程设计
- 使用axios处理HTTP请求，与第三方平台交互
- 提供用户信息转换与集成功能

### 8. 搜索模块实现 (Search Module)

- 实现两种搜索方式：MySQL全文搜索和ElasticSearch搜索
- 设计统一的搜索接口，支持不同搜索引擎的无缝切换
- 集成ElasticSearch客户端，支持高级搜索功能
- 提供文章搜索API，支持关键词和分页查询

### 9. 队列模块实现 (Queue Module)

- 基于Bull和Redis实现消息队列功能
- 创建邮件队列处理器，异步处理邮件发送任务
- 实现默认队列处理器，处理通用任务、访问统计和文章更新
- 提供队列管理服务，支持任务添加和队列清理

### 10. 友链管理功能

- 创建友链实体 `Friend`，包含链接名称、地址、头像等信息
- 实现友链服务，支持添加、更新、删除友链
- 提供友链查询接口，支持状态筛选
- 设计前后端友链展示和管理界面

### 11. 站点配置功能

- 创建站点配置实体 `SiteConfig`，支持键值对配置管理
- 实现配置服务，支持单个和批量配置更新
- 设计前端可见性配置，区分管理员和访客可见配置
- 提供配置查询和更新接口

### 12. 统计功能实现

- 创建访问日志实体 `VisitLog`，记录访问信息
- 实现访问统计服务，支持访问量、访问趋势分析
- 设计访问日志记录和查询接口
- 提供今日访问量、总访问量、周访问趋势等统计接口

### 13. 项目优化

- 添加 `.editorconfig`、`.prettierrc`、`.gitattributes` 文件，统一代码风格
- 解决行尾格式问题，确保跨平台兼容性
- 优化错误处理和日志记录，提高系统稳定性
- 添加 Swagger 文档注解，完善 API 文档

## 错误修复

### 1. Raw 导入错误修复

- 在 TaskService 中修复了 Raw 未正确导入的问题
- 删除了未使用的 Interval 和 Timeout 导入

### 2. 用户认证问题修复

- 删除了 UserController 中重复的 login 方法，登录功能集中在 AuthController 中实现
- 简化了 UserService，删除了不必要的依赖和方法
- 修复了 AuthModule 中 JwtModule 的配置方式
- 优化了 JwtStrategy 的实现，确保正确验证用户身份

### 3. 依赖问题修复

- 安装了缺少的依赖：@nestjs/schedule、moment、bcryptjs 等
- 添加了 SearchService 到 BlogModule
- 添加了 TaskModule 到 AppModule
- 创建了 CommonModule 集中管理全局守卫和装饰器

### 4. 权限控制优化

- 实现了全局 JwtAuthGuard，默认保护所有接口
- 添加了 Public 装饰器，用于标记可公开访问的接口
- 配置了白名单路径，GET 请求对特定路径免认证

### 5. 环境配置修复

- 修复了配置文件中的数据库连接参数名称
- 创建了 .env 文件统一管理环境变量
- 添加了 .env.example 作为环境变量模板
- 更新了 .gitignore 以排除敏感配置文件
- 配置了合理的默认值，提高系统健壮性

### 6. 请求路径检查修复

- 修复了 JwtAuthGuard 中的路径检查，解决了 "Cannot read properties of undefined (reading 'startsWith')" 错误
- 使用 `url` 属性代替 `path`，并正确处理查询参数
- 添加了空值检查，提高代码健壮性

### 7. 响应格式统一化

- 更新了 TransformInterceptor，统一接口返回格式
- 优化了异常过滤器，提供更详细的错误信息
- 集成了全局异常处理，捕获所有未处理异常
- 添加了详细的错误日志记录，便于问题排查

## 模块结构

### 用户和认证模块
- `/modules/user` - 用户模块
- `/modules/auth` - 认证模块

### 博客核心模块
- `/modules/blog/entities` - 博客相关实体
- `/modules/blog/services` - 业务逻辑服务
- `/modules/blog/controllers` - API 控制器

### 公共模块
- `/common/entities` - 基础实体
- `/common/guards` - 认证守卫
- `/common/strategies` - 认证策略

### 功能模块
- `/modules/email` - 邮件模块
- `/modules/upload` - 文件上传模块
- `/modules/oauth` - 第三方登录模块
- `/modules/search` - 搜索模块
- `/modules/queue` - 队列模块

## 接口概览

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /users/register` - 用户注册
- `GET /users/profile` - 获取用户信息

### 文章相关
- `POST /articles` - 创建文章
- `PUT /articles/:id` - 更新文章
- `DELETE /articles/:id` - 删除文章
- `GET /articles` - 文章列表（支持分页筛选）
- `GET /articles/:id` - 文章详情

### 分类和标签
- `GET /categories` - 分类列表
- `GET /categories/tree` - 分类树结构
- `GET /tags` - 标签列表

### 评论相关
- `POST /comments` - 发表评论
- `GET /comments/tree` - 评论树结构
- `GET /comments/article/:articleId` - 获取文章评论

### 文件上传
- `POST /upload/image` - 上传图片
- `POST /upload/file` - 上传文件
- `POST /upload/avatar` - 上传头像

### 第三方登录
- `GET /oauth/github` - GitHub登录
- `GET /oauth/gitee` - Gitee登录
- `GET /oauth/qq` - QQ登录

### 搜索功能
- `GET /search/articles` - 搜索文章

### 友链相关
- `GET /friends` - 友链列表
- `POST /friends` - 创建友链
  
### 站点配置
- `GET /site-config/frontend` - 前端配置
- `POST /site-config/batch` - 批量更新配置

### 统计功能
- `GET /visit-logs/today` - 今日访问量
- `GET /visit-logs/total` - 总访问量
- `GET /visit-logs/weekly` - 周访问趋势