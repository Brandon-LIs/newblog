import Layout from '@theme/Layout';
import {useEffect, useCallback, useState} from 'react';

import Link from '@docusaurus/Link';
import {Icon} from '@iconify/react';

const TITLE = '友链文章';
const DESCRIPTION = '来自好友们的最新博文，持续更新中。';
const API_URL = '/friends-feed.json';
const REFRESH_URL = 'https://apis.oopss.top/api/friends-refresh';
const PAGE_SIZE = 20;

type Article = {
  title: string; link: string; date: string; description: string;
  site: string; siteUrl: string; avatar: string;
};

function formatDate(d: string): string {
  if (!d) return '';
  const t = new Date(d);
  if (isNaN(t.getTime())) return d.slice(0, 10);
  const n = Date.now() - t.getTime();
  const day = Math.floor(n / 864e5);
  if (day < 1) { const h = Math.floor(n / 36e5); return h < 1 ? '刚刚' : h + '小时前'; }
  if (day < 7) return day + '天前';
  if (day < 30) return Math.floor(day / 7) + '周前';
  if (day < 365) return Math.floor(day / 30) + '个月前';
  return Math.floor(day / 365) + '年前';
}

export default function FriendCircle(): JSX.Element {
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadArticles = useCallback(async (f = false) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(API_URL + (f ? '?refresh=1' : ''));
      if (!r.ok) throw Error('HTTP ' + r.status);
      const data = await r.json();
      setArticles(data.list || []); setCount(data.list?.length || 0); setPage(1);
    } catch { setError('加载失败，请稍后重试'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(REFRESH_URL, {method: 'POST'});
      setTimeout(async () => { await loadArticles(true); setRefreshing(false); }, 3000);
    } catch { setRefreshing(false); }
  };

  const shown = articles.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < articles.length;

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0">{TITLE}</h1>
            <p className="text-sm text-[var(--ifm-secondary-text-color)] m-0 mt-1">{DESCRIPTION}</p>
          </div>
          <div className="flex items-center gap-3">
            {count > 0 && <span className="text-xs text-[var(--ifm-secondary-text-color)]">{count} 篇</span>}
            <button
              onClick={handleRefresh} disabled={refreshing}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-solid border-[var(--ifm-color-emphasis-300)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ifm-color-emphasis-700)] transition-all hover:border-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary)]">
              <Icon icon={refreshing ? 'ri:loader-4-line' : 'ri:refresh-line'} width="14" height="14" className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? '刷新中' : '刷新'}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-[var(--ifm-color-danger)]">{error}</p>}
        {loading && !error && <p className="text-center text-sm text-[var(--ifm-secondary-text-color)]">加载中…</p>}

        {!loading && articles.length === 0 && !error && (
          <div className="py-16 text-center">
            <Icon icon="ri:rss-line" width="48" height="48" className="mx-auto mb-4 text-[var(--ifm-color-emphasis-300)]" />
            <p className="m-0 text-sm text-[var(--ifm-secondary-text-color)]">暂无友链文章，请先在后台为友链配置 RSS 订阅地址。</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shown.map((a, i) => (
                <a
                  key={a.link + i}
                  href={a.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col rounded-lg border border-solid border-[var(--ifm-color-emphasis-200)] bg-card p-4 no-underline transition-all duration-200 hover:-translate-y-1 hover:border-[var(--ifm-color-primary)] hover:shadow-md">
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={a.avatar}
                      alt={a.site}
                      className="size-8 rounded-full object-contain"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[var(--ifm-color-emphasis-800)] truncate">{a.site}</div>
                      <div className="text-xs text-[var(--ifm-secondary-text-color)]">{a.date ? formatDate(a.date) : ''}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--ifm-color-emphasis-900)] line-clamp-2 leading-snug group-hover:text-[var(--ifm-color-primary)]">
                    {a.title}
                  </div>
                  {a.description && (
                    <p className="mt-2 text-xs text-[var(--ifm-secondary-text-color)] line-clamp-2 leading-relaxed m-0">
                      {a.description}
                    </p>
                  )}
                </a>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer rounded-full border border-solid border-[var(--ifm-color-emphasis-300)] bg-transparent px-6 py-2 text-sm font-medium text-[var(--ifm-color-emphasis-700)] transition-all hover:border-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary)]">
                  加载更多
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}