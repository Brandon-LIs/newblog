// AI 搜索初始化：替换 navbar 本地搜索为 Cloudflare AI Search
// 适配桌面端（navbar 右侧）和移动端（侧边栏顶部）

export default (function () {
  if (typeof window === 'undefined') return;

  const SCRIPT_SRC = '/vendor/cf-search/search-snippet.es.js';
  const API_URL = 'https://search.oopss.top';

  const CSS_VARS: Record<string, string> = {
    '--search-snippet-min-width': '180px',
    '--search-snippet-max-width': '240px',
    '--search-snippet-input-height': '26px',
    '--search-snippet-border-radius': '20px',
    '--search-snippet-background': 'var(--ifm-navbar-search-input-background-color, #f5f5f5)',
    '--search-snippet-text-color': 'var(--ifm-color-emphasis-700)',
    '--search-snippet-text-secondary': 'var(--ifm-color-emphasis-500)',
    '--search-snippet-primary-color': 'var(--ifm-color-primary)',
    '--search-snippet-border-color': 'transparent',
    '--search-snippet-font-family': 'var(--ifm-font-family-base)',
    '--search-snippet-font-size-sm': '13px',
    '--search-snippet-shadow': 'none',
    '--search-snippet-max-height': '480px',
    '--search-snippet-icon-size': '14px',
    '--search-snippet-icon-margin-left': '8px',
    '--search-snippet-spacing-sm': '4px',
  };

  function applyVars(el: HTMLElement, extra?: Record<string, string>) {
    const all = { ...CSS_VARS, ...extra };
    for (const [k, v] of Object.entries(all)) {
      el.style.setProperty(k, v);
    }
  }

  function createBar() {
    const bar = document.createElement('search-bar-snippet');
    bar.setAttribute('api-url', API_URL);
    bar.setAttribute('placeholder', '搜索…');
    bar.setAttribute('hide-branding', 'true');
    bar.setAttribute('theme', 'auto');
    return bar;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = SCRIPT_SRC;
  script.onload = () => {
    const observer = new MutationObserver(() => {
      // 桌面端：在 navbar 右侧插入搜索框（替换原有搜索位置）
      const rightItems = document.querySelector('.navbar__items--right');
      const desktopTarget = rightItems?.querySelector('.toggle_vylO') || rightItems?.lastElementChild;
      if (rightItems && desktopTarget && !rightItems.querySelector('search-bar-snippet')) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;align-items:center;width:240px;height:30px;margin:0 4px;flex-shrink:0;position:relative;z-index:100';
        const bar = createBar();
        applyVars(bar);
        wrapper.appendChild(bar);
        rightItems.insertBefore(wrapper, desktopTarget);
      }

      // 移动端：在侧边栏品牌区下方添加搜索框
      const sidebarBrand = document.querySelector('.navbar-sidebar__brand');
      if (sidebarBrand && !sidebarBrand.parentElement?.querySelector('search-bar-snippet')) {
        const mobileBar = createBar();
        applyVars(mobileBar, {
          '--search-snippet-min-width': '100%',
          '--search-snippet-max-width': '100%',
          '--search-snippet-border-radius': '28px',
          '--search-snippet-max-height': '60vh',
        });
        mobileBar.style.cssText = 'margin:0 12px 6px;flex-shrink:0;';
        sidebarBrand.after(mobileBar);
      }

      // 两个位置都注入后断开
      if (rightItems && rightItems.querySelector('search-bar-snippet')) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  document.head.appendChild(script);
})();