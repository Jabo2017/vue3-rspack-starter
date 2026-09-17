# Vue2 → Vue3 + Rspack 迁移手册

> 这份手册不抄官方文档。它记录的是**在真实大项目里迁移时真正会卡住的地方**，以及配套的量化方法。

## 一、先量化，再动手

迁移最容易犯的错是「先改起来」，改到一半发现工作量远超预期。正确顺序：

```bash
npm run scan -- --dir ../your-legacy-app --json report.json --html report.html
```

扫描器会输出：每个检测项的命中数、`文件:行号` 明细、依赖风险清单，以及一个 **MDI（迁移债务指数）**。

### MDI 是怎么算的

MDI = Σ(某检测项命中数 × 该项权重)。权重依据「改动单价 × 出错概率」给定：

| 检测项 | 权重 | 为什么是这个数 |
|---|---|---|
| `beforeDestroy` / `destroyed` | 2 | 改名字很机械，但每个都要人工确认清理逻辑没漏 |
| `.sync` | 1 | 纯语法替换，父子两侧改动都很模板化 |
| `slot-scope` / `slot="x"` | 3 | 量最大，且具名插槽/作用域插槽混在一起时极易漏改 |
| `filters` | 2 | Vue 3 无等价写法，要改成函数调用，模板与逻辑都要动 |
| Vue 全局 API | 3 | 涉及启动方式重写，`Vue.set` 这类还要判断能否直接删 |
| `$on/$off/$once/$listeners/$children` | 3 | 没有机械替换方案，要重新设计通信方式 |
| `functional: true` | 2 | 组件语义变了，需要重写 |
| webpack 强耦合 | 1 | Rspack 兼容度高，多数只改配置不改业务 |
| `mixins` | 1.5 | 语法不变，但建议借迁移一起转成 composables |

分值区间只用于排期粗判：**< 50 低 / 50–200 中 / 200–600 高 / > 600 极高**。
它是相对指标——同一个仓库前后对比有意义，跨仓库比较要谨慎（代码风格影响很大）。

## 二、改动顺序（按风险从低到高）

1. **构建先换**：vue-cli → Rspack。此时业务代码一行不动，先把构建跑通。
   好处是「还没开始改业务，就已经拿到构建加速」，团队体感最好。
2. **机械替换**：生命周期改名、`.sync` → `v-model:xxx`、`slot-scope` → `v-slot`。
   这三类占了绝大多数命中数，但决策成本极低。
3. **删除式改造**：`Vue.set/delete` 直接删、`filters` 改成函数、`$listeners` → `$attrs`。
4. **重新设计**：EventBus、`$children` 强耦合、依赖 `$on` 的插件。这一步要单独排期。
5. **收尾**：mixins → composables、Options API → `<script setup>`（可分批，不必一次到顶）。

## 三、Rspack 配置要点

Rspack 兼容 webpack 的 loader/plugin 生态，但有三处必须按新写法来：

```js
// 1. Vue SFC 必须开 inline match resource，否则 <script setup lang="ts"> 的 TS 规则匹配不到
{ test: /\.vue$/, loader: 'vue-loader', options: { experimentalInlineMatchResource: true } }

// 2. TS 转译走内置 swc，比 ts-loader 快一个量级
{ test: /\.ts$/, loader: 'builtin:swc-loader',
  options: { jsc: { parser: { syntax: 'typescript' }, target: 'es2020' } },
  type: 'javascript/auto' }

// 3. CSS 用内置能力，不再需要 style-loader/css-loader 链
{ test: /\.css$/, type: 'css' }
```

其它注意点：

- `chainWebpack` 没有对应物，配置直接写在 `resolve.alias` / `module.rules` 上；
- 需要 Vue 3 的编译期开关（`__VUE_OPTIONS_API__` 等）用 `DefinePlugin` 显式声明，否则会有运行时警告；
- 部署到子路径（GitHub Pages 项目站点）时，用环境变量注入 `output.publicPath`，别写死。

## 四、容易漏的坑

- **`$listeners` 在 Vue 3 合并进了 `$attrs`**：以前 `v-on="$listeners"` 的地方要改成 `v-bind="$attrs"`。
- **`.sync` 迁移后 emit 名不变**（仍是 `update:xxx`），所以子组件往往不用改，父组件批量换即可。
- **`beforeDestroy` 里的清理逻辑别只改名字**：Vue 3 的卸载时机与异步渲染配合时行为更严格，定时器/事件监听漏了会真的泄漏。
- **hash 路由 vs history 路由**：静态托管（Pages/OSS）没有 history fallback，用 `createWebHashHistory` 省事；内部系统有 nginx 配置则用 `createWebHistory`。
- **扫描器的 `node_modules` 白名单**：默认跳过 `node_modules/dist/build/public/static`，如果你的业务代码放在 `public/` 下（老项目常见），用 `--ext` 或改 `IGNORE_DIRS`。

## 五、迁移完成的标准

- `npm run scan` 的输出为 0 命中（或剩下的都是刻意保留的兼容代码，且有注释说明）；
- 类型检查 0 错误，模板也纳入检查（`vue-tsc` 会检查模板表达式）；
- 关键路径有回归用例，尤其是插槽与双向绑定的组合场景。
