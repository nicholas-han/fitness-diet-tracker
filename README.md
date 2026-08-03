# Fitness & Diet Tracker

一个移动端优先的运动和饮食记录工具。可以按日期领取训练/饮食模板、记录组数与重量、查看历史，并把个人记录导出为 JSON。

## 功能

- 每日训练计划与完成状态
- 重量、次数、单位和自定义动作记录
- 每日饮食计划与营养信息编辑
- 历史记录与 JSON 导出
- MySQL 持久化存储

## 技术栈

- React 19 + Vite
- Express + tRPC
- Drizzle ORM + MySQL
- TypeScript + Vitest

## 本地运行

需要 Node.js 20+、Corepack 和一个 MySQL 数据库。

```bash
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env
# 编辑 .env，配置 DATABASE_URL、APP_PASSWORD 和 JWT_SECRET
corepack pnpm db:migrate
corepack pnpm dev
```

默认访问地址为 `http://localhost:3000`。

## 数据与隐私

运动记录、饮食记录和用户信息存储在 MySQL 中，不在 Git 仓库中。仓库也忽略以下本地内容：

- `.env` 和各环境的密钥配置
- `data/`、`personal-data/`、`exports/`、`backups/`
- SQLite 文件、SQL dump 和数据库备份

`drizzle/` 中的是数据库结构与迁移脚本，不包含个人记录，因此会正常纳入版本控制。

## 最省事的部署：Railway

这个项目是单体 Node.js 服务并使用 MySQL，最少改动的方案是把应用和 MySQL 都放在同一个 Railway 项目中。

1. 在 Railway 新建项目，选择 **Deploy from GitHub repo** 并连接本仓库。
2. 在同一项目中添加 **MySQL** 服务。
3. 在应用服务的 Variables 中设置：
   - `DATABASE_URL=${{MySQL.MYSQL_URL}}`
   - `APP_PASSWORD`：你自己使用的访问密码，至少 12 个字符
   - `JWT_SECRET`：至少 32 个字符的随机字符串
   - `APP_USER_NAME`：可选，页面显示的用户名
4. 为应用服务生成公开域名。
5. 首次部署会按 `railway.toml` 自动构建、执行数据库迁移并启动服务；之后每次推送 GitHub 都会重新部署。

### 登录与安全

应用使用单用户密码登录，不依赖第三方 OAuth。登录成功后，服务端通过 HTTP-only、SameSite Cookie 保存签名会话；连续输错 5 次会暂时锁定该来源 15 分钟。不要把 `APP_PASSWORD`、`JWT_SECRET` 或 `DATABASE_URL` 写进代码或提交到 GitHub，只在 Railway Variables 中配置。

## 常用命令

```bash
corepack pnpm check       # TypeScript 类型检查
corepack pnpm test        # 单元测试
corepack pnpm build       # 生产构建
corepack pnpm db:migrate  # 执行数据库迁移
```
