// EdgeOne Cloud Function: 代理友链文章数据源
// 路由：/api/friends-feed （edgeone.json 中 /friends-feed.json 内部 rewrite 到此处）
// Vercel 上该路径由 vercel.json 的外部 rewrite 处理，此处仅用于 EdgeOne 部署
const SOURCE_URL = 'https://friendsdata.oopss.top/friend-articles.json';

export async function onRequestGet() {
  try {
    const r = await fetch(SOURCE_URL, {
      headers: {'User-Agent': 'Mozilla/5.0 (compatible; FriendFeedProxy/1.0)'},
    });
    if (!r.ok) {
      return json({ok: true, list: [], error: 'upstream ' + r.status}, r.status);
    }
    const text = await r.text();
    return new Response(text, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, must-revalidate',
      },
    });
  } catch (e) {
    return json({ok: true, list: [], error: e.message}, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
  });
}