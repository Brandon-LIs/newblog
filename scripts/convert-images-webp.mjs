// 将博客文章中的非 webp 图片自动转成 webp：
// - 下载原图 → cwebp 转换 → 上传 webp 到 blogimg 图床 → 删除原图
// - 更新博客 markdown 里的图片 URL（jsd.oopss.top/xxx.png|jpg → .webp）
// 依赖：系统需安装 cwebp（workflow 里 apt-get install -y webp）
import { readdirSync, readFileSync, writeFileSync, execFileSync } from 'node:fs'
import { execFileSync as exec } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TOKEN = process.env.IMG_TOKEN
if (!TOKEN) { console.error('缺少 IMG_TOKEN'); process.exit(1) }

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogDir = join(root, 'blog')
const H = { Authorization: 'token ' + TOKEN, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'webp-action' }

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  return btoa(binary)
}
function utf8ToBase64(str) { return bytesToBase64(new TextEncoder().encode(str)) }

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/Brandon-LIs/blogimg/contents/${encodeURI(path)}`, { headers: H })
  if (!r.ok) return null
  return r.json()
}
async function ghPut(path, buf, msg, sha) {
  const body = { message: msg, content: bytesToBase64(buf) }
  if (sha) body.sha = sha
  const r = await fetch(`https://api.github.com/repos/Brandon-LIs/blogimg/contents/${encodeURI(path)}`, { method: 'PUT', headers: H, body: JSON.stringify(body) })
  if (!r.ok) { const j = await r.json(); console.error('上传失败', path, r.status, j.message); return false }
  return true
}
async function ghDelete(path, sha, msg) {
  const r = await fetch(`https://api.github.com/repos/Brandon-LIs/blogimg/contents/${encodeURI(path)}`, { method: 'DELETE', headers: H, body: JSON.stringify({ message: msg, sha }) })
  return r.ok
}

async function convertImage(url, path) {
  // 下载原图
  const imgRes = await fetch(url)
  if (!imgRes.ok) { console.warn('下载失败', url); return false }
  const buf = Buffer.from(await imgRes.arrayBuffer())
  // cwebp 转换
  const tmpIn = '/tmp/img_src', tmpOut = '/tmp/img_out.webp'
  writeFileSync(tmpIn, buf)
  try {
    exec('cwebp', ['-quiet', '-q', '85', tmpIn, '-o', tmpOut])
  } catch (e) { console.warn('cwebp 失败', path); return false }
  const webpBuf = readFileSync(tmpOut)
  // 上传 webp
  const webpPath = path.replace(/\.(png|jpe?g|gif|bmp|tiff?)$/i, '.webp')
  const ok = await ghPut(webpPath, webpBuf, `webp-action: convert ${path}`)
  if (!ok) return false
  // 删除原图
  const orig = await ghGet(path)
  if (orig && orig.sha) await ghDelete(path, orig.sha, `webp-action: remove ${path}`)
  return true
}

const files = readdirSync(blogDir).filter((f) => /\.(md|mdx)$/.test(f))
let converted = 0
let updatedFiles = []

for (const file of files) {
  const fp = join(blogDir, file)
  let md = readFileSync(fp, 'utf8')
  let changed = false

  // 找出所有 jsd.oopss.top 图片 URL（markdown 正文 + front matter image）
  const urls = [...new Set(md.match(/https:\/\/jsd\.oopss\.top\/[^\s)\]\">]+/g) || [])]
    .filter((u) => /\.(png|jpe?g|gif|bmp)$/i.test(u))

  for (const url of urls) {
    // 解析图床路径：jsd.oopss.top/<path>
    const path = url.replace('https://jsd.oopss.top/', '')
    const newUrl = url.replace(/\.(png|jpe?g|gif|bmp)$/i, '.webp')
    if (newUrl === url) continue
    console.log(`→ ${path}`)
    const done = await convertImage(url, path)
    if (done) {
      md = md.split(url).join(newUrl)
      changed = true
      converted++
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  if (changed) {
    writeFileSync(fp, md)
    updatedFiles.push(file)
  }
}

console.log(`\n转换 ${converted} 张图片，更新文件: ${updatedFiles.join(', ') || '无'}`)
