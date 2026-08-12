import {type Variants, motion} from 'framer-motion';
import {useEffect, useRef, useState} from 'react';

import HeroSvg from './img/hero.svg';

import {Icon} from '@iconify/react';
import SocialLinks from '@site/src/components/SocialLinks';
import styles from './styles.module.css';

const FALLBACK = '我们都有光明的未来';
const TWIKOO_ENV = 'https://co.oopss.top';

const variants: Variants = {
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 100,
      duration: 0.3,
      delay: i * 0.3,
    },
  }),
  hidden: {opacity: 0, y: 30},
};

function Circle() {
  return <div className={styles.circle} />;
}

function Name() {
  return (
    <motion.div
      className={styles.hero_text}
      custom={1}
      initial="hidden"
      animate="visible"
      variants={variants}
      onMouseMove={(e) => {
        e.currentTarget.style.setProperty('--x', `${e.clientX}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY}px`);
      }}>
      你好! 我是
      <span className={styles.name}>Brandon</span>
      <span className="ml-1">👋</span>
    </motion.div>
  );
}

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const switching = useRef(false);

  // 延迟请求最近评论（通过后端 API，不加载完整 Twikoo JS）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(fetchComments, 3000);
    return () => clearTimeout(timer);
  }, []);

  async function fetchComments() {
    try {
      const res = await fetch('https://apis.oopss.top/api/recent-comments', {
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
          includeReply: false,
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

  // 检查是否需要滚动
  useEffect(() => {
    if (!textRef.current || !innerRef.current) return;
    const outer = textRef.current;
    const inner = innerRef.current;
    const over = inner.scrollWidth > outer.clientWidth;
    if (over && inner.scrollWidth > 0) {
      const dist = outer.clientWidth - inner.scrollWidth - 20;
      const speed = 50;
      const duration = Math.abs(dist) / speed;
      setScrollDist(dist + 'px');
      setScrollDur(duration + 's');
      setScrolling(true);
    } else {
      setScrolling(false);
    }
  }, [current, comments]);

  // 切换逻辑
  useEffect(() => {
    if (!loaded || comments.length < 2) return;
    timerRef.current = setInterval(() => {
      if (scrolling) {
        const dur = parseFloat(scrollDur);
        if (dur > 5) {
          // 等滚动完再切换（滚动时间 + 0.5s 缓冲）
          setTimeout(() => {
            setCurrent((prev) => (prev + 1) % comments.length);
          }, dur * 1000 + 500);
          return;
        }
      }
      setCurrent((prev) => (prev + 1) % comments.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loaded, comments.length, scrolling, scrollDur]);

  const shuffle = async () => {
    // 重新拉取最近评论，避免长期不更新
    await fetchComments();
    setLoaded(true);
  };

  const display = comments[current] || null;
  const text = display ? `「${display.commentText}」—— ${display.nick}` : FALLBACK;

  return (
    <motion.div
      custom={2.5}
      initial="hidden"
      animate="visible"
      variants={variants}
      className={styles.yiyan}>
      <Icon icon="ri:double-quotes-l" width="18" height="18" />
      {display ? (
        <a
          href={display.url}
          target="_blank"
          rel="noreferrer"
          className={styles.yiyanText + ' ' + (scrolling ? styles.scrolling : '')}
          style={scrolling ? {animationDuration: scrollDur, '--scroll-distance': scrollDist} as any : {}}
          ref={textRef}>
          <span className={styles.yiyanTextInner} ref={innerRef}>{text}</span>
        </a>
      ) : (
        <span className={styles.yiyanText} ref={textRef}>
          <span className={styles.yiyanTextInner} ref={innerRef}>{text}</span>
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
    </motion.div>
  );
}

export default function Hero() {
  return (
    <motion.div className={styles.hero}>
      <div className={styles.intro}>
        <Name />
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="max-lg:px-4">
          我是来自中国·宜昌的高中生，热爱前端与计算机科学，在持续学习 AI 与工程化相关内容。
          这里记录我的学习笔记、项目实践与生活分享。
        </motion.p>
        <Yiyan />
        <motion.div custom={3} initial="hidden" animate="visible" variants={variants}>
          <SocialLinks />
        </motion.div>
      </div>
      <motion.div className={styles.background}>
        <HeroSvg />
        <Circle />
      </motion.div>
    </motion.div>
  );
}
