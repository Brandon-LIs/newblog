# 阿里云 OSS 托管静态资源（可选优化）

中国大陆访问博客时，若某些资源走海外 CDN 会偏慢。当前站点已做以下本地化优化：

| 资源 | 现状 | 说明 |
|---|---|---|
| 字体（Clear Han Serif / 仿宋 / 霞鹜文楷） | zeoseven.com 国内源，非阻塞加载 | 已 preconnect + media=print 非阻塞，实测 50–130ms |
| 图标（Iconify） | **已离线打包进产物** | 不再请求海外 api.iconify.design |
| 头像 / favicon | **已本地化**（`static/img/icon.jpg`、`static/img/favicon.ico`） | 不再请求 jsd.oopss.top / cdn.oopss.top |
| 文章图片 | jsd.oopss.top（自建 jsDelivr 代理） | 由 webp-convert 工作流上传，保持现状 |
| 评论 / 统计 / 友链 API | Cloudflare Workers / 第三方 | async 加载，不阻塞首屏 |

## 为什么字体暂不自托管到 OSS

中文字体全集很大（单字体 5–20MB）。zeoseven 服务端已按 `unicode-range` 切成 ~150–240 个子集，浏览器只下载用到的部分，实测延迟 50–130ms，属国内优秀水平。自托管全部子集约 30MB，收益有限。

## 何时值得用 OSS

- 文章图片量大之后，想把 `jsd.oopss.top`（海外代理）换成国内 OSS + CDN；
- 想完全脱离第三方字体/图片服务，全部自控；
- 想给 `static/` 里的资源做国内加速镜像。

## 使用方法

1. 阿里云控制台创建 Bucket（公共读），绑定自定义域名（如 `cdn.oopss.top`），开启 CDN 加速；
2. Bucket 配置跨域（CORS）：来源 `*`、允许 `GET`（字体跨域必需）；
3. 确认 woff2/woff 的 Content-Type 为 `font/woff2` / `font/woff`（脚本已自动设置）；
4. 运行上传脚本：

```bash
OSS_REGION=oss-cn-hangzhou \
OSS_BUCKET=your-bucket \
OSS_ACCESS_KEY_ID=LTAIxxx \
OSS_ACCESS_KEY_SECRET=xxx \
OSS_PREFIX=blog \
node scripts/upload-oss.mjs --dry-run   # 先预览
node scripts/upload-oss.mjs             # 执行上传
```

5. 上传后可把配置里的资源地址改为 `https://cdn.oopss.top/blog/static/...` 并加上 CDN 缓存刷新。

## 加速建议（无需改代码）

- **站点本身托管在 Vercel（hkg1）**，这是大陆访问最大的单点延迟（实测 ~1.1s TLS）。
  想进一步提速可：把 `build/` 产物同步到阿里云 OSS 静态托管 + CDN（实测可降到 ~0.2s），
  或在前端套一层国内 CDN。这需要在你自己的阿里云账号操作，脚本可复用上面的上传逻辑（把 `SOURCE_DIRS` 改为 `['build']`）。
