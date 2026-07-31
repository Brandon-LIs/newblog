# Brandon 的个人博客

基于 [Docusaurus](https://docusaurus.io/) 构建的个人博客，部署于 Vercel（https://blog.oopss.top）。

功能特性：

- 📝 博客 + 笔记（docs）双模块，RSS / Atom / sitemap
- 🔍 本地全文搜索（`@easyops-cn/docusaurus-search-local`，支持中文）
- 📊 Vercel Analytics 访问统计（`@vercel/analytics`）
- 💬 Gitalk 评论（基于 GitHub Issues）
- 🌗 深色模式

## 本地开发

```bash
npm install
npm run start
```

## 配置环境变量（Gitalk）

复制 `.env.example` 并按注释填写，或在构建/部署平台设置：

| 变量 | 说明 |
| ---- | ---- |
| `GITALK_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITALK_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITALK_REPO` | 评论仓库（默认 `oopss-blog`，需公开并开启 Issues） |
| `GITALK_OWNER` | 仓库 owner（默认 `Brandon-LIs`） |

GitHub OAuth App 的 **Authorization callback URL** 填 `https://blog.oopss.top/`（详见 `.env.example`）。

## 部署到 Vercel

1. 创建 GitHub 仓库（如 `oopss-blog`）并推送代码
2. 打开 https://vercel.com → New Project → Import 该仓库
3. Framework Preset 选择 **Docusaurus**（Vercel 会自动识别），无需改动构建配置
4. 在 Project → Settings → Environment Variables 中添加 `GITALK_CLIENT_ID`、`GITALK_CLIENT_SECRET`
5. 部署后在 Settings → Domains 添加 `blog.oopss.top`（需先从旧的 NotionNext 项目中移除该域名）
6. 推送代码到 GitHub 后 Vercel 自动构建部署

## 写文章

在 `blog/` 目录新建 `YYYY-MM-DD-标题.md`：

```md
---
slug: hello-world
title: 你好，世界
authors: [brandon]
tags: [随笔]
---

文章内容...
```

笔记放入 `docs/` 目录即可。
