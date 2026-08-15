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
  let str = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[+-]\d{2}:\d{2}$/.test(str) && !str.endsWith('Z')) {
    str += 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

const ALTERNATIVE_PATHS = [
  '/feed',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/rss/',
  '/rss.xml',
  '/feed/atom/',
  '/feed/rss/',
  '/feeds/',
  '/feeds/posts/default',
];

function feedUrlVariants(baseUrl) {
  try {
    const u = new URL(baseUrl);
    const ext = path.extname(u.pathname);
    if (ext === '.xml' || ext === '.rss' || ext === '.atom') return [];
    return ALTERNATIVE_PATHS.map((p) => {
      const c = new URL(u.origin);
      c.pathname = p;
      return c.href;
    });
  } catch {
    return [];
  }
}

function parseJsonFeed(xml) {
  try {
    const data = JSON.parse(xml);
    if (!data || !data.version) return null;
    return (data.items || []).map((item) => ({
      title: item.title || '',
      link: item.url || item.external_url || '',
      date: item.date_published || item.date_modified || '',
      description: stripHtml(item.content_text || item.summary || item.content_html || '').slice(0, 200),
    }));
  } catch {
    return null;
  }
}

function parseRss(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml);
  const re = isAtom ? /<entry[\s\S]*?<\/entry>/gi : /<item[\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];

    const get = (tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return mm ? decodeEntities(stripCdata(mm[1])).trim() : '';
    };
    const getAttr = (tag, attr) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i'));
      return mm ? mm[1].trim() : '';
    };
    const getHref = (tag) => getAttr(tag, 'href');

    let title = get('title');
    let link = '';
    if (isAtom) {
      link = getHref('link');
    } else {
      link = get('link');
      if (!link) link = getHref('link');
    }
    const pubDate = isAtom ? (get('published') || get('updated')) : (get('pubDate') || get('dc:date') || get('date'));
    const desc = isAtom ? (get('summary') || get('content')) : (get('description') || get('content:encoded'));
    if (!title && !link) continue;
    items.push({
      title,
      link,
      date: pubDate || '',
      description: stripHtml(desc).slice(0, 200),
    });
  }
  return items;
}

function parseFeed(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    const jsonItems = parseJsonFeed(trimmed);
    if (jsonItems && jsonItems.length > 0) return jsonItems;
  }
  return parseRss(trimmed);
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
    if (e.message && (e.message.includes('HTTP 403') || e.message.includes('HTTP 40') || e.message.includes('ETIMEDOUT') || e.message.includes('ENOTFOUND'))) {
      console.log(`[proxy] ${url} (${e.message})，尝试通过代理...`);
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
  const rss = friend.rss || '';
  const primaryUrls = rss ? [rss] : [];
  const websiteUrls = friend.website ? feedUrlVariants(friend.website) : [];
  const tryUrls = [...primaryUrls, ...websiteUrls];
  const tried = new Set();

  for (const url of tryUrls) {
    if (tried.has(url)) continue;
    tried.add(url);
    try {
      const xml = await fetchWithFallback(url);
      const items = parseFeed(xml);
      if (items.length > 0) {
        if (url !== rss) {
          console.log(`[ok] ${friend.title} 使用备用路径 ${url}，${items.length} 篇文章`);
        }
        return items.slice(0, MAX_PER_SITE).map((it) => ({
          ...it,
          site: friend.title,
          siteUrl: friend.website,
          avatar: friend.avatar || '',
        }));
      }
    } catch (e) {
      if (url === rss && tryUrls.length > 1) {
        console.log(`[try-alt] ${friend.title} ${url} 失败 (${e.message})，尝试备用路径...`);
      }
    }
  }
  console.log(`[skip] ${friend.title} (${rss}): 所有路径均失败`);
  return [];
}

async function main() {
  let friends = [];
  try {
    friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8'));
  } catch (e) {
    console.error('读取 friends.json 失败：', e.message);
    process.exit(1);
  }

  const withRss = friends.filter((f) => f.rss || f.feed);
  console.log(`共 ${friends.length} 个友链，其中 ${withRss.length} 个配置了 RSS/Feed`);

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