<template>
  <div class="empty-state">
    <slot>暂无数据</slot>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: 16px;
}
</style>
