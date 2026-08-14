// 离线图标注册：将站点使用的全部 Iconify 图标打包进产物，
// 避免运行时逐个请求海外 api.iconify.design（中国大陆访问更快、更稳、离线可用）。
// 在 docusaurus.config.ts 的 clientModules 中加载。
import {addCollection} from '@iconify/react';

// --- Remix Icon ---
import riArrowRightLine from '@iconify-icons/ri/arrow-right-line';
import riArrowRightSLine from '@iconify-icons/ri/arrow-right-s-line';
import riBilibiliLine from '@iconify-icons/ri/bilibili-line';
import riCalendarLine from '@iconify-icons/ri/calendar-line';
import riCheckLine from '@iconify-icons/ri/check-line';
import riDoubleQuotesL from '@iconify-icons/ri/double-quotes-l';
import riEye2Line from '@iconify-icons/ri/eye-2-line';
import riEyeLine from '@iconify-icons/ri/eye-line';
import riFileCopyLine from '@iconify-icons/ri/file-copy-line';
import riGithubLine from '@iconify-icons/ri/github-line';
import riLink from '@iconify-icons/ri/link';
import riLoader4Line from '@iconify-icons/ri/loader-4-line';
import riMailLine from '@iconify-icons/ri/mail-line';
import riMapPinUserLine from '@iconify-icons/ri/map-pin-user-line';
import riPriceTag3Line from '@iconify-icons/ri/price-tag-3-line';
import riQqLine from '@iconify-icons/ri/qq-line';
import riQuillPenLine from '@iconify-icons/ri/quill-pen-line';
import riRefreshLine from '@iconify-icons/ri/refresh-line';
import riRssLine from '@iconify-icons/ri/rss-line';
import riTimeLine from '@iconify-icons/ri/time-line';
import riTwitterXLine from '@iconify-icons/ri/twitter-x-line';
import riUserAddLine from '@iconify-icons/ri/user-add-line';
import riUserLine from '@iconify-icons/ri/user-line';
import riUserSmileLine from '@iconify-icons/ri/user-smile-line';
import riZhihuLine from '@iconify-icons/ri/zhihu-line';

addCollection({
  prefix: 'ri',
  icons: {
    'arrow-right-line': riArrowRightLine,
    'arrow-right-s-line': riArrowRightSLine,
    'bilibili-line': riBilibiliLine,
    'calendar-line': riCalendarLine,
    'check-line': riCheckLine,
    'double-quotes-l': riDoubleQuotesL,
    'eye-2-line': riEye2Line,
    'eye-line': riEyeLine,
    'file-copy-line': riFileCopyLine,
    'github-line': riGithubLine,
    link: riLink,
    'loader-4-line': riLoader4Line,
    'mail-line': riMailLine,
    'map-pin-user-line': riMapPinUserLine,
    'price-tag-3-line': riPriceTag3Line,
    'qq-line': riQqLine,
    'quill-pen-line': riQuillPenLine,
    'refresh-line': riRefreshLine,
    'rss-line': riRssLine,
    'time-line': riTimeLine,
    'twitter-x-line': riTwitterXLine,
    'user-add-line': riUserAddLine,
    'user-line': riUserLine,
    'user-smile-line': riUserSmileLine,
    'zhihu-line': riZhihuLine,
  },
});

// --- Phosphor ---
import phBookOpen from '@iconify-icons/ph/book-open';
import phGridFour from '@iconify-icons/ph/grid-four';
import phList from '@iconify-icons/ph/list';

addCollection({
  prefix: 'ph',
  icons: {
    'book-open': phBookOpen,
    'grid-four': phGridFour,
    list: phList,
  },
});

// --- Carbon ---
import carbonBlog from '@iconify-icons/carbon/blog';

addCollection({
  prefix: 'carbon',
  icons: {
    blog: carbonBlog,
  },
});

// --- Logos（品牌色图标）---
import logosVue from '@iconify-icons/logos/vue';

addCollection({
  prefix: 'logos',
  icons: {
    vue: logosVue,
  },
});

// --- Simple Icons ---
import simpleIconsJuejin from '@iconify-icons/simple-icons/juejin';

addCollection({
  prefix: 'simple-icons',
  icons: {
    juejin: simpleIconsJuejin,
  },
});

export {};
