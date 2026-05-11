# Trilium Notes - 公司定制版

基于 [TriliumNext/Trilium](https://github.com/TriliumNext/Trilium) 进行公司内部风格化定制的笔记管理系统。

## 项目介绍

这是一个层级化的笔记管理应用，支持富文本编辑、代码高亮、图片管理等功能。本版本针对公司内部使用进行了UI优化和功能定制。

## 快速部署

### 方式一：本地部署

#### 前置要求
- Node.js 18+ 
- pnpm

#### 部署步骤

1. 克隆仓库
```bash
git clone https://github.com/zshiyee-bot/test-buzhidao.git
cd test-buzhidao
```

2. 安装依赖
```bash
pnpm install
```

3. 启动服务
```bash
pnpm run server:start
```

4. 访问应用
打开浏览器访问：http://localhost:8080

### 方式二：Docker 部署（推荐）

> **重要说明**：本项目包含公司定制修改（UI优化、功能增强等），已优化 Docker 构建流程，使用国内镜像源加速。

#### 部署步骤

1. 克隆仓库
```bash
git clone https://github.com/zshiyee-bot/test-buzhidao.git
cd test-buzhidao
```

2. 构建 Docker 镜像
```bash
docker build -t trilium .
```

3. 启动容器
```bash
docker run -d -p 8080:8080 -v trilium-data:/home/node/trilium-data --name trilium trilium
```

4. 访问应用
打开浏览器访问：http://localhost:8080

**说明**：
- 首次构建需要 5-10 分钟
- 数据保存在 Docker volume `trilium-data` 中
- 构建过程包含 4 步验证，确保前端正确打包

#### 查看日志

```bash
# 查看实时日志
docker logs -f trilium

# 查看最近 100 行日志
docker logs --tail 100 trilium
```

#### 停止服务

```bash
# 停止容器
docker stop trilium

# 停止并删除容器（数据不会丢失）
docker rm -f trilium

# 删除数据（谨慎使用）
docker volume rm trilium-data
```

#### 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker build -t trilium .

# 3. 停止并删除旧容器
docker rm -f trilium

# 4. 启动新容器（数据会保留）
docker run -d -p 8080:8080 -v trilium-data:/home/node/trilium-data --name trilium trilium
```

**一键更新命令**：
```bash
git pull && docker build -t trilium . && docker rm -f trilium && docker run -d -p 8080:8080 -v trilium-data:/home/node/trilium-data --name trilium trilium
```

## 生产环境部署建议

- 使用反向代理（Nginx/Caddy）配置 HTTPS
- 定期备份数据目录
- 配置防火墙规则
- 建议使用 Docker 部署以便于管理和更新

## 许可证

本项目基于 AGPL-3.0 许可证开源。

原项目版权归 zadam, Elian Doran 及其他贡献者所有。
