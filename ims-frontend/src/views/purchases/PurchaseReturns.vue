<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-brand">Purchase Returns</h1>
      <button
        v-if="canCreate"
        class="btn-primary"
        @click="showForm = true"
      >
        + New Return
      </button>
    </div>

    <!-- Create Return Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
        <h2 class="text-lg font-semibold">New Purchase Return</h2>

        <input v-model="form.purchase_id" class="input" placeholder="Purchase ID" />
        <input v-model="form.supplier" class="input" placeholder="Supplier" />
        <input v-model.number="form.quantity" type="number" min="1" class="input" placeholder="Quantity" />
        <textarea v-model="form.reason" class="input" placeholder="Reason"></textarea>

        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="submitReturn">Submit</button>
        </div>
      </div>
    </div>

    <DataTable
      :data="returns"
      :columns="columns"
      title="Returns"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button
          v-if="canApprove && row.status === 'pending'"
          class="action-btn"
          @click="approve(row)"
        >
          Approve
        </button>
        <button
          v-if="canApprove && row.status === 'pending'"
          class="action-btn danger"
          @click="reject(row)"
        >
          Reject
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

const canCreate = computed(() => role.value === 'purchase' || role.value === 'owner' || role.value === 'admin')
const canApprove = computed(() => role.value === 'owner' || role.value === 'admin')

const columns = ['purchase_id', 'supplier', 'quantity', 'reason', 'status', 'created_at']

const returns = ref([
  {
    id: 'pr-001',
    business_id: '11111111-1111-1111-1111-111111111111',
    purchase_id: 'c3b1f2e4-7b6a-4a0f-9b2c-1d3e5f6a7b01',
    supplier: 'ABC Supplier',
    quantity: 5,
    reason: 'Damaged items',
    status: 'pending',
    created_at: '2026-02-01T09:00:00Z'
  },
  {
    id: 'pr-002',
    business_id: '11111111-1111-1111-1111-111111111111',
    purchase_id: 'c3b1f2e4-7b6a-4a0f-9b2c-1d3e5f6a7b01',
    supplier: 'ABC Supplier',
    quantity: 2,
    reason: 'Wrong size',
    status: 'approved',
    created_at: '2026-01-28T10:30:00Z'
  }
])

const showForm = ref(false)
const form = ref({
  purchase_id: '',
  supplier: '',
  quantity: 1,
  reason: ''
})

function submitReturn() {
  returns.value.push({
    id: `pr-${Date.now()}`,
    business_id: '11111111-1111-1111-1111-111111111111',
    purchase_id: form.value.purchase_id,
    supplier: form.value.supplier,
    quantity: form.value.quantity,
    reason: form.value.reason,
    status: 'pending',
    created_at: new Date().toISOString()
  })
  closeForm()
}

function closeForm() {
  showForm.value = false
  form.value = { purchase_id: '', supplier: '', quantity: 1, reason: '' }
}

function approve(row) {
  row.status = 'approved'
}

function reject(row) {
  row.status = 'rejected'
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
.action-btn.danger {
  background: #dc2626;
}
</style>
