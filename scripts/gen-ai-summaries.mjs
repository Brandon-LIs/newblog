// 为博客文章生成 AI 摘要，写入 static/ai-summaries.json
// 无第三方依赖（仅使用 Node 内置模块 + fetch）。
// 用法：AI_API_KEY=xxx node scripts/gen-ai-summaries.mjs
// 会跳过内容未变化的文章（通过内容哈希缓存），避免重复调用 API。
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const AI_API_KEY = process.env.AI_API_KEY
const GLM_API_KEY = process.env.GLM_API_KEY
const XUNFEI_API_KEY = process.env.XUNFEI_API_KEY || process.env.SPARK_API_KEY
const AI_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const AI_MODEL = 'Qwen/Qwen3.5-27B'
const GLM_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const XUNFEI_URL = 'https://spark-api-open.xf-yun.com/x2/chat/completions'
const MAX_CHARS = 10000

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogDir = join(root, 'blog')
const outFile = join(root, 'static', 'ai-summaries.json')

if (!AI_API_KEY && !GLM_API_KEY && !XUNFEI_API_KEY) {
  console.log('跳过：缺少 AI_API_KEY / GLM_API_KEY / XUNFEI_API_KEY')
  process.exit(0)
}

function hashContent(content) {
  return createHash('md5').update(content).digest('hex')
}

// 解析 front matter（正则，不依赖 js-yaml）：提取 title / slug / 正文
function parseFrontMatter(file) {
  const text = readFileSync(file, 'utf8')
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { title: '', slug: '', content: text }
  const get = (key) => {
    const kv = m[1].match(new RegExp('^' + key + ':.*?(?:$|\n)', 'm'))
    if (!kv) return ''
    // 兼容 YAML 引号与列表（只取首项）
    let v = kv[0].slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '')
    if (v.startsWith('[')) v = v.slice(1).split(',')[0].trim()
    return v
  }
  return { title: get('title'), slug: get('slug'), content: m[2] }
}

// 计算文章 permalink（与 Docusaurus 保持一致）
function computePermalink(fileName, slug) {
  if (slug) {
    return `/blog/${slug}`
  }
  const base = fileName.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  return `/blog/${base}`
}

function buildPrompt(title, content) {
  return (
    '你是博客文章摘要助手。请用简洁、通顺、自然的中文，用一段话（3~5 句）概括这篇文章的核心内容、要点与结论。\n' +
    '要求：不要使用列表或序号，写成连贯段落；直接输出摘要本身，不要任何前缀或解释。\n\n' +
    '文章标题：' + title + '\n\n文章内容：\n' + content.slice(0, MAX_CHARS)
  )
}

// 硅基流动 Qwen3.5-27B（优先）；失败返回 null
async function summarizeAI(title, content) {
  if (!AI_API_KEY) return null
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: buildPrompt(title, content) }],
        max_tokens: 1500,
        temperature: 0.6,
      }),
    })
    if (!res.ok) {
      console.warn(`  [AI] ${res.status}，尝试 GLM 回退`)
      return null
    }
    const data = await res.json()
    const c = data.choices?.[0]?.message?.content
    return c ? c.trim() : null
  } catch (e) {
    console.warn(`  [AI] ${e.message}，尝试 GLM 回退`)
    return null
  }
}

// 智谱 GLM-4.7-Flash；失败返回 null
async function summarizeGLM(title, content) {
  if (!GLM_API_KEY) return null
  try {
    const res = await fetch(GLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GLM_API_KEY}` },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: [{ role: 'user', content: buildPrompt(title, content) }],
        max_tokens: 1500,
        temperature: 0.6,
        thinking: { type: 'disabled' },
      }),
    })
    if (!res.ok) {
      console.warn(`  [GLM] ${res.status}，尝试讯飞回退`)
      return null
    }
    const data = await res.json()
    const c = data.choices?.[0]?.message?.content
    return c ? c.trim() : null
  } catch (e) {
    console.warn(`  [GLM] ${e.message}，尝试讯飞回退`)
    return null
  }
}

// 讯飞星火 X2（spark-x）；失败返回 null
async function summarizeXunfei(title, content) {
  if (!XUNFEI_API_KEY) return null
  try {
    const res = await fetch(XUNFEI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${XUNFEI_API_KEY}` },
      body: JSON.stringify({
        model: 'spark-x',
        messages: [{ role: 'user', content: buildPrompt(title, content) }],
        max_tokens: 2000,
        temperature: 0.6,
        stream: false,
        thinking: { type: 'disabled' },
      }),
    })
    if (!res.ok) {
      console.warn(`  [讯飞] ${res.status}`)
      return null
    }
    const data = await res.json()
    if (data.code !== 0) {
      console.warn(`  [讯飞] code=${data.code} ${data.message || ''}`)
      return null
    }
    const c = data.choices?.[0]?.message?.content
    return c ? c.trim() : null
  } catch (e) {
    console.warn(`  [讯飞] ${e.message}`)
    return null
  }
}

async function summarize(title, content) {
  const fromAi = await summarizeAI(title, content)
  if (fromAi) return fromAi
  const fromGlm = await summarizeGLM(title, content)
  if (fromGlm) return fromGlm
  const fromXunfei = await summarizeXunfei(title, content)
  if (fromXunfei) return fromXunfei
  throw new Error('AI、GLM 与讯飞均不可用')
}

async function main() {
  // 读取既有摘要 + 哈希缓存
  let existing = { summaries: {}, hashes: {} }
  if (existsSync(outFile)) {
    try {
      existing = JSON.parse(readFileSync(outFile, 'utf8'))
    } catch {}
  }
  const summaries = existing.summaries || {}
  const hashes = existing.hashes || {}

  const files = readdirSync(blogDir).filter((f) => /\.(md|mdx)$/.test(f))
  let ok = 0
  let fail = 0
  let changed = 0

  for (const file of files) {
    const { title, slug, content } = parseFrontMatter(join(blogDir, file))
    const permalink = computePermalink(file, slug)
    const h = hashContent(content)

    console.log(`→ ${permalink} (${title || file})`)

    // 内容未变且已有摘要 → 跳过
    if (hashes[permalink] === h && summaries[permalink]) {
      console.log('  未变化，跳过')
      continue
    }

    try {
      const s = await summarize(title || file, content)
      summaries[permalink] = s
      hashes[permalink] = h
      changed++
      ok++
      console.log(`  ✅ ${s.slice(0, 40)}...`)
    } catch (e) {
      fail++
      console.error(`  ❌ ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  // 移除已删除文章的摘要
  const validKeys = new Set(files.map((f) => computePermalink(f, parseFrontMatter(join(blogDir, f)).slug)))
  for (const k of Object.keys(summaries)) {
    if (!validKeys.has(k)) {
      delete summaries[k]
      delete hashes[k]
      changed++
    }
  }

  writeFileSync(outFile, JSON.stringify({ summaries, hashes }, null, 2) + '\n')
  console.log(`\n完成：${ok} 成功 / ${fail} 失败，变更 ${changed} 处 → ${outFile}`)
}

main().catch((e) => {
  console.error('FATAL', e.message)
  process.exit(1)
})
