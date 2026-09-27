#!/usr/bin/env node
/**
 * 构建后校验：确认 Pagefind 搜索索引完整可用。
 *
 * 背景：线上曾出现 /pagefind/pagefind-entry.json 存在、但其指向的
 * .pf_meta 与 index/*.pf_index 全部 404 的情况。Pagefind 运行时
 * loadMeta() 拿到 404 错误页 → init_pagefind 得不到指针 →
 * 搜索报 "WASM Error (No pointer)" 并永久挂起（弹窗能开、搜不出结果）。
 *
 * 原因：部署环节未执行完整的 `docusaurus build && pagefind --site build`，
 * 或索引文件未随产物上传。此脚本让问题在构建阶段就暴露，而不是等用户搜索失败。
 */
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const SITE = 'build';
const PF = join(SITE, 'pagefind');
const errors = [];

const entryPath = join(PF, 'pagefind-entry.json');
if (!existsSync(entryPath)) {
  console.error('✗ 缺少 build/pagefind/pagefind-entry.json');
  console.error('  pagefind 步骤可能未执行，请确认构建命令为 `docusaurus build && pagefind --site build`');
  process.exit(1);
}

let entry;
try {
  entry = JSON.parse(readFileSync(entryPath, 'utf8'));
} catch (e) {
  console.error('✗ pagefind-entry.json 解析失败:', e.message);
  process.exit(1);
}

const languages = Object.entries(entry.languages || {});
if (languages.length === 0) {
  console.error('✗ pagefind-entry.json 中没有任何语言索引');
  process.exit(1);
}

for (const [lang, info] of languages) {
  // 1) meta 文件必须存在（运行时按 hash 精确请求）
  const meta = join(PF, `pagefind.${info.hash}.pf_meta`);
  if (!existsSync(meta)) {
    errors.push(`语言 ${lang}: 缺少 pagefind.${info.hash}.pf_meta`);
  }

  // 2) index 分片必须存在
  const indexDir = join(PF, 'index');
  if (!existsSync(indexDir)) {
    errors.push(`语言 ${lang}: 缺少 index/ 目录`);
  } else {
    const shards = readdirSync(indexDir).filter((f) => f.endsWith('.pf_index'));
    if (shards.length === 0) {
      errors.push(`语言 ${lang}: index/ 下没有任何 .pf_index 分片`);
    }
  }

  // 3) fragment 至少要有一个（搜索结果取正文摘要用）
  const fragDir = join(PF, 'fragment');
  if (!existsSync(fragDir) || readdirSync(fragDir).filter((f) => f.endsWith('.pf_fragment')).length === 0) {
    errors.push(`语言 ${lang}: 缺少 fragment/ 内容分片`);
  }
}

if (errors.length) {
  console.error('✗ Pagefind 索引不完整，搜索将不可用：');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const total = languages.reduce((n, [, i]) => n + (i.page_count || 0), 0);
console.log(`✓ Pagefind 索引校验通过：${languages.length} 种语言 / ${total} 个页面`);
for (const [lang, info] of languages) {
  console.log(`  - ${lang}: ${info.page_count} 页, hash=${info.hash}`);
}
