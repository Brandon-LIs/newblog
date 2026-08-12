import Layout from '@theme/Layout';
import {useEffect, useState} from 'react';

const GET_URL = 'https://apis.oopss.top/api/friend-apply/get';
const APPROVE_URL = 'https://apis.oopss.top/api/friend-apply/approve';
const REJECT_URL = 'https://apis.oopss.top/api/friend-apply/reject';

type App = {
  id?: string;
  name?: string;
  website?: string;
  friendLink?: string;
  rss?: string;
  email?: string;
  description?: string;
  avatar?: string;
  linkOk?: boolean;
  avatarOk?: boolean;
  rssOk?: boolean;
  status?: string;
};

export default function Review(): JSX.Element {
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [processing, setProcessing] = useState(false);

  const getParam = (key: string) =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(key) || '' : '';

  const id = getParam('id');

  useEffect(() => {
    if (!id) { setLoading(false); setError('缺少申请 ID'); return; }
    (async () => {
      try {
        const res = await fetch(`${GET_URL}?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.ok && data.app) setApp(data.app);
        else setError(data.error || '未找到该申请');
      } catch { setError('加载失败'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const act = async (url: string) => {
    setProcessing(true);
    try {
      const res = await fetch(url, {method: 'GET'});
      const text = await res.text();
      setDone(text);
    } catch { setDone('操作失败'); }
    finally { setProcessing(false); }
  };

  return (
    <Layout title="友链申请审核" description="审核友链申请">
      <main className="my-6">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">友链申请审核</h1>
            <p className="text-sm text-[var(--ifm-secondary-text-color)] mt-2">友链自助申请系统</p>
          </div>

          {loading && <div className="text-center text-sm text-[var(--ifm-secondary-text-color)]">加载中…</div>}
          {error && <div className="rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
          {done && <div className="mb-4 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{done}</div>}

          {app && (
            <div className="rounded-card border border-[var(--ifm-color-emphasis-200)] bg-card p-6 shadow-[var(--blog-item-shadow)]">
              <div className="flex items-center gap-3 mb-5">
                {app.avatar && <img src={app.avatar} className="size-14 rounded-full object-cover" alt="头像" width={56} height={56} />}
                <div>
                  <div className="text-lg font-bold">{app.name}</div>
                  <div className="text-sm text-[var(--ifm-secondary-text-color)]">{app.website}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm leading-6">
                <div><span className="text-[var(--ifm-secondary-text-color)]">简介：</span>{app.description || '—'}</div>
                <div><span className="text-[var(--ifm-secondary-text-color)]">友链页：</span><a href={app.friendLink} target="_blank" rel="noreferrer">{app.friendLink}</a></div>
                <div><span className="text-[var(--ifm-secondary-text-color)]">RSS：</span>{app.rss || '—'}</div>
                <div><span className="text-[var(--ifm-secondary-text-color)]">申请人邮箱：</span>{app.email}</div>
              </div>

              <div className="mt-4 rounded-lg bg-[var(--ifm-color-emphasis-100)] p-3 text-sm leading-6">
                <strong>初审结果：</strong><br />
                友链页检查：{app.linkOk ? '✅ 已找到我的友链' : '❌ 未找到'} · 
                头像：{app.avatarOk ? '✅ 可访问' : '❌ 不可用'} · 
                RSS：{app.rssOk ? '✅ 可访问' : '❌ 不可用或未提供'}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => act(`${APPROVE_URL}?token=${app.id}`)}
                  disabled={processing || app.status === 'approved'}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  ✅ 同意申请
                </button>
                <button
                  onClick={() => act(`${REJECT_URL}?token=${app.id}`)}
                  disabled={processing || app.status === 'rejected'}
                  className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  ❌ 拒绝申请
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}