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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载 Twikoo 并获取最新 5 条评论
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).twikoo) {
      fetchComments();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://s4.zstatic.net/npm/twikoo@1.7.15/dist/twikoo.min.js';
    script.onload = fetchComments;
    document.head.appendChild(script);
  }, []);

  async function fetchComments() {
    try {
      const res = await (window as any).twikoo.getRecentComments({
        envId: TWIKOO_ENV,
        pageSize: 5,
        includeReply: false,
      });
      if (res && res.length > 0) {
        setComments(res);
        setCurrent(Math.floor(Math.random() * res.length));
        setLoaded(true);
      }
    } catch {
      // fallback
    }
  }

  // 每 5 秒切换
  useEffect(() => {
    if (!loaded || comments.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % comments.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loaded, comments.length]);

  const shuffle = () => {
    if (comments.length > 0) {
      let next = Math.floor(Math.random() * comments.length);
      while (next === current && comments.length > 1) {
        next = Math.floor(Math.random() * comments.length);
      }
      setCurrent(next);
    }
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
          className={styles.yiyanText}
          style={{textDecoration: 'none', color: 'inherit'}}>
          {text}
        </a>
      ) : (
        <span className={styles.yiyanText}>{text}</span>
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
