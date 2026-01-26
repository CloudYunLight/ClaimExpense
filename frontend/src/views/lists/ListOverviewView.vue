<template>
  <div class="grid">
    <section class="panel">
      <h2>筛选我的清单</h2>
      <form class="filters" @submit.prevent="handleSearch">
        <label>
          活动名称
          <input v-model.trim="filters.activityName" type="text" placeholder="模糊搜索" />
        </label>
        <label>
          报销状态
          <select v-model="filters.status">
            <option value="">全部</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          开始时间
          <input v-model="filters.startTime" type="date" />
        </label>
        <label>
          结束时间
          <input v-model="filters.endTime" type="date" />
        </label>
        <button type="submit">应用筛选</button>
      </form>
      <div class="create-card">
        <h3>快速创建报销清单</h3>
        <p>根据 Document 的约束，每个清单绑定唯一活动名称，三小时内禁止重名。</p>
        <form @submit.prevent="handleCreate">
          <input v-model.trim="newListName" type="text" placeholder="活动名称" required />
          <button type="submit" :disabled="creating">
            {{ creating ? '创建中...' : '创建清单' }}
          </button>
        </form>
      </div>
    </section>
    <section class="panel table-panel">
      <header class="panel-header">
        <div>
          <h2>我的报销清单</h2>
          <p>{{ pagination.total }} 条记录</p>
        </div>
        <div class="pager">
          <button type="button" :disabled="pagination.pageNum === 1" @click="changePage(-1)">上一页</button>
          <button type="button" :disabled="!hasMore" @click="changePage(1)">下一页</button>
        </div>
      </header>
      <div v-if="loading" class="skeleton">加载中...</div>
      <template v-else>
        <table v-if="lists.length" class="list-table">
          <thead>
            <tr>
              <th>活动名称</th>
              <th>总金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>状态更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in lists" :key="item.listId">
              <td>{{ item.activityName }}</td>
              <td>{{ formatCurrency(item.totalAmount) }}</td>
              <td>
                <StatusBadge :status="item.status" />
              </td>
              <td>{{ formatDateTime(item.createTime) }}</td>
              <td>{{ formatDateTime(item.updateTime) }}</td>
              <td>
                <select v-model.number="statusDraft[item.listId]" @change="submitStatus(item)">
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </td>
              <td class="actions">
                <button type="button" class="ghost" @click="viewDetail(item.listId)">详情</button>
                <button type="button" class="warn" @click="deleteList(item.listId)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else>暂无清单，先创建一个吧</EmptyState>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as listApi from '@/api/lists'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { STATUS_OPTIONS as statusOptions } from '@/utils/constants'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { ReimbursementListItem, ReimbursementStatus } from '@/types/list'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()

const filters = reactive({
  activityName: '',
  status: '',
  startTime: '',
  endTime: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const lists = ref<ReimbursementListItem[]>([])
const loading = ref(false)
const creating = ref(false)
const newListName = ref('')
const statusDraft = reactive<Record<number, number>>({})

const hasMore = computed(
  () => pagination.pageNum * pagination.pageSize < pagination.total
)

const fetchLists = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      activityName: filters.activityName || undefined,
      status:
        filters.status === '' ? undefined : (Number(filters.status) as ReimbursementStatus),
      startTime: filters.startTime || undefined,
      endTime: filters.endTime || undefined
    }
    const data = await listApi.fetchLists(params)
    const payload = data.list ?? data.records ?? []
    lists.value = payload
    pagination.total = data.total ?? payload.length
    payload.forEach((item) => {
      statusDraft[item.listId] = item.status
    })
  } catch (error) {
    toast.error('无法获取清单列表')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchLists()
}

const changePage = (delta: number) => {
  pagination.pageNum = Math.max(1, pagination.pageNum + delta)
  fetchLists()
}

const handleCreate = async () => {
  if (!newListName.value) return
  creating.value = true
  try {
    await listApi.createList({ activityName: newListName.value })
    toast.success('清单创建成功')
    newListName.value = ''
    fetchLists()
  } catch (error) {
    toast.error('创建失败，请确认同名限制')
  } finally {
    creating.value = false
  }
}

const submitStatus = async (item: ReimbursementListItem) => {
  const status = statusDraft[item.listId]
  if (status === undefined || status === item.status) return
  try {
    await listApi.updateListStatus(item.listId, { status: status as ReimbursementStatus })
    toast.success('状态已更新')
    fetchLists()
  } catch (error) {
    statusDraft[item.listId] = item.status
    toast.error('状态更新失败')
  }
}

const deleteList = async (listId: number) => {
  if (!window.confirm('删除后将级联移除账单，确认继续？')) return
  try {
    await listApi.deleteList(listId)
    toast.info('清单已删除')
    fetchLists()
  } catch (error) {
    toast.error('删除失败')
  }
}

const viewDetail = (listId: number) => {
  router.push({ name: 'list-detail', params: { listId } })
}

onMounted(fetchLists)
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(280px, 320px) 1fr;
  gap: 2rem;
}

.panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

.filters input,
.filters select {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 0.65rem;
}

.filters button {
  margin-top: 0.5rem;
  border: none;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.create-card {
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.08);
}

.create-card form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-card input {
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  padding: 0.6rem 0.75rem;
}

.create-card button {
  border: none;
  padding: 0.65rem;
  border-radius: 12px;
  background: linear-gradient(120deg, #38bdf8, #6366f1);
  color: white;
}

.table-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pager button {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 0.35rem 0.75rem;
  margin-left: 0.35rem;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
}

.list-table th,
.list-table td {
  padding: 0.85rem;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.actions {
  display: flex;
  gap: 0.35rem;
}

.actions button {
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}

.actions .ghost {
  background: rgba(37, 99, 235, 0.1);
}

.actions .warn {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.skeleton {
  padding: 2rem;
  text-align: center;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
