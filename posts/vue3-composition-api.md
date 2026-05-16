---
title: Vue 3 Composition API 深度指南
tag: 前端
date: 2025 年 1 月 10 日
readTime: 15
author: 林墨
image: https://picsum.photos/seed/vue3-comp-api/800/400.jpg
---
## 为什么需要 Composition API？
Options API 把逻辑按选项类型分散到 `data`、`methods`、`computed` 中，当组件变得复杂时，**相关的逻辑被拆得七零八落**。
Composition API 的核心思想是：**将相关逻辑组织在一起**。
## 核心概念
### ref — 基本类型的响应式
```js
import { ref } from 'vue'
const count = ref(0)
console.log(count.value) // 0
count.value++
```
### reactive — 对象的响应式
```js
import { reactive } from 'vue'
const state = reactive({
  user: null,
  loading: false
})
```
### computed — 派生状态
```js
const fullName = computed(() => `${first.value} ${last.value}`)
```
## Composable 函数
将逻辑提取为可复用的函数：
```js
// useCounter.js
export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  const decrement = () => count.value--
  return { count, increment, decrement }
}
```
> 按功能模块组织 composable：useAuth、useCart、useTheme……每个封装自己的状态和逻辑，对外暴露清晰接口。