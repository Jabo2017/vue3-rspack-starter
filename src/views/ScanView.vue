<script setup lang="ts">
import { computed, ref } from 'vue'
import { RULES, scanText, summarize } from '@/tools/scan'
import type { Finding, Summary } from '@/tools/scan'
import { useScanStore } from '@/stores/scan'

const SAMPLE = `<!-- src/components/LegacyList.vue —— 典型的 Vue 2 写法 -->
<template>
  <div class="list">
    <Pager :page.sync="page" :total="total" />
    <Row v-for="(row, i) in rows" :key="row.id">
      <template slot="name" slot-scope="{ value }">
        <span>{{ value | upper }}</span>
      </template>
    </Row>
    <span>{{ total }} 条</span>
  </div>
</template>

<script>
import Vue from 'vue'
import bus from '@/utils/bus'

export default {
  name: 'LegacyList',
  filters: {
    upper(v) { return String(v).toUpperCase() }
  },
  mixins: [listMixin],
  data() {
    return { page: 1, total: 0, rows: [], timer: null }
  },
  created() {
    Vue.prototype.$track('list:view')
    bus.$on('list:refresh', this.reload)
    this.timer = setInterval(this.poll, 5000)
  },
  beforeDestroy() {
    bus.$off('list:refresh', this.reload)
    clearInterval(this.timer)
    this.$children.forEach((c) => c.destroy())
  },
  destroyed() {
    this.$listeners = null
  },
  methods: {
    reload() {
      axios.get('/api/list').then((r) => Vue.set(this, 'rows', r.data))
    }
  }
}
<\/script>
`

const filename = ref('src/components/LegacyList.vue')
const source = ref(SAMPLE)
const findings = ref<Finding[]>([])
const summary = ref<Summary | null>(null)
const running = ref(false)

const store = useScanStore()

const ruleMap = computed(() => Object.fromEntries(RULES.map((r) => [r.id, r])))

const grouped = computed(() => {
  const s = summary.value
  if (!s) return []
  return RULES.filter((r) => s.byRule[r.id]).map((r) => ({ ...r, count: s.byRule[r.id] }))
})

function run() {
  running.value = true
  const t0 = performance.now()
  const result = scanText(source.value, filename.value)
  const sum = summarize(result)
  findings.value = result
  summary.value = sum
  store.push({
    title: filename.value,
    loc: source.value.split('\n').length,
    total: sum.total,
    mdi: sum.mdi,
    band: sum.band,
  })
  const ms = Math.round(performance.now() - t0)
  console.info(`[scan] ${ms}ms, ${sum.total} findings, MDI ${sum.mdi}`)
  running.value = false
}

function loadSample() {
  source.value = SAMPLE
  filename.value = 'src/components/LegacyList.vue'
}

function clearAll() {
  source.value = ''
  findings.value = []
  summary.value = null
}

defineExpose({ run })
</script>

<template>
  <section class="head">
    <h1>Vue2 迁移债务扫描器</h1>
    <p>
      同一个内核既跑在 CLI（<code>npm run scan -- --dir ../your-app</code>），也跑在这里。
      粘一段 Vue 2 代码，立刻拿到命中清单与迁移债务指数（MDI）。
    </p>
  </section>

  <div class="toolbar">
    <input v-model="filename" class="file" type="text" spellcheck="false" />
    <button class="btn primary" :disabled="running" @click="run">扫描</button>
    <button class="btn" @click="loadSample">载入示例</button>
    <button class="btn" @click="clearAll">清空</button>
  </div>

  <div class="layout">
    <textarea v-model="source" class="editor mono" spellcheck="false" placeholder="粘贴 Vue 2 组件代码…"></textarea>

    <aside class="result">
      <template v-if="summary">
        <div class="cards">
          <div class="stat"><b>{{ summary.total }}</b><span>命中</span></div>
          <div class="stat"><b>{{ summary.mdi }}</b><span>MDI</span></div>
          <div class="stat"><b :class="'band-' + summary.band">{{ summary.band }}</b><span>量级</span></div>
        </div>

        <table class="rules">
          <tbody>
            <tr v-for="r in grouped" :key="r.id">
              <td><span class="lv" :class="r.level">{{ r.level }}</span></td>
              <td class="name">{{ r.title }}</td>
              <td class="cnt">{{ r.count }}</td>
              <td class="hint">{{ r.hint }}</td>
            </tr>
          </tbody>
        </table>
      </template>
      <p v-else class="placeholder">点「扫描」查看结果</p>
    </aside>
  </div>

  <section v-if="findings.length" class="findings">
    <h2>逐条明细</h2>
    <ul>
      <li v-for="(f, i) in findings" :key="i">
        <code>{{ f.file }}:{{ f.line }}</code>
        <span class="rule">{{ ruleMap[f.ruleId]?.title }}</span>
        <span class="snippet mono">{{ f.snippet }}</span>
      </li>
    </ul>
  </section>

  <section v-if="store.records.length" class="history">
    <div class="h-head">
      <h2>本地扫描历史</h2>
      <button class="btn tiny" @click="store.clear()">清空</button>
    </div>
    <ul>
      <li v-for="r in store.records" :key="r.id">
        <code>{{ r.title }}</code>
        <span>{{ r.loc }} 行 → {{ r.total }} 处命中，MDI {{ r.mdi }}（{{ r.band }}）</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: 18px;
}

h1 {
  font-size: 22px;
  margin: 0 0 8px;
}

.head p {
  color: var(--ink-2);
  font-size: 13.5px;
  max-width: 760px;
  margin: 0;
}

code {
  font-size: 12.5px;
  color: var(--accent);
  background: rgba(91, 140, 255, 0.1);
  padding: 1px 5px;
  border-radius: 5px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.file {
  flex: 1;
  min-width: 220px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink-2);
  font-size: 12.5px;
  font-family: ui-monospace, Consolas, monospace;
  outline: none;
}

.file:focus {
  border-color: var(--accent);
}

.btn {
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover:not(:disabled) {
  color: var(--ink);
  border-color: var(--accent);
}

.btn.primary {
  border: none;
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 5px 16px rgba(91, 140, 255, 0.3);
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.tiny {
  padding: 5px 11px;
  font-size: 12px;
}

.layout {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 14px;
  align-items: start;
}

.editor {
  min-height: 380px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: #12141c;
  color: #c8d1e3;
  font-size: 12.5px;
  line-height: 1.75;
  resize: vertical;
  outline: none;
}

.editor:focus {
  border-color: var(--accent);
}

.result {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  padding: 14px;
  min-height: 380px;
}

.placeholder {
  color: var(--ink-3);
  font-size: 13.5px;
  text-align: center;
  margin-top: 150px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--panel-2);
}

.stat b {
  display: block;
  font-size: 20px;
  line-height: 1.3;
}

.stat span {
  font-size: 11.5px;
  color: var(--ink-3);
}

.band-低 {
  color: var(--ok);
}

.band-中 {
  color: var(--warn);
}

.band-高,
.band-极高 {
  color: var(--err);
}

.rules {
  width: 100%;
  border-collapse: collapse;
}

.rules td {
  padding: 8px 6px;
  border-bottom: 1px solid var(--line);
  font-size: 12.5px;
  vertical-align: top;
}

.rules tr:last-child td {
  border-bottom: none;
}

.lv {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.lv.high {
  color: #ff9db0;
  background: rgba(248, 113, 113, 0.14);
}

.lv.medium {
  color: var(--warn);
  background: rgba(251, 191, 36, 0.14);
}

.lv.low {
  color: var(--ink-2);
  background: rgba(148, 163, 184, 0.14);
}

.name {
  color: var(--ink);
}

.cnt {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  width: 42px;
}

.hint {
  color: var(--ink-3);
  font-size: 12px !important;
}

.findings,
.history {
  margin-top: 24px;
}

h2 {
  font-size: 14.5px;
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
}

.h-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.h-head h2 {
  margin-bottom: 10px;
}

.findings ul,
.history ul {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  overflow: hidden;
}

.findings li {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 12.5px;
  flex-wrap: wrap;
}

.history li {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 9px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-3);
}

.findings li:last-child,
.history li:last-child {
  border-bottom: none;
}

.rule {
  color: var(--ink-2);
  min-width: 190px;
}

.snippet {
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
