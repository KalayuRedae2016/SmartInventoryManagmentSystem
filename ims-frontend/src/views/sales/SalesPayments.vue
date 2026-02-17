<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-brand">Sales Payments</h1>
      <button
        v-if="canRecord"
        class="btn-primary"
        @click="showForm = true"
      >
        + Record Payment
      </button>
    </div>

    <!-- Record Payment Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
        <h2 class="text-lg font-semibold">Record Payment</h2>

        <input v-model="form.sale_id" class="input" placeholder="Sale ID" />
        <input v-model="form.customer" class="input" placeholder="Customer Name" />
        <input v-model.number="form.amount" type="number" min="0" class="input" placeholder="Amount" />
        <select v-model="form.method" class="input">
          <option value="cash">cash</option>
          <option value="bank">bank</option>
          <option value="mobile">mobile</option>
        </select>

        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="submitPayment">Save</button>
        </div>
      </div>
    </div>

    <DataTable
      :data="payments"
      :columns="columns"
      title="Payments"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    >
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
import { ref, computed } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const role = computed(() => auth.user?.role || '')

const canRecord = computed(() =>
  ['admin', 'owner', 'accountant'].includes(role.value)
)

const columns = ['sale_id', 'customer', 'amount', 'method', 'status', 'paid_at']

const payments = ref([
  {
    id: 'sp-001',
    business_id: '11111111-1111-1111-1111-111111111111',
    sale_id: 'd0a1b2c3-4d5e-4f60-9a7b-8c9d0e1f2a01',
    customer: 'John Doe',
    amount: 1500,
    method: 'cash',
    status: 'partial',
    paid_at: '2026-02-01'
  },
  {
    id: 'sp-002',
    business_id: '11111111-1111-1111-1111-111111111111',
    sale_id: 'd0a1b2c3-4d5e-4f60-9a7b-8c9d0e1f2a01',
    customer: 'John Doe',
    amount: 1500,
    method: 'bank',
    status: 'paid',
    paid_at: '2026-02-03'
  }
])

const showForm = ref(false)
const form = ref({
  sale_id: '',
  customer: '',
  amount: 0,
  method: 'cash'
})

function submitPayment() {
  payments.value.push({
    id: `sp-${Date.now()}`,
    business_id: '11111111-1111-1111-1111-111111111111',
    sale_id: form.value.sale_id,
    customer: form.value.customer,
    amount: form.value.amount,
    method: form.value.method,
    status: 'paid',
    paid_at: new Date().toISOString().slice(0, 10)
  })
  closeForm()
}

function closeForm() {
  showForm.value = false
  form.value = { sale_id: '', customer: '', amount: 0, method: 'cash' }
}

function markPaid(row) {
  row.status = 'paid'
  row.paid_at = new Date().toISOString().slice(0, 10)
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
}
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
.action-btn {
  margin-left: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(76, 38, 131);
  color: white;
  font-size: 12px;
}
</style>
