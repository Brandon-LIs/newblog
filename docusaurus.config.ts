import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_USER = 'Brandon-LIs';

const config: Config = {
  title: "Brandon's Blog",
  tagline: '我们都有光明的未来',

  headTags: [
    // 字体预加载
    { tagName: 'link', attributes: { href: 'https://fontsapi.zeoseven.com/22/plus/result.css', rel: 'preload', as: 'style', crossorigin: 'anonymous' } },
    { tagName: 'link', attributes: { href: 'https://fontsapi.zeoseven.com/22/plus/result.css', rel: 'stylesheet', crossorigin: 'anonymous' } },
    // DNS 预解析 + 预连接外部资源
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://jsd.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://apis.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://memos.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'dns-prefetch', href: 'https://jsd.oopss.top' } },
    { tagName: 'link', attributes: { rel: 'dns-prefetch', href: 'https://cdn.oopss.top' } },
    // 百度站点验证
    { tagName: 'meta', attributes: { name: 'baidu-site-verification', content: 'codeva-xxx' } },
    // Google 站点验证
    { tagName: 'meta', attributes: { name: 'google-site-verification', content: 'xxx' } },
    // 微软 Bing 站点验证
    { tagName: 'meta', attributes: { name: 'msvalidate.01', content: 'xxx' } },
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
  favicon: 'https://cdn.oopss.top/favicon.ico',

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
    require.resolve('./src/vercelAnalytics.ts'),
    require.resolve('./src/imgFade.ts'),
  ],

  // 不蒜子访问统计已改为 React 组件（src/components/Busuanzi）请求，无需全局脚本
  scripts: [
    {
      src: 'https://apis.oopss.top/script.js',
      async: true,
      defer: true,
      'data-website-id': '1eb5f40d-b5f6-4dbc-8406-9135f77e1368',
      'data-host-url': 'https://umami.oopss.top',
    },
    '/js/view-image.min.js',
    {
      src: '/js/view-image-init.js',
      async: false,
      defer: false,
    },
  ],

  // 传递给前端组件的自定义配置
  customFields: {
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
          lastmod: null,
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
        blogDescription: '我们都有光明的未来',
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

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 140,
      }),
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Brandon's Blog",
      logo: {
        alt: 'Brandon',
        src: 'https://cdn.oopss.top/icon.jpg',
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
