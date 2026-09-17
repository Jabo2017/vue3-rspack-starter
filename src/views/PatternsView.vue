<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeDiff from '@/components/CodeDiff.vue'
import { PATTERNS } from '@/data/patterns'

const keyword = ref('')

const list = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return PATTERNS
  return PATTERNS.filter(
    (p) =>
      p.title.toLowerCase().includes(k) ||
      p.note.toLowerCase().includes(k) ||
      p.before.toLowerCase().includes(k) ||
      p.after.toLowerCase().includes(k),
  )
})
</script>

<template>
  <section class="head">
    <h1>Vue2 → Vue3 高频改造对照</h1>
    <p>
      下面每一条都来自真实项目的迁移过程，不是文档摘抄。改动量最大的是插槽与
      <code>.sync</code>；最容易出错的是 EventBus 和依赖 <code>$children</code> 的写法。
    </p>
    <input v-model="keyword" class="search" type="search" placeholder="搜索：插槽 / sync / 生命周期…" />
  </section>

  <div class="list">
    <CodeDiff
      v-for="p in list"
      :key="p.id"
      :title="p.title"
      :note="p.note"
      :before="p.before"
      :after="p.after"
    />
    <p v-if="!list.length" class="empty">没有匹配「{{ keyword }}」的条目</p>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 22px;
}

h1 {
  font-size: 22px;
  margin: 0 0 8px;
}

.head p {
  color: var(--ink-2);
  font-size: 13.5px;
  max-width: 720px;
  margin: 0 0 14px;
}

code {
  font-size: 12.5px;
  color: var(--accent);
  background: rgba(91, 140, 255, 0.1);
  padding: 1px 5px;
  border-radius: 5px;
}

.search {
  width: min(340px, 100%);
  padding: 9px 13px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  font-size: 13.5px;
  outline: none;
}

.search:focus {
  border-color: var(--accent);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty {
  color: var(--ink-3);
  text-align: center;
  padding: 40px 0;
  font-size: 13.5px;
}
</style>
