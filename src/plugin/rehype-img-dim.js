// rehype 插件：为 markdown 图片注入 width/height，让浏览器在图片加载前
// 按比例预留空间，避免布局抖动（CLS）。
const { imageSize } = require('image-size')
const { visit } = require('unist-util-visit')

// 下载图片并读取尺寸（超时 + 失败返回 null）
async function fetchImageSize(url, timeoutMs = 10000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const dim = imageSize(buf)
    return dim && dim.width && dim.height ? dim : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

module.exports = function rehypeImgDim() {
  return async (tree) => {
    const nodes = []
    visit(tree, 'element', (node) => {
      if (
        node.tagName === 'img' &&
        node.properties &&
        node.properties.src &&
        !node.properties.width &&
        !node.properties.height
      ) {
        nodes.push(node)
      }
    })
    if (!nodes.length) return

    const urls = [...new Set(nodes.map((n) => n.properties.src))]
    const dims = {}
    await Promise.all(
      urls.map(async (url) => {
        if (!/^https?:\/\//i.test(url)) return // 只处理远程图片
        const dim = await fetchImageSize(url)
        if (dim) dims[url] = dim
      }),
    )

    for (const node of nodes) {
      const d = dims[node.properties.src]
      if (d) {
        node.properties.width = d.width
        node.properties.height = d.height
      }
      // 图片懒加载 + 异步解码
      node.properties.loading = 'lazy'
      node.properties.decoding = 'async'
    }
  }
}
