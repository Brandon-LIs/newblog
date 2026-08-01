import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_USER = 'Brandon-LIs';
const GITALK_REPO = process.env.GITALK_REPO || 'newblog';
const GITALK_OWNER = process.env.GITALK_OWNER || GITHUB_USER;

const config: Config = {
  title: "Brandon's Blog",
  tagline: '我们都有光明的未来',
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

  clientModules: [require.resolve('./src/vercelAnalytics.ts')],

  // 不蒜子访问统计已改为 React 组件（src/components/Busuanzi）请求，无需全局脚本
  scripts: [],

  // 传递给前端组件的自定义配置（构建时从环境变量读取，默认值已内置 Gitalk 凭据）
  customFields: {
    description: '我们都有光明的未来',
    gitalk: {
      clientID: process.env.GITALK_CLIENT_ID || 'Ov23liwhSndMxSW8t1Ef',
      clientSecret:
        process.env.GITALK_CLIENT_SECRET ||
        'bf6a8d31549f9bc1f2d167532ce14528c078f1cf',
      repo: GITALK_REPO,
      owner: GITALK_OWNER,
      admin: [GITALK_OWNER],
    },
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
    'docusaurus-plugin-image-zoom',
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
    zoom: {
      selector: '.markdown :not(em) > img',
      background: {
        light: 'rgb(255, 255, 255)',
        dark: 'rgb(50, 50, 50)',
      },
    },
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Brandon',
      logo: {
        alt: 'Brandon',
        src: 'https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg',
      },
      items: [
        {to: '/blog', label: '博客', position: 'left'},
        {to: '/docs/intro', label: '笔记', position: 'left'},
        {href: 'https://www.oopss.top', label: '个人主页', position: 'left'},
        {to: '/friends', label: '友链', position: 'left'},
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
