<template>
  <div class="toast-host" aria-live="assertive" aria-atomic="true">
    <TransitionGroup name="toast-fade">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="`toast-${toast.type}`"
      >
        <span>{{ toast.message }}</span>
        <button type="button" class="toast-dismiss" @click="dismiss(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-host {
  position: fixed;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 9999;
}

.toast-card {
  min-width: 240px;
  border-radius: 999px;
  padding: 0.75rem 1rem 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.17);
  color: #0f172a;
  background: #f8fafc;
  font-weight: 500;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.toast-success {
  background: linear-gradient(120deg, #ecfccb, #d9f99d);
}

.toast-error {
  background: linear-gradient(120deg, #fee2e2, #fecaca);
}

.toast-info {
  background: linear-gradient(120deg, #e0f2fe, #bae6fd);
}

.toast-dismiss {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
