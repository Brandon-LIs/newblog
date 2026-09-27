// 站内搜索（Pagefind）
//
// 索引来自构建产物，并放在按构建版本号命名的目录 /pagefind/<buildId>/。
// 站点前方 CDN 对 /pagefind/* 使用超长缓存，曾持续供应 8 小时前的
// pagefind-entry.json（且该旧构建缺少 .pf_meta 与 index/*.pf_index），
// 导致 loadMeta() 拿到 404 错误页、init_pagefind 无指针，搜索永久挂起。
// 版本化路径让 URL 随构建变化，CDN 无陈旧缓存可命中，必然回源。
//
// 这里不使用官方 <pagefind-modal> 组件：它内部自建实例后不渲染结果摘要
// （卡片长期停在骨架态），而其运行时 171KB。改为直接调用 Pagefind API
// 自建轻量 UI，实测搜索 ~70ms、结果数据 ~6ms。

const BUILD_ID_FALLBACK = '/pagefind/';

function resolveBase(): string {
  const meta = document.querySelector('meta[name="pf-base"]');
  const base = meta && meta.getAttribute('content');
  if (base && /^\/pagefind\/[A-Za-z0-9._-]+\/$/.test(base)) {
    return base;
  }
  return BUILD_ID_FALLBACK;
}

type PagefindResult = {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta?: {title?: string};
  }>;
};

type PagefindApi = {
  init: (opts: {basePath: string}) => Promise<void>;
  options: (opts: Record<string, unknown>) => Promise<void>;
  search: (q: string) => Promise<{results: PagefindResult[]}>;
  destroy?: () => void;
};

export default (function () {
  if (typeof window === 'undefined') return;

  const BASE = resolveBase();
  const MAX_RESULTS = 12;
  const DEBOUNCE_MS = 180;

  let api: PagefindApi | null = null;
  let loading: Promise<void> | null = null;

  function loadApi(): Promise<void> {
    if (loading) return loading;
    loading = (async () => {
      const mod = (await import(/* webpackIgnore: true */ `${BASE}pagefind.js`)) as unknown as PagefindApi;
      await mod.init({ basePath: BASE });
      await mod.options({ excerptLength: 18 });
      api = mod;
    })();
    return loading;
  }

  // ---------- 触发按钮 ----------
  const TRIGGER_LABEL = '搜索';

  function makeTrigger(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pf-trigger';
    btn.setAttribute('aria-label', TRIGGER_LABEL);
    btn.title = '搜索 (⌘K)';

    const icon = document.createElement('span');
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/>' +
      '<path d="m20 20-3.5-3.5"/></svg>';
    const svg = icon.firstElementChild as SVGElement;
    svg.setAttribute('class', 'pf-trigger-icon');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');

    const label = document.createElement('span');
    label.className = 'pf-trigger-label';
    label.textContent = TRIGGER_LABEL;

    const kbd = document.createElement('kbd');
    kbd.className = 'pf-trigger-kbd';
    kbd.textContent = '⌘K';

    btn.appendChild(svg);
    btn.appendChild(label);
    btn.appendChild(kbd);

    const base =
      'display:inline-flex;align-items:center;justify-content:center;gap:6px;' +
      'border:1px solid #e4e4e7;background:#f4f4f5;color:#52525b;cursor:pointer;' +
      'flex-shrink:0;transition:background .18s,border-color .18s,color .18s;';
    const desktop = base + 'height:34px;padding:0 12px;margin:0 4px 0 0;border-radius:17px;font-size:13px;';
    const mobile = base + 'width:34px;height:34px;padding:0;margin:0 4px 0 0;border-radius:10px;';

    const apply = () => {
      const isMobile = window.matchMedia('(max-width: 996px)').matches;
      btn.style.cssText = isMobile ? mobile : desktop;
      label.style.display = isMobile ? 'none' : '';
      kbd.style.display = isMobile ? 'none' : '';
    };
    apply();
    let rt = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(apply, 100);
    });
    return btn;
  }

  function insertTrigger(rightItems: Element) {
    const toggle = rightItems.querySelector('.toggle_vylO, [class*="toggle"]:last-child');
    const btn = makeTrigger();
    btn.addEventListener('click', () => openModal());
    if (toggle) rightItems.insertBefore(btn, toggle);
    else rightItems.appendChild(btn);
  }

  // ---------- 搜索弹层 ----------
  let overlay: HTMLDivElement | null = null;
  let inputEl: HTMLInputElement | null = null;
  let listEl: HTMLUListElement | null = null;
  let statusEl: HTMLDivElement | null = null;
  let debounceTimer = 0;
  let seq = 0;

  function ensureOverlay(): HTMLDivElement {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'pf-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '站内搜索');
    overlay.innerHTML = [
      '<div class="pf-panel">',
      '  <div class="pf-head">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
      '    <input class="pf-input" type="search" placeholder="搜索文章标题与内容…" autocomplete="off" spellcheck="false" />',
      '    <button class="pf-close" type="button" aria-label="关闭">✕</button>',
      '  </div>',
      '  <div class="pf-status" aria-live="polite"></div>',
      '  <ul class="pf-list"></ul>',
      '  <div class="pf-foot"><span>↑↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);
    inputEl = overlay.querySelector('.pf-input');
    listEl = overlay.querySelector('.pf-list');
    statusEl = overlay.querySelector('.pf-status');

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelector('.pf-close')?.addEventListener('click', closeModal);
    inputEl?.addEventListener('input', () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(runSearch, DEBOUNCE_MS);
    });
    inputEl?.addEventListener('keydown', onInputKey);
    return overlay;
  }

  function onInputKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    const items = Array.from(listEl?.querySelectorAll<HTMLLIElement>('.pf-item') || []);
    if (!items.length) return;
    e.preventDefault();
    const cur = items.findIndex((li) => li.classList.contains('active'));
    if (e.key === 'Enter') {
      if (cur >= 0) {
        const a = items[cur].querySelector('a');
        if (a) window.location.href = a.getAttribute('href') || '#';
      }
      return;
    }
    const next = e.key === 'ArrowDown'
      ? (cur + 1) % items.length
      : (cur <= 0 ? items.length - 1 : cur - 1);
    items.forEach((li) => li.classList.remove('active'));
    items[next].classList.add('active');
    items[next].scrollIntoView({ block: 'nearest' });
  }

  function setStatus(text: string) {
    if (statusEl) statusEl.textContent = text;
  }

  async function runSearch() {
    if (!inputEl || !listEl) return;
    const q = inputEl.value.trim();
    if (!q) {
      listEl.innerHTML = '';
      setStatus('');
      return;
    }
    const mySeq = ++seq;
    setStatus('搜索中…');
    try {
      await loadApi();
      if (mySeq !== seq || !listEl) return;
      const res = api ? await api.search(q) : { results: [] };
      if (mySeq !== seq || !listEl) return;

      const items = res.results.slice(0, MAX_RESULTS);
      if (!items.length) {
        listEl.innerHTML = '';
        setStatus(`没有找到与「${q}」相关的内容`);
        return;
      }
      setStatus(`找到 ${res.results.length} 条结果`);

      const rows = await Promise.all(
        items.map(async (r) => {
          const d = await r.data();
          return { url: d.url, excerpt: d.excerpt || '', title: d.meta?.title || '' };
        }),
      );
      if (mySeq !== seq || !listEl) return;

      listEl.innerHTML = rows
        .map((r, i) => {
          const title = escapeHtml(r.title || r.url);
          // Pagefind 的 excerpt 自带 <mark> 高亮，保留其余部分转义
          const excerpt = r.excerpt
            .replace(/<(?!\/?mark>)/g, '&lt;')
            .replace(/(^|[^&])&gt;/g, '$1&gt;');
          return (
            `<li class="pf-item${i === 0 ? ' active' : ''}">` +
            `<a href="${escapeAttr(r.url)}"><span class="pf-item-title">${title}</span>` +
            `<span class="pf-item-excerpt">${excerpt}</span></a></li>`
          );
        })
        .join('');
    } catch (err) {
      console.warn('[Pagefind] 搜索失败', err);
      if (listEl) listEl.innerHTML = '';
      setStatus('搜索暂时不可用，请稍后重试');
    }
  }

  function escapeHtml(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s: string): string {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function openModal() {
    ensureOverlay();
    overlay?.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    inputEl?.focus();
    inputEl?.select();
    void loadApi();
  }

  function closeModal() {
    overlay?.classList.remove('open');
    document.documentElement.style.overflow = '';
  }

  // ---------- 全局快捷键 ----------
  function onGlobalKey(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay?.classList.contains('open')) closeModal();
      else openModal();
      return;
    }
    if (e.key === '/' && !isTypingTarget(e.target)) {
      e.preventDefault();
      openModal();
    }
  }
  function isTypingTarget(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  // ---------- 启动 ----------
  function init() {
    // 导航栏由 React 渲染，水合阶段会协调并移除命令式插入的节点，
    // 故在有界时间窗内低频复查；连续 2s 存在即视为水合完成。
    const ensureTrigger = (): boolean => {
      const right = document.querySelector('.navbar__items--right');
      if (!right) return false;
      if (!right.querySelector('.pf-trigger')) insertTrigger(right);
      return true;
    };

    const deadline = Date.now() + 10000;
    let lastSeen = 0;
    const ensure = () => {
      if (ensureTrigger()) lastSeen = Date.now();
    };
    ensure();
    const timer = window.setInterval(() => {
      ensure();
      if (Date.now() - lastSeen > 2000 || Date.now() > deadline) window.clearInterval(timer);
    }, 300);

    document.addEventListener('keydown', onGlobalKey);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
