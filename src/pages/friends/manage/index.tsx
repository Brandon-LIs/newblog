import Layout from '@theme/Layout';
import {useState, useEffect} from 'react';
import {Icon} from '@iconify/react';

const TITLE = '友链管理';
const DESCRIPTION = '管理您的友链信息';
const API_BASE = 'https://apis.oopss.top';

export default function FriendManage(): JSX.Element {
  const getParam = (key: string) => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(key) || '';
  };
  const id = getParam('id');
  const key = getParam('key');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<{
    title: string; website: string; avatar: string; rss: string;
    description: string; email: string;
  } | null>(null);
  const [form, setForm] = useState({
    title: '', website: '', avatar: '', rss: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ok: boolean; message: string} | null>(null);
  const [showUrlConfirm, setShowUrlConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  useEffect(() => {
    if (!id || !key) {
      setError('缺少访问参数，请通过邮件中的链接访问');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/friend-manage/get?id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.info) {
          setInfo(data.info);
          setForm({
            title: data.info.title || '',
            website: data.info.website || '',
            avatar: data.info.avatar || '',
            rss: data.info.rss || '',
            description: data.info.description || '',
          });
        } else {
          setError(data.error || '获取信息失败');
        }
      })
      .catch(() => setError('网络错误，请稍后重试'))
      .finally(() => setLoading(false));
  }, [id, key]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({...f, [field]: e.target.value}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 检查 URL 是否变更
    if (form.website !== info?.website) {
      setPendingUrl(form.website);
      setShowUrlConfirm(true);
      return;
    }
    await doSave();
  };

  const doSave = async (urlChange?: string) => {
    setSaving(true);
    setResult(null);
    try {
      const body: Record<string, string> = {
        title: form.title,
        description: form.description,
        avatar: form.avatar,
        rss: form.rss,
      };
      if (urlChange) body.website = urlChange;
      const r = await fetch(`${API_BASE}/api/friend-manage/update?id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.ok) {
        if (data.urlPending) {
          setResult({ok: true, message: '其他信息已更新 ✅ URL 变更已提交审批，请等待站长处理'});
        } else {
          setResult({ok: true, message: '友链信息已更新 ✅'});
          if (info) setInfo({...info, ...body});
        }
      } else {
        setResult({ok: false, message: data.error || '保存失败'});
      }
    } catch {
      setResult({ok: false, message: '网络错误，请稍后重试'});
    } finally {
      setSaving(false);
      setShowUrlConfirm(false);
    }
  };

  const handleUrlConfirm = () => {
    doSave(pendingUrl);
  };

  if (loading) {
    return (
      <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
        <main className="my-6">
          <div className="mx-auto max-w-2xl px-4 text-center py-20">
            <Icon icon="ri:loader-4-line" className="animate-spin inline-block" width="32" height="32" />
            <p className="mt-4 text-sm text-[var(--ifm-secondary-text-color)]">验证身份中…</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
        <main className="my-6">
          <div className="mx-auto max-w-2xl px-4 text-center py-20">
            <Icon icon="ri:error-warning-line" width="48" height="48" className="text-rose-400" />
            <h2 className="mt-4 text-lg font-semibold">访问失败</h2>
            <p className="mt-2 text-sm text-[var(--ifm-secondary-text-color)]">{error}</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <main className="my-6">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">友链管理</h1>
            <p className="text-sm text-[var(--ifm-secondary-text-color)] mt-2">
              管理您在 Brandon's Blog 的友链信息
            </p>
          </div>

          {result && (
            <div className={`mb-6 rounded-card border p-4 text-sm ${
              result.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {result.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-card border border-[var(--ifm-color-emphasis-200)] bg-card p-6 shadow-[var(--blog-item-shadow)]">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">博客名称</label>
              <input value={form.title} onChange={set('title')} required placeholder="您的博客名称"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">
                网站地址
                <span className="ml-1 text-xs text-amber-500">（修改需站长审批）</span>
              </label>
              <input value={form.website} onChange={set('website')} required type="url" placeholder="https://example.com"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">RSS 订阅地址</label>
              <input value={form.rss} onChange={set('rss')} type="url" placeholder="https://example.com/feed.xml（可选）"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">头像链接</label>
              <div className="flex items-center gap-3">
                <input value={form.avatar} onChange={set('avatar')} type="url" placeholder="https://example.com/avatar.png"
                  className="flex-1 rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
                {form.avatar && (
                  <img src={form.avatar} className="size-10 rounded-full object-cover border" alt="预览" width={40} height={40}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">简介</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="一句话介绍您的博客"
                className="w-full resize-none rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-[var(--ifm-secondary-text-color)]">
                博主邮箱（不可修改）
              </label>
              <input value={info?.email || ''} disabled
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-200)] bg-[var(--ifm-color-emphasis-100)] px-3 py-2.5 text-sm text-[var(--ifm-secondary-text-color)] cursor-not-allowed" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-[var(--ifm-color-primary)] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--ifm-color-primary-dark)] hover:shadow-lg disabled:opacity-60">
              {saving ? (
                <span className="inline-flex items-center gap-2"><Icon icon="ri:loader-4-line" className="animate-spin" width="16" height="16" /> 保存中…</span>
              ) : (
                '保存修改'
              )}
            </button>
          </form>
        </div>
      </main>

      {showUrlConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowUrlConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--ifm-color-emphasis-200)] bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <Icon icon="ri:alert-line" width="20" height="20" className="text-amber-500" />
              <h3 className="m-0 text-lg font-semibold">确认修改网站地址</h3>
            </div>
            <p className="mb-3 text-sm text-[var(--ifm-secondary-text-color)]">
              修改网站地址需要站长审批，其他信息（名称、头像、简介、RSS）会直接保存。
              确定提交吗？
            </p>
            <div className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              旧地址：{info?.website}<br />
              新地址：{pendingUrl}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowUrlConfirm(false)}
                className="rounded-lg border border-[var(--ifm-color-emphasis-300)] px-4 py-2 text-sm text-[var(--ifm-secondary-text-color)] hover:bg-[var(--ifm-color-emphasis-100)]">
                取消
              </button>
              <button type="button" onClick={handleUrlConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ifm-color-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90">
                {saving ? '提交中…' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}