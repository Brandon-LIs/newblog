import Link from '@docusaurus/Link';
import IconExternalLink from '@theme/Icon/ExternalLink';
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

function FooterAnchor({link}: {link: FooterLink}) {
  const showExternalIcon =
    link.showExternalIcon ?? Boolean(link.href?.startsWith('http'));
  const linkProps = link.href ? {href: link.href} : {to: link.to};

  return (
    <Link {...linkProps} className={styles.link}>
      {link.label}
      {showExternalIcon && (
        <IconExternalLink className={styles.externalIcon} />
      )}
    </Link>
  );
}

export default function Footer(): JSX.Element {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <section className={styles.brand} aria-label="站点信息">
            <h2 className={styles.title}>{siteInfo.name}</h2>
            <p className={styles.description}>{siteInfo.description}</p>
            <p className={styles.copyright}>
              <span>
                {`© ${siteInfo.copyrightStartYear}-${currentYear} ${siteInfo.name}`}
              </span>
              <br />
              <span>
                Powered by
                {' '}
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

          <div className={styles.stats} aria-label="不蒜子访问统计">
            <span>
              本站总访客数
              <span id="busuanzi_site_uv">加载中...</span>
              人
            </span>
            <span>
              本站访问量
              <span id="busuanzi_site_pv">加载中...</span>
              次
            </span>
            <span>
              本页访客数
              <span id="busuanzi_page_uv">加载中...</span>
              人
            </span>
            <span>
              本页访问量
              <span id="busuanzi_page_pv">加载中...</span>
              次
            </span>
            <a
              href={`https://ac.oopss.top/count?search=${siteInfo.url.replace('https://', '')}`}
              title="不蒜子统计"
              target="_blank"
              rel="noreferrer">
              <img
                src="https://ac.oopss.top/badge"
                alt="不蒜子统计"
                style={{width: 85, height: 20, border: 0, verticalAlign: 'middle'}}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
