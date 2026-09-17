/** Vue2 → Vue3 高频改造对照数据（页面与测试共用） */

export interface PatternItem {
  id: string
  title: string
  note: string
  before: string
  after: string
}

export const PATTERNS: PatternItem[] = [
  {
    id: 'lifecycle',
    title: '生命周期钩子改名',
    note: 'beforeDestroy / destroyed 在 Vue 3 中已移除，注意顺手检查里面的事件解绑与定时器清理。',
    before: `export default {
  beforeDestroy() {
    clearInterval(this.timer)
  },
  destroyed() {
    window.removeEventListener('resize', this.onResize)
  },
}`,
    after: `import { onBeforeUnmount, onUnmounted } from 'vue'

onBeforeUnmount(() => {
  clearInterval(timer)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})`,
  },
  {
    id: 'sync',
    title: '.sync 修饰符 → v-model 参数',
    note: '父子双向绑定写法变了，子组件 emit 的事件名仍然保持 update:xxx。',
    before: `<!-- 父组件 -->
<Dialog :visible.sync="show" />

<!-- 子组件 -->
this.$emit('update:visible', false)`,
    after: `<!-- 父组件 -->
<Dialog v-model:visible="show" />

<!-- 子组件 -->
const emit = defineEmits<{ 'update:visible': [v: boolean] }>()
emit('update:visible', false)`,
  },
  {
    id: 'slot',
    title: 'slot-scope → v-slot',
    note: '这是改动量最大、最容易漏的一类：具名插槽的 slot="x" 也要一起换。',
    before: `<template slot="item" slot-scope="{ row, index }">
  <span>{{ index }} - {{ row.name }}</span>
</template>`,
    after: `<template #item="{ row, index }">
  <span>{{ index }} - {{ row.name }}</span>
</template>`,
  },
  {
    id: 'filters',
    title: 'filters 被移除',
    note: '过滤器无法迁移成等价写法，只能改成函数或 computed。全量替换前先统计模板里的 | 使用量。',
    before: `filters: {
  currency(v) {
    return '¥' + Number(v).toFixed(2)
  },
}
// 模板：{{ price | currency }}`,
    after: `const currency = (v: number) => '¥' + Number(v).toFixed(2)

// 模板：{{ currency(price) }}`,
  },
  {
    id: 'global-api',
    title: 'Vue 全局 API 挂到 app 实例',
    note: 'main.ts 的启动方式整体变了；Vue.set / Vue.delete 直接删掉即可，Vue 3 的响应式已覆盖。',
    before: `import Vue from 'vue'
Vue.prototype.$http = http
Vue.use(SomePlugin)
Vue.set(obj, 'key', 1)

new Vue({ router, render: (h) => h(App) }).$mount('#app')`,
    after: `import { createApp } from 'vue'
const app = createApp(App)

app.config.globalProperties.$http = http
app.use(SomePlugin).use(router).mount('#app')`,
  },
  {
    id: 'event-bus',
    title: '实例事件 API 与 EventBus',
    note: 'Vue 3 移除了 $on / $off / $once 和 $listeners、$children，跨组件通信要走状态层或 mitt。',
    before: `// EventBus
export default new Vue()

bus.$on('refresh', handler)
bus.$emit('refresh')

// 或直接访问子实例
this.$children.forEach((c) => c.reload())`,
    after: `// mitt 或 Pinia 状态层
import mitt from 'mitt'
export const bus = mitt()

bus.on('refresh', handler)
bus.emit('refresh')

// 需要子组件行为时，用 props / ref 暴露的方法
childRef.value?.reload()`,
  },
  {
    id: 'build',
    title: '构建链路：vue-cli → Rspack',
    note: 'Rspack 兼容大部分 webpack loader 与插件生态，迁移成本主要在自定义 chainWebpack 部分。',
    before: `// vue.config.js
module.exports = {
  chainWebpack(config) {
    config.resolve.alias.set('@', path.resolve('src'))
  },
}`,
    after: `// rspack.config.js
export default {
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\\.vue$/, loader: 'vue-loader', options: { experimentalInlineMatchResource: true } },
      { test: /\\.ts$/, loader: 'builtin:swc-loader', options: { jsc: { parser: { syntax: 'typescript' } } } },
      { test: /\\.css$/, type: 'css' },
    ],
  },
}`,
  },
]
