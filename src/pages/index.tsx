import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BlogSection from '../components/landing/BlogSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import Hero from '../components/landing/Hero';

export default function Home() {
  const {
    siteConfig: {customFields, title},
  } = useDocusaurusContext();
  const {description} = customFields as {description: string};

  return (
    <Layout title={title} description={description}>
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
