import Head from '@docusaurus/Head';
import Original from '@theme-original/Blog/Pages/BlogAuthorsPostsPage';
import type {Props} from '@theme/Blog/Pages/BlogAuthorsPostsPage';

/**
 * BlogAuthorsPostsPage 的原始实现不输出 meta description。
 * 这里包一层补上描述，主体逻辑仍走 @theme-original。
 */
const DESCRIPTION = "Brandon's Blog 的作者文章归档：按作者浏览全部文章，涵盖前端与计算机科学笔记、AI 与工程化实践、自托管小项目与游记日常。";

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
