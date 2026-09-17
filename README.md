# vue3-rspack-starter

**Vue 3 + TypeScript + Rspack 起步模板**，附带一件真实用得上的工具：**Vue2 迁移债务扫描器**。

**在线使用**：<https://jabo2017.github.io/vue3-rspack-starter/>

> 前身是 2018 年的 `study-vue-cli` 脚手架练习仓库。重写的动因很具体：手上有个大型 Vue 2 + webpack 项目要迁移，
> 而「迁到 Vue 3 到底要改多少东西」这个问题，当时只能靠拍脑袋。于是把迁移过程中实际需要的两件事合到一起——
> **一个迁完之后的目标形态（本模板）** 和 **一把量化迁移成本的尺子（扫描器）**。

## 它能解决什么问题

给一个 Vue 2 项目路径，输出一份可交付的迁移报告：

```bash
npm run scan -- --dir ../your-legacy-app --html report.html
```

```
  Vue2 迁移债务扫描 · /path/to/your-legacy-app
  扫描 412 个文件（跳过 0），耗时 68ms

  检测项                                  命中  说明
  ──────────────────────────────────────────────────────────────
  beforeDestroy / destroyed 生命周期        73  Vue 3 重命名为 beforeUnmount / u…
  .sync 修饰符                              66  Vue 3 移除 .sync，改为 v-model:…
  slot-scope / slot="name" 旧插槽语法        18  Vue 3 只认 v-slot；<template slo…
  ...
  ──────────────────────────────────────────────────────────────
  合计 218 处                             MDI 486  等级：高

  依赖风险：
   · vue@^2.6.14 —— 迁移主体，升到 3.x
   · vuex@^3.6.2 —— Vuex 3，官方推荐迁移到 Pinia
   · element-ui@^2.15.0 —— Vue 2 生态 UI 库，需换 element-plus
   · moment@^2.29.1 —— 停止维护且体积大，换 dayjs
```

报告包含三个层次：**汇总表**（给排期用）、**依赖风险**（给技术选型用）、**逐条 `文件:行号` 明细**（给干活的人用）。
扫描器既能跑 CLI，也能在网页上粘代码即算（`/scanner` 页面），两边共用同一份内核 `scripts/scan-core.mjs`。

检测项共 10 类：生命周期改名、`.sync`、旧插槽语法、`filters`、Vue 全局 API、实例事件 API、`functional: true`、
webpack 强耦合写法、`mixins`、EventBus。**MDI（迁移债务指数）** 按「改动单价 × 出错概率」加权求和，详见 [迁移手册](docs/MIGRATION.md)。

## 模板本身

| 依赖 | 版本 | 说明 |
|---|---|---|
| vue | 3.5 | Composition API、`<script setup>` |
| @rspack/core | 2.x | Rust 构建，冷启动与 HMR 快于 webpack 5 |
| vue-router | 5.x | hash 模式，开箱适配静态托管 |
| pinia | 4.x | 替代 Vuex，setup store 与组合式函数同构 |
| typescript | 5.9 | `vue-tsc` 做**模板级**类型检查 |
| vitest | 5.x | 扫描内核 / store / 数据均有单测 |

### 目录结构

```
├── rspack.config.js          # dev / prod 单文件配置（含 PUBLIC_PATH 子路径部署）
├── scripts/
│   ├── scan-core.mjs         # 扫描内核（纯函数，可单测）
│   ├── scan-legacy.mjs       # 扫描 CLI：console / --json / --html
│   └── serve-dist.mjs        # 零依赖本地预览
├── src/
│   ├── router/               # vue-router 5
│   ├── stores/               # pinia setup store
│   ├── views/                # 概览 / 改造对照 / 扫描器
│   ├── components/           # CodeDiff 等通用组件
│   └── data/patterns.ts      # Vue2→Vue3 改造对照数据
├── docs/MIGRATION.md         # 迁移手册：顺序、Rspack 要点、易漏的坑、验收标准
└── tests/                    # vitest 单测
```

## 快速开始

```bash
npm install
npm run dev          # 本地开发，默认 http://localhost:5173
npm run scan -- --dir ../your-legacy-app --html report.html
npm run typecheck    # vue-tsc 类型检查（含模板）
npm test             # 单测
npm run build        # 产出 dist/
PUBLIC_PATH=/your-repo/ npm run build   # 子路径部署
npm run preview      # 本地预览 dist/
```

推送到 `master` 后由 GitHub Actions 自动类型检查 + 跑测试 + 构建 + 部署 Pages。

## 页面

- **概览** —— 技术栈、命令、目录结构
- **改造对照** —— 7 组 Vue2 → Vue3 代码对照（生命周期、`.sync`、插槽、`filters`、全局 API、EventBus、构建链路），支持搜索
- **迁移扫描器** —— 在浏览器里粘 Vue2 代码，实时算出命中清单与 MDI，扫描历史存本机

## Roadmap

- [ ] 扫描器支持 AST 模式（`@vue/compiler-sfc`），识别模板里的 `v-model` 误用与 prop 命名冲突
- [ ] 可选的自动修复（codemod）：生命周期改名、`.sync`、`slot-scope` 三类机械替换先做起
- [ ] 报告里加「按目录聚合」，方便大仓分团队认领

## License

[MIT](./LICENSE)
