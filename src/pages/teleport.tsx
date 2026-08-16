import Layout from '@theme/Layout';
import {useEffect} from 'react';

const TITLE = '随机穿梭';
const DESCRIPTION = '随机穿梭到我的一个友链站点';

function randomPath() {
  // 随机选择跃迁通道 或 Linux 终端
  return Math.random() < 0.5 ? '/wormhole' : '/linux';
}

export default function Teleport(): JSX.Element {
  useEffect(() => {
    const path = randomPath();
    const url = `${window.location.origin}${path}`;
    const t = setTimeout(() => {
      window.location.replace(url);
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout title={TITLE} description={DESCRIPTION} wrapperClassName="teleport-page">
      <main className="flex h-[70vh] items-center justify-center text-secondary">
        <div className="text-center">
          <div className="mb-4 animate-pulse text-3xl" aria-hidden>🌀</div>
          <p>正在随机选择穿梭方式…</p>
        </div>
      </main>
    </Layout>
  );
}