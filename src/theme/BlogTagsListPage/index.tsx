import Head from '@docusaurus/Head';
import Original from '@theme-original/BlogTagsListPage';
import type {Props} from '@theme/BlogTagsListPage';

/**
 * BlogTagsListPage 的原始实现不输出 meta description，搜索结果里这些页面只能显示随机片段。
 * 这里包一层补上描述，主体逻辑仍走 @theme-original。
 */
const DESCRIPTION =
  "Brandon's Blog 的全部标签：按主题浏览站内文章。";

export default function Wrapper(props: Props): JSX.Element {
  // 注意 Head 必须放在 Original 之后：Docusaurus 的 Head 会按 meta name 去重，
  // 后渲染的胜出。原始组件若自己也输出了 description（如 BlogArchivePage 会用
  // blogTitle 当描述），放在前面会被它覆盖掉。
  return (
    <>
      <Original {...props} />
      <Head>
        <meta name="description" content={DESCRIPTION} />
      </Head>
    </>
  );
}
