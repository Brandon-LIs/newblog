import Translate from '@docusaurus/Translate';
import features from '@site/data/features';
import {Section} from '../Section';

export default function FeaturesSection() {
  return (
    <Section title={<Translate id="homepage.feature.title">个人特点</Translate>}>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        {features.map((item) => (
          <div key={item.title as string} className="max-w-sm">
            <h3 className="m-0 mb-2 text-base font-semibold text-text">
              {item.title}
            </h3>
            <p className="m-0 text-sm leading-6 text-secondary">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
