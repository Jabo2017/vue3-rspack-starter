#!/usr/bin/env node
/** 本地预览 dist/（等价于 npx serve，零依赖实现，避免多装一个包） */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 4173)
const prefix = process.env.PUBLIC_PATH || '/'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

if (!fs.existsSync(root)) {
  console.error('未找到 dist/，请先执行 npm run build')
  process.exit(1)
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (prefix !== '/' && urlPath.startsWith(prefix)) urlPath = urlPath.slice(prefix.length)
    let file = path.join(root, urlPath)
    if (!file.startsWith(root)) {
      res.writeHead(403).end('forbidden')
      return
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file)) file = path.join(root, 'index.html') // hash 路由兜底
    const ext = path.extname(file)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, () => {
    console.log(`preview: http://localhost:${port}${prefix === '/' ? '' : prefix}`)
  })
