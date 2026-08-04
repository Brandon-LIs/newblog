import Layout from '@theme/Layout';
import {marked} from 'marked';
import {useEffect, useRef, useState} from 'react';

import styles from './shuoshuo.module.css';

// Memos 配置
const MEMOS_PROXY = 'https://admin.oopss.top/api/memos'; // blog-admin worker 代理（token 在服务端）
const LIMIT = 20; // 每次从代理拉取的条数

type MemoResource = {
  name?: string;
  filename?: string;
  type?: string;
  size?: number;
  externalLink?: string;
};

type MemoCreator = {
  name?: string;
  displayName?: string;
  avatarUrl?: string;
};

type Memo = {
  id?: number;
  content?: string;
  createdTs?: number;
  pinned?: boolean;
  visibility?: string;
  resources?: MemoResource[];
  creator?: MemoCreator;
};

function buildFilter() {
  return `creator=='users/1'`;
}

function relativeTime(ts?: number): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  const d = new Date(ts * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function resourceUrl(res: MemoResource): string | null {
  if (res.externalLink) return res.externalLink;
  if (res.name) return `https://memos.oopss.top/file/${res.name}`;
  return null;
}

function MemoRow({memo, index}: {memo: Memo; index: number}) {
  const html = marked.parse(memo.content || '', {gfm: true, breaks: true}) as string;
  const images = (memo.resources || []).filter((r) =>
    /^image\//.test(r.type || ''),
  );
  const avatar =
    memo.creator?.avatarUrl ||
    'https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg';
  const first = index === 0;

  return (
    <div className={styles.row}>
      <div className={styles.rail}>
        <img className={styles.avatar} src={avatar} alt="avatar" loading="lazy" />
        {!first && <span className={styles.line} />}
      </div>
      <div className={styles.bubbleArea}>
        <div className={styles.meta}>
          <span className={styles.name}>{memo.creator?.displayName || 'Brandon'}</span>
          <span className={styles.time}>
            {memo.pinned && '📌 '}
            {relativeTime(memo.createdTs)}
          </span>
        </div>
        <div
          className={styles.bubble}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{__html: html}}
        />
        {images.length > 0 && (
          <div className={styles.images}>
            {images.map((img, i) => {
              const url = resourceUrl(img);
              return url ? (
                <img
                  key={i}
                  className={styles.image}
                  src={url}
                  alt={img.filename || 'image'}
                  loading="lazy"
                />
              ) : null;
            })}
          </div>
        )}
        <a
          href={`https://memos.oopss.top/m/${memo.id}`}
          target="_blank"
          rel="noreferrer"
          className={styles.link}>
          前往评论 →
        </a>
      </div>
    </div>
  );
}

export default function Shuoshuo(): JSX.Element {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [pageToken, setPageToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const initialized = useRef(false);

  async function fetchBatch(): Promise<{list: Memo[]; next: string} | null> {
    setLoading(true);
    setError('');
    try {
      const filter = encodeURIComponent(buildFilter());
      let url = `${MEMOS_PROXY}?limit=${LIMIT}&filter=${filter}`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setError(`加载失败（${res.status}）`);
        return null;
      }
      const data = await res.json();
      return {list: data.memos || [], next: data.nextPageToken || ''};
    } catch {
      setError('网络错误，请稍后重试');
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      const batch = await fetchBatch();
      if (batch) {
        setMemos(batch.list);
        setPageToken(batch.next);
        setVisibleCount(Math.min(1, batch.list.length));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    // 若已展示完当前批次，且还有下一页，则先拉取下一批
    if (visibleCount >= memos.length) {
      if (!pageToken) return;
      const batch = await fetchBatch();
      if (batch && batch.list.length) {
        setMemos((prev) => [...prev, ...batch.list]);
        setPageToken(batch.next);
        setVisibleCount((prev) => prev + 1);
        return;
      }
      return;
    }
    setVisibleCount((prev) => prev + 1);
  }

  const shown = memos.slice(0, visibleCount);
  const hasMore = visibleCount < memos.length || Boolean(pageToken);

  return (
    <Layout title="说说" description="Brandon 的说说广场">
      <main className={styles.page}>
        <h1 className={styles.title}>说说广场</h1>
        <p className={styles.subtitle}>
          {memos.length > 0
            ? `对话流 · 共 ${memos.length}+ 条 · 逐条浏览`
            : '记录日常碎片与随想'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.stream}>
          {shown.map((memo, i) => (
            <MemoRow key={memo.id || i} memo={memo} index={i} />
          ))}
        </div>

        {loading && shown.length === 0 && (
          <div className={styles.empty}>加载中…</div>
        )}
        {!loading && !error && shown.length === 0 && (
          <div className={styles.empty}>暂无说说</div>
        )}

        {hasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              className={styles.loadMore}
              disabled={loading}
              onClick={loadMore}>
              {loading ? '加载中…' : '加载更多'}
            </button>
            <div className={styles.hint}>
              第 {visibleCount} 条{hasMore ? ' · 下一条 ↓' : ''}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
