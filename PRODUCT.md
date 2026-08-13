# Product

## Register

brand

## Users

Chinese-speaking readers (students, developers, friends) visiting a high-school student's personal blog. They come to read articles about frontend development, CS learning, AI and engineering practice, plus life notes ("说说"), friend links and memos. Context: casual reading at desk or on phone; some return daily to check new posts; some land from search engines on a single article.

## Product Purpose

A personal blog that records learning notes, project practice and life sharing ("我们都有光明的未来"). Success = readers can find and read content comfortably, the site feels personal and trustworthy, and pages load fast enough not to interrupt reading. Business logic (blog list, archive, tags, search, comments via Twikoo, memos, friend links, AI summaries, view counts, RSS) must stay intact.

## Brand Personality

优雅极简 (elegant, minimal) · Apple / DeepSeek 式 · 克制 (restrained). Three words: 干净 (clean), 优雅 (elegant), 自信 (confident). The site should feel like an Apple or DeepSeek page — generous whitespace, clean sans-serif, black on white with a restrained blue accent — not a decorated blog theme.

## Anti-references

- 花哨的装饰：印章、水墨插画、满屏粒子、渐变光斑、玻璃拟态、暖黄"文艺"色调。
- 千篇一律的通用博客主题外观（卡片堆叠 + 大圆角 + 阴影 + 插画图标）。
- 高饱和撞色、正文对比度不足的浅灰文字。
- AI 味浓的模板感：每节一个英文小标签眉题、渐变文字、同尺寸图标卡片栅格。

## Design Principles

- 留白即设计：大量负空间，近白/近黑底 + 紫罗兰主色点缀，柔和细边框与阴影，克制的紫色光晕。
- 干净无衬线：系统字体（PingFang SC / HarmonyOS Sans / Microsoft YaHei / Noto Sans），零字体下载，接近 Apple 观感。
- hairline 与柔和层次：细分割线 + 浅阴影卡片划分层次。
- 快是优雅的一部分：图标离线打包、静态资源本地化、无阻塞脚本、动效尊重 prefers-reduced-motion；大陆访问为目标场景。

## Accessibility & Inclusion

- 正文对比度 ≥ 4.5:1（含深色模式），大文本 ≥ 3:1。
- 所有动效提供 `prefers-reduced-motion: reduce` 降级。
- 深色模式沿用并跟随系统偏好。
- 保留语义化标题层级、alt 文本、键盘可操作性。
