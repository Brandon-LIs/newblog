import Layout from '@theme/Layout';
import {marked} from 'marked';
import {useEffect, useRef, useState, useCallback} from 'react';

import styles from './shuoshuo.module.css';

const MEMOS_PROXY = 'https://apis.oopss.top/api/memos';
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

function stripHtml(h: string): string {
  return String(h || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// 生成推特风格分享图
function generateShareImage(memo: Memo): Promise<HTMLCanvasElement> {
  const W = 800;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const avatar = memo.creator?.avatarUrl || 'https://jsd.oopss.top/icon.jpg';
  const name = memo.creator?.nickname || memo.creator?.username || 'Brandon';
  const html = marked.parse(memo.content || '', {gfm: true, breaks: true}) as string;
  const text = stripHtml(html);
  const firstImg = extractFirstImage(html);
  const memoId = memo.id;
  const link = memo.link || `https://memos.oopss.top/m/${memoId}`;
  const time = memo.createdTs ? new Date(memo.createdTs * 1000) : new Date();
  const timeStr = `${time.getFullYear()}年${time.getMonth() + 1}月${time.getDate()}日`;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#f0f7ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部装饰线
  ctx.fillStyle = '#12affa';
  ctx.fillRect(0, 0, W, 4);

  // 加载头像 + 正文图片 + 二维码
  return Promise.all([
    loadImage(avatar),
    firstImg ? loadImage(firstImg).catch(() => null) : Promise.resolve(null),
    loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link)}&margin=0`).catch(() => null),
  ]).then(([avatarImg, contentImg, qrImg]) => {
    // 圆形头像
    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(64, 110, 40, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, 24, 70, 80, 80);
      ctx.restore();
      ctx.strokeStyle = '#12affa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 110, 40, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#12affa';
      ctx.beginPath();
      ctx.arc(64, 110, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('B', 64, 122);
    }

    // 名称
    ctx.fillStyle = '#0f1419';
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(name, 120, 100);

    // 认证徽章
    const nameW = ctx.measureText(name).width;
    ctx.fillStyle = '#12affa';
    ctx.beginPath();
    ctx.arc(120 + nameW + 16, 93, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 120 + nameW + 16, 98);

    // @brandon + 时间
    ctx.fillStyle = '#536471';
    ctx.font = '17px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('@brandon', 120, 128);
    ctx.fillText(timeStr, 120, 152);

    // 正文
    let textY = 200;
    ctx.fillStyle = '#0f1419';
    ctx.font = '20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    textY = wrapText(ctx, text, 60, textY, W - 120, 36);

    // 正文图片
    if (contentImg) {
      const imgW = W - 120;
      const imgH = Math.min(300, (imgW * contentImg.height) / contentImg.width);
      const imgX = 60;
      const imgY = textY + 12;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      roundRect(ctx, imgX, imgY, imgW, imgH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      roundRect(ctx, imgX, imgY, imgW, imgH, 12);
      ctx.clip();
      ctx.drawImage(contentImg, imgX, imgY, imgW, imgH);
      ctx.restore();
      textY = imgY + imgH;
    }

    // 底部品牌
    ctx.fillStyle = '#12affa';
    ctx.font = 'bold 18px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('Brandon\'s Blog', 60, H - 40);
    ctx.fillStyle = '#536471';
    ctx.font = '15px sans-serif';
    ctx.fillText('blog.oopss.top', 60, H - 16);

    // 二维码
    if (qrImg) {
      const qrSize = 108;
      const qrX = W - qrSize - 40;
      const qrY = H - qrSize - 36;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
      ctx.fill();
      ctx.stroke();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    return canvas;
  });
}

function extractFirstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load failed'));
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const chars = Array.from(text);
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineHeight;
      if (yy > 360) break;
    } else {
      line = test;
    }
  }
  if (line && yy <= 360) {
    ctx.fillText(line, x, yy);
    yy += lineHeight;
  }
  return yy;
}

function MemoPost({memo, onShare}: {memo: Memo; onShare: (memo: Memo) => void}) {
  const html = marked.parse(memo.content || '', {gfm: true, breaks: true}) as string;
  const avatar = memo.creator?.avatarUrl || 'https://jsd.oopss.top/icon.jpg';
  const name = memo.creator?.nickname || memo.creator?.username || 'Brandon';
  const link = memo.link || `https://memos.oopss.top/m/${memo.id}`;

  return (
    <article className={styles.post}>
      <div className={styles.postAvatar}>
        <img className={styles.avatar} src={avatar} alt={name} loading="lazy" width={40} height={40} />
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
          <button onClick={() => onShare(memo)} className={styles.postAction}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
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
  const [shareMemo, setShareMemo] = useState<Memo | null>(null);
  const [shareImg, setShareImg] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const initialized = useRef(false);

  const handleShare = useCallback((memo: Memo) => {
    setShareMemo(memo);
    setShareImg(null);
    setShareLoading(true);
    generateShareImage(memo).then((canvas) => {
      setShareImg(canvas.toDataURL('image/png'));
      setShareLoading(false);
    }).catch(() => {
      setShareLoading(false);
    });
  }, []);

  const downloadShare = useCallback(() => {
    if (!shareImg || !shareMemo) return;
    const a = document.createElement('a');
    a.href = shareImg;
    a.download = `brandon-shuoshuo-${shareMemo.id || Date.now()}.png`;
    a.click();
  }, [shareImg, shareMemo]);

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
              <img src="https://jsd.oopss.top/icon.jpg" alt="Brandon" width={80} height={80} />
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
              <MemoPost key={memo.id || i} memo={memo} onShare={handleShare} />
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

      {shareMemo && (
        <div className={styles.shareModal} onClick={() => setShareMemo(null)}>
          <div className={styles.shareModalInner} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shareModalHeader}>
              <span>生成分享图</span>
              <button className={styles.shareClose} onClick={() => setShareMemo(null)}>✕</button>
            </div>
            {shareLoading ? (
              <div className={styles.shareLoading}>生成中…</div>
            ) : shareImg ? (
              <>
                <img src={shareImg} alt="分享图" className={styles.shareImg} />
                <div className={styles.shareActions}>
                  <button className={styles.shareDownload} onClick={downloadShare}>💾 保存图片</button>
                </div>
              </>
            ) : (
              <div className={styles.shareLoading}>生成失败</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}