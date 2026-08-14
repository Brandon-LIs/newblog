import Link from '@docusaurus/Link';
import {useEffect, useState} from 'react';
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
  {
    label: '隐私政策',
    to: '/privacy',
    showExternalIcon: false,
  },
];

const bszStats: Array<{id: string; label: string; icon: string}> = [
  {id: 'busuanzi_site_uv', label: '本站总访客数', icon: 'ri:user-line'},
  {id: 'busuanzi_site_pv', label: '本站总访问量', icon: 'ri:eye-line'},
  {id: 'busuanzi_page_uv', label: '本文总访客量', icon: 'ri:user-smile-line'},
  {id: 'busuanzi_page_pv', label: '本文总阅读量', icon: 'ri:eye-2-line'},
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

function BszStats() {
  const [counts, setCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 自建不蒜子：POST 到 bsz API，referer 区分站点与文章
        const res = await fetch('https://bsz.dusays.com:9001/api', {
          method: 'POST',
          headers: {'x-bsz-referer': window.location.origin},
        });
        const json = await res.json();
        // bsz API 返回 {data: {site_uv, site_pv, page_uv, page_pv}, success}
        const d = json?.data || {};
        if (!cancelled && d) {
          setCounts({
            busuanzi_site_uv: String(d.site_uv ?? ''),
            busuanzi_site_pv: String(d.site_pv ?? ''),
            busuanzi_page_uv: String(d.page_uv ?? ''),
            busuanzi_page_pv: String(d.page_pv ?? ''),
          });
        }
      } catch {
        // 统计失败不影响页面
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.bsz} aria-label="访问统计">
      <span className={styles.bszHeading}>📊 访问统计</span>
      <span className={styles.bszGroup}>
        {bszStats.map((stat) => (
          <span key={stat.id} className={styles.bszItem}>
            <svg
              className={styles.bszIcon}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              {stat.icon === 'ri:user-line' && (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </>
              )}
              {stat.icon === 'ri:eye-line' && (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
              {stat.icon === 'ri:user-smile-line' && (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M8 14h8" />
                </>
              )}
              {stat.icon === 'ri:eye-2-line' && (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
            <span className={styles.bszLabel}>{stat.label}</span>
            <span className={styles.bszValue} id={stat.id}>
              {counts[stat.id]}
            </span>
            <span className={styles.bszUnit}>
              {stat.id.includes('pv') ? '次' : '人'}
            </span>
          </span>
        ))}
      </span>
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
              src="https://blogimg.tos-cn-shanghai.volces.com/img/icon.jpg"
              alt={siteInfo.name}
              width={64}
              height={64}
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
          <BszStats />
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
              src="https://status.oopss.top/badge?theme=dark&lang=zh"
              width="250"
              height="30"
              loading="lazy"
              frameborder="0"
              scrolling="no"
              style={{'color-scheme': 'normal'}}
              title="Uptime Status"
            />
          </a>
        </div>

        <div className={styles.sponsor} aria-label="赞助商">
          <p className={styles.sponsorText}>
            该网站由
            <a href="https://www.synidc.cn" target="_blank" rel="noopener noreferrer">
              双翼鸟数据
            </a>
            提供加速防御
          </p>
          <ul className={styles.sponsorLinks}>
            <li>
              <a href="https://www.synidc.cn" target="_blank" rel="noopener noreferrer">
                双翼鸟数据 - 高防服务器
              </a>
            </li>
            <li>
              <a href="https://www.95duns.com" target="_blank" rel="noopener noreferrer">
                95盾 - 高防CDN
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
