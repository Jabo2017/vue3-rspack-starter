import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { PATTERNS } from '../src/data/patterns'
import { useScanStore } from '../src/stores/scan'

describe('改造对照数据', () => {
  it('每个条目 id 唯一，且新旧代码都不为空', () => {
    const ids = PATTERNS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PATTERNS) {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.before.trim().length).toBeGreaterThan(0)
      expect(p.after.trim().length).toBeGreaterThan(0)
    }
  })

  it('覆盖了六类核心改造点', () => {
    const ids = PATTERNS.map((p) => p.id)
    for (const key of ['lifecycle', 'sync', 'slot', 'filters', 'global-api', 'event-bus']) {
      expect(ids).toContain(key)
    }
  })
})

describe('扫描历史 store（Pinia setup store）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('push 后记录落入列表且 last 指向最新一条', () => {
    const store = useScanStore()
    store.push({ title: 'a.vue', loc: 30, total: 5, mdi: 12.5, band: '低' })
    store.push({ title: 'b.vue', loc: 60, total: 9, mdi: 31, band: '中' })

    expect(store.records).toHaveLength(2)
    expect(store.records[0].title).toBe('b.vue')
    expect(store.last?.mdi).toBe(31)
  })

  it('最多保留 12 条，超出后丢弃最旧的', () => {
    const store = useScanStore()
    for (let i = 0; i < 15; i++) {
      store.push({ title: `f${i}.vue`, loc: 1, total: 1, mdi: 1, band: '低' })
    }
    expect(store.records).toHaveLength(12)
    expect(store.records[0].title).toBe('f14.vue')
  })

  it('clear 以后记录清空', () => {
    const store = useScanStore()
    store.push({ title: 'a.vue', loc: 1, total: 1, mdi: 1, band: '低' })
    store.clear()
    expect(store.records).toHaveLength(0)
    expect(store.last).toBeNull()
  })
})
