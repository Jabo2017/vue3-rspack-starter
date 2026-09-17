#!/usr/bin/env node
/**
 * Vue2 迁移债务扫描 CLI
 *
 * 用法：
 *   npm run scan                          # 扫描当前目录
 *   npm run scan -- --dir ../pcMain        # 扫描指定目录
 *   npm run scan -- --json report.json --html report.html
 *   npm run scan -- --ext .vue,.js,.ts     # 自定义扫描后缀
 */
import fs from 'node:fs'
import path from 'node:path'
import { RULES, scanText, summarize, checkDeps } from './scan-core.mjs'

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', '.github', 'coverage', '.next',
  '.nuxt', '.output', '.cache', 'public', 'static', 'assets', '.vscode', '.idea',
])

const argv = process.argv.slice(2)
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const targetDir = path.resolve(arg('dir', process.cwd()))
const exts = arg('ext', '.vue,.js,.ts,.jsx,.tsx').split(',').map((s) => s.trim())
const jsonOut = arg('json', '')
const htmlOut = arg('html', '')
const quiet = argv.includes('--quiet')

function walk(dir) {
  const out = []
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue
      out.push(...walk(full))
    } else if (exts.some((x) => e.name.endsWith(x))) {
      out.push(full)
    }
  }
  return out
}

const t0 = Date.now()
const files = walk(targetDir)
const findings = []
let skipped = 0
for (const f of files) {
  let code = ''
  try {
    code = fs.readFileSync(f, 'utf8')
  } catch {
    skipped++
    continue
  }
  if (code.includes('\u0000')) {
    skipped++
    continue
  }
  findings.push(...scanText(code, path.relative(targetDir, f)))
}
const summary = summarize(findings)

// 依赖风险
let deps = []
const pkgPath = path.join(targetDir, 'package.json')
if (fs.existsSync(pkgPath)) {
  try {
    deps = checkDeps(JSON.parse(fs.readFileSync(pkgPath, 'utf8')))
  } catch {
    /* package.json 解析失败则跳过 */
  }
}

const elapsed = Date.now() - t0
const relevant = RULES.filter((r) => summary.byRule[r.id])

if (!quiet) {
  console.log('')
  console.log(`  Vue2 迁移债务扫描 · ${targetDir}`)
  console.log(`  扫描 ${files.length - skipped} 个文件（跳过 ${skipped}），耗时 ${elapsed}ms`)
  console.log('')
  if (!findings.length) {
    console.log('  未发现遗留写法 —— 这个项目已经是 Vue 3 的写法了 🎉')
  } else {
    console.log('  ' + '检测项'.padEnd(38) + '命中'.padStart(6) + '  说明')
    console.log('  ' + '─'.repeat(74))
    for (const r of relevant) {
      const n = summary.byRule[r.id]
      console.log('  ' + r.title.padEnd(36) + String(n).padStart(6) + '  ' + r.hint.slice(0, 26) + '…')
    }
    console.log('  ' + '─'.repeat(74))
    console.log('  ' + `合计 ${summary.total} 处`.padEnd(36) + `MDI ${summary.mdi}`.padStart(6) + `  等级：${summary.band}`)
  }
  if (deps.length) {
    console.log('')
    console.log('  依赖风险：')
    for (const d of deps) console.log(`   · ${d.name}@${d.version} —— ${d.tip}`)
  }
  console.log('')
}

// 落盘
if (jsonOut) {
  fs.writeFileSync(
    jsonOut,
    JSON.stringify({ target: targetDir, scannedAt: new Date().toISOString(), summary, deps, findings }, null, 1),
  )
  console.log(`  JSON 报告：${jsonOut}`)
}

if (htmlOut) {
  fs.writeFileSync(htmlOut, renderHtml(targetDir, summary, deps, findings, elapsed))
  console.log(`  HTML 报告：${htmlOut}`)
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}

function renderHtml(target, sum, depHits, all, ms) {
  const rows = RULES.filter((r) => sum.byRule[r.id])
    .map(
      (r) => `<tr>
      <td><span class="lv ${r.level}">${r.level}</span></td>
      <td>${esc(r.title)}</td>
      <td class="n">${sum.byRule[r.id]}</td>
      <td class="w">×${r.weight}</td>
      <td class="hint">${esc(r.hint)}</td>
    </tr>`,
    )
    .join('\n')

  const detail = RULES.filter((r) => sum.byRule[r.id])
    .map((r) => {
      const list = all
        .filter((f) => f.ruleId === r.id)
        .slice(0, 200)
        .map((f) => `<li><code>${esc(f.file)}:${f.line}</code><span>${esc(f.snippet)}</span></li>`)
        .join('\n')
      return `<section><h3>${esc(r.title)} <em>${sum.byRule[r.id]} 处</em></h3><ul>${list}</ul></section>`
    })
    .join('\n')

  const depRows = depHits
    .map((d) => `<tr><td><code>${esc(d.name)}</code></td><td>${esc(d.version)}</td><td>${esc(d.tip)}</td></tr>`)
    .join('\n')

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>Vue2 迁移债务报告 · ${esc(path.basename(target))}</title>
<style>
 :root{--ink:#1f2430;--muted:#6b7383;--line:#e6e9f0;--bg:#f7f8fc}
 *{box-sizing:border-box}
 body{margin:0;padding:40px 24px;background:var(--bg);color:var(--ink);
   font-family:'PingFang SC','Microsoft YaHei',system-ui,sans-serif;line-height:1.6}
 .wrap{max-width:980px;margin:0 auto}
 h1{font-size:22px;margin:0 0 4px} h2{font-size:16px;margin:32px 0 12px}
 .sub{color:var(--muted);font-size:13px;margin-bottom:24px}
 .cards{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:8px}
 .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 20px;min-width:150px}
 .card b{display:block;font-size:26px;letter-spacing:-.5px}
 .card span{color:var(--muted);font-size:12px}
 table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
 th,td{padding:11px 14px;border-bottom:1px solid var(--line);font-size:13.5px;text-align:left;vertical-align:top}
 th{background:#fafbff;font-size:12px;color:var(--muted);font-weight:600}
 td.n{font-weight:700;font-variant-numeric:tabular-nums}
 td.w,td.hint{color:var(--muted)}
 td.hint{font-size:12.5px}
 .lv{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
 .lv.high{background:#fdecef;color:#c0274a}
 .lv.medium{background:#fff5e6;color:#a86a00}
 .lv.low{background:#eef1f6;color:#5b6472}
 section{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-bottom:12px}
 section h3{font-size:14px;margin:0 0 8px}
 section h3 em{color:var(--muted);font-style:normal;font-weight:400;font-size:12px}
 ul{margin:0;padding:0;list-style:none}
 li{display:flex;gap:10px;padding:5px 0;border-bottom:1px dashed #eef0f5;font-size:12.5px;align-items:baseline}
 li:last-child{border-bottom:none}
 li code{color:#4f5ded;white-space:nowrap;font-size:12px}
 li span{color:var(--muted);font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 footer{color:var(--muted);font-size:12px;margin-top:28px;text-align:center}
</style></head><body><div class="wrap">
<h1>Vue2 → Vue3 迁移债务报告</h1>
<div class="sub">目标目录：<code>${esc(target)}</code>　·　生成于 ${new Date().toLocaleString('zh-CN')}　·　耗时 ${ms}ms</div>
<div class="cards">
  <div class="card"><b>${sum.total}</b><span>遗留写法命中</span></div>
  <div class="card"><b>${sum.mdi}</b><span>迁移债务指数 MDI</span></div>
  <div class="card"><b>${sum.band}</b><span>迁移量级</span></div>
  <div class="card"><b>${depHits.length}</b><span>依赖风险</span></div>
</div>
<h2>按检测项汇总</h2>
<table><thead><tr><th>级别</th><th>检测项</th><th>命中</th><th>权重</th><th>处置建议</th></tr></thead>
<tbody>${rows}</tbody></table>
${depHits.length ? `<h2>依赖风险</h2><table><thead><tr><th>包</th><th>当前版本</th><th>处置</th></tr></thead><tbody>${depRows}</tbody></table>` : ''}
<h2>逐条明细（含行号）</h2>
${detail}
<footer>Vue2 迁移债务扫描器 · 由 vue3-rspack-starter 提供</footer>
</div></body></html>`
}
