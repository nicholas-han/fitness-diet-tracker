# Personal Fitness OS

一个本地优先的个人健身控制系统：Plan → Execute → Log → Measure → Review → Adjust。它把训练、游泳/网球/拳击、身体指标、营养模板、购物清单和双周 Review 放在一个低摩擦工作流里。

## 功能

- Dashboard：当前阶段、身体趋势、训练、营养和恢复的高价值指标
- Plan：Phase 0/1/2、默认周结构、力量模板与可编辑营养目标
- Log：一个页面快速记录晨起体重、训练、营养和主观恢复
- Nutrition：Standard Home Diet、餐模板、周计划与移动端 Grocery Checklist
- History：7/14/28 日滚动指标和训练/营养历史
- Review：确定性周报，以及可直接交给 AI 的 Markdown/JSON 双周包
- Settings：目标、碳水分类、米饭杯克重、JSON 全量导入/导出

## 技术栈

- React 19 + Vite
- Tailwind CSS + shadcn/ui primitives
- TypeScript + Vitest
- 服务端代码仍保留在 `server/`，用于兼容已有测试和后续扩展；V1 产品入口不依赖它

## 本地运行

需要 Node.js 20+ 和 Corepack。开发模式会启动一个本地 Express + Vite 服务，数据写入仓库内的 `personal-data/fitness-os.json`；该目录已被 Git 忽略，不需要账号、数据库或外网连接。

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

默认访问地址为 `http://localhost:3000`。如果端口被占用，服务会自动选择 3000 之后的可用端口并在终端打印实际地址。也可以使用 `corepack pnpm build` 生成静态前端资源；静态托管没有仓库文件写入能力，会退回浏览器 `localStorage`，本地开发推荐使用 `pnpm dev`。

## 数据与隐私

运动记录、饮食记录、设置和购物历史存储在 `personal-data/fitness-os.json`，只由本机 API 读写，不会自动上传。请在 **Settings → Export All Data** 创建 JSON 备份；JSON 是 canonical backup，可在另一台设备导入。仓库也忽略以下本地内容：

- `.env` 和各环境的密钥配置
- `data/`、`personal-data/`、`exports/`、`backups/`
- SQLite 文件、SQL dump 和数据库备份

`drizzle/` 和 `server/` 中的是旧版远端持久化兼容代码，不是 V1 前端运行时的必需依赖。

## 后续部署

V1 前端可以部署到任意静态托管（例如 Vercel、Netlify、GitHub Pages）。构建命令为 `pnpm build`，发布目录为 `dist/public`。

如果未来需要多设备同步或 WHOOP/LLM 集成，可在不改变 JSON 数据契约的前提下增加 V2 后端。

## 常用命令

```bash
corepack pnpm check       # TypeScript 类型检查
corepack pnpm test        # 单元测试
corepack pnpm build       # 生产构建
corepack pnpm db:migrate  # 执行数据库迁移
```
