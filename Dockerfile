FROM node:18-alpine AS build
WORKDIR /app

# 复制package.json和锁文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖项
RUN npm install -g pnpm && pnpm install

# 复制所有源代码
COPY . .

# 构建应用程序
RUN pnpm run build

FROM node:18-alpine
WORKDIR /app

# 复制package.json和锁文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装生产依赖
RUN npm install -g pnpm && pnpm install --production

# 从构建阶段复制构建的应用
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./.env

# 添加初始化脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]