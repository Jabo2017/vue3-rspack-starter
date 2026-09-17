<script setup lang="ts">
const stacks = [
  { name: 'vue', version: '3.5', why: 'Composition API + defineModel 等新特性开箱可用' },
  { name: '@rspack/core', version: '2.x', why: 'Rust 实现，冷启动与 HMR 明显快于 webpack 5' },
  { name: 'vue-router', version: '5.x', why: 'createRouter 写法，配合 hash 模式可直接部署静态托管' },
  { name: 'pinia', version: '4.x', why: '替代 Vuex，setup store 写法与组合式函数天然一致' },
  { name: 'typescript', version: '5.9', why: 'vue-tsc 做模板级类型检查，构建期就能拦住大部分低级错误' },
  { name: 'vitest', version: '5.x', why: '与 Vite 生态同源，扫描内核、store、视图都能测' },
]

const structure = `vue3-rspack-starter/
├── rspack.config.js        # 构建配置（dev / prod 单文件）
├── scripts/
│   ├── scan-core.mjs       # 迁移扫描内核（纯函数，可单测）
│   └── scan-legacy.mjs     # 扫描 CLI，输出 console / JSON / HTML 报告
├── src/
│   ├── router/             # vue-router 5，hash 模式
│   ├── stores/             # pinia setup store
│   ├── views/              # 页面（概览 / 改造对照 / 扫描器）
│   ├── components/         # 通用组件
│   └── data/patterns.ts    # 改造对照数据
├── docs/MIGRATION.md       # Vue2 → Vue3 + Rspack 迁移手册
└── tests/                  # vitest 单测`

const cmds = [
  { cmd: 'npm i && npm run dev', desc: '本地起服务（默认 5173）' },
  { cmd: 'npm run scan -- --dir ../your-legacy-app --html report.html', desc: '扫描老项目，产出迁移债务报告' },
  { cmd: 'npm run typecheck && npm test', desc: '类型检查 + 单测' },
  { cmd: 'npm run build', desc: '产出 dist/，子路径部署用 PUBLIC_PATH=/your-repo/ npm run build' },
]
</script>

<template>
  <section class="hero">
    <h1>Vue 3 + TypeScript + Rspack 起步模板</h1>
    <p class="lead">
      一个能直接开工的前端骨架，外加一件真实用得上的工具：<strong>Vue2 迁移债务扫描器</strong>。
      它把「这个老项目迁到 Vue 3 要改多少东西」从拍脑袋变成一份带行号的报告。
    </p>
    <div class="cta">
      <RouterLink to="/scanner" class="btn primary">试试扫描器 →</RouterLink>
      <RouterLink to="/patterns" class="btn ghost">看改造对照</RouterLink>
    </div>
  </section>

  <section class="grid">
    <article class="card">
      <h3>构建快，配置少</h3>
      <p>单文件 <code>rspack.config.js</code> 搞定 dev / prod，Rspack 兼容 vue-loader 与既有 loader 生态。</p>
    </article>
    <article class="card">
      <h3>迁移可量化</h3>
      <p>扫描 10 类 Vue2 遗留写法，逐条给出<code>文件:行号</code>与处置建议，并按权重算出迁移债务指数。</p>
    </article>
    <article class="card">
      <h3>开箱即用的工程线</h3>
      <p>TS 严格模式、vue-tsc 模板类型检查、vitest 单测、GitHub Actions 自动部署 Pages。</p>
    </article>
  </section>

  <section class="block">
    <h2>技术栈</h2>
    <table class="stack">
      <thead>
        <tr><th>依赖</th><th>版本</th><th>为什么选它</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in stacks" :key="s.name">
          <td><code>{{ s.name }}</code></td>
          <td class="ver">{{ s.version }}</td>
          <td class="why">{{ s.why }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="block">
    <h2>常用命令</h2>
    <ul class="cmds">
      <li v-for="c in cmds" :key="c.cmd">
        <code>{{ c.cmd }}</code>
        <span>{{ c.desc }}</span>
      </li>
    </ul>
  </section>

  <section class="block">
    <h2>目录结构</h2>
    <pre class="tree"><code>{{ structure }}</code></pre>
  </section>
</template>

<style scoped>
.hero {
  padding: 8px 0 26px;
}

h1 {
  font-size: 30px;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
  background: linear-gradient(120deg, #fff, #b9c6ff 70%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.lead {
  color: var(--ink-2);
  font-size: 14.5px;
  max-width: 720px;
  margin: 0 0 20px;
}

.lead strong {
  color: var(--ink);
}

.cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  transition: all 0.15s;
}

.btn:hover {
  text-decoration: none;
  transform: translateY(-1px);
}

.btn.primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 6px 18px rgba(91, 140, 255, 0.32);
}

.btn.ghost {
  color: var(--ink-2);
  border: 1px solid var(--line);
  background: var(--panel);
}

.btn.ghost:hover {
  color: var(--ink);
  border-color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 30px;
}

.card {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: var(--radius);
  padding: 16px 18px;
}

.card h3 {
  margin: 0 0 6px;
  font-size: 14.5px;
}

.card p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
}

.block {
  margin-bottom: 30px;
}

h2 {
  font-size: 15px;
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
}

code {
  font-size: 12.5px;
  color: var(--accent);
  background: rgba(91, 140, 255, 0.1);
  padding: 1px 5px;
  border-radius: 5px;
}

.stack {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.stack th,
.stack td {
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.stack th {
  font-size: 11.5px;
  color: var(--ink-3);
  background: var(--panel-2);
  font-weight: 600;
}

.stack tr:last-child td {
  border-bottom: none;
}

.ver {
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.why {
  color: var(--ink-2);
}

.cmds {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  overflow: hidden;
}

.cmds li {
  display: flex;
  gap: 14px;
  align-items: baseline;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}

.cmds li:last-child {
  border-bottom: none;
}

.cmds span {
  font-size: 12.5px;
  color: var(--ink-3);
}

.tree {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--ink-2);
}
</style>
