import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const projects = [
  {
    title: '文件快传',
    url: 'https://github.com/Brandon-LIs/airportal',
    description:
      '基于 Node.js 开发的文件传输系统，支持 Amazon S3 / Cloudflare R2，支持多用户注册和第三方登录。',
    tags: ['Node.js', '工具'],
  },
  {
    title: 'Webdev 云盘',
    url: 'https://github.com/Brandon-LIs/cloud-drive',
    description: '基于 Webdev 的网盘项目，支持分享链接 / 直链分享。',
    tags: ['Vue.js', '工具'],
  },
  {
    title: '自建不蒜子',
    url: 'https://github.com/Brandon-LIs/bsz-cfworker',
    description:
      '基于 Cloudflare Workers + KV 构建的轻量极简网站访问统计工具，完全兼容不蒜子 v3 API，无需注册、无需数据库。',
    tags: ['Cloudflare Workers', '统计', '开源'],
  },
];

const socials = [
  {label: '博客', url: '/blog', external: false},
  {label: 'GitHub', url: 'https://github.com/Brandon-LIs', external: true},
  {
    label: 'Bilibili',
    url: 'https://space.bilibili.com/3546657819986597',
    external: true,
  },
];

function HomepageHero() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <img
          className={styles.heroAvatar}
          src="https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg"
          alt="Brandon"
        />
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <p className={styles.heroDesc}>
          我是来自中国·宜昌的高中生，热爱前端与计算机科学，在持续学习 AI 与工程化相关内容。
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/blog">
            进入博客
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/Brandon-LIs">
            GitHub
          </Link>
        </div>
        <div className={styles.socials}>
          {socials.map((s) =>
            s.external ? (
              <a key={s.label} href={s.url} className={styles.socialLink}>
                {s.label}
              </a>
            ) : (
              <Link key={s.label} to={s.url} className={styles.socialLink}>
                {s.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}

function HomepageProjects() {
  return (
    <section className={styles.projectsSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          项目
        </Heading>
        <div className={styles.projects}>
          {projects.map((p) => (
            <a key={p.title} href={p.url} className={styles.projectCard}>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className={styles.tags}>
                {p.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Brandon 的个人博客：分享前端、计算机科学、AI 与工程化相关内容。">
      <HomepageHero />
      <main>
        <HomepageProjects />
      </main>
    </Layout>
  );
}
