import Layout from '@theme/Layout';
import {marked} from 'marked';
import {useEffect, useRef, useState} from 'react';

import styles from './shuoshuo.module.css';

// Memos 配置
const MEMOS_HOST = 'https://memos.oopss.top';
const CREATOR_ID = '1'; // 说说的作者用户 ID
const LIMIT = 20;

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
  return `creator=='users/${CREATOR_ID}'&&visibilities==['PUBLIC','PROTECTED']`;
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
  if (res.name) return `${MEMOS_HOST}/file/${res.name}`;
  if (res.filename && res.name) return `${MEMOS_HOST}/file/${res.name}`;
  return null;
}

function MemoCard({memo}: {memo: Memo}) {
  const content = memo.content || '';
  const html = marked.parse(content, {gfm: true, breaks: true}) as string;
  const images = (memo.resources || []).filter((r) =>
    /^image\//.test(r.type || ''),
  );
  const avatar =
    memo.creator?.avatarUrl || 'https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg';

  return (
    <article className={styles.card}>
      {memo.pinned && <span className={styles.pinned}>📌 置顶</span>}
      <div className={styles.header}>
        <img className={styles.avatar} src={avatar} alt="avatar" loading="lazy" />
        <div className={styles.meta}>
          <span className={styles.name}>{memo.creator?.displayName || 'Brandon'}</span>
          <span className={styles.time}>{relativeTime(memo.createdTs)}</span>
        </div>
      </div>
      <div
        className={styles.content}
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
      <div className={styles.footer}>
        <a
          href={`https://memos.oopss.top/m/${memo.id}`}
          target="_blank"
          rel="noreferrer"
          className={styles.link}>
          前往评论 →
        </a>
      </div>
    </article>
  );
}

export default function Shuoshuo(): JSX.Element {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [pageToken, setPageToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const initialized = useRef(false);

  async function load(append: boolean, token?: string) {
    setLoading(true);
    setError('');
    try {
      const filter = encodeURIComponent(buildFilter());
      let url = `${MEMOS_HOST}/api/v1/memos?limit=${LIMIT}&filter=${filter}`;
      if (token) url += `&pageToken=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('无法读取说说：请在 Memos 设置中开启「允许未登录用户查看公开 Memos」。');
        } else {
          setError(`加载失败（${res.status}）`);
        }
        return;
      }
      const data = await res.json();
      const list: Memo[] = data.memos || [];
      if (append) {
        setMemos((prev) => [...prev, ...list]);
      } else {
        setMemos(list);
      }
      setPageToken(data.nextPageToken || '');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout title="说说" description="Brandon 的说说广场">
      <main className={styles.page}>
        <h1 className={styles.title}>说说广场</h1>
        <p className={styles.subtitle}>记录日常碎片与随想 · 由 Memos 驱动</p>

        {error && <div className={styles.error}>{error}</div>}

        {memos.length > 0 && (
          <div className={styles.grid}>
            {memos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
          </div>
        )}

        {loading && memos.length === 0 && (
          <div className={styles.empty}>加载中…</div>
        )}
        {!loading && !error && memos.length === 0 && (
          <div className={styles.empty}>暂无说说</div>
        )}

        {pageToken && (
          <div className={styles.loadMoreWrap}>
            <button
              className={styles.loadMore}
              disabled={loading}
              onClick={() => load(true, pageToken)}>
              {loading ? '加载中…' : '加载更多'}
            </button>
          </div>
        )}
      </main>
    </Layout>
  );
}
