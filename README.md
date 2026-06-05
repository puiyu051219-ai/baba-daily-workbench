# 八八婆和八八公的日常工作台

一个可以注册登录的日常工作台：任务清单、学习任务、番茄钟、倒数日、外部链接卡片和一起玩的小游戏放在同一个网站里。

## 本地运行

```bash
npm install
npm run dev
```

本地 Vite 模式会使用浏览器本地数据，方便调 UI。线上 Cloudflare Workers 版本会用 Durable Object 保存账号、登录会话、工作台数据和飞行棋房间。

## 部署

```bash
npm run deploy
```

当前公开地址：

```text
https://yuhuangdadi.puiyu051219.workers.dev
```

## 已实现

- 注册与登录。
- 任务清单：今天、重要、Deadline、全部。
- 学习任务与复习卡。
- 番茄钟与完成轮数记录。
- 倒数日、纪念日、Deadline 日期卡。
- 外部链接卡片：支持 Instagram、抖音、小红书、TikTok、YouTube 等链接保存，线上会尝试抓标题、描述和封面。
- AI 总结接口：没有 key 时使用本地摘要；配置 OpenAI 或 Anthropic key 后自动生成链接摘要。
- 一起玩：`谕皇大帝` 板块里先放飞行棋，支持房间码加入、多人同步、掷骰和移动。
- PWA 支持，可添加到手机主屏幕。

## AI 总结配置

可选配置，不影响基础功能：

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_MODEL
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ANTHROPIC_MODEL
```

只需要配置其中一个模型供应商即可。

## 页面

- `/`: 注册、登录和工作台。
- `/game/:gameId`: 飞行棋房间。
