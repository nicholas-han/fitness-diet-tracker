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
# 编辑 .env，至少配置 DATABASE_URL、JWT_SECRET 和登录相关变量
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
   - `JWT_SECRET`：一个长随机字符串
   - `.env.example` 中列出的登录相关变量
4. 为应用服务生成公开域名。
5. 首次部署会按 `railway.toml` 自动构建、执行数据库迁移并启动服务；之后每次推送 GitHub 都会重新部署。

### 部署前必须处理的登录问题

当前认证来自原始 Manus 项目，依赖 Manus OAuth 的 App ID、登录门户和服务端地址。若没有这些有效配置，网页虽然能构建和启动，但无法登录，也就不能新增记录。

对于只给自己使用的场景，建议下一步把 Manus OAuth 替换为简单的单用户密码登录；这样部署时只需再设置一个密码哈希或访问密码，不需要维护第三方 OAuth 应用。

## 常用命令

```bash
corepack pnpm check       # TypeScript 类型检查
corepack pnpm test        # 单元测试
corepack pnpm build       # 生产构建
corepack pnpm db:migrate  # 执行数据库迁移
```
