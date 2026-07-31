import Translate, {translate} from '@docusaurus/Translate';
import {Icon} from '@iconify/react';
import OpenSourceSvg from '@site/static/svg/undraw_open_source.svg';
import SpiderSvg from '@site/static/svg/undraw_spider.svg';
import WebDeveloperSvg from '@site/static/svg/undraw_web_developer.svg';

export type FeatureItem = {
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  header: React.ReactNode;
  icon?: React.ReactNode;
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
    header: <WebDeveloperSvg className="h-auto w-full" height={150} role="img" />,
    icon: <Icon icon="logos:vue" className="size-4 text-neutral-500" />,
  },
  {
    title: 'AI 探索者',
    description: (
      <Translate>
        积极尝试将 AI 融入学习与工程实践，探索大模型、自动化与智能硬件结合的无限可能。
      </Translate>
    ),
    header: <SpiderSvg className="h-auto w-full" height={150} role="img" />,
  },
  {
    title: '开源爱好者',
    description: (
      <Translate>
        乐于将想法落地为开源项目，如文件快传、Webdev 云盘、自建不蒜子等，并持续打磨完善。
      </Translate>
    ),
    header: <OpenSourceSvg className="h-auto w-full" height={150} role="img" />,
  },
];

export default FEATURES;
