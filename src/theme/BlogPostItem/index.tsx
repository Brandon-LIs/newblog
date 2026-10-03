import Head from '@docusaurus/Head';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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

/**
 * 文章详情页输出 BlogPosting 结构化数据。
 * 站点级 JSON-LD（Docusaurus 内置）只有 WebSite + Person，
 * 搜索结果的富媒体摘要（作者/发布时间/封面）需要 BlogPosting 才有。
 * 只在详情页输出，避免列表页重复声明同一篇文章。
 */
function BlogPostingJsonLd() {
  const {isBlogPostPage, metadata, frontMatter} = useBlogPost();
  const {siteConfig} = useDocusaurusContext();

  if (!isBlogPostPage) {
    return null;
  }

  const url = `${siteConfig.url}${metadata.permalink}`;
  // image / keywords / description 只存在于原始 frontmatter，
  // metadata 上是 Docusaurus 加工过的版本（image 已被丢弃，
  // description 在未显式配置时会退化成正文首行，例如取到小标题「序」）
  const fm = frontMatter as {
    image?: string;
    description?: string;
    keywords?: string[];
    tags?: string[];
  };
  const description = fm.description || metadata.description;
  const image = fm.image;
  const keywords = fm.keywords?.length ? fm.keywords : fm.tags;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    mainEntityOfPage: {'@type': 'WebPage', '@id': url},
    headline: metadata.title,
    description,
    image: image ? [image] : undefined,
    datePublished: metadata.date ? new Date(metadata.date).toISOString() : undefined,
    dateModified: metadata.lastUpdatedAt
      ? new Date(metadata.lastUpdatedAt).toISOString()
      : undefined,
    author: {
      '@type': 'Person',
      name: 'Brandon',
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Person',
      name: 'Brandon',
      url: siteConfig.url,
    },
    mainEntity: {'@type': 'WebPage', '@id': url},
    inLanguage: 'zh-Hans',
    keywords: keywords?.join(', '),
  };

  // 去掉 undefined 字段，避免输出空键
  const clean = Object.fromEntries(
    Object.entries(jsonLd).filter(([, v]) => v !== undefined && v !== ''),
  );

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(clean)}</script>
    </Head>
  );
}

export default function BlogPostItem({
  children,
  className,
}: Props): JSX.Element {
  const containerClassName = useContainerClassName();
  return (
    <>
      <BlogPostingJsonLd />
      <BlogPostItemContainer className={cn(containerClassName, className)}>
        <BlogPostItemHeader />
        <AiSummary />
        <BlogPostItemSummary />
        <BlogPostItemContent>{children}</BlogPostItemContent>
        <BlogPostItemFooter />
      </BlogPostItemContainer>
    </>
  );
}
