// AI 搜索初始化：替换 navbar 本地搜索为 Cloudflare AI Search
// 适配桌面端（navbar 右侧）和移动端（侧边栏顶部）

export default (function () {
  if (typeof window === 'undefined') return;

  const SCRIPT_SRC = '/vendor/cf-search/search-snippet.es.js';
  const API_URL = 'https://search.oopss.top';

  function createSearchBar(overrides?: Record<string, string>) {
    const bar = document.createElement('search-bar-snippet');
    bar.setAttribute('api-url', API_URL);
    bar.setAttribute('placeholder', '搜索…');
    bar.setAttribute('hide-branding', 'true');
    bar.setAttribute('theme', 'auto');
    const vars = {
      '--search-snippet-min-width': '200px',
      '--search-snippet-max-width': '260px',
      '--search-snippet-input-height': '32px',
      '--search-snippet-border-radius': '18px',
      '--search-snippet-background': 'var(--ifm-navbar-search-input-background-color, #f5f5f5)',
      '--search-snippet-text-color': 'var(--ifm-color-emphasis-700)',
      '--search-snippet-text-secondary': 'var(--ifm-color-emphasis-500)',
      '--search-snippet-primary-color': 'var(--ifm-color-primary)',
      '--search-snippet-border-color': 'transparent',
      '--search-snippet-font-family': 'var(--ifm-font-family-base)',
      '--search-snippet-font-size-sm': '14px',
      '--search-snippet-shadow': 'none',
      '--search-snippet-max-height': '480px',
      ...overrides,
    };
    for (const [k, v] of Object.entries(vars)) {
      bar.style.setProperty(k, v);
    }
    return bar;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = SCRIPT_SRC;
  script.onload = () => {
    const observer = new MutationObserver(() => {
      // 桌面端：替换 navbar 右侧搜索框
      const existingSearch = document.querySelector('.navbar__search');
      if (existingSearch) {
        const searchContainer = existingSearch.parentElement;
        if (searchContainer && !searchContainer.querySelector('search-bar-snippet')) {
          (existingSearch as HTMLElement).style.display = 'none';
          searchContainer.style.cssText = 'display:flex;align-items:center;width:260px;height:34px';
          searchContainer.appendChild(createSearchBar());
        }
      }

      // 移动端：在侧边栏顶部添加搜索框
      const sidebarBrand = document.querySelector('.navbar-sidebar__brand');
      if (sidebarBrand && !sidebarBrand.querySelector('search-bar-snippet')) {
        const mobileBar = createSearchBar({
          '--search-snippet-min-width': '100%',
          '--search-snippet-max-width': '100%',
          '--search-snippet-border-radius': '28px',
          '--search-snippet-max-height': '60vh',
        });
        mobileBar.style.cssText = 'margin:0 12px 8px;flex-shrink:0;';
        sidebarBrand.after(mobileBar);
      }

      if (existingSearch && sidebarBrand) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  document.head.appendChild(script);
})();