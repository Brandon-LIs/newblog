import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import type {BlogPost} from '@docusaurus/plugin-content-blog';
import {usePluginData} from '@docusaurus/useGlobalData';
import {Section} from '../Section';

const BLOG_POSTS_COUNT = 6;

// 瀑布流高度分布（桌面端 3 栏时的行跨度）
const HEIGHT_SPANS = [2, 1, 1, 1, 2, 1];

export function BlogCard({post, index, cover}: {post: BlogPost; index: number; cover?: string}) {
  const {
    metadata: {permalink, title, description, date},
  } = post;

  const span = HEIGHT_SPANS[index % HEIGHT_SPANS.length];

  return (
    <Link
      href={permalink}
      className="blog-card group block overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 no-underline"
      style={{gridRow: `span ${span}`}}>
      {cover && (
        <div className="overflow-hidden" style={{height: span > 1 ? '220px' : '140px'}}>
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="m-0 text-[0.95rem] font-semibold text-text line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-secondary line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function BlogSection(): JSX.Element {
  const blogData = usePluginData('docusaurus-plugin-content-blog') as {
    posts: BlogPost[];
    postNum: number;
    covers: Record<string, string>;
  };

  const posts = blogData.posts.slice(0, BLOG_POSTS_COUNT);

  if (blogData.postNum === 0) {
    return <p className="text-secondary">作者还没开始写博文哦...</p>;
  }

  return (
    <Section title={<Translate id="homepage.blog.title">近期博客</Translate>} href="/blog">
      <div className="blog-grid">
        {posts.map((post, index) => (
          <BlogCard
            key={post.id}
            post={post}
            index={index}
            cover={blogData.covers?.[post.metadata.permalink]}
          />
        ))}
      </div>
    </Section>
  );
}
