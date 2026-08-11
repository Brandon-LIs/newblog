import Layout from '@theme/Layout';
import {marked} from 'marked';
import {useEffect, useRef, useState} from 'react';

import styles from './shuoshuo.module.css';

const MEMOS_PROXY = 'https://api.oopss.top/api/memos';
const LIMIT = 10;
const STEP = 10;

type MemoCreator = {id?: number; nickname?: string; username?: string; avatarUrl?: string};
type Memo = {id?: number; content?: string; createdTs?: number; pinned?: boolean; visibility?: string; tags?: string[]; creator?: MemoCreator; link?: string};

function relativeTime(ts?: number): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function MemoPost({memo}: {memo: Memo}) {
  const html = marked.parse(memo.content || '', {gfm: true, breaks: true}) as string;
  const avatar = memo.creator?.avatarUrl || 'https://cdn.oopss.top/icon.jpg';
  const name = memo.creator?.nickname || memo.creator?.username || 'Brandon';
  const link = memo.link || `https://memos.oopss.top/m/${memo.id}`;

  return (
    <article className={styles.post}>
      <div className={styles.postAvatar}>
        <img className={styles.avatar} src={avatar} alt={name} loading="lazy" />
      </div>
      <div className={styles.postBody}>
        <div className={styles.postMeta}>
          <span className={styles.postName}>{name}</span>
          <span className={styles.postTagline}>@brandon</span>
          <span className={styles.postDot}>·</span>
          <a href={link} target="_blank" rel="noreferrer" className={styles.postTime}>
            {memo.pinned && '📌 '}
            {relativeTime(memo.createdTs)}
          </a>
        </div>
        <div className={styles.postContent} dangerouslySetInnerHTML={{__html: html}} />
        <div className={styles.postActions}>
          <a href={link} target="_blank" rel="noreferrer" className={styles.postAction}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </a>
          <a href={link} target="_blank" rel="noreferrer" className={styles.postAction}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </a>
        </div>
      </div>
    </article>
  );
}

type MemosResp = {memos?: Memo[]; total?: number; page?: number; size?: number; hasMore?: boolean};

export default function Shuoshuo(): JSX.Element {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  async function fetchPage(nextPage: number): Promise<MemosResp | null> {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${MEMOS_PROXY}?limit=${LIMIT}&page=${nextPage}`);
      if (!res.ok) { setError(`加载失败（${res.status}）`); return null; }
      return await res.json() as MemosResp;
    } catch { setError('网络错误，请稍后重试'); return null; }
    finally { setLoading(false); }
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
  }, []);

  async function loadMore() {
    if (visibleCount >= memos.length) {
      if (!hasMore) return;
      const nextPage = page + 1;
      const data = await fetchPage(nextPage);
      if (data && data.memos && data.memos.length) {
        setMemos(prev => [...prev, ...(data.memos || [])]);
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
        setVisibleCount(prev => prev + STEP);
      }
      return;
    }
    setVisibleCount(prev => prev + STEP);
  }

  const shown = memos.slice(0, visibleCount);
  const canMore = visibleCount < memos.length || hasMore;

  return (
    <Layout title="说说" description="Brandon 的说说广场" wrapperClassName="bg-background">
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarAvatar}>
              <img src="https://cdn.oopss.top/icon.jpg" alt="Brandon" />
            </div>
            <h2 className={styles.sidebarName}>Brandon</h2>
            <p className={styles.sidebarBio}>我们都有光明的未来</p>
            <div className={styles.sidebarStats}>
              <span><strong>{memos.length}</strong> 条说说</span>
            </div>
          </div>
        </div>

        <div className={styles.feed}>
          <div className={styles.feedHeader}>
            <h1 className={styles.feedTitle}>说说</h1>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {loading && shown.length === 0 && <div className={styles.empty}>加载中…</div>}
          {!loading && !error && shown.length === 0 && <div className={styles.empty}>暂无说说</div>}

          <div className={styles.stream}>
            {shown.map((memo, i) => (
              <MemoPost key={memo.id || i} memo={memo} />
            ))}
          </div>

          {canMore && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMore} disabled={loading} onClick={loadMore}>
                {loading ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}