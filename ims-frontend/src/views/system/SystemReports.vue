<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card">
        <p class="label">Total Businesses</p>
        <p class="value">{{ totals.total }}</p>
      </div>
      <div class="card">
        <p class="label">Active</p>
        <p class="value text-green">{{ totals.active }}</p>
      </div>
      <div class="card">
        <p class="label">Pending</p>
        <p class="value text-yellow">{{ totals.pending }}</p>
      </div>
      <div class="card">
        <p class="label">Expired</p>
        <p class="value text-red">{{ totals.expired }}</p>
      </div>
    </div>

    <DataTable
      :data="expiring"
      :columns="columns"
      title="Expiring Subscriptions"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'

const businesses = ref([
  { id: 'b1', name: 'Acme Trading', status: 'active' },
  { id: 'b2', name: 'Blue Sky Mart', status: 'active' },
  { id: 'b3', name: 'Habesha Supplies', status: 'expired' },
  { id: 'b4', name: 'Red Star', status: 'pending' }
])

const expiring = ref([
  {
    id: 'e1',
    business_name: 'Blue Sky Mart',
    subscription_plan: 'monthly',
    subscription_end: '2026-02-14',
    status: 'active'
  },
  {
    id: 'e2',
    business_name: 'Habesha Supplies',
    subscription_plan: 'yearly',
    subscription_end: '2026-02-28',
    status: 'expired'
  }
])

const columns = ['business_name', 'subscription_plan', 'subscription_end', 'status']

const totals = computed(() => ({
  total: businesses.value.length,
  active: businesses.value.filter(b => b.status === 'active').length,
  pending: businesses.value.filter(b => b.status === 'pending').length,
  expired: businesses.value.filter(b => b.status === 'expired').length
}))

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>

<style scoped>
.card {
  background: white;
  padding: 14px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.label {
  color: #6b7280;
  font-weight: 600;
}
.value {
  font-size: 20px;
  font-weight: 700;
  color: rgb(76, 38, 131);
}
.text-green { color: #16a34a; }
.text-yellow { color: #d97706; }
.text-red { color: #dc2626; }
</style>
