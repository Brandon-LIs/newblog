import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';

export default function BlogPostItemHeader(): JSX.Element {
  const {isBlogPostPage} = useBlogPost();
  return (
    <header style={{position: 'relative', zIndex: 2}}>
      {isBlogPostPage ? (
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <span
            aria-hidden="true"
            className="inline-flex size-7 shrink-0 translate-y-[0.15em] select-none items-center justify-center rounded-[0.35rem] bg-[#a63d2f] text-[0.78rem] font-semibold leading-none text-[#f6f1e8] [writing-mode:vertical-rl]">
            光明
          </span>
          <BlogPostItemHeaderTitle />
        </div>
      ) : (
        <BlogPostItemHeaderTitle />
      )}
      {isBlogPostPage && (
        <>
          <BlogPostItemHeaderInfo />
          {/* <BlogPostItemHeaderAuthors /> */}
        </>
      )}
    </header>
  );
}
