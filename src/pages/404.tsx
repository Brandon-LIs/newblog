import Layout from '@theme/Layout';
import {useLocation} from '@docusaurus/router';

export default function NotFound(): JSX.Element {
  const location = useLocation();

  return (
    <Layout title="404 | 页面未找到" description="页面不存在">
      <main className="my-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div style={{fontSize: 72, fontWeight: 800, color: 'var(--ifm-color-primary)', lineHeight: 1}}>
            404
          </div>
          <h1 className="text-xl font-semibold mt-4" style={{color: 'var(--ifm-heading-color)'}}>
            页面未找到
          </h1>
          <p className="text-sm mt-2" style={{color: 'var(--ifm-secondary-text-color)'}}>
            路径 <code>{location.pathname}</code> 不存在。
          </p>
          <div className="mt-6 text-left text-sm leading-7" style={{
            background: 'var(--ifm-card-background-color)',
            border: '1px solid var(--ifm-color-emphasis-200)',
            borderRadius: 'var(--ifm-card-border-radius)',
            padding: '16px 20px',
            color: 'var(--ifm-secondary-text-color)',
            fontFamily: 'var(--ifm-font-family-monospace)',
            whiteSpace: 'pre-wrap',
          }}>
{`您可能想访问以下页面：

- 首页：https://blog.oopss.top/
- 博客：https://blog.oopss.top/blog
- 说说：https://blog.oopss.top/shuoshuo
- 笔记：https://blog.oopss.top/docs/intro
- 友链：https://blog.oopss.top/friends
- 关于：https://blog.oopss.top/about
- 站点地图：https://blog.oopss.top/sitemap.xml
- RSS 订阅：https://blog.oopss.top/blog/rss.xml

开发者资源：
- API 文档：https://blog.oopss.top/openapi.json
- 项目指南：https://blog.oopss.top/llms.txt`}
          </div>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{background: 'var(--ifm-color-primary)'}}
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}