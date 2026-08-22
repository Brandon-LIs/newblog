// AI 搜索初始化：Cloudflare AI Search
// 桌面端：navbar 右侧圆角搜索框
// 移动端：navbar 搜索图标 → 点击弹出虚化背景浮层

export default (function () {
  if (typeof window === 'undefined') return;

  const SCRIPT_SRC = '/vendor/cf-search/search-snippet.es.js';
  const API_URL = 'https://search.oopss.top';

  // 主题协调的 CSS 变量（紫罗兰 + 暖灰系）
  const CSS_VARS: Record<string, string> = {
    '--search-snippet-width': '100%',
    '--search-snippet-min-width': '320px',
    '--search-snippet-max-width': '340px',
    '--search-snippet-input-height': '34px',
    '--search-snippet-border-radius': '17px',
    '--search-snippet-border-radius-sm': '10px',
    '--search-snippet-border-color': 'transparent',
    '--search-snippet-border-width': '0',
    '--search-snippet-background':
      'var(--blog-item-shade, #f4f4f5)',
    '--search-snippet-surface':
      'var(--blog-item-background-color, #fff)',
    '--search-snippet-text-color': 'var(--ifm-text-color, #18181b)',
    '--search-snippet-text-secondary':
      'var(--ifm-secondary-text-color, #52525b)',
    '--search-snippet-text-description':
      'var(--ifm-secondary-text-color, #71717a)',
    '--search-snippet-primary-color': 'var(--ifm-color-primary, #7c3aed)',
    '--search-snippet-hover':
      'var(--ifm-color-emphasis-300, #d4d4d8)',
    '--search-snippet-hover-background':
      'var(--blog-item-shade, #f4f4f5)',
    '--search-snippet-font-family': 'var(--ifm-font-family-base)',
    '--search-snippet-font-size-sm': '14px',
    '--search-snippet-font-size-base': '14px',
    '--search-snippet-font-weight-medium': '500',
    '--search-snippet-shadow': 'none',
    '--search-snippet-focus-ring':
      '0 0 0 3px color-mix(in srgb, var(--ifm-color-primary, #7c3aed) 18%, transparent)',
    '--search-snippet-button-height': '28px',
    '--search-snippet-button-min-border-radius': '14px',
    '--search-snippet-icon-size': '16px',
    '--search-snippet-icon-margin-left': '10px',
    '--search-snippet-spacing-sm': '6px',
    '--search-snippet-max-height': '500px',
    '--search-snippet-z-dropdown': '1001',
    '--search-snippet-user-message-bg':
      'color-mix(in srgb, var(--ifm-color-primary, #7c3aed) 8%, transparent)',
    '--search-snippet-user-message-text': 'var(--ifm-text-color, #18181b)',
    '--search-snippet-assistant-message-bg': 'var(--blog-item-shade, #f4f4f5)',
    '--search-snippet-assistant-message-text': 'var(--ifm-text-color, #18181b)',
    '--search-snippet-system-message-bg': 'var(--blog-item-shade, #f4f4f5)',
    '--search-snippet-system-message-text':
      'var(--ifm-secondary-text-color, #52525b)',
  };

  function applyVars(el: HTMLElement, extra?: Record<string, string>) {
    const all = {...CSS_VARS, ...extra};
    for (const [k, v] of Object.entries(all)) {
      el.style.setProperty(k, v);
    }
  }

  function createBar(extra?: Record<string, string>) {
    const bar = document.createElement('search-bar-snippet');
    bar.setAttribute('api-url', API_URL);
    bar.setAttribute('placeholder', '搜索…');
    bar.setAttribute('hide-branding', 'true');
    bar.setAttribute('theme', 'auto');
    applyVars(bar, extra);
    return bar;
  }

  // 移动端浮层
  let overlay: HTMLDivElement | null = null;

  function openMobileSearch() {
    if (overlay) {
      overlay.style.display = 'flex';
      return;
    }
    overlay = document.createElement('div');
    overlay.className = 'ai-search-overlay';
    overlay.innerHTML = `
      <div class="ai-search-modal">
        <div class="ai-search-modal-header">
          <div class="ai-search-modal-bar"></div>
          <button class="ai-search-close" type="button" aria-label="关闭搜索">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const barHost = overlay.querySelector('.ai-search-modal-bar')!;
    const bar = createBar({
      '--search-snippet-min-width': '0',
      '--search-snippet-max-width': '100%',
      '--search-snippet-input-height': '42px',
      '--search-snippet-border-radius': '21px',
      '--search-snippet-max-height': '60vh',
    });
    barHost.appendChild(bar);

    const close = overlay.querySelector('.ai-search-close')!;
    close.addEventListener('click', closeMobileSearch);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMobileSearch();
    });
    // ESC 关闭
    overlay.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') closeMobileSearch();
    });
  }

  function closeMobileSearch() {
    if (overlay) overlay.style.display = 'none';
  }

  // 搜索图标（移动端 navbar）
  function createMobileIcon() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-search-icon';
    btn.setAttribute('aria-label', '搜索');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
    btn.addEventListener('click', openMobileSearch);
    return btn;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = SCRIPT_SRC;
  script.onload = () => {
    const observer = new MutationObserver(() => {
      const rightItems = document.querySelector('.navbar__items--right');
      if (!rightItems) return;

      // 桌面端搜索框（CSS 在移动端隐藏）
      if (!rightItems.querySelector('.ai-search-desktop')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-search-desktop';
        const bar = createBar();
        wrapper.appendChild(bar);
        const toggle = rightItems.querySelector(
          '.toggle_vylO, [class*="toggle"]:last-child, .navbar__toggle',
        );
        if (toggle && toggle.classList.contains('navbar__toggle') === false) {
          rightItems.insertBefore(wrapper, toggle);
        } else {
          rightItems.appendChild(wrapper);
        }
      }

      // 移动端搜索图标（CSS 在桌面端隐藏）
      if (!rightItems.querySelector('.ai-search-icon')) {
        const icon = createMobileIcon();
        const toggle = rightItems.querySelector(
          '.toggle_vylO, [class*="toggle"]:last-child',
        );
        if (toggle) rightItems.insertBefore(icon, toggle);
        else rightItems.appendChild(icon);
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
  };
  document.head.appendChild(script);
})();
