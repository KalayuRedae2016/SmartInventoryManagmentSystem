<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-brand">Sales Payments</h1>
    </div>

    <DataTable :data="rows" :columns="columns" title="Payments" :can-edit="false" :can-delete="false">
      <template #rowActions="{ row }">
        <button
          v-if="canRecord && row.status !== 'paid'"
          class="action-btn"
          @click="markPaid(row)"
        >
          Mark Paid
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { useAuthStore } from '@/stores/auth'
import { useSalesStore } from '@/stores/sales'

const auth = useAuthStore()
const salesStore = useSalesStore()

const role = computed(() => auth.user?.role || '')
const canRecord = computed(() => ['admin', 'owner', 'accountant', 'superadmin'].includes(role.value))
const columns = ['sale_id', 'customer', 'amount', 'status', 'paymentMethod']

const rows = computed(() =>
  salesStore.sales.map(s => ({
    id: s.id,
    sale_id: s.id,
    customer: s.customer,
    amount: s.totalAmount,
    paidAmount: s.paidAmount,
    status: s.status,
    paymentMethod: s.paymentMethod || 'cash'
  }))
)

onMounted(() => {
  salesStore.fetchSales()
})

async function markPaid(row) {
  await salesStore.updateSale({
    id: row.id,
    paidAmount: row.amount,
    paymentMethod: row.paymentMethod
  })
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.action-btn {
  margin-left: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(76, 38, 131);
  color: white;
  font-size: 12px;
}
</style>
