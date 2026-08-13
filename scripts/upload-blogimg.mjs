// 将任意文件上传到 blogimg 图床仓库（GitHub Contents API），
// 之后即可通过 https://jsd.oopss.top/<路径> 访问（香港 jsDelivr 节点）。
//
// 用法：
//   IMG_TOKEN=<GitHub token（需 blogimg 仓库写入权限）> \
//   node scripts/upload-blogimg.mjs <本地文件> <仓库路径>
//   例：IMG_TOKEN=xxx node scripts/upload-blogimg.mjs static/js/view-image.min.js js/view-image.min.js
//
// 也可批量：node scripts/upload-blogimg.mjs --batch <json 文件>
//   json 形如：[{"local":"static/img/icon.jpg","remote":"img/icon.jpg"}, ...]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TOKEN = process.env.IMG_TOKEN
if (!TOKEN) {
  console.error('缺少环境变量 IMG_TOKEN（GitHub token，需 blogimg 仓库写入权限）')
  process.exit(1)
}

const REPO = 'Brandon-LIs/blogimg'
const H = {
  Authorization: 'token ' + TOKEN,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'blogimg-uploader',
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  return btoa(binary)
}

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}`, { headers: H })
  if (!r.ok) return null
  return r.json()
}

async function ghPut(path, buf, msg) {
  const existing = await ghGet(path)
  const body = { message: msg, content: bytesToBase64(buf) }
  if (existing?.sha) body.sha = existing.sha
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT', headers: H, body: JSON.stringify(body),
  })
  if (!r.ok) {
    const j = await r.json()
    console.error('上传失败', path, r.status, j.message)
    return false
  }
  console.log(`✅ https://jsd.oopss.top/${path}  (${buf.length} B)`)
  return true
}

async function main() {
  const args = process.argv.slice(2)
  let jobs = []
  if (args[0] === '--batch') {
    jobs = JSON.parse(readFileSync(args[1], 'utf8'))
  } else {
    const [local, remote] = args
    if (!local || !remote) {
      console.error('用法：upload-blogimg.mjs <本地文件> <仓库路径> 或 --batch <json>')
      process.exit(1)
    }
    jobs = [{ local, remote }]
  }
  let ok = 0
  for (const { local, remote } of jobs) {
    try {
      if (await ghPut(remote, readFileSync(local), 'upload via script')) ok++
    } catch (e) {
      console.error('失败', remote, e.message)
    }
  }
  console.log(`完成：${ok}/${jobs.length}`)
  if (ok !== jobs.length) process.exit(1)
}

main().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
