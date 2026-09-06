// ViewImage 灯箱初始化 - 仅应用于正文/说说内容图片
(function () {
  var UI_SEL = '.navbar img, footer img, .twikoo img';

  function tagNoView() {
    var imgs = document.querySelectorAll(UI_SEL + ':not([no-view])');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].setAttribute('no-view', '');
    }
  }

  function init() {
    if (typeof window.ViewImage === 'undefined') return;
    // 仅正文与说说内容图片启用灯箱；导航栏/页脚/Twikoo 等 UI 图片全部排除
    try {
      window.ViewImage.init(
        '.markdown img, .theme-doc-markdown img, .theme-blog-post-markdown img, .blog-post-page img, .shuoshuo img, .post-content img'
      );
      tagNoView();
      if (window.MutationObserver) {
        new MutationObserver(tagNoView).observe(document, {
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