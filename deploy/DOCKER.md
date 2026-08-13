# Sub2API 二次开发版 Docker 镜像

当前二次开发仓库：<https://github.com/inspoaibox/sub2api-new>

默认镜像：`ghcr.io/inspoaibox/sub2api-new:latest`

镜像由 GitHub Actions 构建，包含当前仓库的前端和后端代码，支持 `linux/amd64` 与 `linux/arm64`。完整部署、更新、回滚和备份说明见 [`部署说明_CN.md`](./部署说明_CN.md)。

## Quick Start

```bash
mkdir -p /opt/sub2api && cd /opt/sub2api
curl -fsSL https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy/docker-deploy.sh | bash
docker compose up -d
docker compose ps
```

## Docker Compose

生产环境请直接使用仓库中的 `docker-compose.local.yml`，它包含 PostgreSQL、Redis、健康检查、持久化目录和自动初始化配置。不要使用没有数据卷的简单 `docker run` 方式。

## 镜像标签

| 标签 | 说明 |
|------|------|
| `latest` | `main` 分支最近一次成功构建 |
| `sha-提交短哈希` | 固定到指定源码提交 |
| `v0.1.175` | 对应版本标签构建 |

GHCR 包如果是私有的，请先登录：

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u inspoaibox --password-stdin
```

## Supported Architectures

- `linux/amd64`
- `linux/arm64`

## Tags

- `latest` - Latest stable release
- `x.y.z` - Specific version
- `x.y` - Latest patch of minor version
- `x` - Latest minor of major version

## Links

- [GitHub Repository](https://github.com/inspoaibox/sub2api-new)
- [中文部署说明](./部署说明_CN.md)
