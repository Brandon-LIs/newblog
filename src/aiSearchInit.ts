// AI 搜索初始化：替换 navbar 本地搜索为 Cloudflare AI Search

export default (function () {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://jsd.oopss.top/vendor/cf-search/search-snippet.es.js';
  script.onload = () => {
    const observer = new MutationObserver(() => {
      const existingSearch = document.querySelector('.navbar__search');
      if (!existingSearch) return;
      const searchContainer = existingSearch.parentElement;
      if (!searchContainer || searchContainer.querySelector('search-bar-snippet')) return;

      searchContainer.style.cssText = 'display:flex;align-items:center;width:260px;height:34px';
      (existingSearch as HTMLElement).style.display = 'none';

        const bar = document.createElement('search-bar-snippet');
        bar.setAttribute('api-url', 'https://search.oopss.top');
        bar.setAttribute('placeholder', '搜索…');
        bar.setAttribute('hide-branding', 'true');
        bar.setAttribute('theme', 'auto');
        bar.style.setProperty('--search-snippet-min-width', '240px');
        bar.style.setProperty('--search-snippet-max-width', '260px');
        bar.style.setProperty('--search-snippet-input-height', '32px');
        bar.style.setProperty('--search-snippet-border-radius', '18px');
        bar.style.setProperty('--search-snippet-background', 'var(--ifm-navbar-search-input-background-color, #f5f5f5)');
        bar.style.setProperty('--search-snippet-text-color', 'var(--ifm-color-emphasis-700)');
        bar.style.setProperty('--search-snippet-text-secondary', 'var(--ifm-color-emphasis-500)');
        bar.style.setProperty('--search-snippet-primary-color', 'var(--ifm-color-primary)');
        bar.style.setProperty('--search-snippet-border-color', 'transparent');
        bar.style.setProperty('--search-snippet-font-family', 'var(--ifm-font-family-base)');
        bar.style.setProperty('--search-snippet-font-size-sm', '14px');
        bar.style.setProperty('--search-snippet-shadow', 'none');
        bar.style.setProperty('--search-snippet-max-height', '480px');

        searchContainer.appendChild(bar);
        observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  document.head.appendChild(script);
})();