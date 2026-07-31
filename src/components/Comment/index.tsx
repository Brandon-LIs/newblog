import React, {useEffect, useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import '@site/src/vendor/gitalk/gitalk.css';

// 反代域名：自建 Cloudflare Worker（~/Downloads/gh-proxy），加速国内访问 api.github.com
const GITHUB_PROXY = 'https://gh.oopss.top/oauth/token';

export default function Comment(): JSX.Element | null {
  const {siteConfig} = useDocusaurusContext();
  const gitalk =
    (
      siteConfig.customFields as {
        gitalk?: {
          clientID: string;
          clientSecret: string;
          repo: string;
          owner: string;
          admin: string[];
        };
      }
    ).gitalk ?? {
      clientID: '',
      clientSecret: '',
      repo: '',
      owner: '',
      admin: [],
    };
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current || !containerRef.current) {
      return;
    }
    if (!gitalk.clientID || !gitalk.clientSecret) {
      console.warn(
        '[Gitalk] 未配置 GITALK_CLIENT_ID / GITALK_CLIENT_SECRET 环境变量，评论已隐藏',
      );
      return;
    }

    const init = () => {
      renderedRef.current = true;
      import('@site/src/vendor/gitalk/gitalk.min.js').then(({default: Gitalk}) => {
        new Gitalk({
          clientID: gitalk.clientID,
          clientSecret: gitalk.clientSecret,
          repo: gitalk.repo,
          owner: gitalk.owner,
          admin: gitalk.admin,
          id: location.pathname, // Ensure uniqueness and length less than 50
          distractionFreeMode: false,
          language: 'zh-CN',
          proxy: GITHUB_PROXY, // 自建 OAuth 反代，替代慢速公共代理
        }).render(containerRef.current!);
      });
    };

    // 滚动到评论区附近才加载 gitalk，避免拖慢首屏
    if ('IntersectionObserver' in window) {
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
  }, [gitalk]);

  return (
    <div className="blog-comment">
      <div ref={containerRef} />
    </div>
  );
}
