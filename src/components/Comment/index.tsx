import React, {useEffect, useRef, useState} from 'react';

// Twikoo 评论（envId 为自建 Twikoo 后端），使用 Twikoo 默认样式
// 走 jsDelivr 国内镜像（jsd.oopss.top 代理把 .js 当 text/plain+nosniff 返回，浏览器拒执行，故不用 volces）
const TWIKOO_SCRIPT = 'https://s4.zstatic.net/npm/twikoo@2.0.12/dist/twikoo.min.js';
const TWIKOO_ENV = 'https://co.oopss.top';

// 骨架高度要贴近真实评论区（约 180~260px），既能占住版面避免 CLS，
// 也让挂载点有非零面积 —— 见下方「为什么必须有骨架」说明。
const SKELETON_MIN_HEIGHT = 200;

type Phase = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 加载策略（相对最初的纯懒加载做了三处调整）：
 *
 * 1) 骨架占位 —— 原实现观察一个空 div 的 IntersectionObserver。
 *    空 div 高度为 0，而 IntersectionObserver 按规范会跳过零面积目标
 *    （intersectionRatio 恒为 0 且不派发回调），所以脚本其实永远不会被加载。
 *    给挂载点一个 min-height 骨架后，观察器才可能触发，同时顺带消掉 CLS。
 *
 * 2) 空闲预热 —— 首屏渲染完成后（window load 事件之后）用
 *    requestIdleCallback 提前把 twikoo.min.js（约 343KB）拉进 HTTP 缓存。
 *    脚本是 async 注入的，不阻塞解析与渲染；空闲回调只在浏览器空闲时触发，
 *    所以既不占用首屏带宽，也不会和正文抢主线程。
 *
 * 3) 提前建立到后端的连接 —— 空闲时先发一个 OPTIONS 预检预热，
 *    滚到评论区时那条 COMMENT_GET 就不必再等 TLS 握手。
 *
 * 综合效果：滚到评论区时脚本已在缓存里，只需 init + 一次接口请求；
 * 首屏则完全没有新增阻塞。
 */

/** 空闲时执行；不支持 requestIdleCallback 的浏览器退化为 setTimeout。 */
function onIdle(cb: () => void, timeout = 2000): () => void {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number;
      cancelIdleCallback?: (id: number) => void;
    }
  ).requestIdleCallback;
  if (typeof ric === 'function') {
    const id = ric(() => cb(), {timeout});
    return () => {
      const cancel = (
        window as unknown as {cancelIdleCallback?: (id: number) => void}
      ).cancelIdleCallback;
      cancel?.(id);
    };
  }
  const id = window.setTimeout(cb, 1);
  return () => window.clearTimeout(id);
}

export default function Comment(): JSX.Element {
  // wrapperRef：有骨架占位、非零面积，交给 IntersectionObserver 观察
  const wrapperRef = useRef<HTMLDivElement>(null);
  // containerRef：Twikoo 的实际挂载点，必须保持干净（不能放骨架）
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('idle');

  /** 注入脚本（幂等）。脚本已在缓存中时 resolve 几乎立即完成。 */
  const ensureScript = (): Promise<void> => {
    if (window.twikoo) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${TWIKOO_SCRIPT}"]`,
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(), {once: true});
        existing.addEventListener('error', () => reject(new Error('load')), {
          once: true,
        });
        return;
      }
      const script = document.createElement('script');
      script.src = TWIKOO_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Twikoo 脚本加载失败'));
      document.head.appendChild(script);
    });
  };

  /** 真正初始化 Twikoo。重复调用无效。 */
  const initTwikoo = async () => {
    if (startedRef.current || !containerRef.current) {
      return;
    }
    startedRef.current = true;
    setPhase('loading');
    try {
      await ensureScript();
      if (!window.twikoo) {
        throw new Error('Twikoo 未就绪');
      }
      await window.twikoo.init({
        envId: TWIKOO_ENV,
        el: containerRef.current,
      });
      setPhase('ready');
    } catch (err) {
      console.warn('[Twikoo] 初始化失败', err);
      setPhase('error');
    }
  };

  useEffect(() => {
    // ── 空闲预热：首屏渲染完成后再去抢带宽和连接 ──
    let cancelIdle = () => {};
    const warmup = () => {
      // 只预热脚本，不 init —— 初始化要等用户真的滚到评论区再做，
      // 避免在空闲回调里塞进一整套 DOM 构建。
      void ensureScript().catch(() => {
        /* 预热失败不报错，等真正可见时会再试一次并给出提示 */
      });
      // 预热到后端的连接，省掉后续 TLS 握手
      fetch(TWIKOO_ENV, {method: 'OPTIONS'}).catch(() => {});
    };

    if (document.readyState === 'complete') {
      cancelIdle = onIdle(warmup);
    } else {
      const onLoad = () => {
        cancelIdle = onIdle(warmup);
      };
      window.addEventListener('load', onLoad, {once: true});
      return () => {
        window.removeEventListener('load', onLoad);
        cancelIdle();
      };
    }
    return () => cancelIdle();
  }, []);

  useEffect(() => {
    // 关键：观察 wrapperRef 而不是 containerRef。
    // containerRef 是空 div，高度为 0，而 IntersectionObserver 会跳过零面积目标，
    // 观察它永远不会触发。wrapperRef 内含 min-height:200px 的骨架，才有非零面积。
    const target = wrapperRef.current;
    if (!target) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      void initTwikoo();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          void initTwikoo();
        }
      },
      {rootMargin: '600px 0px'},
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="blog-comment"
      style={{margin: '2.5rem 0 1rem'}}>
      {/* 骨架：给挂载点非零面积（IntersectionObserver 需要）+ 占位避免 CLS。
          Twikoo 渲染出真实内容后由下面 useEffect 切走。 */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          aria-hidden="true"
          style={{
            minHeight: SKELETON_MIN_HEIGHT,
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--ifm-color-emphasis-200)',
            background: 'var(--ifm-color-emphasis-100)',
          }}>
          <div
            style={{
              height: 14,
              width: '38%',
              borderRadius: 7,
              marginBottom: 18,
              background: 'var(--ifm-color-emphasis-300)',
              opacity: 0.55,
            }}
          />
          {[0, 1].map((i) => (
            <div key={i} style={{marginBottom: 14}}>
              <div
                style={{
                  height: 11,
                  width: '100%',
                  borderRadius: 6,
                  marginBottom: 7,
                  background: 'var(--ifm-color-emphasis-200)',
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  height: 11,
                  width: `${72 - i * 16}%`,
                  borderRadius: 6,
                  background: 'var(--ifm-color-emphasis-200)',
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
          <div
            style={{
              height: 11,
              width: '100%',
              borderRadius: 6,
              background: 'var(--ifm-color-emphasis-200)',
              opacity: 0.6,
            }}
          />
        </div>
      )}

      {phase === 'error' && (
        <p
          style={{
            color: 'var(--ifm-color-danger)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '24px 0',
          }}>
          评论加载失败，请检查网络后
          <button
            type="button"
            onClick={() => {
              startedRef.current = false;
              void initTwikoo();
            }}
            style={{
              background: 'none',
              border: 0,
              color: 'var(--ifm-color-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0 4px',
            }}>
            重试
          </button>
          。
        </p>
      )}

      <div ref={containerRef} />
    </div>
  );
}