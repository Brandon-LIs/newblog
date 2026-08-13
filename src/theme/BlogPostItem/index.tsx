import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {cn} from '@site/src/lib/utils';
import type {Props} from '@theme/BlogPostItem';
import AiSummary from '@theme/BlogPostItem/AiSummary';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemSummary from '../BlogPostItem/Summary';

// apply a bottom margin in list view
function useContainerClassName() {
  const {isBlogPostPage} = useBlogPost();
  return !isBlogPostPage ? 'group/blog rounded-xl border border-border bg-blog p-6 mb-4 shadow-blog transition-all duration-300 hover:border-[var(--ifm-color-primary-lighter)]' : '';
}

export default function BlogPostItem({
  children,
  className,
}: Props): JSX.Element {
  const containerClassName = useContainerClassName();
  return (
    <BlogPostItemContainer className={cn(containerClassName, className)}>
      <BlogPostItemHeader />
      <AiSummary />
      <BlogPostItemSummary />
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
    </BlogPostItemContainer>
  );
}
