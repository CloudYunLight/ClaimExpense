<template>
  <ToastHost />
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastHost from '@/components/feedback/ToastHost.vue'
</script>
