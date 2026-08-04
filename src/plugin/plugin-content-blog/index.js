const blogPluginExports = require('@docusaurus/plugin-content-blog')
const { default: blogPlugin } = blogPluginExports

// 从 markdown 正文中提取第一张图片
function extractFirstImage(markdown) {
  if (!markdown) return undefined
  const md = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (md) return md[1].trim()
  const html = markdown.match(/<img[^>]*src=["']([^"']+)["']/i)
  return html ? html[1] : undefined
}

async function blogPluginEnhanced(context, options) {
  const blogPluginInstance = await blogPlugin(context, options)

  return {
    ...blogPluginInstance,
    async contentLoaded({ content, allContent, actions }) {
      // Sort blog with sticky
      content.blogPosts.sort(
        (a, b) =>
          (b.metadata.frontMatter.sticky || 0) - (a.metadata.frontMatter.sticky || 0),
      )

      // 封面映射：每篇文章的封面 = 手动 image 或正文第一张图（无图则无封面）
      const covers = {}
      for (const post of content.blogPosts) {
        const explicit = post.metadata.frontMatter.image
        covers[post.metadata.permalink] =
          explicit || extractFirstImage(post.content) || undefined
      }

      // Create default plugin pages
      await blogPluginInstance.contentLoaded({ content, allContent, actions })

      // Create your additional pages
      const { blogTags } = content
      const { setGlobalData } = actions

      setGlobalData({
        posts: content.blogPosts.slice(0, 10), // Only store 10 posts
        postNum: content.blogPosts.length,
        tagNum: Object.keys(blogTags).length,
        covers,
      })
    },
  }
}

module.exports = Object.assign({}, blogPluginExports, {
  default: blogPluginEnhanced,
})