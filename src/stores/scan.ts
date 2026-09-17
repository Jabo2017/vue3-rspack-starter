import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ScanRecord {
  id: number
  title: string
  loc: number
  total: number
  mdi: number
  band: string
  at: number
}

/** 扫描历史：演示 Pinia 的 setup store 写法（替代 Vuex） */
export const useScanStore = defineStore('scan', () => {
  const records = ref<ScanRecord[]>([])
  const last = ref<ScanRecord | null>(null)

  function push(rec: Omit<ScanRecord, 'id' | 'at'>) {
    const item: ScanRecord = { ...rec, id: Date.now(), at: Date.now() }
    records.value.unshift(item)
    if (records.value.length > 12) records.value.pop()
    last.value = item
  }

  function clear() {
    records.value = []
    last.value = null
  }

  return { records, last, push, clear }
})
