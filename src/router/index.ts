import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 这里用 hash 模式是有意的：GitHub Pages 之类的纯静态托管无法配置
 * history fallback，刷新 /patterns 会 404。内部系统可以换成 createWebHistory。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/patterns', name: 'patterns', component: () => import('@/views/PatternsView.vue') },
    { path: '/scanner', name: 'scanner', component: () => import('@/views/ScanView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
