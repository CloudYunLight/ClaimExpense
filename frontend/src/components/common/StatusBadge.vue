<template>
  <span class="status" :style="{ backgroundColor: badgeColor }">{{ badgeLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusMeta } from '@/utils/constants'
import type { ReimbursementStatus } from '@/types/list'

const props = defineProps<{ status: ReimbursementStatus }>()

const badgeColor = computed(() => getStatusMeta(props.status).color)
const badgeLabel = computed(() => getStatusMeta(props.status).label)
</script>

<style scoped>
.status {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  color: #0f172a;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
