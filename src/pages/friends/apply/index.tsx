import Layout from '@theme/Layout';
import {useState} from 'react';

import {Icon} from '@iconify/react';

const TITLE = '申请友链';
const DESCRIPTION = '填写表单，提交后自动审核并通知您结果。';
const SUBMIT_URL = 'https://apis.oopss.top/api/friend-apply';
const UPLOAD_URL = 'https://admin.oopss.top/upload';
const AI_PARSE_URL = 'https://apii.oopss.top/api/ai/parse-friends';

type FormState = {
  name: string;
  website: string;
  friendLink: string;
  rss: string;
  email: string;
  description: string;
  avatarUrl: string;
};

export default function FriendApply(): JSX.Element {
  const getParam = (key: string) => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(key) || '';
  };
  const [form, setForm] = useState<FormState>({
    name: getParam('name'),
    website: getParam('website'),
    friendLink: getParam('friendLink'),
    rss: getParam('rss'),
    email: getParam('email'),
    description: getParam('description'),
    avatarUrl: getParam('avatarUrl'),
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ok: boolean; message: string} | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({...f, [key]: e.target.value}));

  // AI 智能识别友链信息并填充表单
  const handleAiParse = async () => {
    if (!aiText.trim()) {
      setResult({ok: false, message: '请先粘贴您在其他博主页面的友链信息'});
      return;
    }
    setAiLoading(true);
    setResult(null);
    try {
      const r = await fetch(AI_PARSE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: aiText}),
      });
      const data = await r.json();
      if (r.ok && data.ok && data.list && data.list.length > 0) {
        const f = data.list[0];
        setForm((prev) => ({
          ...prev,
          name: f.title || prev.name,
          website: f.website || prev.website,
          avatarUrl: f.avatar || prev.avatarUrl,
          description: f.description || prev.description,
          rss: f.rss || prev.rss,
        }));
        setAiDialogOpen(false);
        setResult({ok: true, message: 'AI 已识别并填充信息，请核对后修改再提交'});
      } else {
        setResult({ok: false, message: data.error || 'AI 未能识别有效信息'});
      }
    } catch {
      setResult({ok: false, message: 'AI 识别失败，请稍后重试'});
    } finally {
      setAiLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('website', form.website);
      fd.append('friendLink', form.friendLink);
      fd.append('rss', form.rss);
      fd.append('email', form.email);
      fd.append('description', form.description);
      if (avatarFile) {
        fd.append('avatar', avatarFile, avatarFile.name);
      } else {
        fd.append('avatarUrl', form.avatarUrl);
      }
      const r = await fetch(SUBMIT_URL, {method: 'POST', body: fd});
      const data = await r.json();
      setResult({ok: data.ok, message: data.message || (data.error || '提交失败')});
    } catch {
      setResult({ok: false, message: '网络错误，请稍后重试'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="bg-background">
      <main className="my-6">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">申请交换友链</h1>
            <p className="text-sm text-[var(--ifm-secondary-text-color)] mt-2">
              填写下方信息，提交后系统会自动审核并通知您结果
            </p>
            <button
              type="button"
              onClick={() => setAiDialogOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <Icon icon="ri:sparkles-2-line" width="16" height="16" />
              AI 智能填表
            </button>
          </div>

          {result && (
            <div className={`mb-6 rounded-card border p-4 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {result.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-card border border-[var(--ifm-color-emphasis-200)] bg-card p-6 shadow-[var(--blog-item-shadow)]">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">博客名称 <span className="text-rose-500">*</span></label>
              <input value={form.name} onChange={set('name')} required placeholder="例如：张三的博客"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">网站地址 <span className="text-rose-500">*</span></label>
              <input value={form.website} onChange={set('website')} required type="url" placeholder="https://example.com"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">已添加我站友链的友链页地址 <span className="text-rose-500">*</span></label>
              <input value={form.friendLink} onChange={set('friendLink')} required type="url" placeholder="https://example.com/friends"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
              <p className="mt-1 text-xs text-[var(--ifm-secondary-text-color)]">请在贵站添加我的友链后再提交，便于审核</p>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">RSS 订阅地址</label>
              <input value={form.rss} onChange={set('rss')} type="url" placeholder="https://example.com/rss.xml（可选）"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">邮箱地址 <span className="text-rose-500">*</span></label>
              <input value={form.email} onChange={set('email')} required type="email" placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
              <p className="mt-1 text-xs text-[var(--ifm-secondary-text-color)]">用于接收审核结果通知</p>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">头像</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handleAvatarChange}
                  className="text-sm text-[var(--ifm-secondary-text-color)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--ifm-color-primary)] file:px-3 file:py-2 file:text-sm file:text-white" />
                {avatarPreview && <img src={avatarPreview} className="size-10 rounded-full object-cover" alt="预览" width={40} height={40} />}
              </div>
              <div className="mt-2 text-xs text-[var(--ifm-secondary-text-color)]">或填写头像链接：</div>
              <input value={form.avatarUrl} onChange={set('avatarUrl')} type="url" placeholder="https://example.com/avatar.png（二选一）"
                className="mt-1 w-full rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium">简介</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="一句话介绍你的博客"
                className="w-full resize-none rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-[var(--ifm-color-primary)] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--ifm-color-primary-dark)] hover:shadow-lg disabled:opacity-60">
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Icon icon="ri:loader-4-line" className="animate-spin" width="16" height="16" /> 提交中…</span>
              ) : (
                '提交申请'
              )}
            </button>
          </form>

          {/* AI 智能填表弹窗 */}
          {aiDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAiDialogOpen(false)}>
              <div className="w-full max-w-lg rounded-2xl border border-[var(--ifm-color-emphasis-200)] bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon icon="ri:sparkles-2-line" width="20" height="20" className="text-[#8b5cf6]" />
                  <h3 className="m-0 text-lg font-semibold">AI 智能填表</h3>
                </div>
                <p className="mb-3 text-sm text-[var(--ifm-secondary-text-color)]">
                  其他博主通常会在其友链页或关于页写明互换友链需提供的信息，将那段文字粘贴到这里，
                  AI 会自动识别并填入左侧表单，你可以在提交前修改。
                </p>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  rows={6}
                  placeholder="例如：本站友链申请信息：名称=…，网址=…，简介=…"
                  className="w-full resize-none rounded-lg border border-[var(--ifm-color-emphasis-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ifm-color-primary)]"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setAiDialogOpen(false)} className="rounded-lg border border-[var(--ifm-color-emphasis-300)] px-4 py-2 text-sm text-[var(--ifm-secondary-text-color)] hover:bg-[var(--ifm-color-emphasis-100)]">
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAiParse}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60">
                    {aiLoading ? (
                      <Icon icon="ri:loader-4-line" className="animate-spin" width="16" height="16" />
                    ) : (
                      <Icon icon="ri:scan-line" width="16" height="16" />
                    )}
                    {aiLoading ? '识别中…' : '开始识别'}
                  </button>
                </div>
              </div>
            </div>
          )}


          <div className="mt-6 rounded-card border border-[var(--ifm-color-emphasis-200)] bg-card p-4 text-sm">
            <div className="mb-2 font-medium">我的站点信息</div>
            <div className="text-[var(--ifm-secondary-text-color)] leading-6">
              名称：Brandon's Blog<br />
              地址：https://blog.oopss.top<br />
              头像：https://cdn.oopss.top/icon.jpg<br />
              简介：Brandon的个人博客
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
