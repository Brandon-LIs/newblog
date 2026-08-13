# Product

## Register

brand

## Users

Chinese-speaking readers (students, developers, friends) visiting a high-school student's personal blog. They come to read articles about frontend development, CS learning, AI and engineering practice, plus life notes ("说说"), friend links and memos. Context: casual reading at desk or on phone; some return daily to check new posts; some land from search engines on a single article.

## Product Purpose

A personal blog that records learning notes, project practice and life sharing ("我们都有光明的未来"). Success = readers can find and read content comfortably, the site feels personal and trustworthy, and pages load fast enough not to interrupt reading. Business logic (blog list, archive, tags, search, comments via Twikoo, memos, friend links, AI summaries, view counts, RSS) must stay intact.

## Brand Personality

极简端庄 (minimal, dignified) · 中文文艺编辑风 (Chinese literary editorial). Three words: 安静 (quiet), 雅正 (refined-correct), 克制 (restrained). The site should feel like a well-set printed page — ink text on clean paper, generous whitespace, a serif voice for reading — not like a template with effects.

## Anti-references

- 花哨的装饰特效：满屏粒子、强渐变光斑、鼠标聚光炫技、玻璃拟态。这些与"端庄"相悖。
- 千篇一律的通用博客主题外观（卡片堆叠 + 大圆角 + 霓虹、冷蓝灰"工具感"配色）。
- 高饱和撞色、正文对比度不足的浅灰文字。
- AI 味浓的模板感：每节一个英文小标签眉题、渐变文字、同尺寸图标卡片栅格。

## Design Principles

- 白纸黑字：正文以衬线字体呈现，行高舒展，行宽限制在 65–75ch，让阅读成为中心。
- 暖纸与青瓷：底色为偏暖的纸白（非米黄），主色为克制的青瓷绿，含蓄有书卷气；装饰元素必须服务于阅读，一个页面最多一个焦点特效。
- 留白分级：用间距而非边框/阴影来划分层次，hairline 分隔线代替厚重卡片。
- 字体国内源：Clear Han Serif（界面/标题）+ Zhuque Fangsong（正文仿宋）+ LXGW WenKai（兜底），均来自 zeoseven 国内字体服务，非阻塞加载；系统中文字体（宋体/思源宋体）作即时兜底。
- 快是端庄的一部分：图标离线打包、静态资源本地化、无阻塞脚本、动效尊重 prefers-reduced-motion；大陆访问为目标场景。

## Accessibility & Inclusion

- 正文对比度 ≥ 4.5:1（含深色模式），大文本 ≥ 3:1。
- 所有动效提供 `prefers-reduced-motion: reduce` 降级。
- 深色模式沿用并跟随系统偏好。
- 保留语义化标题层级、alt 文本、键盘可操作性。
