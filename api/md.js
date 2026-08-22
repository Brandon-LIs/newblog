// Vercel Serverless Function: Markdown content negotiation
// Serves markdown versions of pages when Accept: text/markdown is sent
// https://acceptmarkdown.com

export default async function handler(req, res) {
  const accept = (req.headers['accept'] || '').toLowerCase();

  if (!accept.includes('text/markdown')) {
    res.status(406).json({error: 'Not Acceptable', message: 'Send Accept: text/markdown header'});
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname === '/' ? '/index' : url.pathname;

  // Serve llms.txt content for root path, otherwise return markdown of the page
  let md = '';
  if (path === '/index' || path === '') {
    md = `# Brandon's Blog

一个高中生的个人博客，分享技术与生活。

## 快速链接

- 首页：https://blog.oopss.top/
- 博客：https://blog.oopss.top/blog
- 说说：https://blog.oopss.top/shuoshuo
- 笔记：https://blog.oopss.top/docs/intro
- 友链：https://blog.oopss.top/friends
- 关于：https://blog.oopss.top/about
- 站点地图：https://blog.oopss.top/sitemap.xml
- RSS 订阅：https://blog.oopss.top/blog/rss.xml

## 开发者资源

- API 文档：https://blog.oopss.top/openapi.json
- 项目指南：https://blog.oopss.top/llms.txt
- 完整文档：https://blog.oopss.top/llms-full.txt

## 技术栈

Docusaurus 3.10 · React 19 · TypeScript · Tailwind CSS · Cloudflare Workers · Vercel
`;
  } else {
    md = `# Brandon's Blog

页面 [${path}](https://blog.oopss.top${url.pathname}) 的 Markdown 版本。

如需完整内容，请访问：https://blog.oopss.top${url.pathname}

## 相关链接

- 首页：https://blog.oopss.top/
- 博客：https://blog.oopss.top/blog
- API 文档：https://blog.oopss.top/openapi.json
- 项目指南：https://blog.oopss.top/llms.txt
`;
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Vary', 'Accept, Accept-Encoding');
  res.status(200).send(md);
}