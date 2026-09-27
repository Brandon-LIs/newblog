import Layout from '@theme/Layout';
import {useEffect, useRef, useState} from 'react';

import {Icon} from '@iconify/react';

import styles from './message.module.css';

// 留言板：复用自建 Twikoo 后端（与文章评论区同一 env，但按页面 URL 独立成帖）
// 用 twikoo.min.js（自带基础样式，351KB）；不用 .nocss.js + twikoo.css 组合（合计 810KB），
// 页面样式由本组件的 message.module.css 覆写（选择器多一层 .board，特异性更高，不受注入顺序影响）
const TWIKOO_SCRIPT = 'https://s4.zstatic.net/npm/twikoo@2.0.9/dist/twikoo.min.js';
const TWIKOO_ENV = 'https://co.oopss.top';
// 固定线程标识：留言板只有一个公共留言池，不随 query/hash 变化
const TWIKOO_URL = 'https://blog.oopss.top/message';

const TITLE = '留言板';
const DESCRIPTION = '想说的话，都可以留在这里。';

declare global {
  interface Window {
    twikoo?: {
      init: (options: {
        envId: string;
        el: HTMLElement | string;
        url?: string;
        onCommentLoaded?: () => void;
      }) => Promise<void>;
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1') { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('脚本加载失败')));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => reject(new Error('脚本加载失败'));
    document.head.appendChild(s);
  });
}

// Twikoo 内置文案为「评论」语境，留言板统一改为「留言」
const WORDING: Array<[RegExp, string]> = [
  [/(\d+)\s*条评论/g, '$1 条留言'],
  [/条评论/g, '条留言'],
  [/没有评论/g, '还没有留言，来写第一条吧'],
  [/评论/g, '留言'],
];

function normalizeWording(root: HTMLElement): void {
  const targets = [
    '.tk-comments-count', '.tk-comments-title', '.tk-comments-no',
    '.tk-comments-actions', '.tk-sort-item', '.tk-comments-search',
  ];
  for (const sel of targets) {
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      // 只处理自身直接文本节点，避免破坏表情/按钮内的图标结构
      const own = [...el.childNodes].filter((n) => n.nodeType === 3) as Text[];
      own.forEach((node) => {
        let text = node.nodeValue || '';
        WORDING.forEach(([re, to]) => { text = text.replace(re, to); });
        if (text !== node.nodeValue) { node.nodeValue = text; }
      });
    });
  }
}

export default function Message(): JSX.Element {
  const boardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;
    let timer: number | undefined;

    const sync = () => {
      if (disposed || !boardRef.current) { return; }
      normalizeWording(boardRef.current);
    };

    // Twikoo 异步渲染/翻页/提交后文案会重写，用节流的 MutationObserver 保持术语一致
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, 120);
    };

    (async () => {
      try {
        await loadScript(TWIKOO_SCRIPT);
        if (disposed || !boardRef.current) { return; }

        if (!window.twikoo) {
          throw new Error('Twikoo 未就绪');
        }

        await window.twikoo.init({
          envId: TWIKOO_ENV,
          el: boardRef.current,
          url: TWIKOO_URL,
          onCommentLoaded: () => {
            if (disposed) { return; }
            setStatus('ready');
            sync();
          },
        });
        // 部分情况下 onCommentLoaded 不触发，init 成功后兜底解除骨架
        if (!disposed) { setStatus('ready'); }
        sync();
        observer = new MutationObserver(debounced);
        observer.observe(boardRef.current, {childList: true, subtree: true, characterData: true});
      } catch (err) {
        console.warn('[留言板] Twikoo 初始化失败', err);
        if (!disposed) { setStatus('error'); }
      }
    })();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName={styles.page}>
      <main className={styles.wrap}>
        <header className={styles.header}>
          <div className={styles.headerIcon} aria-hidden>
            <Icon icon="ri:message-3-line" width={26} height={26} />
          </div>
          <h1 className={styles.title}>{TITLE}</h1>
          <p className={styles.sub}>{DESCRIPTION}</p>
          <ul className={styles.hints}>
            <li><Icon icon="ri:heart-3-line" width={15} height={15} /> 这里是公共留言池，随便聊</li>
            <li><Icon icon="ri:link" width={15} height={15} /> 支持昵称、邮箱、站点与表情</li>
            <li><Icon icon="ri:reply-line" width={15} height={15} /> 每条留言都可以回复</li>
          </ul>
        </header>

        <div className={styles.board}>
          {status === 'loading' && (
            <div className={styles.skeleton} aria-hidden>
              <div className={styles.skEditor} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
            </div>
          )}

          {status === 'error' && (
            <div className={styles.error} role="alert">
              <Icon icon="ri:alarm-warning-line" width={22} height={22} />
              <div>
                <strong>留言板加载失败</strong>
                <p>可能是网络波动或评论服务暂时不可用，请稍后刷新重试。</p>
              </div>
            </div>
          )}

          {/* Twikoo 挂载点：自定义样式全部限定在 .board 内，不影响文章评论区 */}
          <div ref={boardRef} className={styles.twikoo} />
        </div>
      </main>
    </Layout>
  );
}
