<template>
  <header class="app-header">
    <div>
      <p class="eyebrow">{{ route.meta.title ?? 'Expense Claim' }}</p>
      <h1>{{ greeting }}</h1>
    </div>
    <div class="header-actions">
      <div class="user-pill">
        <span class="user-name">{{ authStore.user?.realName ?? authStore.user?.username }}</span>
        <small>{{ authStore.user?.role === 'admin' ? '管理员' : '普通用户' }}</small>
      </div>
      <button type="button" class="ghost" @click="goProfile">修改密码</button>
      <button type="button" class="primary" @click="handleLogout">退出登录</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '夜间也要注意休息'
})

const handleLogout = async () => {
  await authStore.logout()
  toast.info('已退出登录')
  router.push({ name: 'login' })
}

const goProfile = () => {
  router.push({ name: 'change-password' })
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem;
  background: transparent;
}

.eyebrow {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
  margin: 0 0 0.25rem;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-pill {
  background: rgba(37, 99, 235, 0.1);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-weight: 600;
}

button {
  border-radius: 999px;
  padding: 0.55rem 1.25rem;
  border: 1px solid transparent;
  cursor: pointer;
}

button.primary {
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  color: white;
}

button.ghost {
  background: transparent;
  border-color: rgba(37, 99, 235, 0.2);
  color: var(--brand-primary);
}

@media (max-width: 960px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
