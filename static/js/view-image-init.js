// ViewImage 灯箱初始化 - 应用于所有博客与说说图片
(function () {
  function init() {
    if (typeof window.ViewImage === 'undefined') return;
    // 初始化所有 markdown 内容图片与说说图片
    try {
      window.ViewImage.init(
        '.markdown img, .theme-doc-markdown img, .theme-blog-post-markdown img, .blog-post-page img, .shuoshuo img, .post-content img, article img'
      );
    } catch (e) {
      console.warn('ViewImage init error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();