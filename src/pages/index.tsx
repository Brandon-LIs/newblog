import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BlogSection from '../components/landing/BlogSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import Hero from '../components/landing/Hero';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const {customFields, title} = siteConfig;

  const FALLBACK_DESCRIPTION =
    "Brandon's Blog 记录学习、技术与生活：前端与计算机科学笔记、AI 与工程化实践、自托管小项目，以及游记与日常。";

  return (
    <Layout
      title={title}
      description={(customFields?.homeDescription as string) ?? FALLBACK_DESCRIPTION}>
      <main>
        <Hero />

        <div className="relative">
          <div className="mx-auto max-w-7xl lg:px-8">
            <BlogSection />
            <FeaturesSection />
          </div>
        </div>
      </main>
    </Layout>
  );
}
