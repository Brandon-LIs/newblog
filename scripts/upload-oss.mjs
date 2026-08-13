// 将站点静态资源（图片/SVG/JS 等）同步到阿里云 OSS，可选地让 CDN 域名（如 cdn.oopss.top）加速分发。
// 中国大陆访问自建 OSS + CDN 通常比海外 CDN 更稳更快。
//
// 用法：
//   OSS_REGION=oss-cn-hangzhou \
//   OSS_BUCKET=your-bucket \
//   OSS_ACCESS_KEY_ID=LTAI... \
//   OSS_ACCESS_KEY_SECRET=... \
//   [OSS_PREFIX=blog] \
//   node scripts/upload-oss.mjs            # 真实上传
//   node scripts/upload-oss.mjs --dry-run  # 只打印将上传的文件
//
// 前置准备（控制台操作，一次即可）：
//   1. 创建 Bucket（公共读），绑定自定义域名（如 cdn.oopss.top）并配置 CDN 加速
//   2. Bucket 跨域设置（CORS）：来源 *，允许 GET，避免字体跨域被拦截
//   3. 内容类型：woff2 -> font/woff2、woff -> font/woff、svg -> image/svg+xml
//      （本脚本会自动带上正确的 Content-Type，若源文件扩展名不识别会回退 application/octet-stream）
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRY_RUN = process.argv.includes('--dry-run')

const region = process.env.OSS_REGION
const bucket = process.env.OSS_BUCKET
const accessKeyId = process.env.OSS_ACCESS_KEY_ID
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
const prefix = (process.env.OSS_PREFIX || 'blog').replace(/^\/+|\/+$/g, '')

if (!DRY_RUN && (!region || !bucket || !accessKeyId || !accessKeySecret)) {
  console.error(
    '缺少环境变量：OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET（--dry-run 模式不需要密钥）',
  )
  process.exit(1)
}

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

function walk(dir, base = dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      out.push(...walk(p, base))
    } else {
      out.push(relative(base, p))
    }
  }
  return out
}

// 需要同步的目录（相对项目根）
const SOURCE_DIRS = ['static/img', 'static/svg', 'static/js']

async function main() {
  let client
  if (!DRY_RUN) {
    const OSS = (await import('ali-oss')).default
    client = new OSS({
      region,
      bucket,
      accessKeyId,
      accessKeySecret,
      // 若已绑定自定义域名，可开启（需自行处理 CDN 缓存刷新）：
      // endpoint: `https://${process.env.OSS_CDN_DOMAIN || ''}`,
    })
  }

  let total = 0
  for (const dir of SOURCE_DIRS) {
    const abs = join(root, dir)
    if (!existsSync(abs)) continue
    const files = walk(abs)
    for (const file of files) {
      const localPath = join(abs, file)
      const objectKey = `${prefix}/${dir}/${file}`
      const contentType = CONTENT_TYPES[extname(file).toLowerCase()] || 'application/octet-stream'
      if (DRY_RUN) {
        console.log(`[dry-run] PUT ${objectKey}  (${statSync(localPath).size} B, ${contentType})`)
      } else {
        await client.put(objectKey, readFileSync(localPath), {
          headers: { 'Content-Type': contentType },
          mime: contentType,
        })
        console.log(`[uploaded] ${objectKey}`)
      }
      total++
    }
  }
  console.log(DRY_RUN ? `\n${total} 个文件将被上传` : `\n完成：${total} 个文件已上传到 oss://${bucket}/${prefix}/`)
}

main().catch((e) => {
  console.error('FATAL', e.message)
  process.exit(1)
})
