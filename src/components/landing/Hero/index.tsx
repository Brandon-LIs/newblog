import {type Variants, motion} from 'framer-motion';
import {useEffect, useState} from 'react';

import HeroSvg from './img/hero.svg';

import {Icon} from '@iconify/react';
import SocialLinks from '@site/src/components/SocialLinks';
import styles from './styles.module.css';

const YIYAN_API = 'https://api.yviii.com/yiyan/yi.php/?syz=js&charset=utf-8';
const FALLBACK = '我们都有光明的未来';

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

function Yiyan() {
  const [yiyan, setYiyan] = useState<string>(FALLBACK);

  const fetchYiyan = () => {
    const originalWrite = document.write.bind(document);
    document.write = (html: string) => {
      const text = html.replace(/<[^>]*>/g, '').trim();
      if (text) {
        setYiyan(text);
      }
    };
    const script = document.createElement('script');
    script.src = YIYAN_API;
    script.onload = () => {
      document.write = originalWrite;
      script.remove();
    };
    script.onerror = () => {
      document.write = originalWrite;
      script.remove();
      setYiyan(FALLBACK);
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    fetchYiyan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      custom={2.5}
      initial="hidden"
      animate="visible"
      variants={variants}
      className={styles.yiyan}>
      <Icon icon="ri:double-quotes-l" width="18" height="18" />
      <span className={styles.yiyanText}>{yiyan}</span>
      <button
        type="button"
        className={styles.yiyanRefresh}
        onClick={fetchYiyan}
        title="换一句"
        aria-label="换一句">
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
