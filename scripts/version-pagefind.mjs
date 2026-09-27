#!/usr/bin/env node
/**
 * 把 Pagefind 产物复制到按构建版本号命名的子目录。
 *
 * 为什么需要：站点前面套了 CDN（SpeedOnlineCDN），它对 /pagefind/* 使用了
 * 很长的缓存 TTL。曾出现 CDN 持续供应 8 小时前的 pagefind-entry.json
 * （31 页的旧索引），而该旧构建又缺少 .pf_meta / index/*.pf_index，
 * 导致 loadMeta() 拿到 404 错误页 → init_pagefind 无指针 →
 * 报 "WASM Error (No pointer)"，搜索永久挂起。
 *
 * 对策：让 pagefind 的访问路径随每次构建变化（/pagefind/<buildId>/），
 * CDN 上不存在该新路径的缓存，只能回源，从而必然拿到与本次构建匹配、
 * 且已通过 verify-pagefind.mjs 校验的完整索引。
 *
 * 原始 /pagefind/ 目录一并保留，供 basePath 回退与排查使用。
 */
import {readFileSync, existsSync, cpSync, mkdirSync, rmSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PF = join(ROOT, 'build', 'pagefind');

// 版本号必须与页面里注入的 <meta name="pf-build"> 完全一致，
// 否则前端会去请求一个不存在的目录。这里直接从已构建的 HTML 读取，
// 从构造上保证两者一致（不重复实现 git/env 解析逻辑）。
function resolveBuildId() {
  if (process.env.PAGEFIND_BUILD_ID) return process.env.PAGEFIND_BUILD_ID.trim();
  const html = readFileSync(join(ROOT, 'build', 'index.html'), 'utf8');
  // 兼容压缩后无引号的属性：<meta name=pf-build content=450f6ac>
  const q = '["\']?';
  const re1 = new RegExp(`<meta\\s+name=${q}pf-build${q}\\s+content=${q}([^"'>\\s]+)${q}`, 'i');
  const re2 = new RegExp(`<meta\\s+content=${q}([^"'>\\s]+)${q}\\s+name=${q}pf-build${q}`, 'i');
  const m = html.match(re1) || html.match(re2);
  if (m && m[1]) return m[1].trim();
  console.error('✗ 未在 build/index.html 中找到 meta[name=pf-build]，无法确定版本目录');
  process.exit(1);
}

const buildId = resolveBuildId();

if (!/^[A-Za-z0-9._-]+$/.test(buildId)) {
  console.error(`✗ 非法的构建版本号: ${buildId}`);
  process.exit(1);
}

const dest = join(PF, buildId);
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

// 复制索引数据与运行时（排除版本化子目录自身，避免递归嵌套）
const items = ['index', 'fragment', 'pagefind-entry.json', 'pagefind.js', 'pagefind-worker.js',
  'pagefind-ui.js', 'pagefind-ui.css', 'pagefind-modular-ui.js', 'pagefind-modular-ui.css',
  'pagefind-component-ui.js', 'pagefind-component-ui.css', 'pagefind-highlight.js'];
for (const item of items) {
  const src = join(PF, item);
  if (!existsSync(src)) continue;
  cpSync(src, join(dest, item), { recursive: true });
}
// wasm 文件名带语言前缀，按实际存在的复制
for (const f of ['wasm.unknown.pagefind']) {
  const src = join(PF, f);
  if (existsSync(src)) cpSync(src, join(dest, f));
}
for (const f of readdirSync(PF)) {
  if (f.endsWith('.pf_meta')) cpSync(join(PF, f), join(dest, f));
}

console.log(`✓ Pagefind 产物已镜像到版本目录 /pagefind/${buildId}/`);
