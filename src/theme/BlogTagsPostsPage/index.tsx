import Head from '@docusaurus/Head';
import Original from '@theme-original/BlogTagsPostsPage';
import type {Props} from '@theme/BlogTagsPostsPage';

/**
 * BlogTagsPostsPage 的原始实现不输出 meta description，搜索结果里这些页面只能显示随机片段。
 * 这里包一层补上描述，主体逻辑仍走 @theme-original。
 */
const DESCRIPTION =
  "Brandon's Blog 的标签归档：按主题浏览全部文章，涵盖技术、生活与旅游等分类。";

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
