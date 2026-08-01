import {Icon} from '@iconify/react';
import {useLocation} from '@docusaurus/router';
import {useCallback, useEffect, useState} from 'react';

const BSZ_API = 'https://bsz.dusays.com:9001/api';

type BszData = {
  site_pv: number;
  site_uv: number;
  page_pv: number;
  page_uv: number;
};

function fetchBsz(): Promise<BszData> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BSZ_API, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-bsz-referer', window.location.href);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.responseText);
            if (json.success && json.data) {
              resolve(json.data);
            } else {
              reject(new Error('bsz not success'));
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`http ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('network error'));
    xhr.send();
  });
}

const formatNum = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n.toString();

const stats = [
  {key: 'site_uv', label: '本站总访客数', icon: 'ri:user-line', unit: '人'},
  {key: 'site_pv', label: '本站总访问量', icon: 'ri:eye-line', unit: '次'},
  {key: 'page_uv', label: '本文总访客量', icon: 'ri:user-smile-line', unit: '人'},
  {key: 'page_pv', label: '本文总阅读量', icon: 'ri:eye-2-line', unit: '次'},
] as const;

export default function Busuanzi({
  className,
}: {
  className?: string;
}): JSX.Element {
  const {pathname} = useLocation();
  const [data, setData] = useState<BszData | null>(null);

  const load = useCallback(() => {
    fetchBsz()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    load();
  }, [pathname, load]);

  return (
    <div className={className} aria-label="不蒜子访问统计">
      {stats.map(({key, label, icon, unit}) => (
        <span key={key} className="bsz-stat">
          <span className="bsz-stat-icon">
            <Icon icon={icon} width="14" height="14" />
          </span>
          {label}
          <span className="bsz-stat-value">
            {data ? formatNum(data[key]) : '加载中...'}
          </span>
          {unit}
        </span>
      ))}
    </div>
  );
}
