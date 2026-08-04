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
      {showExternalIcon && <IconExternalLink className={styles.externalIcon} />}
    </Link>
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
            <a
              className={styles.icpLink}
              href="https://icp.gov.moe/?keyword=20262621"
              target="_blank"
              rel="noopener noreferrer">
              萌ICP备20262621号
            </a>
          </nav>
          <a
            className={styles.statusBadge}
            href="https://status.oopss.top"
            target="_blank"
            rel="noopener noreferrer"
            title="服务状态">
            <iframe
              src="https://status.oopss.top/badge?theme=light"
              width="250"
              height="30"
              frameborder="0"
              scrolling="no"
              style={{'color-scheme': 'normal'}}
              title="Uptime Status"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
