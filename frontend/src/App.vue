<template>
  <ToastHost />
  <RouterView />
</template>

<!--<ToastHost />
这是一个全局 Toast（消息提示）容器组件。通常它会：
渲染一个固定定位（position: fixed）的区域（比如右上角或底部）
接收来自 Pinia 或全局事件总线的通知，动态显示/隐藏 Toast
必须放在 App.vue 中，以确保在任何路由页面下都能显示提示

<RouterView />
Vue Router 的核心组件，是当前路由匹配到的页面组件的渲染出口。
所有 views/ 下的页面（如 Login.vue, Dashboard.vue）都会在这里被动态替换显示。-->

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastHost from '@/components/feedback/ToastHost.vue'
</script>
