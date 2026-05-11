# ============================================
# 生产环境多阶段构建 Dockerfile
# ============================================

# 阶段 1: 构建应用
FROM node:24-slim AS builder

# 启用 pnpm 并配置国内镜像源
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate && \
    pnpm config set registry https://registry.npmmirror.com

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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml contributors.json ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY tsconfig*.json ./

# 安装依赖
RUN echo "========================================" && \
    echo "步骤 1/4: 安装依赖 (pnpm install)" && \
    echo "========================================" && \
    pnpm install --frozen-lockfile || (echo "❌ 错误：依赖安装失败！" && exit 1) && \
    echo "✅ 依赖安装成功"

# 构建应用
RUN echo "" && \
    echo "========================================" && \
    echo "步骤 2/4: 构建应用 (pnpm run server:build)" && \
    echo "========================================" && \
    pnpm run server:build || (echo "❌ 错误：构建失败！请检查上方构建日志" && exit 1) && \
    echo "✅ 构建命令执行成功"

# 验证构建产物
RUN echo "" && \
    echo "========================================" && \
    echo "步骤 3/4: 验证构建产物" && \
    echo "========================================" && \
    echo "检查目录结构：" && \
    ls -la /app/apps/server/dist/ || (echo "❌ 错误：dist 目录不存在！" && exit 1) && \
    echo "" && \
    echo "检查 public 目录：" && \
    ls -la /app/apps/server/dist/public/ || (echo "❌ 错误：public 目录不存在！前端未构建" && exit 1) && \
    echo "" && \
    echo "检查关键文件：" && \
    test -f /app/apps/server/dist/public/index.html && echo "  ✅ index.html 存在" || (echo "  ❌ index.html 不存在" && exit 1) && \
    test -d /app/apps/server/dist/public/src && echo "  ✅ src 目录存在" || (echo "  ❌ src 目录不存在" && exit 1) && \
    echo "" && \
    echo "前端文件列表（前10个）：" && \
    find /app/apps/server/dist/public -type f | head -10 && \
    echo "✅ 构建产物验证通过"

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

# 验证前端文件已复制
RUN echo "" && \
    echo "========================================" && \
    echo "步骤 4/4: 验证运行环境" && \
    echo "========================================" && \
    echo "检查工作目录：" && \
    ls -la /app/ && \
    echo "" && \
    echo "检查 public 目录：" && \
    ls -la /app/public/ || (echo "❌ 错误：public 目录未复制到运行环境！" && exit 1) && \
    echo "" && \
    echo "检查关键文件：" && \
    test -f /app/public/index.html && echo "  ✅ index.html 存在" || (echo "  ❌ index.html 不存在" && exit 1) && \
    test -f /app/main.cjs && echo "  ✅ main.cjs 存在" || (echo "  ❌ main.cjs 不存在" && exit 1) && \
    test -f /app/docker_healthcheck.cjs && echo "  ✅ docker_healthcheck.cjs 存在" || (echo "  ❌ docker_healthcheck.cjs 不存在" && exit 1) && \
    echo "" && \
    echo "✅ 运行环境验证通过" && \
    echo "========================================" && \
    echo "🎉 Docker 镜像构建成功！" && \
    echo "========================================"

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["sh", "./start-docker.sh"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD gosu node node /app/docker_healthcheck.cjs || exit 1
