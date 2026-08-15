import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {useEffect, useState} from 'react';

import styles from './styles.module.css';

const SUMMARY_URL = '/ai-summaries.json';

type SummaryMap = Record<string, string | undefined>;

function loadSummaries(): Promise<SummaryMap> {
  return fetch(SUMMARY_URL)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => (d && d.summaries ? d.summaries : {}))
    .catch(() => ({}));
}

export default function AiSummary(): JSX.Element | null {
  const {isBlogPostPage, metadata} = useBlogPost();
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!isBlogPostPage) {
      return;
    }
    let cancelled = false;
    loadSummaries().then((map) => {
      if (!cancelled) {
        setSummary(map[metadata.permalink] ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isBlogPostPage, metadata.permalink]);

  if (!isBlogPostPage || !summary) {
    return null;
  }

  return (
    <div className={styles.box} itemScope>
      <div className={styles.header}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 8V4" />
          <path d="M8 4h8" />
          <path d="M8 13l2 2 4-4" />
        </svg>
        <span className={styles.title}>AI 摘要</span>
      </div>
      <p className={styles.content}>{summary}</p>
    </div>
  );
}