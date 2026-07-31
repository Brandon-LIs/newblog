import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_USER = 'Brandon-LIs';
const GITALK_REPO = process.env.GITALK_REPO || 'oopss-blog';
const GITALK_OWNER = process.env.GITALK_OWNER || GITHUB_USER;

const config: Config = {
  title: 'Brandon | 个人博客',
  tagline: '心有阳光，万物可爱',
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
  projectName: 'oopss-blog', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  clientModules: [require.resolve('./src/vercelAnalytics.ts')],

  // 传递给前端组件的自定义配置（构建时从环境变量读取）
  customFields: {
    gitalk: {
      clientID: process.env.GITALK_CLIENT_ID || '',
      clientSecret: process.env.GITALK_CLIENT_SECRET || '',
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
          editUrl: `https://github.com/${GITHUB_USER}/oopss-blog/tree/main/`,
        },
        blog: {
          showReadingTime: true,
          postsPerPage: 10,
          blogSidebarCount: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            copyright: `Copyright © ${new Date().getFullYear()} Brandon`,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: `https://github.com/${GITHUB_USER}/oopss-blog/tree/main/`,
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          priority: null,
          changefreq: null,
        },
      } satisfies Preset.Options,
    ],
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
      title: 'Brandon',
      logo: {
        alt: 'Brandon',
        src: 'https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg',
      },
      items: [
        {to: '/blog', label: '博客', position: 'left'},
        {to: '/docs', label: '笔记', position: 'left'},
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
            },
          ],
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
      copyright: `Copyright © ${new Date().getFullYear()} Brandon · 心有阳光，万物可爱 · Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
