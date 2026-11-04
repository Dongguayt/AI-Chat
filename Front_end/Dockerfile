# 阶段一：构建
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 阶段二：Nginx 部署
FROM nginx:alpine
# 复制打包后的静态文件
COPY --from=build /app/dist /usr/share/nginx/html
# 复制我们的 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80