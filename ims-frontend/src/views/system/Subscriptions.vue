<template>
  <div class="space-y-4">
    <DataTable
      :data="payments"
      :columns="columns"
      title="Subscription Payments"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button
          v-if="row.status === 'pending'"
          class="action-btn"
          @click="approvePayment(row)"
        >
          Approve
        </button>
        <button
          v-if="row.status === 'pending'"
          class="action-btn danger"
          @click="rejectPayment(row)"
        >
          Reject
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'

const columns = ['business_name', 'plan', 'amount', 'status', 'paid_at']

const payments = ref([
  {
    id: 'p-001',
    business_id: '11111111-1111-1111-1111-111111111111',
    business_name: 'Acme Trading',
    plan: 'trial',
    amount: 0,
    status: 'pending',
    paid_at: '2026-02-01'
  },
  {
    id: 'p-002',
    business_id: '22222222-2222-2222-2222-222222222222',
    business_name: 'Blue Sky Mart',
    plan: 'monthly',
    amount: 49,
    status: 'approved',
    paid_at: '2026-01-15'
  }
])

function approvePayment(payment) {
  payment.status = 'approved'
}

function rejectPayment(payment) {
  payment.status = 'rejected'
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
.action-btn.danger {
  background: #dc2626;
}
</style>
