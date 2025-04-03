FROM node:18-alpine AS builder
WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm
RUN pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml ./
RUN pnpm install
RUN pnpm add @fastify/static
COPY . .
RUN pnpm build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
EXPOSE 3000
CMD ["node", "dist/main.js"]