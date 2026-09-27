// Pagefind 本地搜索初始化
// 资源来自构建产物 /pagefind/（build 时由 pagefind CLI 生成），无需外部 CDN
// 仅注入一个自建触发器按钮（CSS 控制桌面/移动端形态），点击通过 JS 打开 pagefind-modal

export default (function () {
  if (typeof window === 'undefined') return;

  // 索引走版本化目录（/pagefind/<buildId>/）。站点前方 CDN 对 /pagefind/*
  // 使用超长缓存，曾导致浏览器拿到旧的、甚至缺 .pf_meta / index 分片的索引，
  // 表现为搜索弹窗能开但永久无结果（WASM Error: No pointer）。
  // 版本化路径让 URL 随构建变化，CDN 无陈旧缓存可命中，必然回源取到完整索引。
  function resolveBase(): string {
    const meta = document.querySelector('meta[name="pf-base"]');
    const base = meta && meta.getAttribute('content');
    if (base && /^\/pagefind\/[A-Za-z0-9._-]+\/$/.test(base)) {
      return base;
    }
    return '/pagefind/';
  }

  const BASE = resolveBase();
  const UI_JS = `${BASE}pagefind-component-ui.js`;
  const UI_CSS = `${BASE}pagefind-component-ui.css`;

  function loadAssets() {
    if (!document.querySelector(`link[href="${UI_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = UI_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${UI_JS}"]`)) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = UI_JS;
      s.onerror = () => console.warn('[Pagefind] UI 加载失败（未构建索引？）');
      document.head.appendChild(s);
    }
  }

  function openModal() {
    // <pagefind-modal> 是 Pagefind 注册的自定义元素，TS 不知道它有 open()
    const modal = document.querySelector('pagefind-modal') as
      | (Element & {open?: () => void})
      | null;
    if (modal && typeof modal.open === 'function') {
      modal.open();
    }
  }

  const DESKTOP_STYLE =
    'display:inline-flex;align-items:center;justify-content:center;gap:7px;' +
    'height:34px;padding:0 12px;margin:0 4px 0 0;border:1px solid #e4e4e7;' +
    'border-radius:17px;background:#f4f4f5;color:#52525b;font-size:13px;' +
    'cursor:pointer;flex-shrink:0;transition:background .18s,border-color .18s,color .18s;';
  const MOBILE_STYLE =
    'display:inline-flex;align-items:center;justify-content:center;gap:7px;' +
    'width:34px;height:34px;padding:0;margin:0 4px 0 0;border:1px solid #e4e4e7;' +
    'border-radius:10px;background:#f4f4f5;color:#52525b;font-size:13px;' +
    'cursor:pointer;flex-shrink:0;transition:background .18s,border-color .18s,color .18s;';

  function makeTrigger() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pf-trigger';
    btn.setAttribute('aria-label', '搜索');
    const icon =
      '<svg class="pf-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    const label = document.createElement('span');
    label.className = 'pf-trigger-label';
    label.textContent = '搜索';
    const kbd = document.createElement('kbd');
    kbd.className = 'pf-trigger-kbd';
    kbd.textContent = '⌘K';
    btn.appendChild(iconValue(icon));
    btn.appendChild(label);
    btn.appendChild(kbd);

    const applyResponsive = () => {
      const mobile = window.matchMedia('(max-width: 996px)').matches;
      btn.style.cssText = mobile ? MOBILE_STYLE : DESKTOP_STYLE;
      label.style.display = mobile ? 'none' : '';
      kbd.style.display = mobile ? 'none' : '';
    };
    applyResponsive();
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
    // 简单监听 resize（防抖）
    let t = 0;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = window.setTimeout(applyResponsive, 100);
    });
    return btn;
  }

  // 把不含受控标签的图标字符串转成节点（忽略 class 控制）
  function iconValue(html: string): HTMLElement {
    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    return wrap.firstElementChild as HTMLElement;
  }

  function insertTrigger(rightItems: Element) {
    const toggle = rightItems.querySelector(
      '.toggle_vylO, [class*="toggle"]:last-child',
    );
    const btn = makeTrigger();
    if (toggle) rightItems.insertBefore(btn, toggle);
    else rightItems.appendChild(btn);
  }

  function init() {
    if (!document.querySelector('pagefind-modal')) {
      const m = document.createElement('pagefind-modal');
      m.setAttribute('reset-on-close', '');
      // bundle-path 让 Pagefind 从版本化目录加载索引与运行时
      m.setAttribute('bundle-path', BASE);
      document.body.appendChild(m);
    }

    // 导航栏由 React 渲染，水合(hydration)阶段会协调并清掉命令式插入的节点。
    // 因此插入后需在有界时间窗内持续复查，直到水合结束。
    // 这里用低频定时复查，而非监听 document.body + subtree 的 MutationObserver：
    // 后者会在全站每次 DOM 变动时触发，开销大且无必要。
    const ensureTrigger = (): boolean => {
      const rightItems = document.querySelector('.navbar__items--right');
      if (!rightItems) { return false; }
      if (!rightItems.querySelector('.pf-trigger')) {
        insertTrigger(rightItems);
      }
      return true;
    };

    const GUARD_MS = 10000;
    const GUARD_INTERVAL = 300;
    const deadline = Date.now() + GUARD_MS;
    let lastSeen = 0;
    let timer = 0;

    const ensure = () => {
      if (ensureTrigger()) {
        lastSeen = Date.now();
      }
    };

    ensure();
    timer = window.setInterval(() => {
      ensure();
      // 连续 2s 都在则视为水合完成，提前停止
      if (Date.now() - lastSeen > 2000 || Date.now() > deadline) {
        window.clearInterval(timer);
        timer = 0;
      }
    }, GUARD_INTERVAL);

    loadAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();