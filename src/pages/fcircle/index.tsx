import Layout from '@theme/Layout';
import {useEffect, useState} from 'react';

import Link from '@docusaurus/Link';
import {Icon} from '@iconify/react';
import {motion} from 'framer-motion';

const TITLE = '友链文章';
const DESCRIPTION = '来自好友们的最新博文，持续更新中。';
const API_URL = 'https://cdn.jsdelivr.net/gh/Brandon-LIs/newblog@main/data/friend-articles.json';
const API_FALLBACK = 'https://blog-admin.cloud-drive-zc.workers.dev/api/public/friends-feed';

type Article = {
  title: string;
  link: string;
  date: string;
  description: string;
  site: string;
  siteUrl: string;
  avatar: string;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '刚刚';
    return hours + ' 小时前';
  }
  if (days < 7) return days + ' 天前';
  if (days < 30) return Math.floor(days / 7) + ' 周前';
  if (days < 365) return Math.floor(days / 30) + ' 个月前';
  return Math.floor(days / 365) + ' 年前';
}

function ArticleHeader() {
  return (
    <section className="margin-top--lg margin-bottom--lg text-center">
      <h1>{TITLE}</h1>
      <p>{DESCRIPTION}</p>
    </section>
  );
}

const ArticleCard = motion.div;

export default function FriendCircle(): JSX.Element {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      for (const url of [API_URL, API_FALLBACK]) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const data = await r.json();
          if (cancelled) return;
          setArticles(data.list || []);
          return;
        } catch {
          // 尝试下一个源
        }
      }
      if (!cancelled) setError('文章加载失败，请稍后重试');
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <main className="my-4">
        <ArticleHeader />

        {error && (
          <p className="text-center text-sm text-[var(--ifm-color-danger)]">{error}</p>
        )}

        {articles === null && !error && (
          <div className="mx-auto max-w-3xl px-4 text-center text-sm text-[var(--ifm-secondary-text-color)]">
            加载中…
          </div>
        )}

        {articles && articles.length === 0 && (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <Icon icon="ri:rss-line" width="48" height="48" className="mx-auto mb-4 text-[var(--ifm-color-emphasis-300)]" />
            <p className="m-0 text-sm text-[var(--ifm-secondary-text-color)]">
              暂无友链文章。请先在后台为友链配置 RSS 订阅地址。
            </p>
          </div>
        )}

        {articles && articles.length > 0 && (
          <div className="mx-auto my-8 max-w-5xl px-4 py-2">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {articles.map((a, i) => (
                <ArticleCard
                  key={a.link + i}
                  initial={{opacity: 0, y: 16}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: Math.min(i * 0.03, 0.4)}}
                  className="group relative flex flex-col overflow-hidden rounded-card border border-solid border-[var(--ifm-color-emphasis-200)] bg-card p-5 shadow-[var(--blog-item-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ifm-color-primary)]">
                  <div className="mb-3 flex items-center gap-2.5">
                    <img
                      src={a.avatar}
                      alt={a.site}
                      className="size-9 min-w-9 rounded-full object-contain"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                      }}
                    />
                    <Link
                      to={a.siteUrl}
                      rel=""
                      className="flex items-center gap-1 text-sm font-medium text-[var(--ifm-color-emphasis-600)] no-underline transition-colors hover:text-[var(--ifm-color-primary)]">
                      {a.site}
                    </Link>
                    {a.date && (
                      <span className="ml-auto shrink-0 text-xs text-[var(--ifm-color-emphasis-400)]">
                        {formatDate(a.date)}
                      </span>
                    )}
                  </div>
                  <Link
                    to={a.link}
                    rel=""
                    target="_blank"
                    className="line-clamp-2 font-semibold text-[var(--ifm-color-emphasis-900)] no-underline transition-colors hover:text-[var(--ifm-color-primary)]">
                    {a.title}
                  </Link>
                  {a.description && (
                    <p className="mt-2 line-clamp-2 m-0 text-sm leading-6 text-[var(--ifm-secondary-text-color)]">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ifm-color-primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      阅读原文
                      <Icon icon="ri:arrow-right-up-line" width="14" height="14" />
                    </span>
                  </div>
                </ArticleCard>
              ))}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}