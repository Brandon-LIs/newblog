import React, {useEffect, useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import 'gitalk/dist/gitalk.css';

export default function Comment(): JSX.Element | null {
  const {siteConfig} = useDocusaurusContext();
  const gitalk = (siteConfig.customFields as {gitalk?: {
    clientID: string;
    clientSecret: string;
    repo: string;
    owner: string;
    admin: string[];
  }}).gitalk ?? {clientID: '', clientSecret: '', repo: '', owner: '', admin: []};
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
    renderedRef.current = true;
    import('gitalk').then(({default: Gitalk}) => {
      new Gitalk({
        clientID: gitalk.clientID,
        clientSecret: gitalk.clientSecret,
        repo: gitalk.repo,
        owner: gitalk.owner,
        admin: gitalk.admin,
        id: location.pathname, // Ensure uniqueness and length less than 50
        distractionFreeMode: false,
        language: 'zh-CN',
      }).render(containerRef.current!);
    });
  }, [gitalk]);

  return (
    <div className="blog-comment">
      <div ref={containerRef} />
    </div>
  );
}
