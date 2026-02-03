<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="dot" />
      <div>
        <p class="brand-title">Expense Claim</p>
        <small>Vue + Node.js</small>
      </div>
    </div>
    <nav>
      <button
        v-for="item in items"
        :key="item.routeName"
        :class="['nav-item', { active: route.name === item.routeName }]"
        type="button"
        @click="navigate(item.routeName)"
      >
        <span class="icon">{{ iconMap[item.icon] ?? '•' }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

interface SidebarItem {
  label: string
  routeName: string
  icon: string
}

const props = defineProps<{ items: SidebarItem[] }>()

const route = useRoute()
const router = useRouter()

const iconMap: Record<string, string> = {
  dashboard: '📊',
  layers: '🗂️',
  lock: '🔐',
  users: '👥'
}

const navigate = (name: string) => {
  if (route.name !== name) {
    router.push({ name })
  }
}
</script>

<style scoped>
.sidebar {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(120deg, #38bdf8, #6366f1);
  display: inline-block;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  border: none;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  text-align: left;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.12);
}

.icon {
  font-size: 1.1rem;
}

@media (max-width: 960px) {
  .sidebar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
