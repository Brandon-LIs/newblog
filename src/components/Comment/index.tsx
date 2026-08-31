import React, {useEffect, useRef} from 'react';

// Twikoo 评论（envId 为自建 Twikoo 后端），使用 Twikoo 默认样式
// 走 jsDelivr 国内镜像（jsd.oopss.top 代理把 .js 当 text/plain+nosniff 返回，浏览器拒执行，故不用 volces）
const TWIKOO_SCRIPT = 'https://s4.zstatic.net/npm/twikoo@1.7.20/dist/twikoo.min.js';
const TWIKOO_ENV = 'https://co.oopss.top';

declare global {
  interface Window {
    twikoo?: {
      init: (options: {envId: string; el: HTMLElement | string}) => Promise<void>;
    };
  }
}

export default function Comment(): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current || !containerRef.current) {
      return;
    }

    const init = () => {
      if (renderedRef.current) {
        return;
      }
      renderedRef.current = true;

      const run = () => {
        if (!window.twikoo) {
          console.warn('[Twikoo] 评论脚本未加载');
          return;
        }
        window.twikoo
          .init({envId: TWIKOO_ENV, el: containerRef.current!})
          .catch((err) => console.warn('[Twikoo] 初始化失败', err));
      };

      if (window.twikoo) {
        run();
        return;
      }

      const script = document.createElement('script');
      script.src = TWIKOO_SCRIPT;
      script.async = true;
      script.onload = run;
      script.onerror = () => {
        console.warn('[Twikoo] 评论脚本加载失败，请检查网络');
      };
      document.head.appendChild(script);
    };

    // 滚动到评论区附近才加载，避免拖慢首屏
    if ('IntersectionObserver' in window && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            observer.disconnect();
            init();
          }
        },
        {rootMargin: '400px'},
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
    init();
  }, []);

  return (
    <div className="blog-comment" style={{margin: '2.5rem 0 1rem'}}>
      <div ref={containerRef} />
    </div>
  );
}
