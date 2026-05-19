const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const IMAGES_DIR = path.join(ROOT, 'images');
const DOCS_DIR = path.join(ROOT, 'docs');

// ── 1. 准备输出目录 ──────────────────────────────
if (fs.existsSync(DOCS_DIR)) {
  fs.rmSync(DOCS_DIR, { recursive: true });
}
fs.mkdirSync(DOCS_DIR, { recursive: true });

// ── 2. 读取所有 Markdown ──────────────────────────
if (!fs.existsSync(POSTS_DIR)) {
  console.log('⚠️  posts/ 目录不存在，请先创建');
  process.exit(1);
}

const mdFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
if (mdFiles.length === 0) {
  console.log('⚠️  posts/ 目录下没有 .md 文件');
  process.exit(1);
}

// ── 3. 解析每篇文章 ──────────────────────────────
const posts = [];
for (const file of mdFiles) {
  const slug = file.replace('.md', '');
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');

  const meta = { title: '', tag: '', date: '', readTime: 5, author: '', image: '' };
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        meta[k] = v;
      }
    });
  }

  meta.readTime = parseInt(meta.readTime) || 5;
  let body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
  const excerpt = body.replace(/[#*`>\-\[\]|]/g, '').trim().substring(0, 130);

  // ★ 关键修复：把正文中的 /images/ 绝对路径转为 ./images/ 相对路径
  // 这样双击打开 file:// 协议也能正确加载图片
  body = body.replace(/(]\()(\/images\/)/g, '$1./images/');
  body = body.replace(/(src=["'])(\/images\/)/g, '$1./images/');

  // ★ 封面图也转为相对路径
  let image = meta.image || '';
  if (image.startsWith('/images/')) {
    image = './images/' + image.slice('/images/'.length);
  }

  posts.push({
    slug,
    title: meta.title || slug,
    tag: meta.tag || '未分类',
    date: meta.date || '',
    readTime: meta.readTime,
    author: meta.author || '',
    image,
    excerpt,
    rawBody: body,
  });
}

// 按日期排序（新 → 旧）
posts.sort((a, b) => b.date.localeCompare(a.date));

// ── 4. 生成 index.html（嵌入文章数据）──────────────
const indexPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const jsonStr = JSON.stringify(posts)
  .replace(/</g, '\\u003c')
  .replace(/-->/g, '--\\u003e');

html = html.replace(
  /<script id="blog-data" type="application\/json">[\s\S]*?<\/script>/,
  `<script id="blog-data" type="application/json">${jsonStr}<\/script>`
);

// ★ HTML 中固定的图片引用也转为相对路径
html = html.replace(/(src=["'])\/images\//g, '$1./images/');

fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), html);

// ── 5. 复制图片目录 ──────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

let imgCount = 0;
if (fs.existsSync(IMAGES_DIR)) {
  copyDir(IMAGES_DIR, path.join(DOCS_DIR, 'images'));
  imgCount = countFiles(path.join(DOCS_DIR, 'images'));
}

// ── 6. 复制 CNAME ────────────────────────────────
const cnamePath = path.join(ROOT, 'CNAME');
if (fs.existsSync(cnamePath)) {
  fs.copyFileSync(cnamePath, path.join(DOCS_DIR, 'CNAME'));
}

// ── 完成 ─────────────────────────────────────────
console.log('');
console.log('  ┌──────────────────────────────────────┐');
console.log('  │                                      │');
console.log('  │   ✅ 构建完成！                         │');
console.log(`  │   📝 ${posts.length} 篇文章已嵌入                    │`);
console.log(`  │   🖼️  ${imgCount} 张图片已复制                    │`);
console.log('  │                                      │');
console.log('  │   输出目录: docs/                     │');
console.log('  │                                      │');
console.log('  │   双击 docs/index.html 即可预览,,       │');
console.log('  │   或运行 node server.js              │');
console.log('  └──────────────────────────────────────┘');
console.log('');

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) count++;
    else if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
  }
  return count;
}
