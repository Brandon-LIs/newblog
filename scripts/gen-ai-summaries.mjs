// 为博客文章生成 AI 摘要，写入 static/ai-summaries.json
// 用法：node scripts/gen-ai-summaries.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const API_KEY = process.env.GLM_API_KEY
const MODEL = 'glm-4.7-flash'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MAX_CHARS = 10000

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogDir = join(root, 'blog')
const outFile = join(root, 'static', 'ai-summaries.json')

if (!API_KEY) {
  console.error('缺少环境变量 GLM_API_KEY')
  process.exit(1)
}

// 解析 front matter
function parseFrontMatter(file) {
  const text = readFileSync(file, 'utf8')
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, content: text }
  let data = {}
  try {
    data = yaml.load(m[1]) || {}
  } catch {
    data = {}
  }
  return { data, content: m[2] }
}

// 计算文章 permalink（与 Docusaurus 保持一致）
function computePermalink(fileName, frontMatter) {
  if (frontMatter.slug != null) {
    return `/blog/${String(frontMatter.slug)}`
  }
  const base = fileName.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  return `/blog/${base}`
}

async function summarize(title, content) {
  const text = `你是博客文章摘要助手。请用简洁、通顺、自然的中文，用一段话（3~5 句）概括这篇文章的核心内容、要点与结论。
要求：不要使用列表或序号，写成连贯段落；直接输出摘要本身，不要任何前缀或解释。

文章标题：${title}

文章内容：
${content.slice(0, MAX_CHARS)}`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: text }],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`GLM ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const content_ = data.choices?.[0]?.message?.content
  if (!content_) throw new Error('GLM 返回为空')
  return content_.trim()
}

async function main() {
  const files = readdirSync(blogDir).filter((f) => /\.(md|mdx)$/.test(f))
  const summaries = {}
  let ok = 0
  let fail = 0

  for (const file of files) {
    const { data, content } = parseFrontMatter(join(blogDir, file))
    const permalink = computePermalink(file, data)
    const title = data.title || file
    console.log(`→ ${permalink} (${title})`)
    try {
      const s = await summarize(title, content)
      summaries[permalink] = s
      ok++
      console.log(`  ✅ ${s.slice(0, 40)}...`)
    } catch (e) {
      fail++
      console.error(`  ❌ ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  writeFileSync(outFile, JSON.stringify({ summaries }, null, 2) + '\n')
  console.log(`\n完成：${ok} 成功 / ${fail} 失败 → ${outFile}`)
}

main().catch((e) => {
  console.error('FATAL', e.message)
  process.exit(1)
})
