<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-brand">Purchase Returns</h1>
      <button class="btn-primary" @click="showForm = true">+ New Return</button>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-lg p-6 rounded space-y-4">
        <h2 class="text-lg font-semibold">New Purchase Return</h2>

        <select v-model.number="form.purchaseId" class="input">
          <option disabled :value="null">Select purchase</option>
          <option v-for="p in purchases" :key="p.id" :value="p.id">#{{ p.id }} - {{ p.supplier }}</option>
        </select>

        <input v-model.number="form.totalAmount" type="number" min="1" class="input" placeholder="Total return amount" />
        <textarea v-model="form.reason" class="input" placeholder="Reason"></textarea>

        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="submitReturn">Submit</button>
        </div>
      </div>
    </div>

    <DataTable :data="rows" :columns="columns" title="Returns" :can-edit="false" :can-delete="false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import api, { getResponseData } from '@/services/api'
import { usePurchasesStore } from '@/stores/purchases'

const purchasesStore = usePurchasesStore()
const purchases = computed(() => purchasesStore.purchases)

const columns = ['id', 'purchaseId', 'supplier', 'totalAmount', 'reason', 'status', 'createdAt']
const rows = ref([])
const showForm = ref(false)
const form = ref({ purchaseId: null, totalAmount: 0, reason: '' })

onMounted(async () => {
  await Promise.all([fetchReturns(), purchasesStore.fetchPurchases()])
})

async function fetchReturns() {
  try {
    const res = await api.get('/purchase-returns')
    const payload = getResponseData(res, [])
    rows.value = (Array.isArray(payload) ? payload : []).map(r => ({
      id: r.id,
      purchaseId: r.purchaseId,
      supplier: r.supplier?.name || '-',
      totalAmount: r.totalAmount,
      reason: r.reason,
      status: r.status,
      createdAt: (r.createdAt || '').slice(0, 10)
    }))
  } catch {
    rows.value = []
  }
}

async function submitReturn() {
  const purchase = purchases.value.find(p => p.id === form.value.purchaseId)
  if (!purchase) return

  await api.post('/purchase-returns', {
    purchaseId: purchase.id,
    warehouseId: purchase.warehouseId,
    supplierId: purchase.supplierId,
    totalAmount: form.value.totalAmount,
    reason: form.value.reason
  })

  closeForm()
  await fetchReturns()
}

function closeForm() {
  showForm.value = false
  form.value = { purchaseId: null, totalAmount: 0, reason: '' }
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
</style>
