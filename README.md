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
git clone https://github.com/zshiyee-bot/tongzhou-videomanage.git
cd tongzhou-videomanage
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

> **重要说明**：本项目包含公司定制修改（UI优化、功能增强等），使用自动构建的 Docker 镜像。

#### 一行命令部署

1. 克隆仓库
```bash
git clone https://github.com/zshiyee-bot/tongzhou-videomanage.git
cd tongzhou-videomanage
```

2. 启动服务（自动构建并运行）
```bash
docker-compose up -d
```

3. 访问应用
打开浏览器访问：http://localhost:8080

**说明**：
- 首次运行会自动构建镜像（需要 5-10 分钟）
- 数据默认保存在 `~/trilium-data` 目录
- 可通过环境变量修改数据目录：`TRILIUM_DATA_DIR=/your/path docker-compose up -d`

#### 查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail 100
```

#### 停止服务

```bash
# 停止容器
docker-compose down

# 停止并删除数据（谨慎使用）
docker-compose down -v
```

#### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 生产环境部署建议

- 使用反向代理（Nginx/Caddy）配置 HTTPS
- 定期备份数据目录
- 配置防火墙规则
- 建议使用 Docker 部署以便于管理和更新

## 许可证

本项目基于 AGPL-3.0 许可证开源。

原项目版权归 zadam, Elian Doran 及其他贡献者所有。
