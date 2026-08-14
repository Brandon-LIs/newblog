import Layout from '@theme/Layout';
import {memo, useMemo, useRef, useState} from 'react';

import {Friend, Friends} from '@site/data/friends';

import {Icon} from '@iconify/react';
import {motion} from 'framer-motion';

const TITLE = '友链';
const DESCRIPTION = '有很多良友，胜于有很多财富。';
const APPLY_FORM_URL = 'https://blog.oopss.top/friends/apply';
const APPLY_EMAIL = 'bcihal@qq.com';
const SITE_INFO = `title: 'Brandon's Blog'
bio: '一个高中生的个人博客'
website: 'https://blog.oopss.top'
avatar: '/img/icon.jpg'
`;
const friends = Friends;

function stableFriendOrder(friend: Friend): number {
  const text = `${friend.title}${friend.website}`;
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000000007;
  }

  return hash;
}

function SiteInfo() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE_INFO);
      setCopied(true);
    } catch {
      // 兼容旧浏览器
      const ta = document.createElement('textarea');
      ta.value = SITE_INFO;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-blog shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-secondary">本站信息</span>
        <button
          type="button"
          onClick={copy}
          title="复制本站信息"
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs text-secondary transition-colors duration-200 hover:border-[var(--ifm-color-primary)] hover:text-primary">
          <Icon icon={copied ? 'ri:check-line' : 'ri:file-copy-line'} width="14" height="14" />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="m-0 select-text overflow-x-auto p-4 text-left text-xs leading-6">
        <code>{SITE_INFO}</code>
      </pre>
    </div>
  );
}

function FriendHeader() {
  return (
    <section className="margin-top--lg margin-bottom--lg text-center">
      <h1>{TITLE}</h1>
      <p>{DESCRIPTION}</p>
      <p className="m-0 mt-2 text-sm text-secondary">
        共收录 {friends.length} 位好友
      </p>
    </section>
  );
}

function ApplyNotice() {
  return (
    <section className="mx-auto mb-10 max-w-3xl px-4">
      <div className="relative overflow-hidden rounded-card border border-solid border-[var(--ifm-color-emphasis-200)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ifm-color-primary)_9%,transparent),transparent_60%),var(--ifm-card-background-color)] p-6 text-center shadow-[var(--blog-item-shadow)]">
        <div className="mb-3 text-[var(--ifm-color-primary)]">
          <Icon icon="ri:user-add-line" width="28" height="28" />
        </div>
        <h3 className="mb-2 m-0 text-lg font-medium">申请友链</h3>
        <p className="mb-5 m-0 text-sm leading-6 text-[var(--ifm-secondary-text-color)]">
          欢迎交换友链！请点击下方按钮直接提交申请，系统会自动审核。如有问题可邮件联系。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ifm-color-primary)] px-5 py-2.5 text-sm font-medium text-white no-underline shadow-[0_4px_14px_color-mix(in_srgb,var(--ifm-color-primary)_35%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:no-underline hover:brightness-105"
            href={APPLY_FORM_URL}
            target="_blank"
            rel="noreferrer">
            <Icon icon="ri:link" width="16" height="16" />
            填写申请表单
          </a>
          <a
            className="inline-flex items-center gap-1.5 rounded-full border border-solid border-[var(--ifm-color-emphasis-300)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--ifm-color-emphasis-700)] no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary)] hover:no-underline"
            href={'mailto:' + APPLY_EMAIL}>
            <Icon icon="ri:mail-line" width="16" height="16" />
            有问题发邮件：{APPLY_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}

const FriendCard = memo(({friend}: {friend: Friend}) => (
  <li className="group relative h-full overflow-hidden rounded-2xl border border-border bg-blog p-4 shadow-blog transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ifm-color-primary-lighter)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
    <a
      href={friend.website}
      target="_blank"
      rel="noreferrer"
      className="relative z-10 flex h-full items-center gap-3.5 no-underline">
      <div className="relative h-12 w-12 min-w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--ifm-border-color)]">
        <img
          src={friend.avatar}
          alt={friend.title}
          className="size-full object-cover"
          width={48}
          height={48}
          loading="lazy"
          onError={(e) => {
            // 头像加载失败：先回退到该站自己的 /favicon.ico，仍失败则用本地占位图
            const host = friend.website.replace(/^https?:\/\//, '').split('/')[0];
            const el = e.currentTarget;
            if (!el.dataset.faviconTried) {
              el.dataset.faviconTried = '1';
              el.onerror = null;
              el.src = `https://${host}/favicon.ico`;
            } else {
              el.onerror = null;
              el.src = '/img/friends/default.svg';
            }
          }}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-y-1">
        <p className="m-0 line-clamp-1 text-sm font-semibold text-text transition-colors duration-200 group-hover:text-primary">
          {friend.title}
        </p>
        <p className="m-0 line-clamp-2 text-xs leading-5 text-secondary">
          {friend.description}
        </p>
      </div>
    </a>
  </li>
));

function FriendCards() {
  const shuffledFriends = useMemo(() => {
    return [...friends].sort((left, right) => {
      const order = stableFriendOrder(left) - stableFriendOrder(right);
      return order || left.title.localeCompare(right.title, 'en-US');
    });
  }, []);

  return (
    <section className="my-8">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <ul className="grid grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shuffledFriends.map((friend) => (
            <FriendCard key={friend.website} friend={friend} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function FriendLink(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <motion.main ref={ref} className="my-4">
        <FriendHeader />
        <ApplyNotice />
        <FriendCards />
        <motion.div
          drag
          dragConstraints={ref}
          className="sticky bottom-4 left-4 z-50 inline-flex cursor-move text-right">
          <SiteInfo />
        </motion.div>
      </motion.main>
    </Layout>
  );
}
