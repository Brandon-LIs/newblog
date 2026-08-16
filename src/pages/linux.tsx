import Layout from '@theme/Layout';
import React, {useState, useEffect, useRef} from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {BlogPost} from '@docusaurus/plugin-content-blog';

import {Friends} from '@site/data/friends';

import styles from './linux.module.css';

const TITLE = 'Linux 终端';
const DESCRIPTION = '模拟 Linux 终端，键入 help 查看可用的命令';
const friends = Friends;

type Friend = {title: string; description?: string; website: string; avatar?: string; rss?: string};
type Memo = {id?: number; content?: string; createdTs?: number};
type Comment = {nick?: string; commentText?: string; url?: string};
type Article = {title?: string; link?: string; site?: string; description?: string; date?: string};

type Line = {text: string; cls?: string};

const HELP_CMDS: [string, string][] = [
  ['help', '显示帮助'],
  ['clear', '清屏'],
  ['about', '关于本站'],
  ['date', '显示当前时间'],
  ['whoami', '当前用户'],
  ['uname', '系统信息'],
  ['shuttle', '随机穿梭到友链'],
  ['shuttle <name>', '穿梭到指定友链'],
  ['friends', '列出友链列表'],
  ['posts', '列出博客文章'],
  ['open <slug>', '打开一篇博客'],
  ['feed', '列出友链最近文章'],
  ['openfeed <n>', '打开友链文章 #n'],
  ['comments', '列出最近评论'],
  ['memos', '列出最近说说'],
  ['echo <text>', '回显文本'],
  ['ls', 'List 命令'],
  ['exit', '退出终端(可试试)'],
];

const CREDITS = [
  ' _   _                _    ',
  '| | | | ___  _ __ ___| |_  ',
  '| |_| |/ _ \\| \'__/ _ \\ __|',
  '|  _  | (_) | | |  __/ |_  ',
  '|_| |_|\\___/|_|  \\___|\\__|',
];

export default function LinuxTerminal(): JSX.Element {
  const [history, setHistory] = useState<Line[]>([]);
  const [cmd, setCmd] = useState('');
  const [booted, setBooted] = useState(false);
  const [feedCache, setFeedCache] = useState<Article[] | null>(null);
  const [memoCache, setMemoCache] = useState<Memo[] | null>(null);
  const [cmtCache, setCmtCache] = useState<Comment[] | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bootQueue = useRef<string[]>([]);
  const cmdHistory = useRef<string[]>([]);
  const historyIdx = useRef(-1);

  const blogData = usePluginData('docusaurus-plugin-content-blog') as {posts: BlogPost[]} | undefined;
  const posts: BlogPost[] = blogData?.posts ?? [];

  const push = (text: string, cls?: string) =>
    setHistory((h) => [...h, {text, cls}]);

  const runLines = (lines: string[], base = 0, interval = 12) => {
    lines.forEach((l, i) =>
      setTimeout(() => push(l), base + i * interval),
    );
  };

  // 开机引导
  useEffect(() => {
    if (booted) return;
    const bootLines = [
      {text: CREDITS.join('\n'), cls: 'accent'},
      {text: '', cls: ''},
      {text: 'Brandon@Blog 终端 v2.6.1 (tty1)', cls: 'dim'},
      {text: '加载中… [OK]', cls: 'ok'},
      {text: '正在启动核心服务 [  OK  ]', cls: 'ok'},
      {text: '正在加载友链节点… [  OK  ]', cls: 'ok'},
      {text: '正在连接评论服务  [  OK  ]', cls: 'ok'},
      {text: '正在启动匿名登录   [  OK  ]', cls: 'ok'},
      {text: '', cls: ''},
      {text: '欢迎使用 Brandon 博客终端。输入 help 查看可用命令。', cls: 'dim'},
      {text: '提示：键入 shuttle 即可随机穿梭到任意友链站点。', cls: 'dim'},
    ];
    let acc = 0;
    bootLines.forEach((l) => {
      setTimeout(() => push(l.text, l.cls), acc);
      acc += 90;
    });
    setTimeout(() => setBooted(true), acc + 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, booted]);

  async function fetchFeed() {
    if (feedCache) return feedCache;
    try {
      const r = await fetch('https://friendsdata.oopss.top/friend-articles.json');
      const d = await r.json();
      const list = (d?.list || []) as Article[];
      setFeedCache(list);
      return list;
    } catch {
      return [];
    }
  }

  async function fetchMemos() {
    if (memoCache) return memoCache;
    try {
      const r = await fetch('https://api.oopss.top/api/memos?limit=8');
      const d = await r.json();
      const list = (d?.memos || []) as Memo[];
      setMemoCache(list);
      return list;
    } catch {
      return [];
    }
  }

  async function fetchComments() {
    if (cmtCache) return cmtCache;
    try {
      const r = await fetch('https://api.oopss.top/api/recent-comments');
      const list = (await r.json()) as Comment[];
      setCmtCache(list);
      return list;
    } catch {
      return [];
    }
  }

  async function handle(cmdline: string) {
    const trimmed = cmdline.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\s+/);
    const cmd0 = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    push(`brandon@blog:~$ ${trimmed}`, 'prompt');

    switch (cmd0) {
      case 'help':
      case '?': {
        push('可用命令：', 'bold');
        HELP_CMDS.forEach(([c, d]) => push(`${c.padEnd(16)}${d}`, 'info'));
        break;
      }
      case 'clear':
        setHistory([]);
        return;
      case 'about':
        runLines([
          '',
          'Brandon\'s Blog — 一个高中生的个人博客',
          '记录学习笔记、项目实践与生活分享。',
          '我们都有光明的未来 ✨',
          '',
        ]);
        break;
      case 'date':
        push(String(new Date()));
        break;
      case 'whoami':
        push('brandon (uid=1000)');
        break;
      case 'uname':
        push('BrandonOS 6.6.35-blog #1 SMP x86_64 GNU/Blog');
        break;
      case 'echo':
        push(arg || '"');
        break;
      case 'pwd':
        push('/home/brandon/blog');
        break;
      case 'ls': {
        push('blog/  friends/  memos/  comments/  about.md  README.md', 'info');
        break;
      }
      case 'friends': {
        push(`共 ${friends.length} 个友链：`, 'bold');
        friends.forEach((f) => push(`${f.title}${f.description ? '  — ' + f.description : ''}`, 't2'));
        push('');
        break;
      }
      case 'posts': {
        if (!posts.length) { push('暂无博客文章', 'err'); break; }
        push(`共 ${posts.length} 篇博客：`, 'bold');
        posts.forEach((p, i) => {
          const slug = p.metadata?.permalink || '';
          push(`${String(i + 1).padStart(2, ' ')}. ${p.metadata?.title}  (slug: ${slug})`, 't2');
        });
        push('用法：open <slug>', 'dim');
        break;
      }
      case 'open': {
        if (!arg) { push('用法：open <slug>', 'warn'); break; }
        const slug = arg.startsWith('/') ? arg : `/blog/${arg}`;
        const found = posts.find((p) =>
          p.metadata?.permalink === slug || p.metadata?.title?.toLowerCase().includes(arg.toLowerCase()));
        if (found) {
          push(`正在打开 ${found.metadata?.title} …`, 'ok');
          setTimeout(() => { window.open(found.metadata?.permalink, '_blank'); }, 600);
        } else {
          push(`未找到文章 "${arg}"`, 'err');
        }
        break;
      }
      case 'feed': {
        const list = await fetchFeed();
        if (!list.length) { push('暂无友链文章', 'err'); break; }
        push(`共 ${list.length} 篇友链文章（最近 10 篇）：`, 'bold');
        list.slice(0, 10).forEach((a, i) => {
          const t = cleanText(a.title || '');
          push(`${String(i + 1).padStart(2, ' ')}. [${a.site || '?'}] ${t}`, 't2');
        });
        push('用法：openfeed <n> 打开指定文章', 'dim');
        break;
      }
      case 'openfeed': {
        const n = parseInt(arg, 10);
        if (isNaN(n)) { push('用法：openfeed <n>', 'warn'); break; }
        const list = await fetchFeed();
        const a = list[n - 1];
        if (!a) { push(`没有第 ${n} 篇文章`, 'err'); break; }
        push(`正在跳转 → ${a.title}`, 'ok');
        setTimeout(() => { if (a.link) window.open(a.link, '_blank'); }, 600);
        break;
      }
      case 'comments': {
        const list = await fetchComments();
        if (!list.length) { push('暂无评论', 'err'); break; }
        push(`共 ${list.length} 条最近评论：`, 'bold');
        list.forEach((c, i) => {
          const t = (c.commentText || '').replace(/\s+/g, ' ').slice(0, 40);
          push(`${String(i + 1).padStart(2, ' ')}. ${c.nick || '匿名'}: ${t}`, 't2');
        });
        break;
      }
      case 'memos':
      case 'shuoshuo': {
        const list = await fetchMemos();
        if (!list.length) { push('暂无说说', 'err'); break; }
        push('最近说说：', 'bold');
        list.forEach((m, i) => {
          const t = (m.content || '').replace(/\n+/g, ' ').slice(0, 50);
          const ts = m.createdTs ? new Date(m.createdTs * 1000).toLocaleString('zh-CN', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}) : '';
          push(`${String(i + 1).padStart(2, ' ')}. ${t}  (${ts})`, 't2');
        });
        break;
      }
      case 'shuttle': {
        if (arg) {
          const f = friends.find((x) => x.title.toLowerCase().includes(arg.toLowerCase()));
          if (!f) { push(`未找到友链 "${arg}"`, 'err'); break; }
          push(`( 穿梭到 ${f.title} )`, 'ok');
          setTimeout(() => { window.location.href = f.website; }, 800);
          break;
        }
        if (!friends.length) { push('暂无友链', 'err'); break; }
        const f = friends[Math.floor(Math.random() * friends.length)];
        push(`( 正在穿梭到 ${f.title} — ${f.description || ''} )`, 'ok');
        setTimeout(() => { window.location.href = f.website; }, 900);
        break;
      }
      case 'exit':
        push('( 正在关闭终端，回到首页… )', 'warn');
        setTimeout(() => { window.location.href = '/'; }, 800);
        break;
      case 'reboot': {
        push('重启中…', 'warn');
        setTimeout(() => { window.location.reload(); }, 700);
        break;
      }
      default:
        push(`command not found: ${cmd0}`, 'err');
        push('输入 help 查看可用命令。', 'dim');
    }
  }

  function cleanText(s: string): string {
    return s.replace(/[#*`>_]/g, '').replace(/\s+/g, ' ').slice(0, 60);
  }

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="linux-page">
      <div className={styles.root}>
        <div className={styles.bar}>
          <span className={`${styles.dot} ${styles.red}`} />
          <span className={`${styles.dot} ${styles.yellow}`} />
          <span className={`${styles.dot} ${styles.green}`} />
          <span className={styles.title}>Brandon@Blog: ~/终端</span>
          <span className={styles.barRight}>tty1</span>
        </div>

        <div className={styles.screen} ref={screenRef}>
          <div className={styles.header}>
            <p className={styles.headerTitle}>Brandon@Blog ❯ Linux Terminal</p>
            <p className={styles.headerSub}>与服务器交互，键入 help 查看命令。穿梭：shuttle</p>
          </div>

          {history.map((l, i) => (
            <p key={i} className={`${styles.line} ${l.cls ? styles[l.cls as keyof typeof styles] || '' : ''}`}>
              {l.text}
            </p>
          ))}

          {booted && (
            <div className={styles.promptLine}>
              <span className={`${styles.prompt} ${styles.accent}`}>brandon@blog:~$</span>
              <input
                className={styles.input}
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = cmd;
                    setCmd('');
                    cmdHistory.current.unshift(val);
                    historyIdx.current = -1;
                    await handle(val);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const list = cmdHistory.current;
                    if (!list.length) return;
                    historyIdx.current = Math.min(historyIdx.current + 1, list.length - 1);
                    setCmd(list[historyIdx.current]);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const list = cmdHistory.current;
                    if (!list.length) return;
                    historyIdx.current = Math.max(historyIdx.current - 1, -1);
                    setCmd(historyIdx.current < 0 ? '' : list[historyIdx.current]);
                  }
                }}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                aria-label="终端命令输入"
              />
            </div>
          )}
        </div>

        <div className={styles.bottom}>
          <span>brandon@blog ~ $</span>
          <span>❯ 输入 help 查看命令 ❯ shuttle 穿梭</span>
        </div>
      </div>
    </Layout>
  );
}