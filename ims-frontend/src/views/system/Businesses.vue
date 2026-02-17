<template>
  <div class="space-y-4">
    <DataTable
      :data="businesses"
      :columns="columns"
      title="Businesses"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button
          v-if="row.status !== 'active'"
          class="action-btn"
          @click="activateBusiness(row)"
        >
          Activate
        </button>
        <button
          v-if="row.status === 'active'"
          class="action-btn warn"
          @click="suspendBusiness(row)"
        >
          Suspend
        </button>
        <button
          v-if="row.status === 'active' || row.status === 'suspended'"
          class="action-btn danger"
          @click="expireBusiness(row)"
        >
          Expire
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'

const columns = [
  'name',
  'email',
  'phone',
  'status',
  'subscription_plan',
  'subscription_start',
  'subscription_end'
]

const businesses = ref([
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Acme Trading',
    email: 'admin@acme.com',
    phone: '0900112233',
    status: 'pending',
    subscription_plan: 'trial',
    subscription_start: '',
    subscription_end: '',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Blue Sky Mart',
    email: 'owner@bluesky.com',
    phone: '0900223344',
    status: 'active',
    subscription_plan: 'monthly',
    subscription_start: '2026-01-15',
    subscription_end: '2026-02-14',
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-20T12:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Habesha Supplies',
    email: 'contact@habesha.com',
    phone: '0900334455',
    status: 'suspended',
    subscription_plan: 'yearly',
    subscription_start: '2025-06-01',
    subscription_end: '2026-05-31',
    created_at: '2025-06-01T08:00:00Z',
    updated_at: '2026-01-30T09:00:00Z'
  }
])

function activateBusiness(business) {
  business.status = 'active'
  const today = new Date()
  const plan = business.subscription_plan
  const start = today.toISOString().slice(0, 10)
  business.subscription_start = start
  business.subscription_end = addPlanDays(today, plan)
  business.updated_at = new Date().toISOString()
}

function suspendBusiness(business) {
  business.status = 'suspended'
  business.updated_at = new Date().toISOString()
}

function expireBusiness(business) {
  business.status = 'expired'
  business.updated_at = new Date().toISOString()
}

function addPlanDays(date, plan) {
  const d = new Date(date)
  if (plan === 'trial') d.setDate(d.getDate() + 14)
  else if (plan === 'monthly') d.setDate(d.getDate() + 30)
  else if (plan === 'yearly') d.setDate(d.getDate() + 365)
  return d.toISOString().slice(0, 10)
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>

<style scoped>
.action-btn {
  margin-left: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(76, 38, 131);
  color: white;
  font-size: 12px;
}
.action-btn.warn {
  background: #f59e0b;
}
.action-btn.danger {
  background: #dc2626;
}
</style>
