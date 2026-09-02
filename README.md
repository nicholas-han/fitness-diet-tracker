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
- `server/` 仅提供本地 JSON 文件 API 和 Express/Vite 开发服务；V1 不需要账号、数据库或远程 API

## 本地运行

需要 Node.js 20+ 和 Corepack。如果希望数据写入仓库本地文件，必须使用开发模式：它会启动本地 Express + Vite 服务，并将数据写入 `personal-data/fitness-os.json`。该目录已被 Git 忽略，不需要账号、数据库或外网连接。

```bash
# 首次安装（只需执行一次）
corepack enable
corepack pnpm install --frozen-lockfile

# 以后每次启动本地应用
corepack pnpm dev
```

默认访问地址为 `http://localhost:3000`。如果端口被占用，服务会自动选择 3000 之后的可用端口并在终端打印实际地址。

`corepack pnpm build` + `corepack pnpm start` 用于测试生产构建；生产模式不开放本地文件 API，不会写入 `personal-data/fitness-os.json`，数据会退回浏览器 `localStorage`。日常本地使用请运行 `corepack pnpm dev`。

## 数据与隐私

### 存储位置与优先级

开发模式下，运动记录、饮食记录、设置和购物历史的主数据源是 `personal-data/fitness-os.json`，只由本机 API 读写，不会自动上传。默认数据目录也可以通过 `FITNESS_DATA_DIR` 环境变量覆盖。

浏览器还会在 `localStorage` 中保留同一份状态副本，键名为 `personal-fitness-os:v1`，用于启动时的快速加载和本地 API 不可用时的回退。开发模式会按 `updatedAt` 选择较新的副本，并将修改同步到文件和浏览器。Settings 页显示“已连接到本地文件存储”时，表示当前已连接文件 API。

可以直接检查文件内容：

```bash
jq . personal-data/fitness-os.json
```

### JSON 数据格式

训练和饮食共用一个版本化的 JSON 状态对象，不会拆成两个文件：

```json
{
  "version": 1,
  "updatedAt": "2026-09-02T10:00:00.000Z",
  "settings": {},
  "activities": [],
  "body": [],
  "recovery": [],
  "nutrition": [],
  "carbDayOverrides": {},
  "grocery": [],
  "groceryHistory": [],
  "groceryExtras": [],
  "mealTemplates": [],
  "foods": [],
  "standardHomeDiet": {},
  "weeklyMealPlan": {},
  "inventory": [],
  "strengthPrograms": [],
  "weeklySchedule": [],
  "reviewNotes": {}
}
```

其中 `activities` 是训练/运动记录，`body` 是体重和身体指标，`recovery` 是恢复指标，`nutrition` 是每日饮食和宏量营养记录；其余字段保存设置、模板、周计划、食物目录和购物数据。文件是格式化 JSON，浏览器副本使用相同的数据结构。请在 **Settings → Export All Data** 创建 JSON 备份；该备份是 canonical backup，可在另一台设备导入。仓库也忽略以下本地内容：

- `.env` 和各环境的密钥配置
- `data/`、`personal-data/`、`exports/`、`backups/`
- SQLite 文件、SQL dump 和数据库备份

仓库中保留的 `drizzle/` 迁移文件仅用于历史参考，不参与 V1 运行时；密码登录、JWT 会话和远端训练/饮食 API 已移除。

## 后续部署

V1 前端可以部署到任意静态托管（例如 Vercel、Netlify、GitHub Pages）。构建命令为 `pnpm build`，发布目录为 `dist/public`。

如果未来需要多设备同步或 WHOOP/LLM 集成，可在不改变 JSON 数据契约的前提下增加 V2 后端。

## 常用命令

```bash
corepack pnpm check       # TypeScript 类型检查
corepack pnpm test        # 单元测试
corepack pnpm build       # 生产构建
```
