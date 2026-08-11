import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {BlogPostFrontMatter} from '@docusaurus/plugin-content-blog';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {usePluginData} from '@docusaurus/useGlobalData';
import {cn} from '@site/src/lib/utils';
import type {Props} from '@theme/BlogPostItem/Container';

export default function BlogPostItemContainer({
  children,
  className,
}: Props): JSX.Element {
  const {frontMatter, assets, metadata} = useBlogPost();
  const {withBaseUrl} = useBaseUrlUtils();
  const hideImage = (frontMatter as BlogPostFrontMatter & {hideImage?: boolean})
    .hideImage === true;

  // 全局数据中的封面映射：未手动指定 image 时，自动取正文第一张图
  const blogData = usePluginData('docusaurus-plugin-content-blog') as {
    covers?: Record<string, string | undefined>;
  };
  const autoCover = blogData?.covers?.[metadata.permalink];

  const image = hideImage ? undefined : assets.image ?? frontMatter.image ?? autoCover;
  return (
    <article
      className={cn('relative px-5 py-6', className)}
      itemProp="blogPost"
      itemScope
      itemType="http://schema.org/BlogPosting">
      {image && (
        <>
          <meta itemProp="image" content={withBaseUrl(image, {absolute: true})} />
          <div
            className="mb-4 h-40 w-full overflow-hidden rounded-xl"
            style={{
              backgroundImage: `url("${image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </>
      )}
      {children}
    </article>
  );
}