<template>
  <div class="app-shell">
    <AppSidebar :items="navItems" />
    <div class="app-shell__content">
      <AppHeader />
      <main>
        <RouterView />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { NAV_ITEMS } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const navItems = computed(() => {
  const role = authStore.user?.role ?? 'user'
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
})
</script>
