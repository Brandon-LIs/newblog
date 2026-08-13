import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import type React from 'react';

interface SectionProps {
  title: string | JSX.Element;
  href?: string;
  children: React.ReactNode;
}

export function Section({title, href, children}: SectionProps) {
  return (
    <section className="py-4 max-lg:mx-4">
      <div className="mb-6 flex w-full items-center justify-between">
        <h2 className="m-0 text-xl font-semibold tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-sm font-medium text-secondary no-underline transition-colors duration-200 hover:text-primary">
            <Translate id="homepage.lookMore">查看更多</Translate> ›
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
