import Translate from '@docusaurus/Translate';

export type FeatureItem = {
  title: string;
  description: React.ReactNode;
};

const FEATURES: FeatureItem[] = [
  {
    title: '前端与 CS 学习者',
    description: (
      <Translate>
        热爱前端与计算机科学，从零开始系统学习编程，持续探索
        HTML/CSS/JS、Vue/React 与 Node.js 技术栈。
      </Translate>
    ),
  },
  {
    title: 'AI 探索者',
    description: (
      <Translate>
        积极尝试将 AI 融入学习与工程实践，探索大模型、自动化与智能硬件结合的无限可能。
      </Translate>
    ),
  },
  {
    title: '开源爱好者',
    description: (
      <Translate>
        乐于将想法落地为开源项目，如文件快传、Webdev 云盘、自建不蒜子等，并持续打磨完善。
      </Translate>
    ),
  },
];

export default FEATURES;
