import Layout from '@theme/Layout';
import {marked} from 'marked';
import {useEffect, useRef, useState} from 'react';

import styles from './shuoshuo.module.css';

// 说说 API（经 blog-admin worker 代理，token 在服务端）
const MEMOS_PROXY = 'https://admin.oopss.top/api/memos';
const LIMIT = 10; // 每次从代理拉取条数
const STEP = 5; // 每次显示条数

type MemoCreator = {
  id?: number;
  nickname?: string;
  username?: string;
  avatarUrl?: string;
};

type Memo = {
  id?: number;
  content?: string;
  createdTs?: number;
  pinned?: boolean;
  visibility?: string;
  tags?: string[];
  creator?: MemoCreator;
  link?: string;
};

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

function MemoRow({memo, index}: {memo: Memo; index: number}) {
  const html = marked.parse(memo.content || '', {gfm: true, breaks: true}) as string;
  const avatar =
    memo.creator?.avatarUrl ||
    'https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg';
  const name = memo.creator?.nickname || memo.creator?.username || 'Brandon';
  const link = memo.link || `https://memos.oopss.top/m/${memo.id}`;
  const first = index === 0;

  return (
    <div className={styles.row}>
      <div className={styles.rail}>
        <img className={styles.avatar} src={avatar} alt="avatar" loading="lazy" />
        {!first && <span className={styles.line} />}
      </div>
      <div className={styles.bubbleArea}>
        <div className={styles.meta}>
          <span className={styles.name}>{name}</span>
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
        <a href={link} target="_blank" rel="noreferrer" className={styles.link}>
          前往评论 →
        </a>
      </div>
    </div>
  );
}

type MemosResp = {
  memos?: Memo[];
  total?: number;
  page?: number;
  size?: number;
  hasMore?: boolean;
};

export default function Shuoshuo(): JSX.Element {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const initialized = useRef(false);

  async function fetchPage(nextPage: number): Promise<MemosResp | null> {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${MEMOS_PROXY}?limit=${LIMIT}&page=${nextPage}`);
      if (!res.ok) {
        setError(`加载失败（${res.status}）`);
        return null;
      }
      return (await res.json()) as MemosResp;
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
      const data = await fetchPage(1);
      if (data) {
        setMemos(data.memos || []);
        setPage(1);
        setHasMore(Boolean(data.hasMore));
        setVisibleCount(Math.min(STEP, (data.memos || []).length));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    // 已展示完当前页数据，且还有下一页 → 拉取下一页
    if (visibleCount >= memos.length) {
      if (!hasMore) return;
      const nextPage = page + 1;
      const data = await fetchPage(nextPage);
      if (data && data.memos && data.memos.length) {
        setMemos((prev) => [...prev, ...(data.memos || [])]);
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
        setVisibleCount((prev) => prev + STEP);
      }
      return;
    }
    setVisibleCount((prev) => prev + STEP);
  }

  const shown = memos.slice(0, visibleCount);
  const canMore = visibleCount < memos.length || hasMore;

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

        {canMore && (
          <div className={styles.loadMoreWrap}>
            <button
              className={styles.loadMore}
              disabled={loading}
              onClick={loadMore}>
              {loading ? '加载中…' : '加载更多'}
            </button>
            <div className={styles.hint}>
              第 {visibleCount} 条{canMore ? ' · 下一条 ↓' : ''}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
