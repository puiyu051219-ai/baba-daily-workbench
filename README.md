# LumiDay 今天有你

一个给女朋友先用的实时情侣生活副驾。入口不是旅行，也不是学习，而是「今天怎么安排」：今日安排、学习陪跑、旅行共创和轻小游戏放在同一个房间里。

## 运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址即可体验。没有 Supabase 环境变量时，会自动进入本地演示模式，同一浏览器的多个标签页可以同步。

## Supabase 实时同步

1. 新建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 复制 `.env.example` 为 `.env.local`，填入：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon key
```

4. 重启开发服务。

第一版前端使用 `rooms.app_state` 做房间快照实时同步，数据库脚本同时保留 `profiles`、`today_cards`、`study_items`、`trip_items`、`game_sessions` 等核心表，方便后续拆成更细的分析和权限模型。

## 已实现

- `今天`: 今日安排、共同投票、轻心情卡、快速新增安排。
- `学习`: 课程任务、AI 解释提示、复习进度、专注计时。
- `旅行`: 景点投票、预算、酒店/路线方案、拍照和安全偏好。
- `一起玩`: 二选一、默契问答、双方答完后揭晓。
- 实时房间：Supabase Realtime 可跨设备同步，本地模式支持多标签页同步。
- PWA：支持 Vercel 部署后添加到手机主屏幕。

## 页面

- `/`: 创建或加入房间。
- `/room/:roomId`: 今日生活副驾。
- `/room/:roomId/trip`: 旅行共创。
- `/room/:roomId/play`: 情侣小游戏。

## 部署到 Vercel

把项目根目录设为 `TripSense-Web`，构建命令使用：

```bash
npm run build
```

输出目录使用：

```bash
dist
```

如果要开启跨设备同步，在 Vercel 的环境变量里加入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
