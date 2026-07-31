import Link from '@docusaurus/Link';
import IconExternalLink from '@theme/Icon/ExternalLink';
import {Icon} from '@iconify/react';
import social from '@site/data/social';
import {siteInfo} from '@site/data/site';
import styles from './styles.module.css';

type FooterLink = {
  label: string;
  href?: string;
  showExternalIcon?: boolean;
  to?: string;
};

const currentYear = new Date().getFullYear();

const linkGroups: Array<{title: string; links: FooterLink[]}> = [
  {
    title: '关于',
    links: [
      {label: '首页', to: '/'},
      {label: '关于我', to: '/about'},
      {label: '关于本站项目', href: siteInfo.repository},
    ],
  },
  {
    title: '更多',
    links: [
      {label: '博客', to: '/blog'},
      {label: '归档', to: '/blog/archive'},
      {label: '友链', to: '/friends'},
    ],
  },
  {
    title: '联系',
    links: [
      {label: 'GitHub', href: social.github.href},
      {label: 'Bilibili', href: social.bilibili.href},
      {label: 'QQ', href: social.qq.href},
      {label: '邮箱 bcihal@qq.com', href: social.email.href},
    ],
  },
];

const utilityLinks: FooterLink[] = [
  {
    label: 'RSS 订阅',
    href: `${siteInfo.url}/blog/rss.xml`,
    showExternalIcon: false,
  },
  {
    label: '站点地图',
    href: `${siteInfo.url}/sitemap.xml`,
    showExternalIcon: false,
  },
];

const stats: Array<{id: string; label: string; icon: string; unit: string}> = [
  {id: 'busuanzi_site_uv', label: '本站访客', icon: 'ri:user-line', unit: '人'},
  {id: 'busuanzi_site_pv', label: '本站访问', icon: 'ri:eye-line', unit: '次'},
  {id: 'busuanzi_page_uv', label: '本页访客', icon: 'ri:user-smile-line', unit: '人'},
  {id: 'busuanzi_page_pv', label: '本页阅读', icon: 'ri:eye-2-line', unit: '次'},
];

function FooterAnchor({link}: {link: FooterLink}) {
  const showExternalIcon =
    link.showExternalIcon ?? Boolean(link.href?.startsWith('http'));
  const linkProps = link.href ? {href: link.href} : {to: link.to};

  return (
    <Link {...linkProps} className={styles.link}>
      {link.label}
      {showExternalIcon && <IconExternalLink className={styles.externalIcon} />}
    </Link>
  );
}

function Stats() {
  return (
    <div className={styles.stats} aria-label="不蒜子访问统计">
      {stats.map(({id, label, icon, unit}) => (
        <span key={id} className={styles.statItem}>
          <Icon icon={icon} width="14" height="14" />
          {label}
          <span id={id} className={styles.statValue}>
            加载中...
          </span>
          {unit}
        </span>
      ))}
      <a
        href={`https://ac.oopss.top/count?search=${siteInfo.url.replace('https://', '')}`}
        title="不蒜子统计"
        target="_blank"
        rel="noreferrer"
        className={styles.statBadge}>
        <img
          src="https://ac.oopss.top/badge"
          alt="不蒜子统计"
          style={{width: 85, height: 20, border: 0}}
        />
      </a>
    </div>
  );
}

export default function Footer(): JSX.Element {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <section className={styles.brand} aria-label="站点信息">
            <img
              className={styles.avatar}
              src="https://q.qlogo.cn/headimg_dl?dst_uin=3970588157&spec=640&img_type=jpg"
              alt={siteInfo.name}
            />
            <h2 className={styles.title}>{siteInfo.name}</h2>
            <p className={styles.description}>{siteInfo.description}</p>
            <p className={styles.copyright}>
              <span>
                {`© ${
                  siteInfo.copyrightStartYear === currentYear
                    ? currentYear
                    : `${siteInfo.copyrightStartYear}-${currentYear}`
                } ${siteInfo.name}`}
              </span>
              <br />
              <span>
                Powered by{' '}
                <Link href="https://docusaurus.io">Docusaurus</Link>
              </span>
            </p>
          </section>

          <nav className={styles.groups} aria-label="页脚导航">
            {linkGroups.map((group) => (
              <section key={group.title} className={styles.group}>
                <h3 className={styles.groupTitle}>{group.title}</h3>
                <ul className={styles.groupList}>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <nav className={styles.utility} aria-label="订阅和站点地图">
            {utilityLinks.map((link) => (
              <FooterAnchor key={link.label} link={link} />
            ))}
          </nav>
          <Stats />
        </div>
      </div>
    </footer>
  );
}
