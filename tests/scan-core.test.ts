import { describe, expect, it } from 'vitest'
import { RULES, checkDeps, scanText, summarize } from '../scripts/scan-core.mjs'

interface Finding {
  ruleId: string
  file: string
  line: number
  column: number
  snippet: string
}

const has = (findings: Finding[], ruleId: string) => findings.filter((f) => f.ruleId === ruleId)

describe('scanText · Vue2 遗留写法检测', () => {
  it('命中 beforeDestroy / destroyed 并给出准确行号', () => {
    const code = ['export default {', '  beforeDestroy() {', '    clearInterval(this.t)', '  },', '  destroyed() {},', '}'].join('\n')
    const found = has(scanText(code, 'a.vue') as Finding[], 'lifecycle-destroy')
    expect(found).toHaveLength(2)
    expect(found[0].line).toBe(2)
    expect(found[1].line).toBe(5)
  })

  it('不会误报 Vue3 的 beforeUnmount / unmounted', () => {
    const code = 'onBeforeUnmount(() => clear())\nonUnmounted(() => off())'
    expect(has(scanText(code) as Finding[], 'lifecycle-destroy')).toHaveLength(0)
  })

  it('命中 .sync 修饰符', () => {
    const code = '<Dialog :visible.sync="show" />\n<Pager :page.sync="page" />'
    expect(has(scanText(code) as Finding[], 'sync-modifier')).toHaveLength(2)
  })

  it('命中 slot-scope 与 Vue2 具名插槽 slot=', () => {
    const code = '<template slot-scope="{ row }">x</template>\n<template slot="footer">y</template>'
    expect(has(scanText(code) as Finding[], 'slot-scope')).toHaveLength(2)
  })

  it('命中 filters 选项与模板里的管道符', () => {
    const code = 'filters: { upper(v) { return v } }\n<span>{{ name | upper }}</span>'
    expect(has(scanText(code) as Finding[], 'filters')).toHaveLength(2)
  })

  it('命中全局 API 与实例事件 API', () => {
    const code = 'Vue.prototype.$http = http\nVue.set(obj, "k", 1)\nnew Vue({ el: "#app" })\nbus.$on("x", fn)\nthis.$children'
    const globalApi = has(scanText(code) as Finding[], 'global-api')
    const eventsApi = has(scanText(code) as Finding[], 'events-api')
    expect(globalApi.length).toBe(3)
    expect(eventsApi.length).toBe(2)
  })

  it('命中 mixins 与 webpack 耦合写法', () => {
    const code = 'mixins: [listMixin],\nconst ctx = require.context("./x", true, /\\.js$/)'
    expect(has(scanText(code) as Finding[], 'mixins')).toHaveLength(1)
    expect(has(scanText(code) as Finding[], 'webpack-coupling')).toHaveLength(1)
  })

  it('干净的 Vue 3 代码不应有任何命中', () => {
    const code = [
      "import { ref, onMounted, onUnmounted } from 'vue'",
      'const count = ref(0)',
      'onMounted(() => window.addEventListener("resize", onResize))',
      'onUnmounted(() => window.removeEventListener("resize", onResize))',
      'const fmt = (v: number) => v.toFixed(2)',
    ].join('\n')
    expect(scanText(code) as Finding[]).toHaveLength(0)
  })

  it('结果按行列排序，便于直接跳转', () => {
    const code = 'Vue.set(a, "b", 1)\nbeforeDestroy() {}\n<span>{{ x | y }}</span>'
    const found = scanText(code) as Finding[]
    const lines = found.map((f) => f.line)
    expect([...lines]).toEqual([...lines].sort((a, b) => a - b))
  })
})

describe('summarize · 迁移债务指数', () => {
  it('按权重累加并给出量级', () => {
    const code = 'beforeDestroy() {}\nbeforeDestroy() {}\nthis.$children'
    const sum = summarize(scanText(code) as Finding[])
    // 2 × beforeDestroy(权重2) + 1 × $children(权重3) = 7
    expect(sum.total).toBe(3)
    expect(sum.mdi).toBe(7)
    expect(sum.band).toBe('低')
  })

  it('空结果得 0 分', () => {
    const sum = summarize([])
    expect(sum.mdi).toBe(0)
    expect(sum.total).toBe(0)
    expect(sum.byRule).toEqual({})
  })

  it('每条规则都有唯一 id 与正权重', () => {
    const ids = RULES.map((r: { id: string }) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of RULES as { weight: number; pattern: RegExp }[]) {
      expect(r.weight).toBeGreaterThan(0)
      expect(r.pattern).toBeInstanceOf(RegExp)
    }
  })
})

describe('checkDeps · 依赖风险识别', () => {
  it('识别 Vue2 技术栈里的高风险依赖', () => {
    const hits = checkDeps({
      dependencies: { vue: '^2.6.14', 'vue-router': '^3.5.1', vuex: '^3.6.2', moment: '^2.29.1' },
      devDependencies: { '@vue/cli-service': '~5.0.0', 'node-sass': '^4.14.1' },
    })
    const names = hits.map((h: { name: string }) => h.name).sort()
    expect(names).toEqual(['@vue/cli-service', 'moment', 'node-sass', 'vue', 'vue-router', 'vuex'])
  })

  it('Vue 3 技术栈不误报', () => {
    const hits = checkDeps({
      dependencies: { vue: '^3.5.0', 'vue-router': '^4.4.0', pinia: '^2.2.0', dayjs: '^1.11.0' },
      devDependencies: { '@rspack/core': '^1.0.0', sass: '^1.77.0' },
    })
    expect(hits).toHaveLength(0)
  })
})
