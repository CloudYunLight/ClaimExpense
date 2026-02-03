<template>
  <div class="status-chart">
    <div v-for="item in dataset" :key="item.status" class="status-row">
      <div class="row-header">
        <span class="dot" :style="{ backgroundColor: metaColor(item.status) }" />
        <span>{{ metaLabel(item.status) }}</span>
        <small>{{ item.statusCount }} 个清单</small>
      </div>
      <div class="bar">
        <span
          class="bar-fill"
          :style="{
            width: `${Math.min(item.percentage, 100)}%`,
            background: metaColor(item.status)
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusDistributionItem } from '@/types/dashboard'
import { getStatusMeta } from '@/utils/constants'
import type { ReimbursementStatus } from '@/types/list'

defineProps<{ dataset: StatusDistributionItem[] }>()

const normalizeStatus = (status: number): ReimbursementStatus => {
  if (status <= 0) return 0
  if (status >= 2) return 2
  return 1
}

const metaLabel = (status: number) => getStatusMeta(normalizeStatus(status)).label
const metaColor = (status: number) => getStatusMeta(normalizeStatus(status)).color
</script>

<style scoped>
.status-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.row-header {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-flex;
}

.bar {
  width: 100%;
  height: 10px;
  background: rgba(15, 23, 42, 0.08);
  border-radius: 999px;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}
</style>
