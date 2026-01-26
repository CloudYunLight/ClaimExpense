<template>
  <div class="data-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>

<style scoped>
.data-card {
  padding: 1.5rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.02));
  border: 1px solid rgba(37, 99, 235, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.value {
  font-size: 2rem;
  font-weight: 700;
}
</style>
