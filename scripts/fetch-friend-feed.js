// Friend-Circle-Lite 方案：抓取所有友链 RSS 文章，聚合写入 data/friend-articles.json
// 由 GitHub Action 定时执行，前端只读取静态 JSON。
const fs = require('fs');
const path = require('path');

const FRIENDS_FILE = path.join(__dirname, '../data/friends.json');
const OUTPUT_FILE = path.join(__dirname, '../data/friend-articles.json');
const MAX_PER_SITE = 5;
const TIMEOUT_MS = 10000;

function stripCdata(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'");
}

function stripHtml(h) {
  return String(h || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(s) {
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function parseRss(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/.test(xml);
  const re = isAtom ? /<entry[\s\S]*?<\/entry>/g : /<item[\s\S]*?<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];
    const get = (tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return mm ? decodeEntities(stripCdata(mm[1])).trim() : '';
    };
    const getAttr = (tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*href=["']([^"']+)["']`, 'i'));
      return mm ? mm[1].trim() : '';
    };
    let title = get('title');
    let link = isAtom ? getAttr('link') : get('link');
    const pubDate = isAtom ? get('updated') : get('pubDate');
    const desc = isAtom ? get('summary') : get('description');
    if (!title && !link) continue;
    items.push({
      title,
      link,
      date: pubDate || get('date') || '',
      description: stripHtml(desc).slice(0, 200),
    });
  }
  return items;
}

const PROXY_URL = 'https://apis.oopss.top/api/proxy-fetch?url=';

async function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {'User-Agent': 'Mozilla/5.0 (compatible; FriendCircle/1.0)'},
      redirect: 'follow',
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchWithFallback(url) {
  try {
    return await fetchWithTimeout(url);
  } catch (e) {
    if (e.message && e.message.includes('HTTP 403')) {
      console.log(`[proxy] ${url} 返回 403，尝试通过代理...`);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      try {
        const r = await fetch(PROXY_URL + encodeURIComponent(url), {
          signal: ctrl.signal,
          headers: {'User-Agent': 'Mozilla/5.0'},
        });
        if (!r.ok) throw new Error('代理返回 ' + r.status);
        return await r.text();
      } finally {
        clearTimeout(t);
      }
    }
    throw e;
  }
}

async function fetchFriendFeed(friend) {
  const rss = friend.rss;
  if (!rss) return [];
  try {
    const xml = await fetchWithFallback(rss);
    const items = parseRss(xml);
    return items.slice(0, MAX_PER_SITE).map((it) => ({
      ...it,
      site: friend.title,
      siteUrl: friend.website,
      avatar: friend.avatar || '',
    }));
  } catch (e) {
    console.log(`[skip] ${friend.title} (${rss}): ${e.message}`);
    return [];
  }
}

async function main() {
  let friends = [];
  try {
    friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8'));
  } catch (e) {
    console.error('读取 friends.json 失败：', e.message);
    process.exit(1);
  }

  const withRss = friends.filter((f) => f.rss);
  console.log(`共 ${friends.length} 个友链，其中 ${withRss.length} 个配置了 RSS`);

  // 并发限制 4
  let idx = 0;
  const results = new Array(withRss.length);
  const workers = Array.from({length: Math.min(4, withRss.length)}, async () => {
    while (idx < withRss.length) {
      const i = idx++;
      results[i] = await fetchFriendFeed(withRss[i]);
    }
  });
  await Promise.all(workers);

  const flat = results
    .flat()
    .filter((a) => a.title && a.link)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const out = {
    updated_at: new Date().toISOString(),
    count: flat.length,
    list: flat,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));
  console.log(`写入 ${OUTPUT_FILE}，共 ${flat.length} 篇文章`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});