// 友链健康度检测：检查 data/friends.json 中每个友链网站的可用性
// 输出结果：ok / broken
import {readFileSync} from 'node:fs';

const BROKEN = [];

async function check(url, title, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {'User-Agent': 'Mozilla/5.0 (compatible; FriendHealthCheck/1.0)'},
    });
    if (r.ok || r.status === 403 || r.status === 429) {
      return {ok: true, status: r.status};
    }
    return {ok: false, status: r.status};
  } catch (e) {
    return {ok: false, error: e.name || e.message};
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const friends = JSON.parse(readFileSync(new URL('../data/friends.json', import.meta.url), 'utf8'));
  console.log(`共 ${friends.length} 个友链，开始检测...\n`);

  const results = [];
  const concurrency = 5;
  for (let i = 0; i < friends.length; i += concurrency) {
    const batch = friends.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (f) => {
        if (!f.website) return {title: f.title, website: '', ok: false, error: '无网址'};
        const r = await check(f.website, f.title);
        const line = `[${r.ok ? '✅' : '❌'}] ${f.title} | ${f.website}${r.ok ? ` | HTTP ${r.status}` : ` | ${r.error || 'HTTP ' + r.status}`}`;
        console.log(line);
        if (!r.ok) BROKEN.push({title: f.title, website: f.website, error: r.error || ('HTTP ' + r.status)});
        return {title: f.title, website: f.website, ...r};
      })
    );
    results.push(...batchResults);
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n检测完成：${results.length} 个友链，${okCount} 正常，${results.length - okCount} 异常`);

  // 写入汇总供后续 step 使用
  const summary = {total: results.length, ok: okCount, broken: results.length - okCount, brokenList: BROKEN};
  const {writeFileSync} = await import('node:fs');
  writeFileSync('/tmp/friend-health.json', JSON.stringify(summary, null, 2));

  // 存在异常则以非零退出，供 workflow 判断
  if (BROKEN.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});