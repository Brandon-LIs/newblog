import Layout from '@theme/Layout';
import React, {useState, useEffect} from 'react';

import {Friends} from '@site/data/friends';

import styles from './teleport.module.css';

const TITLE = '随机穿梭';
const DESCRIPTION = '随机穿梭到我的一个友链站点';
const friends = Friends;

function randomFriend() {
  if (friends.length === 0) return null;
  return friends[Math.floor(Math.random() * friends.length)];
}

function Stars() {
  const count = 80;
  const stars = Array.from({length: count}, (_, i) => {
    const left = (i * 37.7) % 100;
    const top = (i * 61.3) % 100;
    const size = (i % 3) + 1;
    const dur = 1.5 + (i % 8) * 0.4;
    const delay = (i % 10) * 0.3;
    return (
      <span
        key={i}
        className="twinkle"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });
  return <div className={styles.stars}>{stars}</div>;
}

export default function Teleport(): JSX.Element {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'jump' | 'leaving'>('idle');
  const [target, setTarget] = useState<{title: string; description?: string; website?: string; avatar?: string} | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (msg: string, delay = 500) => {
    setTimeout(() => setLog((l) => [...l, msg]), delay);
  };

  const start = () => {
    const f = randomFriend();
    if (!f) return;
    setTarget(f);
    setLog([]);
    setPhase('scanning');
    pushLog('$ sudo 随机穿梭 --target=友链', 350);
    pushLog('[init] 正在连接星际友链网络…', 1100);
    pushLog(`[scan] 已扫描 ${friends.length} 个节点`, 1700);
    pushLog(`[lock] 锁定目标 → ${f.title}`, 2350);
    setTimeout(() => setPhase('jump'), 3150);
  };

  useEffect(() => {
    if (phase === 'jump' && target) {
      const t = setTimeout(() => setPhase('leaving'), 2800);
      return () => clearTimeout(t);
    }
  }, [phase, target]);

  useEffect(() => {
    if (phase === 'leaving' && target?.website) {
      const t = setTimeout(() => {
        window.location.href = target.website as string;
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, target]);

  const lineClass = (line: string) =>
    line.startsWith('$') ? 'prompt' : line.startsWith('[ok]') ? 'ok' : line.startsWith('[lock]') ? 'hi' : 'dim';

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="teleport-page">
      <main className={styles.root}>
        <div className={styles.glow} />
        <Stars />

        <div className={styles.content}>
          {phase === 'idle' && (
            <>
              <h1 className={styles.title}>随机穿梭</h1>
              <p className={styles.sub}>点击按钮，向深空发射一次友链漫游</p>
              <button className={styles.btn} onClick={start}>
                <span className={styles.btnIcon}>🚀</span>
                开始穿梭
              </button>
              <div className={styles.hint}>将随机抵达 {friends.length} 个友链站点之一</div>
            </>
          )}

          {phase === 'scanning' && (
            <div className={styles.term}>
              <div className={styles.termBar}>
                <span className={`${styles.dot} ${styles.red}`} />
                <span className={`${styles.dot} ${styles.yellow}`} />
                <span className={`${styles.dot} ${styles.green}`} />
                <span className={styles.termTitle}>space-jump --target=&lt;friend&gt;</span>
              </div>
              <div className={styles.termBody}>
                {log.map((line, i) => (
                  <p key={i} className={`${styles.line} ${styles[lineClass(line)] || styles.dim}`}>
                    {line}
                  </p>
                ))}
                <span className={styles.line} style={{opacity: 0.4}}>▍</span>
              </div>
            </div>
          )}

          {phase === 'jump' && target && (
            <>
              <div className={styles.wormhole}>
                <div className={`${styles.ring} ${styles.r1}`} />
                <div className={`${styles.ring} ${styles.r2}`} />
                <div className={`${styles.ring} ${styles.r3}`} />
                <div className={styles.core}>
                  {target.avatar ? (
                    <img src={target.avatar} alt={target.title} />
                  ) : (
                    <span>✦</span>
                  )}
                </div>
              </div>
              <h2 className={styles.arrive}>即将来到</h2>
              <h1 className={styles.site}>{target.title}</h1>
              {target.description && <p className={styles.desc}>{target.description}</p>}
              <div className={styles.countline}>穿过虫洞…</div>
            </>
          )}

          {phase === 'leaving' && target && (
            <>
              <div className={`${styles.wormhole} ${styles.leaving}`}>
                <div className={`${styles.ring} ${styles.r1}`} />
                <div className={`${styles.ring} ${styles.r2}`} />
                <div className={`${styles.ring} ${styles.r3}`} />
                <div className={styles.core}>🚀</div>
              </div>
              <div className={styles.countline}>已抵达，正在着陆…</div>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}