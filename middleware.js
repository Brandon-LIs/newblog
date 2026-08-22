// Vercel Edge Middleware: Markdown content negotiation
// Serves markdown when Accept: text/markdown is sent
// https://acceptmarkdown.com

const SITE_URL = 'https://blog.oopss.top';

function serveMarkdown(path, url) {
  const pagePath = path === '/' || path === '' ? '/index' : path;
  const pageUrl = `${SITE_URL}${url.pathname}${url.search}`;

  let md = '';
  if (pagePath === '/index') {
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

页面 [${pagePath}](${pageUrl}) 的 Markdown 版本。

如需完整内容，请访问：${pageUrl}

## 相关链接

- 首页：${SITE_URL}/
- 博客：${SITE_URL}/blog
- API 文档：${SITE_URL}/openapi.json
- 项目指南：${SITE_URL}/llms.txt
`;
  }

  return new Response(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept, Accept-Encoding',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default function middleware(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const url = new URL(request.url);

  // Skip API routes, static assets, and well-known files
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/__docusaurus/') ||
      url.pathname.startsWith('/blog/rss') ||
      url.pathname.startsWith('/blog/atom') ||
      url.pathname.match(/\.(js|css|json|xml|ico|png|jpg|webp|svg|wasm|map|txt)$/)) {
    return;
  }

  // Serve markdown for Accept: text/markdown
  if (accept.includes('text/markdown')) {
    return serveMarkdown(url.pathname, url);
  }
}

export const config = {
  matcher: [
    '/((?!api/|assets/|_next/|__docusaurus/|\\.(js|css|json|xml|ico|png|jpg|webp|svg|wasm|map|txt)$).*)',
  ],
};