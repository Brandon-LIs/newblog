import {motion, useReducedMotion} from 'framer-motion';
import {useEffect, useRef, useState} from 'react';

import {Icon} from '@iconify/react';
import SocialLinks from '@site/src/components/SocialLinks';
import styles from './styles.module.css';

const FALLBACK = '我们都有光明的未来';
const TWIKOO_ENV = 'https://co.oopss.top';

type Comment = {
  nick: string;
  commentText: string;
  url: string;
  avatar: string;
  relativeTime: string;
};

function Yiyan() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [scrollDist, setScrollDist] = useState('0px');
  const [scrollDur, setScrollDur] = useState('0s');
  const textRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  // 延迟请求最近评论（通过后端 API，不加载完整 Twikoo JS）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(fetchComments, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchComments() {
    try {
      const res = await fetch('https://api.oopss.top/api/recent-comments', {
        method: 'GET',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      applyComments(data);
    } catch {
      tryFallback();
    }
  }

  async function tryFallback() {
    try {
      const res = await fetch(`${TWIKOO_ENV}/api/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'GET_RECENT_COMMENTS',
          accessToken: '',
          pageSize: 5,
          includeReply: true,
          envId: TWIKOO_ENV,
        }),
      });
      const json = await res.json();
      applyComments(json.data);
    } catch {}
  }

  function applyComments(data: any[]) {
    if (data && data.length > 0) {
      setComments(data);
      setCurrent(Math.floor(Math.random() * data.length));
      setLoaded(true);
    }
  }

  // 检查是否需要滚动，并排定切换时机
  useEffect(() => {
    if (!loaded || comments.length === 0) return;
    const outer = textRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const over = inner.scrollWidth > outer.clientWidth + 1;
    let delay = 5000;
    if (over) {
      const dist = outer.clientWidth - inner.scrollWidth - 24;
      const duration = Math.max(Math.abs(dist) / 40, 2);
      setScrollDist(`${dist}px`);
      setScrollDur(`${duration}s`);
      setScrolling(true);
      delay = duration * 1000 + 2000;
    } else {
      setScrolling(false);
    }

    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % comments.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [loaded, comments, current]);

  const shuffle = async () => {
    await fetchComments();
    setLoaded(true);
  };

  const display = comments[current] || null;
  const text = display ? `「${display.commentText}」—— ${display.nick}` : FALLBACK;
  const innerStyle = scrolling
    ? ({'--scroll-distance': scrollDist, animationDuration: scrollDur} as any)
    : undefined;
  const innerClassName =
    styles.yiyanTextInner + (scrolling ? ' ' + styles.scrolling : '');

  return (
    <div className={styles.yiyan}>
      {display ? (
        <a
          href={display.url}
          target="_blank"
          rel="noreferrer"
          className={styles.yiyanText}
          ref={textRef}>
          <span className={innerClassName} style={innerStyle} ref={innerRef}>
            {text}
          </span>
        </a>
      ) : (
        <span className={styles.yiyanText} ref={textRef}>
          <span className={innerClassName} style={innerStyle} ref={innerRef}>
            {text}
          </span>
        </span>
      )}
      <button
        type="button"
        className={styles.yiyanRefresh}
        onClick={shuffle}
        title="换一条"
        aria-label="换一条">
        <Icon icon="ri:refresh-line" width="16" height="16" />
      </button>
    </div>
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const fade = (i: number) => ({
    initial: {opacity: 0, y: reduceMotion ? 0 : 20},
    animate: {opacity: 1, y: 0},
    transition: {duration: 0.7, ease: 'easeOut' as const, delay: reduceMotion ? 0 : i * 0.1},
  });

  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <motion.h1 {...fade(0)} className={styles.title}>
          你好，我是 Brandon。
        </motion.h1>
        <motion.p {...fade(1)} className={styles.subtitle}>
          一名热爱前端与计算机科学的高中生，在这里记录学习、项目与生活。
        </motion.p>
        <motion.div {...fade(2)}>
          <Yiyan />
        </motion.div>
        <motion.div {...fade(3)}>
          <SocialLinks />
        </motion.div>
      </div>
    </div>
  );
}
