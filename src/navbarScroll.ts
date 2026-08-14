// 顶栏滚动状态：顶部透明，滚动后出现背景 + 边框 + 阴影（参考 lemonadorable 风格）
export {};

if (typeof window !== 'undefined') {
  const update = () => {
    const scrolled = window.scrollY > 8;
    document.documentElement.classList.toggle('navbar-scrolled', scrolled);
  };
  update();
  window.addEventListener('scroll', update, {passive: true});
}
