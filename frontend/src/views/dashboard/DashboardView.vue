<template>
  <section class="dashboard">
    <header class="panel-header">
      <div>
        <h2>个人报销大盘</h2>
        <p>实时同步 Document 中定义的汇总指标与状态分布</p>
      </div>
      <form class="filters" @submit.prevent="loadData">
        <label>
          开始日期
          <input v-model="filters.startDate" type="date" />
        </label>
        <label>
          结束日期
          <input v-model="filters.endDate" type="date" />
        </label>
        <button type="submit">刷新</button>
      </form>
    </header>

    <div class="cards">
      <DataCard label="报销清单" :value="summary.totalListCount.toString()" />
      <DataCard label="总金额" :value="formatCurrency(summary.totalAmount)" />
      <DataCard label="已回款" :value="formatCurrency(summary.repaidAmount)" />
      <DataCard label="未回款" :value="formatCurrency(summary.unrepaidAmount)" />
    </div>

    <section class="panel">
      <div class="panel-header">
        <h3>状态占比</h3>
        <p>展示未报销 / 已上交 / 已回款三大态</p>
      </div>
      <StatusBreakdown :dataset="statusData" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardSummary, StatusDistributionItem } from '@/types/dashboard'
import DataCard from '@/components/common/DataCard.vue'
import StatusBreakdown from '@/components/charts/StatusBreakdown.vue'
import { formatCurrency } from '@/utils/format'
import { useToast } from '@/composables/useToast'

const filters = reactive({
  startDate: '',
  endDate: ''
})

const summary = reactive<DashboardSummary>({
  totalListCount: 0,
  totalAmount: 0,
  repaidAmount: 0,
  unrepaidAmount: 0,
  unrepaidListCount: 0,
  submittedListCount: 0,
  repaidListCount: 0
})

const statusData = ref<StatusDistributionItem[]>([])
const toast = useToast()

const loadData = async () => {
  try {
    const [summaryData, status] = await Promise.all([
      dashboardApi.getSummary(filters),
      dashboardApi.getStatusDistribution(filters)
    ])
    Object.assign(summary, summaryData)
    statusData.value = status
  } catch (error) {
    toast.error('大盘数据加载失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filters label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}

.filters input {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.4rem 0.6rem;
}

.filters button {
  border-radius: 12px;
  border: none;
  padding: 0.5rem 1rem;
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}
</style>
