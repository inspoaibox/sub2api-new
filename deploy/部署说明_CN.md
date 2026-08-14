# Sub2API 二次开发版 Docker 部署说明

本文档适用于仓库 `inspoaibox/sub2api-new`。GitHub Actions 根据当前仓库源码构建完整镜像，前端会在 Docker 构建阶段编译并嵌入后端，最终由一个 Sub2API 容器统一提供 Web 界面和 API。

## 镜像地址

```text
ghcr.io/inspoaibox/sub2api-new:latest
```

| 标签 | 用途 |
|------|------|
| `latest` | `main` 分支最近一次成功构建 |
| `sha-提交短哈希` | 固定到某次源码提交 |
| `v0.1.175` | 对应版本标签构建 |

镜像支持 `linux/amd64` 和 `linux/arm64`。如果 GHCR 包设置为私有，服务器需要先登录：

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u inspoaibox --password-stdin
```

Token 至少需要 `read:packages` 权限。公开镜像不需要登录。

## 推荐部署

准备 Docker 20.10+ 和 Docker Compose v2+，创建独立部署目录：

```bash
mkdir -p /opt/sub2api && cd /opt/sub2api
curl -fsSL https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy/docker-deploy.sh | bash
docker compose up -d
docker compose ps
docker compose logs -f sub2api
```

访问 `http://服务器IP:8080`。端口可在 `.env` 中通过 `SERVER_PORT` 修改，但整个系统仍只有一个对外的 Sub2API 端口；PostgreSQL 和 Redis 只在 Docker 内部网络提供服务。

## 环境配置

部署脚本会生成 `.env`。至少检查以下配置：

```dotenv
SUB2API_IMAGE=ghcr.io/inspoaibox/sub2api-new:latest
SERVER_PORT=8080
POSTGRES_PASSWORD=请使用强密码
JWT_SECRET=请固定保存的随机密钥
TOTP_ENCRYPTION_KEY=请固定保存的随机密钥
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=首次初始化时使用的管理员密码
```

生产环境建议固定版本，不直接跟随 `latest`：

```dotenv
SUB2API_IMAGE=ghcr.io/inspoaibox/sub2api-new:v0.1.175
```

`.env` 包含数据库密码和加密密钥，不要提交到 Git。修改 `POSTGRES_PASSWORD` 不会修改已经初始化的 PostgreSQL 用户密码。

`TOTP_ENCRYPTION_KEY` 不能留空，也不能在更新时重新生成。支付服务商的 Secret Key、Webhook Secret、支付宝/微信私钥等凭证会使用它进行 AES-256-GCM 加密；缺少固定密钥时，管理后台会拒绝保存支付配置。已经由旧版本写入数据库的明文支付配置仍可读取，使用本版本重新保存后会自动转为密文。

## GitHub 构建流程

镜像发布由两个工作流协作完成：

1. `.github/workflows/docker-publish.yml` 在推送到 `main` 后，使用根目录 `Dockerfile` 构建 `amd64/arm64` 完整镜像并发布 `latest` 和提交标签。
2. 原有 `.github/workflows/release.yml` 在推送 `v*` 标签后，使用 GoReleaser 发布对应版本镜像、二进制和 GitHub Release。
3. 可以在 GitHub Actions 中手动运行 Docker 工作流并填写自定义标签。
4. 两条链路都使用当前仓库源码，前端产物会嵌入后端二进制。

普通 CI 通过不代表镜像已经发布，必须确认 Docker 工作流为绿色。

## 首次部署与更新的区别

`docker-deploy.sh` 只用于空的首次部署目录。它会生成新的数据库密码、JWT 密钥和 TOTP 加密密钥，因此不要在已有系统目录中重复执行。

已有部署必须使用下面的更新脚本。更新脚本会保留当前 `.env`、端口、数据库、Redis 和应用数据，只替换应用镜像和 Compose 配置：

```bash
cd /root/sub2api-deploy
curl -fsSL https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy/docker-update.sh \
  -o /tmp/sub2api-docker-update.sh
bash /tmp/sub2api-docker-update.sh
rm -f /tmp/sub2api-docker-update.sh
```

脚本支持指定镜像进行固定版本更新：

```bash
curl -fsSL https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy/docker-update.sh \
  -o /tmp/sub2api-docker-update.sh
bash /tmp/sub2api-docker-update.sh \
  --image ghcr.io/inspoaibox/sub2api-new:sha-提交短哈希
rm -f /tmp/sub2api-docker-update.sh
```

只有看到 `[SUCCESS] Application container updated`、镜像信息和容器状态，才表示更新完成。仅出现 PostgreSQL 备份成功不代表镜像已经更新。

更新前会在当前目录的 `backups/时间戳/` 下保存：

- `.env`
- 当前 Compose 配置
- PostgreSQL SQL 备份（数据库容器正常运行时）

更新完成后会自动检查健康接口，并输出容器实际使用的镜像和版本。更新过程中不会删除 `data/`、`postgres_data/`、`redis_data/`，也不会增加前端服务或新的对外端口。

## 更新版本

更新只替换 Sub2API 镜像，不删除数据目录。推荐使用上面的 `docker-update.sh`。如果需要手动执行：

```bash
cd /opt/sub2api
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < /dev/null > "backups/sub2api-$(date +%Y%m%d-%H%M%S).sql"
cp .env "backups/env-$(date +%Y%m%d-%H%M%S)"
curl -fsSL https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy/docker-compose.local.yml -o docker-compose.yml
docker compose pull sub2api
docker compose up -d --force-recreate sub2api
docker compose ps
docker compose logs --tail=100 sub2api
```

本地目录版还应备份 `data/`、`postgres_data/` 和 `redis_data/`。不要执行 `docker compose down -v`，也不要删除这些目录，否则会丢失系统数据。

## 回滚版本

修改镜像标签后重新拉取和启动：

```bash
cd /opt/sub2api
cp .env .env.before-rollback
sed -i 's#^SUB2API_IMAGE=.*#SUB2API_IMAGE=ghcr.io/inspoaibox/sub2api-new:v0.1.175#' .env
docker compose pull sub2api
docker compose up -d --force-recreate sub2api
docker compose logs --tail=100 sub2api
```

数据库迁移是增量迁移，镜像回滚不能自动撤销已经执行的数据库迁移。涉及数据库结构的版本升级必须保留升级前 SQL 备份，必要时从备份恢复数据库后再启动旧版本。

## 检查与排障

```bash
docker compose ps
docker compose logs --tail=200 sub2api
curl http://127.0.0.1:${SERVER_PORT:-8080}/health
docker compose exec postgres pg_isready
docker compose exec redis redis-cli ping
docker inspect sub2api --format '{{.Config.Image}}'
```

`pull access denied` 通常表示 GHCR 包未公开或服务器未登录 GHCR。`port is already allocated` 时只修改 `.env` 的 `SERVER_PORT`，不要新增前端服务或额外工作台端口。

## 停止和数据保护

```bash
docker compose down
docker compose up -d
```

以上操作会保留数据。只有完成备份并明确要清空系统时，才允许删除数据卷或数据目录。
