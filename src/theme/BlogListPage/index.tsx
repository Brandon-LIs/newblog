import {
  HtmlClassNameProvider,
  PageMetadata,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {cn} from '@site/src/lib/utils';
import BackToTopButton from '@theme/BackToTopButton';
import type {Props} from '@theme/BlogListPage';
import BlogListPaginator from '@theme/BlogListPaginator';
import BlogPostItems from '@theme/BlogPostItems';
import SearchMetadata from '@theme/SearchMetadata';

import Translate from '@docusaurus/Translate';
import {Icon} from '@iconify/react';
import {type ViewType, useViewType} from '@site/src/hooks/useViewType';
import BlogPostGridItems from '../BlogPostGridItems';

import MyLayout from '../MyLayout';

function BlogListPageMetadata(props: Props): JSX.Element {
  const {metadata} = props;
  const {blogDescription, blogTitle} = metadata;

  // 标签页（/blog/tags/*）、作者页（/blog/authors/*）等自动生成的列表路由
  // 不携带 blogDescription，直接透传会导致这些页面的 meta description 为空。
  // 这里按页面类型兜底拼一个，避免搜索引擎抓到没有描述的页面。
  const resolvedTitle = blogTitle ?? 'Blog';
  const fallbackDescription =
    resolvedTitle === 'Blog'
      ? blogDescription
      : `${resolvedTitle} - Brandon's Blog 记录学习、技术与生活：前端与计算机科学笔记、AI 与工程化实践、自托管小项目，以及游记与日常。`;

  return (
    <>
      <PageMetadata
        title={resolvedTitle}
        description={blogDescription ?? fallbackDescription}
      />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function ViewTypeSwitch({
  viewType,
  toggleViewType,
}: {
  viewType: ViewType;
  toggleViewType: (viewType: ViewType) => void;
}): JSX.Element {
  return (
    <div className="my-4 flex items-center justify-center">
      <Icon
        icon="ph:list"
        width="24"
        height="24"
        onClick={() => toggleViewType('list')}
        color={viewType === 'list' ? 'var(--ifm-color-primary)' : '#ccc'}
        className="cursor-pointer transition duration-500"
      />
      <Icon
        icon="ph:grid-four"
        width="24"
        height="24"
        onClick={() => toggleViewType('grid')}
        color={viewType === 'grid' ? 'var(--ifm-color-primary)' : '#ccc'}
        className="cursor-pointer transition duration-500"
      />
    </div>
  );
}

function BlogListPageContent(props: Props) {
  const {metadata, items} = props;

  const {viewType, toggleViewType} = useViewType();

  const isListView = viewType === 'list';
  const isGridView = viewType === 'grid';

  return (
    <MyLayout>
      <h2 className="mb-4 flex items-center justify-center text-center">
        <Translate id="theme.blog.title.new">博客</Translate>
      </h2>
      <p className="mb-4 text-center">我们都有光明的未来</p>
      <ViewTypeSwitch viewType={viewType} toggleViewType={toggleViewType} />
      <div className="row">
        <div className="col col--12">
          <>
            {isListView && (
              <div className="mb-4">
                <BlogPostItems items={items} />
              </div>
            )}
            {isGridView && <BlogPostGridItems items={items} />}
          </>
          <BlogListPaginator metadata={metadata} />
        </div>
      </div>
      <BackToTopButton />
    </MyLayout>
  );
}

export default function BlogListPage(props: Props): JSX.Element {
  return (
    <HtmlClassNameProvider
      className={cn(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
