import {motion, useReducedMotion} from 'framer-motion';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';

import {Icon} from '@iconify/react';
import SocialLinks from '@site/src/components/SocialLinks';
import styles from './styles.module.css';

const FALLBACK = '我们都有光明的未来';

type Memo = {
  id?: number;
  content?: string;
  createdTs?: number;
  creator?: {nickname?: string; username?: string; avatarUrl?: string};
  link?: string;
};

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/>\s/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

function Yiyan() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [scrollDist, setScrollDist] = useState('0px');
  const [scrollDur, setScrollDur] = useState('0s');
  const [scrollDelay, setScrollDelay] = useState('0s');
  const textRef = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(fetchMemos, 3000);
    return () => clearTimeout(timer);
  }, []);

  async function fetchMemos(randomize = true) {
    try {
      const res = await fetch('https://apii.oopss.top/api/memos?limit=3', {method: 'GET'});
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: Memo[] = (data.memos || []).filter((m: Memo) => m.content).slice(0, 3);
      if (list.length > 0) {
        setMemos(list);
        if (randomize) setCurrent(Math.floor(Math.random() * list.length));
        setLoaded(true);
        return;
      }
    } catch {}
  }

  useLayoutEffect(() => {
    if (!loaded || memos.length === 0) return;
    const outer = textRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const over = inner.scrollWidth > outer.clientWidth + 1;
    setScrolling(false);

    if (over) {
      const dist = outer.clientWidth - inner.scrollWidth - 24;
      const duration = Math.max(Math.abs(dist) / 25, 2);
      const delay = 1.2;
      setScrollDist(`${dist}px`);
      setScrollDur(`${duration}s`);
      setScrollDelay(`${delay}s`);

      const raf = requestAnimationFrame(() => {
        setScrolling(true);
      });

      const onEnd = () => {
        setScrolling(false);
        setCurrent((prev) => (prev + 1) % memos.length);
      };
      inner.addEventListener('animationend', onEnd, {once: true});
      return () => {
        cancelAnimationFrame(raf);
        inner.removeEventListener('animationend', onEnd);
      };
    } else {
      const timer = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % memos.length);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loaded, memos, current]);

  const shuffle = async () => {
    if (memos.length > 1) {
      setCurrent((prev) => (prev + 1) % memos.length);
      fetchMemos(false);
    } else {
      await fetchMemos();
      setLoaded(true);
    }
  };

  const display = memos[current] || null;
  const text = display ? `「${stripMarkdown(display.content || '')}」` : FALLBACK;
  const memoUrl = display?.link || `https://memos.oopss.top/m/${display?.id}`;
  const innerStyle = scrolling
    ? ({
        '--scroll-distance': scrollDist,
        animationDuration: scrollDur,
        animationDelay: scrollDelay,
      } as any)
    : undefined;
  const innerClassName =
    styles.yiyanTextInner + (scrolling ? ' ' + styles.scrolling : '');

  return (
    <div className={styles.yiyan}>
      {display ? (
        <a
          href={memoUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.yiyanText}
          ref={textRef}>
          <span
            key={current}
            className={innerClassName}
            style={innerStyle}
            ref={innerRef}>
            {text}
          </span>
        </a>
      ) : (
        <span className={styles.yiyanText} ref={textRef as any}>
          <span
            key={current}
            className={innerClassName}
            style={innerStyle}
            ref={innerRef}>
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

  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const fullText = '你好，\n我是 Brandon。';

  useEffect(() => {
    if (reduceMotion) {
      setTyped(fullText);
      setDone(true);
      return;
    }
    let i = 0;
    setTyped('');
    setDone(false);
    const timer = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setTimeout(() => setDone(true), 250);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <motion.h1 {...fade(0)} className={styles.title}>
          <span style={{whiteSpace: 'pre-wrap'}}>
            {typed}{!done && <span className={styles.cursor}>|</span>}
          </span>
        </motion.h1>
        <motion.p {...fade(1)} className={styles.subtitle}>
          一名普普通通的高中生，在这里记录日常与生活。
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
