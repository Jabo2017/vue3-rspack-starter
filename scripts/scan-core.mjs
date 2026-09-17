/**
 * Vue 2 遗留代码扫描内核（纯函数，便于单元测试）
 *
 * 设计原则：
 * 1. 只做「能在源码里稳定判定」的检测，不做猜测式 AST 推断 —— 宁可少报，不可误导；
 * 2. 每条命中都带 file:line + 代码片段，方便直接跳过去改；
 * 3. 权重用于汇总「迁移债务指数（MDI）」，权重的依据见 docs/MIGRATION.md。
 */

/** @typedef {{ id: string, title: string, level: 'high'|'medium'|'low', weight: number, hint: string, pattern: RegExp }} Rule */
/** @typedef {{ ruleId: string, file: string, line: number, column: number, snippet: string }} Finding */

/** @type {Rule[]} */
export const RULES = [
  {
    id: 'lifecycle-destroy',
    title: 'beforeDestroy / destroyed 生命周期',
    level: 'high',
    weight: 2,
    hint: 'Vue 3 重命名为 beforeUnmount / unmounted，改名字即可，但要逐一确认清理逻辑',
    pattern: /\b(beforeDestroy|destroyed)\s*(\(|:)/g,
  },
  {
    id: 'sync-modifier',
    title: '.sync 修饰符',
    level: 'high',
    weight: 1,
    hint: 'Vue 3 移除 .sync，改为 v-model:propName；子组件 emit 名从 update:xxx 保持一致',
    pattern: /(?:v-bind:|:)[\w.-]+\.sync\s*=|\.sync\s*=/g,
  },
  {
    id: 'slot-scope',
    title: 'slot-scope / slot="name" 旧插槽语法',
    level: 'high',
    weight: 3,
    hint: 'Vue 3 只认 v-slot；<template slot-scope="x"> 要改成 <template #default="x">',
    pattern: /\bslot-scope\s*=|\bslot\s*=\s*["']/g,
  },
  {
    id: 'filters',
    title: 'filters 过滤器',
    level: 'high',
    weight: 2,
    hint: 'Vue 3 移除 filters 选项，改成 computed 或纯函数调用（模板里写 {{ fmt(x) }}）',
    pattern: /\bfilters\s*:\s*\{|(\{\{[^}]*\|[^}]*\}\})/g,
  },
  {
    id: 'global-api',
    title: 'Vue 全局 API（prototype / use / set ...）',
    level: 'high',
    weight: 3,
    hint: 'Vue 3 改为 app.use / app.config.globalProperties；Vue.set|delete 直接删除（响应式系统已覆盖）',
    pattern: /\bVue\s*\.\s*(prototype|use|mixin|component|directive|filter|extend|set|delete|observable)\b|\bnew\s+Vue\s*\(/g,
  },
  {
    id: 'events-api',
    title: '$on / $off / $once / $listeners / $children',
    level: 'high',
    weight: 3,
    hint: 'Vue 3 移除实例事件 API 与 $listeners/$children；EventBus 改用 mitt，父子通信改用 props/emit',
    pattern: /\$on\s*\(|\$off\s*\(|\$once\s*\(|\$listeners\b|\$children\b/g,
  },
  {
    id: 'functional-option',
    title: 'functional: true 函数式组件',
    level: 'medium',
    weight: 2,
    hint: '改成普通函数组件（props/emits 显式声明），Vue 3 中函数式组件是纯函数',
    pattern: /\bfunctional\s*:\s*true/g,
  },
  {
    id: 'webpack-coupling',
    title: 'Webpack 强耦合写法',
    level: 'medium',
    weight: 1,
    hint: 'Rspack 兼容大部分 loader 链，但 require.context 的写法、chainWebpack 配置要重写',
    pattern: /\brequire\.context\s*\(|process\.env\.VUE_APP_|chainWebpack\s*\(|configureWebpack\s*\(|vue-cli-service/g,
  },
  {
    id: 'mixins',
    title: 'mixins 引用',
    level: 'medium',
    weight: 1.5,
    hint: 'mixins 在 Vue 3 仍可用但同样导致数据来源不透明；建议迁移期换成组合式函数（composables）',
    pattern: /\bmixins\s*:\s*\[/g,
  },
  {
    id: 'event-bus',
    title: 'EventBus 模式（$emit 到全局实例）',
    level: 'medium',
    weight: 2,
    hint: 'Vue 3 无全局事件实例，改用 mitt / 或提到状态层（Pinia）',
    pattern: /new\s+Vue\s*\(\s*\)|\.\s*\$emit\s*\(\s*['"]\$?bus|bus\s*\.\s*\$emit/g,
  },
]

/** package.json 依赖里需要重点关注的包（key 为正则片段，value 为处置建议） */
export const DEP_RISKS = [
  { test: /^vue$/, version: /^[\^~]?2\./, tip: 'Vue 2 —— 迁移主体，升到 3.x' },
  { test: /^vue-router$/, version: /^[\^~]?[23]\./, tip: 'Vue Router 2/3 —— 升到 4/5，API 从 new Router() 改为 createRouter()' },
  { test: /^vuex$/, version: /.*/, tip: 'Vuex 3 —— 官方推荐迁移到 Pinia' },
  { test: /^(element-ui|mint-ui|vant)$/, version: /.*/, tip: 'Vue 2 生态 UI 库 —— 需换 element-plus / vant 4' },
  { test: /^@vue\/cli-service$/, version: /.*/, tip: 'vue-cli —— 换 Rspack/Vite 构建' },
  { test: /^(webpack|webpack-dev-server)$/, version: /.*/, tip: 'Webpack —— 可换 Rspack，配置基本平移' },
  { test: /^node-sass$/, version: /.*/, tip: 'node-sass 已废弃 —— 换 sass（dart-sass）' },
  { test: /^moment$/, version: /.*/, tip: 'moment 停止维护且体积大 —— 换 dayjs' },
  { test: /^echarts$/, version: /^[\^~]?[0-4]\./, tip: 'echarts 4 及以下 —— 5.x API 有破坏性变更' },
  { test: /^swiper$/, version: /^[\^~]?[0-5]\./, tip: 'swiper 5 及以下 —— 6+ 组件名与 API 变更较大' },
  { test: /^lodash$/, version: /.*/, tip: 'lodash 全量引入 —— 换 lodash-es 按需引入' },
  { test: /^vue-awesome-swiper$/, version: /.*/, tip: 'Vue 2 封装的老 swiper —— 换 swiper 官方 Vue 组件' },
]

/**
 * 扫描一段源码，返回命中列表。
 * @param {string} code
 * @param {string} file
 * @returns {Finding[]}
 */
export function scanText(code, file = '<inline>') {
  /** @type {Finding[]} */
  const findings = []
  const lines = code.split(/\r?\n/)

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0
    let m
    while ((m = rule.pattern.exec(code)) !== null) {
      const upto = code.slice(0, m.index)
      const line = upto.split('\n').length
      const column = m.index - upto.lastIndexOf('\n')
      findings.push({
        ruleId: rule.id,
        file,
        line,
        column,
        snippet: (lines[line - 1] || '').trim().slice(0, 120),
      })
      // 零宽匹配保护
      if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex++
    }
  }

  return findings.sort((a, b) => a.line - b.line || a.column - b.column)
}

/**
 * 汇总扫描结果：按规则计数 + 计算迁移债务指数（MDI）。
 * MDI = Σ(命中数 × 权重)；分值区间用于粗粒度排期，不作为精确工期估算。
 * @param {Finding[]} findings
 */
export function summarize(findings) {
  /** @type {Record<string, number>} */
  const byRule = {}
  /** @type {Record<string, string[]>} */
  const filesByRule = {}
  for (const f of findings) {
    byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1
    filesByRule[f.ruleId] = filesByRule[f.ruleId] ?? []
    if (!filesByRule[f.ruleId].includes(f.file)) filesByRule[f.ruleId].push(f.file)
  }

  let mdi = 0
  for (const rule of RULES) {
    mdi += (byRule[rule.id] ?? 0) * rule.weight
  }
  mdi = Math.round(mdi * 10) / 10

  return {
    total: findings.length,
    byRule,
    filesByRule,
    mdi,
    band: mdi < 50 ? '低' : mdi < 200 ? '中' : mdi < 600 ? '高' : '极高',
  }
}

/**
 * 检查 package.json 依赖风险。
 * @param {Record<string, Record<string, string>>} pkg
 */
export function checkDeps(pkg) {
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const hits = []
  for (const [name, version] of Object.entries(all)) {
    for (const risk of DEP_RISKS) {
      if (risk.test.test(name) && risk.version.test(String(version))) {
        hits.push({ name, version, tip: risk.tip })
      }
    }
  }
  return hits
}
