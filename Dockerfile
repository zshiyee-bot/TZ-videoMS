# ============================================
# 生产环境多阶段构建 Dockerfile
# ============================================

# 阶段 1: 构建应用
FROM node:24-slim AS builder

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# 安装构建依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY tsconfig*.json ./

# 安装依赖并构建
RUN pnpm install --frozen-lockfile && \
    pnpm run server:build

# ============================================
# 阶段 2: 生产运行环境
# ============================================
FROM node:24-slim

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends gosu && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/apps/server/dist ./

# 复制启动脚本
COPY --from=builder /app/apps/server/start-docker.sh ./

# 创建数据目录
RUN mkdir -p /home/node/trilium-data && \
    chown -R node:node /home/node/trilium-data

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["sh", "./start-docker.sh"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD gosu node node /app/docker_healthcheck.cjs || exit 1
