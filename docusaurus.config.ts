import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {execSync} from 'node:child_process';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_USER = 'Brandon-LIs';

// 每次构建的版本号：优先取 git commit，其次用环境变量。
// 用于把 Pagefind 产物放到 /pagefind/<BUILD_ID>/ 版本化目录，
// 避免 CDN 长期缓存 /pagefind/* 导致搜索读到陈旧/残缺索引。
function resolveBuildId(): string {
  if (process.env.PAGEFIND_BUILD_ID) return process.env.PAGEFIND_BUILD_ID.trim();
  try {
    const sha = execSync('git rev-parse --short HEAD', {cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore']})
      .toString()
      .trim();
    if (sha) return sha;
  } catch {
    // 非 git 环境（如打包发布）走下面的兜底
  }
  return 'local';
}

const BUILD_ID = resolveBuildId();
const PAGEFIND_BASE = `/pagefind/${BUILD_ID}/`;

const config: Config = {
  title: "Brandon's Blog",
  // 站内标题统一后缀由 siteConfig.title + siteConfig.titleDelimiter 决定（Docusaurus
  // 没有 titleTemplate 选项）。因此描述性文案不能写进上面的 title —— 那会连带改掉
  // 全站每一页的标题后缀（曾导致归档页标题变成
  // 「历史博文 | Brandon's Blog | 一个高中生的个人博客，记录技术与生活」）。
  // 首页的描述性标题由 src/pages/index.tsx 单独传给 Layout。
  tagline: '我们都有光明的未来',

  headTags: [
    // Pagefind 索引版本化目录（前端 pagefindInit 读取，用于绕开 CDN 陈旧缓存）
    { tagName: 'meta', attributes: { name: 'pf-base', content: PAGEFIND_BASE } },
    { tagName: 'meta', attributes: { name: 'pf-build', content: BUILD_ID } },
    // 搜索引擎验证
    { tagName: 'meta', attributes: { name: 'sogou_site_verification', content: 'XAWthKRnIS' } },
    { tagName: 'meta', attributes: { name: 'msvalidate.01', content: 'E4B3D7DAC6638D437E39343DD8E21EE9' } },
    { tagName: 'meta', attributes: { name: 'baidu-site-verification', content: 'codeva-XU1RSS0GsJ' } },
    // 收录策略：默认即可被索引，但显式声明可附带 max-image-preview:large，
    // 让搜索结果里文章封面与摘要的展示权限更宽松（缺失时只声明 index, follow）
    { tagName: 'meta', attributes: { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' } },
    // 图标：/favicon.ico 由浏览器默认兜底请求，务必提供，否则每页都会 404。
    // 站内同源直出，不再绕 npm CDN 跨域取。
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
    // DNS 预解析 + 预连接外部资源
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://jsd.onmicrosoft.cn' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://jsd.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://status.oopss.top', crossorigin: 'anonymous' } },
    { tagName: 'link', attributes: { rel: 'dns-prefetch', href: 'https://jsd.onmicrosoft.cn' } },
    { tagName: 'link', attributes: { rel: 'dns-prefetch', href: 'https://jsd.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'dns-prefetch', href: 'https://status.oopss.top' } },
    // 百度站点验证
    { tagName: 'meta', attributes: { name: 'baidu-site-verification', content: 'codeva-xxx' } },
    // Google 站点验证
    { tagName: 'meta', attributes: { name: 'google-site-verification', content: 'xxx' } },
    // 微软 Bing 站点验证
    { tagName: 'meta', attributes: { name: 'msvalidate.01', content: 'xxx' } },
    // 添加 meta 标签方便 AI 爬虫识别
    { tagName: 'meta', attributes: { name: 'agent-version', content: '1.0' } },
    { tagName: 'meta', attributes: { name: 'llms', content: '/llms.txt' } },
    { tagName: 'link', attributes: { rel: 'alternate', type: 'text/markdown', href: '/llms.txt', title: "Brandon's Blog (Markdown)" } },
    // JSON-LD 结构化数据 - 网站
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: "Brandon's Blog",
        url: 'https://blog.oopss.top',
        description: '一个高中生的个人博客，分享技术与生活',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://blog.oopss.top/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        author: {
          '@type': 'Person',
          name: 'Brandon',
          url: 'https://blog.oopss.top/about',
        },
      }),
    },
    // JSON-LD 结构化数据 - 个人
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Brandon',
        alternateName: 'Brandon Li',
        url: 'https://blog.oopss.top',
        sameAs: [
          'https://github.com/Brandon-LIs',
          'https://space.bilibili.com/3546657819986597',
        ],
      }),
    },
  ],
  favicon: '/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://blog.oopss.top',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: GITHUB_USER, // Usually your GitHub org/user name.
  projectName: 'newblog', // Usually your repo name.

  // sitemap.xml / rss.xml 在构建阶段生成，链接检查时尚未存在，故使用 warn
  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  clientModules: [
    require.resolve('./src/pagefindInit.ts'),
    require.resolve('./src/vercelAnalytics.ts'),
    require.resolve('./src/imgFade.ts'),
    require.resolve('./src/iconifyOffline.ts'),
    require.resolve('./src/navbarScroll.ts'),
  ],

  // 不蒜子访问统计已改为 React 组件（src/components/Busuanzi）请求，无需全局脚本
  scripts: [
    {
      src: 'https://jsd.onmicrosoft.cn/npm/br-blog@1.0.3/js/umami.min.js',
      async: true,
      defer: true,
      'data-website-id': '1eb5f40d-b5f6-4dbc-8406-9135f77e1368',
      'data-host-url': 'https://umami.oopss.top',
    },
    {
      src: 'https://jsd.onmicrosoft.cn/npm/br-blog@1.0.3/js/view-image.min.js',
      async: false,
      defer: true,
    },
    {
      src: 'https://jsd.onmicrosoft.cn/npm/br-blog@1.0.3/js/view-image-init.js',
      async: false,
      defer: true,
    },
  ],

  // 传递给前端组件的自定义配置
  customFields: {
    // 首页 meta description。原来的「我们都有光明的未来」只有 9 字且不含可检索词，
    // 搜索结果里既看不出站点讲什么，也带不来点击。tagline 仍保留给页面副标题用。
    homeDescription:
      "Brandon's Blog 记录学习、技术与生活：前端与计算机科学笔记、AI 与工程化实践、自托管小项目，以及游记与日常。",
    description: '我们都有光明的未来',
    bio: '一个高中生的个人博客',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: `https://github.com/${GITHUB_USER}/newblog/tree/main/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          // lastmod 依赖 git 信息，Vercel 云端构建无 .git 目录会失败，故关闭
          lastmod: 'date',
          priority: null,
          changefreq: null,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      './src/plugin/plugin-content-blog', // 为了实现全局 blog 数据（首页展示近期博客）
      {
        path: 'blog',
        editUrl: `https://github.com/${GITHUB_USER}/newblog/edit/main/`,
        editLocalizedFiles: false,
        // 列表页 meta description：原值「我们都有光明的未来」只有 9 字且不含任何
        // 可检索词，搜索结果里既看不出站点在讲什么，也无法带来点击
        blogDescription:
          "Brandon's Blog 记录学习、技术与生活：前端与计算机科学笔记、AI 与工程化实践、自托管小项目，以及游记与日常。",
        blogSidebarCount: 10,
        blogSidebarTitle: '历史博文',
        postsPerPage: 10,
        showReadingTime: true,
        readingTime: ({content, frontMatter, defaultReadingTime}) =>
          defaultReadingTime({content, options: {wordsPerMinute: 300}}),
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: "Brandon's Blog",
          copyright: `Copyright © ${new Date().getFullYear()} Brandon`,
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'warn',
        rehypePlugins: [require('./src/plugin/rehype-img-dim')],
      },
    ],
    async function tailwindcssPlugin() {
      return {
        name: 'docusaurus-tailwindcss',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(require('@tailwindcss/postcss'))
          return postcssOptions
        },
      }
    },
  ],

  themes: [],

  themeConfig: {
    // 全站默认分享图标/简介（微信等平台抓取 og:image；各博文页会用自身封面覆盖）
    // 注意：需用无防盗链的图片，微信机器人才能抓取（volces CDN 有 Referer 防盗链，故用 jsd.oopss.top）
    metadata: [
      { property: 'og:image', content: 'https://jsd.oopss.top/twikoo/08310001.jpg' },
      { property: 'og:image:alt', content: "Brandon's Blog" },
      { name: 'twitter:image', content: 'https://jsd.oopss.top/twikoo/08310001.jpg' },
      { name: 'twitter:image:alt', content: "Brandon's Blog" },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Brandon's Blog",
      logo: {
        alt: 'Brandon',
        src: 'https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/img/icon.webp',
        width: 32,
        height: 32,
      },
      items: [
        {to: '/blog', label: '博客', position: 'left'},
        {to: '/shuoshuo', label: '说说', position: 'left'},
        {to: '/docs/intro', label: '笔记', position: 'left'},
{href: 'https://www.oopss.top', label: '主页', position: 'left'},
        {type: 'dropdown', label: '友链', position: 'left', items: [
          {to: '/friends', label: '友情链接'},
          {to: '/fcircle', label: '友链文章'},
        ]},
        {to: '/message', label: '留言', position: 'left'},
        {href: 'https://github.com/Brandon-LIs/newblog/issues/4', label: '订阅', position: 'left'},
        {to: '/about', label: '关于', position: 'left'},
        {
          href: `https://github.com/${GITHUB_USER}`,
          className: 'header-github-link',
          'aria-label': 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '更多',
          items: [
            {
              label: '博客',
              to: '/blog',
            },
            {
              label: '归档',
              to: '/blog/archive',
            },
            {
              label: 'RSS',
              href: '/blog/rss.xml',
            },
            {
              label: '站点地图',
              href: '/sitemap.xml',
            },          ],
        },
        {
          title: '联系',
          items: [
            {
              label: 'GitHub',
              href: `https://github.com/${GITHUB_USER}`,
            },
            {
              label: 'Bilibili',
              href: 'https://space.bilibili.com/3546657819986597',
            },
            {
              label: 'QQ',
              href: 'https://qm.qq.com/q/xseGAqvn22',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Brandon · 我们都有光明的未来 · Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
