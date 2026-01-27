<template>
  <footer class="app-footer">
    <div class="app-footer__meta">
      <span>© {{ year }} Expense Claim Studio</span>
      <span class="dot" />
      <span>智能报销可视化平台</span>
    </div>
    <a :href="copyrightLink" class="app-footer__link" target="_blank" rel="noopener noreferrer">
      查看版权说明 →
    </a>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { COPYRIGHT_FALLBACK_URL } from '@/utils/constants'

const year = new Date().getFullYear()
const copyrightLink = computed(
  () => import.meta.env.VITE_COPYRIGHT_URL ?? COPYRIGHT_FALLBACK_URL
)
</script>

<style scoped>
.app-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 2rem 2rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.app-footer__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-footer__meta .dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.3);
}

.app-footer__link {
  color: var(--brand-primary);
  font-weight: 600;
  border-bottom: 1px solid rgba(37, 99, 235, 0.2);
  padding-bottom: 2px;
}

.app-footer__link:hover {
  color: var(--brand-secondary);
  border-color: rgba(14, 165, 233, 0.2);
}
</style>
