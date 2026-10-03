import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BlogSection from '../components/landing/BlogSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import Hero from '../components/landing/Hero';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const {customFields} = siteConfig;

  // 首页标题不能只写站名（实测原值仅 "Brandon's Blog" 14 字，无任何可检索词）。
  // 也写不进 siteConfig.title —— 那会污染全站 titleTemplate 的后缀。
  // 这里单给一句描述性标题，最终渲染为
  //「一个高中生的个人博客，记录学习、技术与生活 | Brandon's Blog」。
  const HOME_TITLE = '一个高中生的个人博客，记录学习、技术与生活';
  const FALLBACK_DESCRIPTION =
    "Brandon's Blog 记录学习、技术与生活：前端与计算机科学笔记、AI 与工程化实践、自托管小项目，以及游记与日常。";

  return (
    <Layout
      title={HOME_TITLE}
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
