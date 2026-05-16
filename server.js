const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

// ★ 启动前自动构建，确保本地预览的数据是最新的
console.log('🔨 正在构建...');
try {
  require('./build.js');
} catch (e) {
  // build.js 会自己打印输出，这里忽略重复日志
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  let urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  urlPath = urlPath.replace(/\.\./g, ''); // 防止目录穿越

  // 优先从 docs/ 读取（构建后的产物）
  const docsPath = path.join(ROOT, 'docs', urlPath);
  if (fs.existsSync(docsPath) && fs.statSync(docsPath).isFile()) {
    const ext = path.extname(docsPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(docsPath));
    return;
  }

  // 回退到项目根目录（index.html 模板等）
  const rootPath = path.join(ROOT, urlPath);
  if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
    const ext = path.extname(rootPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(rootPath));
    return;
  }

  // 回退到 images/ 目录（兼容旧写法 /images/xxx.jpg）
  if (urlPath.startsWith('/images/')) {
    const imgPath = path.join(ROOT, urlPath.replace(/^\//, ''));
    if (fs.existsSync(imgPath) && fs.statSync(imgPath).isFile()) {
      const ext = path.extname(imgPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(imgPath));
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  const docsDir = path.join(ROOT, 'docs');
  const htmlExists = fs.existsSync(path.join(docsDir, 'index.html'));
  const imgDir = path.join(docsDir, 'images');
  const imgCount = fs.existsSync(imgDir) ? countFiles(imgDir) : 0;

  console.log('');
  console.log('  ┌──────────────────────────────────────┐');
  console.log('  │                                      │');
  console.log('  │   🖊️  墨迹博客已启动                    │');
  console.log(`  │   📦 已构建: ${htmlExists ? '是' : '否'}                       │`);
  console.log(`  │   🖼️  图片: ${imgCount} 张                          │`);
  console.log(`  │   🌐 http://localhost:${PORT}              │`);
  console.log('  │                                      │');
  console.log('  │   编辑 posts/*.md 后重启即可预览       │');
  console.log('  └──────────────────────────────────────┘');
  console.log('');
});

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) count++;
    else if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
  }
  return count;
}
