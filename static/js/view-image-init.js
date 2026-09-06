// ViewImage 灯箱初始化 - 应用于所有博客与说说图片
(function () {
  function tagTwikooImages() {
    var imgs = document.querySelectorAll('.twikoo img:not([no-view])');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].setAttribute('no-view', '');
    }
  }

  function init() {
    if (typeof window.ViewImage === 'undefined') return;
    // 初始化所有 markdown 内容图片与说说图片
    try {
      window.ViewImage.init(
        '.markdown img, .theme-doc-markdown img, .theme-blog-post-markdown img, .blog-post-page img, .shuoshuo img, .post-content img, article img'
      );
      // Twikoo 评论区内图片不启用灯箱（否则点击表情会弹出灯箱）
      tagTwikooImages();
      if (window.MutationObserver) {
        new MutationObserver(tagTwikooImages).observe(document, {
          childList: true,
          subtree: true,
        });
      }
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