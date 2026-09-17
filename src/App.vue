<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const nav = [
  { to: '/', label: '概览' },
  { to: '/patterns', label: '改造对照' },
  { to: '/scanner', label: '迁移扫描器' },
]

const active = computed(() => route.path)
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="wrap top-inner">
        <RouterLink to="/" class="brand">
          <span class="mark">V3</span>
          <span class="brand-text">
            <strong>vue3-rspack-starter</strong>
            <small>Vue 3 · TypeScript · Rspack</small>
          </span>
        </RouterLink>
        <nav>
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ on: active === item.to }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="wrap main">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>

    <footer class="foot wrap">
      <span>内置 Vue2 迁移债务扫描器 · 从 pcMain 这类真实项目的迁移实践中沉淀</span>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.wrap {
  width: min(1000px, 100% - 40px);
  margin: 0 auto;
}

.top {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(12px);
  background: rgba(14, 16, 22, 0.82);
  border-bottom: 1px solid var(--line);
}

.top-inner {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
}

.brand:hover {
  text-decoration: none;
}

.mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 4px 14px rgba(91, 140, 255, 0.35);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand-text strong {
  font-size: 14.5px;
}

.brand-text small {
  color: var(--ink-3);
  font-size: 11.5px;
}

nav {
  display: flex;
  gap: 4px;
}

.nav-item {
  font-size: 13.5px;
  color: var(--ink-2);
  padding: 7px 14px;
  border-radius: 9px;
  transition: all 0.15s;
}

.nav-item:hover {
  color: var(--ink);
  background: var(--panel);
  text-decoration: none;
}

.nav-item.on {
  color: #fff;
  background: var(--panel-2);
  box-shadow: inset 0 0 0 1px var(--line);
}

.main {
  flex: 1;
  padding: 32px 0 48px;
}

.foot {
  color: var(--ink-3);
  font-size: 12px;
  padding: 20px 0 32px;
  border-top: 1px solid var(--line);
  margin-top: 20px;
}

@media (max-width: 640px) {
  .brand-text {
    display: none;
  }
}
</style>
