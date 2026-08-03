import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {cn} from '@site/src/lib/utils';
import type {Props} from '@theme/BlogPostItem/Content';
import MDXContent from '@theme/MDXContent';

export default function BlogPostItemContent({
  children,
  className,
}: Props): JSX.Element {
  const {isBlogPostPage, metadata} = useBlogPost();

  // 列表页：只显示摘要（前若干字），避免把全文展示出来
  if (!isBlogPostPage) {
    return (
      <div className={cn('px-1 pt-1', className)}>
        <p className="m-0 line-clamp-3 w-full overflow-hidden text-sm leading-[1.66] text-[var(--ifm-secondary-text-color)]">
          {metadata.description}
        </p>
      </div>
    );
  }

  return (
    <div
      // This ID is used for the feed generation to locate the main content
      id={blogPostContainerID}
      className={cn('markdown', className)}
      itemProp="articleBody"
      style={{position: 'relative'}}>
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
