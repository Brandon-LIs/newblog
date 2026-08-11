import Layout from '@theme/Layout';
import {useEffect, useCallback, useState} from 'react';

import Link from '@docusaurus/Link';
import {Icon} from '@iconify/react';

const TITLE = '友链文章';
const DESCRIPTION = '来自好友们的最新博文，持续更新中。';
const API_URL = 'https://api.oopss.top/api/friends-feed';
const REFRESH_URL = 'https://api.oopss.top/api/friends-refresh';
const PAGE_SIZE = 5;

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
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
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

export default function FriendCircle(): JSX.Element {
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadArticles = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_URL + (forceRefresh ? '?refresh=1' : ''));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      setArticles(data.list || []);
      setCount(data.list?.length || 0);
      setPage(1);
    } catch {
      setError('文章加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(REFRESH_URL, {method: 'POST'});
      setTimeout(async () => {
        await loadArticles(true);
        setRefreshing(false);
      }, 3000);
    } catch {
      setRefreshing(false);
    }
  };

  const shown = articles.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < articles.length;

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <main className="my-4">
        <ArticleHeader />

        <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between px-4">
          <span className="text-sm text-[var(--ifm-secondary-text-color)]">
            {count > 0 ? `共 ${count} 篇文章` : ''}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-solid border-[var(--ifm-color-emphasis-300)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--ifm-color-emphasis-700)] no-underline transition-all duration-300 hover:border-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary)]">
            <Icon icon={refreshing ? 'ri:loader-4-line' : 'ri:refresh-line'} width="16" height="16" className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '刷新中…' : '刷新'}
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-[var(--ifm-color-danger)]">{error}</p>
        )}

        {loading && !error && (
          <div className="mx-auto max-w-3xl px-4 text-center text-sm text-[var(--ifm-secondary-text-color)]">
            加载中…
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <Icon icon="ri:rss-line" width="48" height="48" className="mx-auto mb-4 text-[var(--ifm-color-emphasis-300)]" />
            <p className="m-0 text-sm text-[var(--ifm-secondary-text-color)]">
              暂无友链文章。请先在后台为友链配置 RSS 订阅地址。
            </p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="mx-auto mb-8 max-w-5xl px-4 py-2">
            <div className="flex flex-col gap-5">
              {shown.map((a, i) => (
                <div
                  key={a.link + i}
                  className="group flex flex-col overflow-hidden rounded-card border border-solid border-[var(--ifm-color-emphasis-200)] bg-card p-5 shadow-[var(--blog-item-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ifm-color-primary)]">
                  <div className="mb-2 flex items-center gap-2.5">
                    <img
                      src={a.avatar}
                      alt={a.site}
                      className="size-9 min-w-9 rounded-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                    target="_blank"
                    className="line-clamp-2 font-semibold text-[var(--ifm-color-emphasis-900)] no-underline transition-colors hover:text-[var(--ifm-color-primary)]">
                    {a.title}
                  </Link>
                  {a.description && (
                    <p className="mt-2 line-clamp-2 m-0 text-sm leading-6 text-[var(--ifm-secondary-text-color)]">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-auto pt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ifm-color-primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      阅读原文
                      <Icon icon="ri:arrow-right-up-line" width="14" height="14" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-solid border-[var(--ifm-color-emphasis-300)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--ifm-color-emphasis-700)] no-underline transition-all duration-300 hover:border-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary)]">
                  加载更多
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  );
}