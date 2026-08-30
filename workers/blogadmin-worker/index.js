var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
import UI from "./ui.html";
import UPLOAD from "./upload.html";
import {encodeToWebp} from "./src/webp.js";
var GH_API = "https://api.github.com";
var SESSION_TTL = 7 * 24 * 3600;
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT,POST,GET,OPTIONS,DELETE",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept",
      ...extraHeaders
    }
  });
}
__name(json, "json");
function ok(data) {
  return json({ ok: true, ...data });
}
__name(ok, "ok");
function fail(message, status = 400) {
  return json({ ok: false, error: message }, status);
}
__name(fail, "fail");
function ghHeaders(env) {
  return {
    Authorization: `token ${env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "blog-admin-worker"
  };
}
__name(ghHeaders, "ghHeaders");
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
__name(bytesToBase64, "bytesToBase64");
function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
__name(base64ToUtf8, "base64ToUtf8");
function utf8ToBase64(str) {
  return bytesToBase64(new TextEncoder().encode(str));
}
__name(utf8ToBase64, "utf8ToBase64");
function encodePath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}
__name(encodePath, "encodePath");
async function ghRead(env, repo, path) {
  const r = await fetch(
    `${GH_API}/repos/${repo}/contents/${encodePath(path)}`,
    { headers: ghHeaders(env) }
  );
  if (!r.ok) throw new Error(`\u8BFB\u53D6 ${path} \u5931\u8D25: ${r.status}`);
  const j = await r.json();
  if (j.encoding === "base64") {
    return { content: base64ToUtf8(j.content), sha: j.sha, size: j.size };
  }
  return { content: j.content, sha: j.sha, size: j.size };
}
__name(ghRead, "ghRead");
async function ghPutBase64(env, repo, path, base64, message, sha) {
  const body = { message, content: base64 };
  if (sha) body.sha = sha;
  const r = await fetch(`${GH_API}/repos/${repo}/contents/${encodePath(path)}`, {
    method: "PUT",
    headers: ghHeaders(env),
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) {
    const msg = j.message && j.message.includes("sha") ? "\u6587\u4EF6\u5DF2\u88AB\u8FDC\u7A0B\u4FEE\u6539\uFF0C\u8BF7\u5237\u65B0\u540E\u518D\u8BD5" : j.message || "GitHub \u5199\u5165\u5931\u8D25";
    throw new Error(`${msg} (${r.status})`);
  }
  return j.content;
}
__name(ghPutBase64, "ghPutBase64");
function ghWrite(env, repo, path, content, message, sha) {
  return ghPutBase64(env, repo, path, utf8ToBase64(content), message, sha);
}
__name(ghWrite, "ghWrite");
async function ghDelete(env, repo, path, sha, message) {
  const r = await fetch(`${GH_API}/repos/${repo}/contents/${encodePath(path)}`, {
    method: "DELETE",
    headers: ghHeaders(env),
    body: JSON.stringify({ message, sha })
  });
  if (!r.ok) throw new Error(`\u5220\u9664\u5931\u8D25: ${r.status}`);
  return true;
}
__name(ghDelete, "ghDelete");
async function ghListDir(env, repo, dir) {
  const r = await fetch(
    `${GH_API}/repos/${repo}/contents/${encodePath(dir)}`,
    { headers: ghHeaders(env) }
  );
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}
__name(ghListDir, "ghListDir");
function extractTitle(content) {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return "";
  const t = m[1].match(/^title:\s*(.+)$/m);
  return t ? t[1].trim().replace(/^['"]|['"]$/g, "") : "";
}
__name(extractTitle, "extractTitle");
async function checkAuth(env, request) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  return await env.KV.get(`sess:${token}`) !== null;
}
__name(checkAuth, "checkAuth");
function readJsonBody(request) {
  return request.json().catch(() => null);
}
__name(readJsonBody, "readJsonBody");
async function handleLogin(env, request) {
  const body = await readJsonBody(request);
  if (!body || !body.password) return fail("\u8BF7\u8F93\u5165\u5BC6\u7801");
  if (body.password !== env.ADMIN_PASS) return fail("\u5BC6\u7801\u9519\u8BEF", 401);
  const token = crypto.randomUUID();
  await env.KV.put(`sess:${token}`, "1", { expirationTtl: SESSION_TTL });
  return ok({ token });
}
__name(handleLogin, "handleLogin");
async function handleLogout(env, request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (token) await env.KV.delete(`sess:${token}`);
  return ok({});
}
__name(handleLogout, "handleLogout");
async function handleList(env, url) {
  const type = url.searchParams.get("type") || "blog";
  const cacheKey = "admin:list:" + type;
  // 尝试从 KV 读取缓存
  if (env.KV) {
    try {
      const cached = await env.KV.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.items) return ok(parsed);
      }
    } catch {}
  }
  const dir = type === "docs" ? env.DOCS_DIR : env.BLOG_DIR;
  const files = await ghListDir(env, env.BLOG_REPO, dir);
  const items = [];
  for (const f of files) {
    if (f.type !== "file" || !/\.(md|mdx)$/i.test(f.name)) continue;
    let title = "";
    try {
      const c = await ghRead(env, env.BLOG_REPO, f.path);
      title = extractTitle(c.content);
    } catch {
      title = "";
    }
    items.push({ name: f.name, path: f.path, sha: f.sha, size: f.size, title });
  }
  items.sort((a, b) => a.name < b.name ? 1 : -1);
  const result = { type, items };
  // 写入 KV 缓存
  if (env.KV) {
    try {
      await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
    } catch {}
  }
  return ok(result);
}
__name(handleList, "handleList");
async function handleGetPost(env, url) {
  const path = url.searchParams.get("path");
  if (!path) return fail("\u7F3A\u5C11 path");
  try {
    const c = await ghRead(env, env.BLOG_REPO, path);
    return ok({ path, sha: c.sha, content: c.content });
  } catch (e) {
    return fail(e.message, 404);
  }
}
__name(handleGetPost, "handleGetPost");
function buildFrontMatter(type, meta, body) {
  const fm = ["---"];
  if (type === "docs") {
    if (meta.title) fm.push(`title: ${meta.title}`);
    if (meta.description) fm.push(`description: ${meta.description}`);
    if (meta.sidebar_position) fm.push(`sidebar_position: ${meta.sidebar_position}`);
    if (meta.slug) fm.push(`slug: ${meta.slug}`);
  } else {
    if (meta.slug) fm.push(`slug: ${meta.slug}`);
    if (meta.title) fm.push(`title: ${meta.title}`);
    if (meta.authors) fm.push(`authors: [${meta.authors}]`);
    if (meta.tags) fm.push(`tags: [${meta.tags}]`);
    if (meta.date) fm.push(`date: ${meta.date}`);
    if (meta.image) fm.push(`image: ${meta.image}`);
    if (meta.description) fm.push(`description: ${meta.description}`);
    if (meta.aiSummary !== undefined) fm.push(`ai_summary: ${meta.aiSummary}`);
  }
  fm.push("---", "");
  return fm.join("\n") + (body || "").trimStart();
}
__name(buildFrontMatter, "buildFrontMatter");
function sanitizeSlug(s) {
  return (s || "").replace(/[^\w\u4e00-\u9fa5-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
__name(sanitizeSlug, "sanitizeSlug");
function today() {
  const d = /* @__PURE__ */ new Date();
  const p = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "p");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
__name(today, "today");
async function aiGenerateSlug(env, title) {
  if (!env.AI_API_KEY) return "";
  const apiUrl = env.AI_API_URL || "https://api.agnes-ai.cn/v1/chat/completions";
  const model = env.AI_MODEL || "agnes-2.0-flash";
  const prompt =
    "根据博文标题生成一个简洁的英文 URL slug。\n\n要求：\n- 只输出 slug 本身，不要引号、反引号、空格或任何额外文字\n- 由小写英文字母、数字、连字符组成，不含中文\n- 尽量简短（3~6 个词，通常 30 个字符以内）\n- 可以是纯英文，也可含数字（数字非必需）\n\n博文标题：\n" + title;
  try {
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.AI_API_KEY },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是一个 URL slug 生成助手，只输出 slug 字符串，不含任何其他内容。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 32,
        temperature: 0.3
      })
    });
    if (!r.ok) return "";
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || "").trim();
  } catch {
    return "";
  }
}
__name(aiGenerateSlug, "aiGenerateSlug");
async function handleSavePost(env, body) {
  const type = body.type === "docs" ? "docs" : "blog";
  const title = (body.title || "").trim();
  if (!title) return fail("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
  const userSlug = (body.slug || "").trim();
  let slug;
  if (userSlug) {
    slug = sanitizeSlug(userSlug);
  } else {
    // 用户未填写 slug：由 AI 根据标题生成，失败则回退标题清洗
    slug = await aiGenerateSlug(env, title);
    slug = slug ? sanitizeSlug(slug) : sanitizeSlug(title);
  }
  const bodyContent = (body.content || "").trim();
  if (!bodyContent && !body.content) return fail("\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  const meta = {
    title,
    slug,
    description: (body.description || "").trim(),
    image: (body.image || "").trim(),
    date: body.date || today(),
    authors: body.authors || env.AUTHORS_DEFAULT,
    tags: Array.isArray(body.tags) ? body.tags.map((t) => t.trim()).filter(Boolean).join(", ") : (body.tags || "").trim(),
    sidebar_position: body.sidebar_position || "",
    aiSummary: body.aiSummary !== undefined ? body.aiSummary : true,
  };
  let path = body.path || "";
  const isNew = !path;
  if (isNew) {
    path = type === "docs" ? `${env.DOCS_DIR}/${slug}.md` : `${env.BLOG_DIR}/${meta.date}-${slug}.md`;
  }
  const full = buildFrontMatter(type, meta, bodyContent);
  const commitMsg = `${isNew ? "blog-admin \u53D1\u5E03\u65B0" : "blog-admin \u66F4\u65B0"}${type === "docs" ? "\u7B14\u8BB0" : "\u535A\u6587"}: ${title}`;
  try {
    const result = await ghWrite(env, env.BLOG_REPO, path, full, commitMsg, body.sha || void 0);
    // 清除列表缓存
    const cacheKey = "admin:list:" + (type === "docs" ? "docs" : "blog");
    if (env.KV) { try { await env.KV.delete(cacheKey); } catch {} }
    const url = `https://github.com/${env.BLOG_REPO}/blob/main/${path}`;
    return ok({ path, url, isNew, version: result && result.sha });
  } catch (e) {
    return fail(e.message, 500);
  }
}
__name(handleSavePost, "handleSavePost");
async function handleDeletePost(env, body) {
  if (!body.path || !body.sha) return fail("\u7F3A\u5C11 path \u6216 sha");
  try {
    await ghDelete(env, env.BLOG_REPO, body.path, body.sha, `blog-admin \u5220\u9664 ${body.path}`);
    // 清除列表缓存（同时清除 blog 和 docs 的缓存，不确定类型）
    for (const t of ["blog", "docs"]) {
      const cacheKey = "admin:list:" + t;
      if (env.KV) { try { await env.KV.delete(cacheKey); } catch {} }
    }
    return ok({ path: body.path });
  } catch (e) {
    return fail(e.message, 500);
  }
}
__name(handleDeletePost, "handleDeletePost");
async function handleGetAbout(env) {
  try {
    const c = await ghRead(env, env.BLOG_REPO, env.ABOUT_PATH);
    return ok({ path: env.ABOUT_PATH, sha: c.sha, content: c.content });
  } catch (e) {
    return fail(e.message, 404);
  }
}
__name(handleGetAbout, "handleGetAbout");
var FRIENDS_PATH = "data/friends.json";
async function handleGetFriends(env) {
  try {
    const c = await ghRead(env, env.BLOG_REPO, FRIENDS_PATH);
    const list = JSON.parse(c.content);
    return ok({ list: Array.isArray(list) ? list : [], sha: c.sha });
  } catch (e) {
    return ok({ list: [], sha: "" });
  }
}
__name(handleGetFriends, "handleGetFriends");
async function handleSaveFriends(env, body) {
  if (!Array.isArray(body.list)) return fail("list \u5FC5\u987B\u662F\u6570\u7EC4");
  const clean = body.list.map((f) => ({
    title: String(f.title || "").trim(),
    description: String(f.description || "").trim(),
    website: String(f.website || "").trim(),
    avatar: String(f.avatar || "").trim() || void 0,
    rss: String(f.rss || "").trim() || void 0
  }));
  try {
    let sha;
    try {
      const c = await ghRead(env, env.BLOG_REPO, FRIENDS_PATH);
      sha = c.sha;
    } catch {
    }
    const json2 = JSON.stringify(clean, null, 2) + "\n";
    const r = await ghWrite(env, env.BLOG_REPO, FRIENDS_PATH, json2, "blog-admin \u66F4\u65B0\u53CB\u94FE", sha);
    return ok({ count: clean.length, version: r && r.sha });
  } catch (e) {
    return fail(e.message, 500);
  }
}
__name(handleSaveFriends, "handleSaveFriends");
async function handleSaveAbout(env, body) {
  if (!body.content) return fail("\u5185\u5BB9\u4E3A\u7A7A");
  try {
    const c = await ghRead(env, env.BLOG_REPO, env.ABOUT_PATH);
    const r = await ghWrite(env, env.BLOG_REPO, env.ABOUT_PATH, body.content, "blog-admin \u66F4\u65B0\u5173\u4E8E\u9875", c.sha);
    return ok({ path: env.ABOUT_PATH, version: r && r.sha });
  } catch (e) {
    return fail(e.message, 500);
  }
}
__name(handleSaveAbout, "handleSaveAbout");
async function handlePublicFriends(env) {
  try {
    const c = await ghRead(env, env.BLOG_REPO, FRIENDS_PATH);
    const list = JSON.parse(c.content);
    return json({ ok: true, list: Array.isArray(list) ? list : [] });
  } catch (e) {
    return json({ ok: true, list: [] });
  }
}
__name(handlePublicFriends, "handlePublicFriends");
function stripCdata(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}
__name(stripCdata, "stripCdata");
function decodeEntities(s) {
  return String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}
__name(decodeEntities, "decodeEntities");
function parseRss(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/.test(xml);
  const re = isAtom ? /<entry[\s\S]*?<\/entry>/g : /<item[\s\S]*?<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];
    const get = /* @__PURE__ */ __name((tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return mm ? decodeEntities(stripCdata(mm[1])).trim() : "";
    }, "get");
    const getAttr = /* @__PURE__ */ __name((tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*href=["']([^"']+)["']`, "i"));
      return mm ? mm[1].trim() : "";
    }, "getAttr");
    let title = isAtom ? get("title") : get("title");
    let link = isAtom ? getAttr("link") : get("link");
    const pubDate = isAtom ? get("updated") : get("pubDate");
    const desc = isAtom ? get("summary") : get("description");
    if (!title && !link) continue;
    items.push({ title, link, date: pubDate || get("date"), description: stripHtml(desc).slice(0, 200) });
  }
  return items;
}
__name(parseRss, "parseRss");
function stripHtml(h) {
  return String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
__name(stripHtml, "stripHtml");
function parseDate(s) {
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}
__name(parseDate, "parseDate");
async function fetchFriendFeed(friend) {
  const rss = friend.rss;
  if (!rss) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8e3);
    const r = await fetch(rss, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FriendCircle/1.0)" }
    });
    clearTimeout(t);
    if (!r.ok) return [];
    const xml = await r.text();
    const items = parseRss(xml);
    return items.slice(0, 5).map((it) => ({
      ...it,
      site: friend.title,
      siteUrl: friend.website,
      avatar: friend.avatar || ""
    }));
  } catch {
    return [];
  }
}
__name(fetchFriendFeed, "fetchFriendFeed");
async function handlePublicFriendsFeed(env, url) {
  const forceRefresh = url && url.searchParams.get("refresh") === "1";
  if (!forceRefresh) {
    try {
      if (env.KV) {
        const cached = await env.KV.get("friends:feed");
        if (cached) return json(JSON.parse(cached));
      }
    } catch {
    }
  }
  let friends = [];
  try {
    const c = await ghRead(env, env.BLOG_REPO, FRIENDS_PATH);
    friends = JSON.parse(c.content) || [];
  } catch {
  }
  const tasks = friends.filter((f) => f.rss).map((f) => fetchFriendFeed(f));
  const results = await Promise.all(tasks);
  const now = Date.now();
  // 过滤未来时间的文章（对方站点提前排期，未实际发布）
  const flat = results.flat().filter((a) => !(parseDate(a.date) > now)).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  if (env.KV) {
    try {
      await env.KV.put("friends:feed", JSON.stringify({ ok: true, list: flat }), { expirationTtl: 1800 });
    } catch {
    }
  }
  return json({ ok: true, list: flat });
}
__name(handlePublicFriendsFeed, "handlePublicFriendsFeed");
var IMG_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "ico"];
var MAX_UPLOAD = 80 * 1024 * 1024;
async function allocateSeq(env, dir) {
  const now = /* @__PURE__ */ new Date();
  const pad = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "pad");
  const yyyy = now.getFullYear();
  const mmdd = pad(now.getMonth() + 1) + pad(now.getDate());
  const key = `${dir === "twikoo" ? "seqe" : "seq"}:${yyyy}${mmdd}`;
  const prev = parseInt(await env.KV.get(key) || "0", 10);
  const next = prev + 1;
  await env.KV.put(key, String(next));
  const seq = String(next).padStart(4, "0");
  return { base: `${mmdd}${seq}`, folder: dir === "twikoo" ? "twikoo" : `uploads/${yyyy}`, yyyy };
}
__name(allocateSeq, "allocateSeq");
async function storeWithWebp(env, bytes, ext, dir, reservedBase) {
  let base, folder, yyyy;
  if (reservedBase) {
    base = reservedBase.base;
    folder = reservedBase.folder;
    yyyy = reservedBase.yyyy;
  } else {
    const alloc = await allocateSeq(env, dir);
    base = alloc.base;
    folder = alloc.folder;
    yyyy = alloc.yyyy;
  }
  const origName = `${base}.${ext}`;
  const origPath = `${folder}/${origName}`;
  await ghPutBase64(env, env.IMG_REPO, origPath, bytesToBase64(bytes), `blog-admin upload ${origName}`);
  return { url: `${env.IMG_PREFIX}/${origPath}`, fileName: origName, webp: false };
}
__name(storeWithWebp, "storeWithWebp");
async function handleReserveUpload(env, url) {
  const ext = (url.searchParams.get("ext") || "png").toLowerCase();
  if (!IMG_EXTS.includes(ext)) return fail("\u4EC5\u652F\u6301\u5E38\u89C1\u56FE\u7247\u683C\u5F0F");
  try {
    const alloc = await allocateSeq(env, "uploads");
    const folder = alloc.folder;
    const safeExt = ext === "gif" ? "gif" : (ext === "svg" ? "svg" : "webp");
    const url2 = `${env.IMG_PREFIX}/${folder}/${alloc.base}.${safeExt}`;
    return ok({ url: url2, path: url2.replace(`${env.IMG_PREFIX}/`, ""), base: alloc.base, yyyy: alloc.yyyy, folder, ext: safeExt });
  } catch (e) {
    return fail(`\u9884\u5206\u914D\u5931\u8D25: ${e.message}`, 500);
  }
}
__name(handleReserveUpload, "handleReserveUpload");
async function handleUploadUrl(env, request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("\u8BF7\u4F7F\u7528 multipart/form-data \u4E0A\u4F20");
  }
  const url = (form.get("url") || "").trim();
  if (!url) return fail("\u7F3A\u5C11 url");
  // 检查 URL 合法性
  try { new URL(url); } catch { return fail("\u65E0\u6548\u7684 URL"); }
  const path = url.split("?")[0];
  const name = path.split("/").pop() || "image";
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (!IMG_EXTS.includes(ext)) return fail("\u4EC5\u652F\u6301\u5E38\u89C1\u56FE\u7247\u683C\u5F0F");
  // 支持前端预分配
  let reservedBase;
  const rb = form.get("reservedBase");
  const rf = form.get("reservedFolder");
  const ry = form.get("reservedYyyy");
  if (rb && rf && ry) {
    reservedBase = { base: rb, folder: rf, yyyy: parseInt(ry, 10) };
  }
  try {
    const imgRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BlogUpload/1.0)" } });
    if (!imgRes.ok) return fail("\u4E0B\u8F7D\u5931\u8D25: HTTP " + imgRes.status);
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    const MAX = 80 * 1024 * 1024;
    if (buf.byteLength > MAX) return fail("\u56FE\u7247\u8FC7\u5927\uFF0C\u8BF7\u63A7\u5236\u5728 80MB \u4EE5\u5185");
    const { url: resultUrl, fileName } = await storeWithWebp(env, buf, ext, "uploads", reservedBase);
    return ok({ url: resultUrl, path: resultUrl.replace(env.IMG_PREFIX + "/", ""), name, fileName });
  } catch (e) {
    return fail("\u4E0A\u4F20\u5931\u8D25: " + e.message, 500);
  }
}
__name(handleUploadUrl, "handleUploadUrl");
async function handleUpload(env, request, ctx) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("\u8BF7\u4F7F\u7528 multipart/form-data \u4E0A\u4F20");
  }
  const file = form.get("file");
  if (!file || !file.arrayBuffer) return fail("\u672A\u627E\u5230\u6587\u4EF6");
  const name = file.name || "file";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!IMG_EXTS.includes(ext)) return fail("\u4EC5\u652F\u6301\u5E38\u89C1\u56FE\u7247\u683C\u5F0F\uFF1Apng / jpg / gif / webp / svg \u7B49");
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > MAX_UPLOAD) return fail("\u6587\u4EF6\u8FC7\u5927\uFF0C\u8BF7\u63A7\u5236\u5728 80MB \u4EE5\u5185\uFF08\u53D7 Cloudflare \u9650\u5236\uFF09");
  let reservedBase;
  const rb = form.get("reservedBase");
  const rf = form.get("reservedFolder");
  const ry = form.get("reservedYyyy");
  if (rb && rf && ry) {
    reservedBase = { base: rb, folder: rf, yyyy: parseInt(ry, 10) };
  }
  try {
    let alloc;
    if (reservedBase) {
      alloc = reservedBase;
    } else {
      alloc = await allocateSeq(env, "uploads");
    }
    const { base, folder } = alloc;
    // 尝试转换 WebP（仅对 png/jpg 有效）
    let webpBuf = null;
    let webpError = '';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      try {
        webpBuf = await encodeToWebp(buf.buffer, ext, 80);
      } catch (e) {
        webpError = e.message;
      }
    }
    const isWebp = webpBuf && webpBuf.length > 0;
    const finalExt = isWebp ? 'webp' : ext;
    const fileName = `${base}.${finalExt}`;
    const filePath = `${folder}/${fileName}`;
    const url = `${env.IMG_PREFIX}/${filePath}`;
    const uploadBuf = isWebp ? webpBuf : buf;
    // 异步上传到 GitHub，立即返回 URL
    ctx.waitUntil(ghPutBase64(env, env.IMG_REPO, filePath, bytesToBase64(uploadBuf), `blog-admin upload ${fileName}`).catch(() => {}));
    return ok({ url, path: filePath, name, fileName });
  } catch (e) {
    return fail(`\u4E0A\u4F20\u5931\u8D25: ${e.message}`, 500);
  }
}
__name(handleUpload, "handleUpload");
async function handleEasyImageUpload(env, request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ result: "failed", code: 204, message: "\u6CA1\u6709\u9009\u62E9\u4E0A\u4F20\u7684\u6587\u4EF6" });
  }
  const formToken = (form.get("token") || "").trim();
  const headerToken = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const token = formToken || headerToken;
  if (!token || token !== env.EASY_TOKEN) {
    return json({ result: "failed", code: 401, message: "token \u65E0\u6548" });
  }
  const file = form.get("image");
  if (!file || !file.arrayBuffer) {
    return json({ result: "failed", code: 204, message: "\u6CA1\u6709\u9009\u62E9\u4E0A\u4F20\u7684\u6587\u4EF6" });
  }
  const name = file.name || "image";
  const srcName = name.split(".").slice(0, -1).join(".") || name || "image";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!IMG_EXTS.includes(ext)) {
    return json({ result: "failed", code: 400, message: "\u4EC5\u652F\u6301\u5E38\u89C1\u56FE\u7247\u683C\u5F0F" });
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > MAX_UPLOAD) {
    return json({ result: "failed", code: 400, message: "\u6587\u4EF6\u8FC7\u5927" });
  }
  try {
    const { url } = await storeWithWebp(env, buf, ext, "twikoo");
    return json({
      result: "success",
      code: 200,
      url,
      srcName,
      thumb: "",
      del: "",
      id: token,
      message: "success"
    });
  } catch (e) {
    return json({ result: "failed", code: 400, message: `\u4E0A\u4F20\u5931\u8D25: ${e.message}` });
  }
}
__name(handleEasyImageUpload, "handleEasyImageUpload");
async function handleEasyUploadV2(env, request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, result: [], error: "\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF" });
  }
  let file = null;
  for (const value of form.values()) {
    if (typeof value !== "string" && value && value.arrayBuffer) {
      file = value;
      break;
    }
  }
  if (!file) {
    return json({ success: false, result: [], error: "\u6CA1\u6709\u9009\u62E9\u4E0A\u4F20\u7684\u6587\u4EF6" });
  }
  const name = file.name || "image";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!IMG_EXTS.includes(ext)) {
    return json({ success: false, result: [], error: "\u4EC5\u652F\u6301\u5E38\u89C1\u56FE\u7247\u683C\u5F0F" });
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > MAX_UPLOAD) {
    return json({ success: false, result: [], error: "\u6587\u4EF6\u8FC7\u5927" });
  }
  try {
    const { url } = await storeWithWebp(env, buf, ext, "twikoo");
    return json({ success: true, result: [url] });
  } catch (e) {
    return json({ success: false, result: [], error: `\u4E0A\u4F20\u5931\u8D25: ${e.message}` });
  }
}
__name(handleEasyUploadV2, "handleEasyUploadV2");
async function handleSaveDraft(env, body) {
  if (!body.content && !body.title) return fail("\u8349\u7A3F\u5185\u5BB9\u4E3A\u7A7A");
  const id = body.id || crypto.randomUUID();
  const draft = {
    id,
    type: body.type === "docs" ? "docs" : "blog",
    title: (body.title || "").trim(),
    content: body.content || "",
    path: body.path || "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.KV.put(`draft:${id}`, JSON.stringify(draft));
  return ok({ id });
}
__name(handleSaveDraft, "handleSaveDraft");
async function handleListDrafts(env) {
  const list = await env.KV.list({ prefix: "draft:" });
  const drafts = [];
  for (const key of list.keys) {
    const raw = await env.KV.get(key.name);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        d.key = key.name;
        drafts.push(d);
      } catch {
      }
    }
  }
  drafts.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
  return ok({ drafts });
}
__name(handleListDrafts, "handleListDrafts");
async function handleDeleteDraft(env, url) {
  const id = url.searchParams.get("id");
  if (!id) return fail("\u7F3A\u5C11 id");
  await env.KV.delete(`draft:${id}`);
  return ok({ id });
}
__name(handleDeleteDraft, "handleDeleteDraft");
async function handleAiParseFriends(env, body) {
  if (!body || !body.text || !body.text.trim()) return fail("\u8BF7\u8F93\u5165\u53CB\u94FE\u4FE1\u606F");
  if (!env.AI_API_KEY) return fail("\u672A\u914D\u7F6E AI \u63A5\u53E3\u5BC6\u94A5\uFF08AI_API_KEY\uFF09", 500);
  const apiUrl = env.AI_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
  const model = env.AI_MODEL || "Qwen/Qwen3.5-27B";
  const prompt = `\u4F60\u662F\u4E00\u4E2A\u53CB\u94FE\u4FE1\u606F\u63D0\u53D6\u5668\u3002\u4ECE\u7528\u6237\u8F93\u5165\u7684\u6587\u672C\u4E2D\u63D0\u53D6\u53CB\u94FE\u4FE1\u606F\uFF0C\u8FD4\u56DE JSON \u6570\u7EC4\u3002

\u6BCF\u4E2A\u53CB\u94FE\u5BF9\u8C61\u5B57\u6BB5\uFF1A
- title: \u7F51\u7AD9\u6807\u9898/\u540D\u79F0 (string)
- website: \u7F51\u7AD9\u94FE\u63A5 (string)
- avatar: \u7F51\u7AD9\u56FE\u6807\u94FE\u63A5 (string, \u65E0\u5219\u7A7A\u5B57\u7B26\u4E32)
- description: \u7F51\u7AD9\u7B80\u4ECB (string, \u65E0\u5219\u7A7A\u5B57\u7B26\u4E32)
- rss: RSS \u8BA2\u9605\u5730\u5740 (string, \u65E0\u5219\u7A7A\u5B57\u7B26\u4E32)

\u89C4\u5219\uFF1A
1. \u53EA\u8FD4\u56DE JSON \u6570\u7EC4\uFF0C\u4E0D\u8981 markdown \u4EE3\u7801\u5757\uFF0C\u4E0D\u8981\u4EFB\u4F55\u989D\u5916\u6587\u5B57
2. \u5982\u679C\u627E\u4E0D\u5230\u67D0\u4E2A\u5B57\u6BB5\uFF0C\u8BBE\u4E3A\u7A7A\u5B57\u7B26\u4E32
3. \u5141\u8BB8\u591A\u4E2A\u53CB\u94FE\uFF0C\u6BCF\u4E2A\u53CB\u94FE\u4E00\u884C\u6216\u4E00\u6BB5\u6587\u5B57
4. \u5B57\u6BB5\u540D(key)\u51FA\u73B0\u7684\u4F4D\u7F6E\u4E0D\u5B9A\uFF0C\u8BF7\u667A\u80FD\u8BC6\u522B

\u7528\u6237\u8F93\u5165\uFF1A
${body.text}`;
  try {
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + env.AI_API_KEY
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E25\u683C\u8F93\u51FA JSON \u7684\u6570\u636E\u63D0\u53D6\u52A9\u624B\uFF0C\u53EA\u8F93\u51FA JSON \u6570\u7EC4\uFF0C\u4E0D\u5305\u542B markdown \u4EE3\u7801\u5757\u3001\u53CD\u5F15\u53F7\u6216\u4EFB\u4F55\u989D\u5916\u6587\u5B57\u3002" },
          { role: "user", content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.1
      })
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return fail(`AI \u63A5\u53E3\u8BF7\u6C42\u5931\u8D25: ${r.status} ${errText}`, 502);
    }
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content || "";
    if (!content) return fail("AI \u8FD4\u56DE\u7A7A\u7ED3\u679C", 502);
    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    const parsed = JSON.parse(jsonStr);
    const list = Array.isArray(parsed) ? parsed : parsed.friends || parsed.list || parsed.items || [parsed];
    return ok({ list });
  } catch (e) {
    return fail(`AI \u89E3\u6790\u5931\u8D25: ${e.message}`, 500);
  }
}
__name(handleAiParseFriends, "handleAiParseFriends");
async function handleFriendsRefresh(env) {
  if (!env.WORKFLOW_TOKEN) return fail("\u672A\u914D\u7F6E WORKFLOW_TOKEN", 500);
  try {
    const r = await fetch("https://api.github.com/repos/Brandon-LIs/newblog/actions/workflows/friend-feed.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: "token " + env.WORKFLOW_TOKEN,
        "Content-Type": "application/json",
        "User-Agent": "blog-admin-worker"
      },
      body: JSON.stringify({ ref: "main" })
    });
    if (!r.ok) return fail("\u89E6\u53D1 Action \u5931\u8D25: " + r.status, 502);
    return ok({ message: "\u5237\u65B0\u5DF2\u89E6\u53D1" });
  } catch (e) {
    return fail("\u89E6\u53D1 Action \u5931\u8D25: " + e.message, 500);
  }
}
__name(handleFriendsRefresh, "handleFriendsRefresh");
async function handleTwikooConfig(env) {
  return ok({
    envId: "https://co.oopss.top",
    passwordConfigured: Boolean(env.TWIKOO_PASSWORD)
  });
}
__name(handleTwikooConfig, "handleTwikooConfig");
async function handleTwikooLogin(env) {
  if (!env.TWIKOO_PASSWORD) return fail("\u672A\u914D\u7F6E\u8BC4\u8BBA\u7CFB\u7EDF\u5BC6\u7801", 500);
  return ok({ password: env.TWIKOO_PASSWORD });
}
__name(handleTwikooLogin, "handleTwikooLogin");
var UMAMI_URL = "https://umami.oopss.top";
var UMAMI_WEBSITE_ID = "1eb5f40d-b5f6-4dbc-8406-9135f77e1368";
async function handleStats(env) {
  try {
    if (env.KV) {
      const cached = await env.KV.get("stats:data");
      if (cached) return ok(JSON.parse(cached));
    }
  } catch {
  }
  try {
    const authRes = await fetch(UMAMI_URL + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://umami.oopss.top",
        "Referer": "https://umami.oopss.top/"
      },
      body: JSON.stringify({ username: "admin", password: "lbn201164" })
    });
    if (!authRes.ok) {
      const errText = await authRes.text().catch(() => "");
      return fail(`Umami \u8BA4\u8BC1\u5931\u8D25 (${authRes.status}): ${errText.slice(0, 100)}`, 502);
    }
    const { token } = await authRes.json();
    const now = Date.now();
    const thirty = now - 2592e6;
    const auth = { headers: { Authorization: "Bearer " + token } };
    const [stats, active, pageviews, browsers, referrers] = await Promise.all([
      fetch(UMAMI_URL + `/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${thirty}&endAt=${now}`, auth).then((r) => r.json()),
      fetch(UMAMI_URL + `/api/websites/${UMAMI_WEBSITE_ID}/active`, auth).then((r) => r.json()),
      fetch(UMAMI_URL + `/api/websites/${UMAMI_WEBSITE_ID}/pageviews?startAt=${thirty}&endAt=${now}&unit=day`, auth).then((r) => r.json()),
      fetch(UMAMI_URL + `/api/websites/${UMAMI_WEBSITE_ID}/metrics?type=browser&startAt=${thirty}&endAt=${now}&limit=5`, auth).then((r) => r.json()),
      fetch(UMAMI_URL + `/api/websites/${UMAMI_WEBSITE_ID}/metrics?type=referrer&startAt=${thirty}&endAt=${now}&limit=5`, auth).then((r) => r.json())
    ]);
    const data = { stats, active, pageviews, browsers, referrers };
    if (env.KV) {
      try {
        await env.KV.put("stats:data", JSON.stringify(data), { expirationTtl: 300 });
      } catch {
      }
    }
    return ok(data);
  } catch (e) {
    return fail("\u83B7\u53D6\u7EDF\u8BA1\u5931\u8D25: " + e.message, 500);
  }
}
__name(handleStats, "handleStats");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(UI, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
    if (pathname === "/upload" && request.method === "GET") {
      return new Response(UPLOAD, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (pathname === "/comments" && request.method === "GET") {
      return new Response(null, {
        status: 302,
        headers: { "Location": "https://twikoo.oopss.top/#account=admin&password=lbn201164" }
      });
    }
    if (pathname === "/upload/reserve" && request.method === "POST") {
      return handleReserveUpload(env, url);
    }
    if (pathname === "/upload" && request.method === "POST") {
      return handleEasyUploadV2(env, request);
    }
    if (!pathname.startsWith("/api/")) {
      return new Response(UI, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT,POST,GET,OPTIONS,DELETE",
          "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept",
          "Access-Control-Max-Age": "3600"
        }
      });
    }
    if (pathname === "/api/login" && request.method === "POST") {
      return handleLogin(env, request);
    }
    if (pathname === "/api/logout" && request.method === "POST") {
      return handleLogout(env, request);
    }
    if (pathname === "/api/upload/url" && request.method === "POST") {
      return handleUploadUrl(env, request);
    }
    if (pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(env, request, ctx);
    }
    if ((pathname === "/api/index.php" || pathname === "/api/easyimage" || pathname === "/api" || pathname === "/api/") && request.method === "POST") {
      return handleEasyImageUpload(env, request);
    }
    if (pathname === "/api/public/friends" && request.method === "GET") {
      return handlePublicFriends(env);
    }
    if (pathname === "/api/public/friends-feed" && request.method === "GET") {
      return handlePublicFriendsFeed(env, url);
    }
    if (pathname === "/api/friends-refresh" && request.method === "POST") {
      return handleFriendsRefresh(env);
    }
    const authed = await checkAuth(env, request);
    if (!authed) return fail("\u672A\u767B\u5F55\u6216\u4F1A\u8BDD\u5DF2\u8FC7\u671F", 401);
    try {
      switch (true) {
        case pathname === "/api/status":
          return ok({ authed: true, repo: env.BLOG_REPO });
        case (pathname === "/api/posts" && request.method === "GET"):
          return handleList(env, url);
        case (pathname === "/api/post" && request.method === "GET"):
          return handleGetPost(env, url);
        case (pathname === "/api/post" && request.method === "POST"): {
          const body = await readJsonBody(request);
          return handleSavePost(env, body);
        }
        case (pathname === "/api/post" && request.method === "DELETE"): {
          const body = await readJsonBody(request);
          return handleDeletePost(env, body);
        }
        case (pathname === "/api/about" && request.method === "GET"):
          return handleGetAbout(env);
        case (pathname === "/api/friends" && request.method === "GET"):
          return handleGetFriends(env);
        case (pathname === "/api/friends" && request.method === "POST"): {
          const body = await readJsonBody(request);
          return handleSaveFriends(env, body);
        }
        case (pathname === "/api/about" && request.method === "POST"): {
          const body = await readJsonBody(request);
          return handleSaveAbout(env, body);
        }
        case (pathname === "/api/drafts" && request.method === "GET"):
          return handleListDrafts(env);
        case (pathname === "/api/draft" && request.method === "POST"): {
          const body = await readJsonBody(request);
          return handleSaveDraft(env, body);
        }
        case (pathname === "/api/draft" && request.method === "DELETE"):
          return handleDeleteDraft(env, url);
        case (pathname === "/api/ai/parse-friends" && request.method === "POST"): {
          const body = await readJsonBody(request);
          return handleAiParseFriends(env, body);
        }
        case (pathname === "/api/stats" && request.method === "GET"):
          return handleStats(env);
        case (pathname === "/api/twikoo-config" && request.method === "GET"):
          return handleTwikooConfig(env);
        case (pathname === "/api/twikoo-login" && request.method === "GET"):
          return handleTwikooLogin(env);
        default:
          return fail("\u63A5\u53E3\u4E0D\u5B58\u5728", 404);
      }
    } catch (e) {
      return fail(e.message || "\u670D\u52A1\u5668\u9519\u8BEF", 500);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
