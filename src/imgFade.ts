// 文章图片淡入：配合 width/height 占位，加载完成后淡入，避免生硬跳变
// 仅对带 .img-fade 的元素生效；JS 不可用时图片保持正常显示
export {};

if (typeof document !== 'undefined') {
  const init = () => {
    const imgs = document.querySelectorAll<HTMLImageElement>(
      '.markdown img[width][height]',
    );
    imgs.forEach((img) => {
      img.classList.add('img-fade');
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
        return;
      }
      const onLoad = () => {
        img.classList.add('loaded');
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      };
      const onError = () => {
        img.classList.remove('img-fade');
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      };
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
    });
  };

  if (document.readyState === 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
}
