import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import type {BlogPost} from '@docusaurus/plugin-content-blog';
import {usePluginData} from '@docusaurus/useGlobalData';
import {Section} from '../Section';

const BLOG_POSTS_COUNT = 6;

export function BlogItem({post}: {post: BlogPost}) {
  const {
    metadata: {permalink, title, description, date},
  } = post;

  const dateObj = new Date(date);
  const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  return (
    <li className="group flex items-baseline justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="min-w-0">
        <Link
          href={permalink}
          className="block truncate text-[1.05rem] font-semibold text-text no-underline transition-colors duration-200 group-hover:text-primary">
          {title}
        </Link>
        {description && (
          <p className="mt-1 truncate text-sm text-secondary">{description}</p>
        )}
      </div>
      <time dateTime={date} className="shrink-0 text-sm tabular-nums text-secondary">
        {dateString}
      </time>
    </li>
  );
}

export default function BlogSection(): JSX.Element {
  const blogData = usePluginData('docusaurus-plugin-content-blog') as {
    posts: BlogPost[];
    postNum: number;
  };

  const posts = blogData.posts.slice(0, BLOG_POSTS_COUNT);

  if (blogData.postNum === 0) {
    return <p className="text-secondary">作者还没开始写博文哦...</p>;
  }

  return (
    <Section title={<Translate id="homepage.blog.title">近期博客</Translate>} href="/blog">
      <ul className="m-0 list-none p-0">
        {posts.map((post) => (
          <BlogItem key={post.id} post={post} />
        ))}
      </ul>
    </Section>
  );
}
