// Vercel Serverless Function: Markdown content negotiation
// Serves markdown versions of pages when Accept: text/markdown is sent
// https://acceptmarkdown.com

const SITE_URL = 'https://blog.oopss.top';

module.exports = function handler(req, res) {
  const accept = (req.headers['accept'] || '').toLowerCase();

  if (!accept.includes('text/markdown')) {
    res.status(406).json({error: 'Not Acceptable', message: 'Send Accept: text/markdown header'});
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname === '/' ? '/index' : url.pathname;

  let md = '';
  if (path === '/index' || path === '') {
    md = `# Brandon's Blog

一个高中生的个人博客，分享技术与生活。

## 快速链接

- 首页：${SITE_URL}/
- 博客：${SITE_URL}/blog
- 说说：${SITE_URL}/shuoshuo
- 笔记：${SITE_URL}/docs/intro
- 友链：${SITE_URL}/friends
- 关于：${SITE_URL}/about
- 站点地图：${SITE_URL}/sitemap.xml
- RSS 订阅：${SITE_URL}/blog/rss.xml

## 开发者资源

- API 文档：${SITE_URL}/openapi.json
- 项目指南：${SITE_URL}/llms.txt
- 完整文档：${SITE_URL}/llms-full.txt

## 技术栈

Docusaurus 3.10 · React 19 · TypeScript · Tailwind CSS · Cloudflare Workers · Vercel
`;
  } else {
    md = `# Brandon's Blog

页面 [${path}](${SITE_URL}${url.pathname}) 的 Markdown 版本。

如需完整内容，请访问：${SITE_URL}${url.pathname}

## 相关链接

- 首页：${SITE_URL}/
- 博客：${SITE_URL}/blog
- API 文档：${SITE_URL}/openapi.json
- 项目指南：${SITE_URL}/llms.txt
`;
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Vary', 'Accept, Accept-Encoding');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(md);
};