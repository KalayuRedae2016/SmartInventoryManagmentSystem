<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-purple-800">New Purchase</h1>
      <RouterLink to="/purchases" class="btn-secondary">Back to Purchases</RouterLink>
    </div>

    <div class="bg-white rounded shadow p-6 space-y-4">
      <div>
        <label class="block font-semibold mb-1">Supplier</label>
        <select v-model.number="form.supplierId" class="input">
          <option disabled :value="null">Select supplier</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold mb-1">Warehouse</label>
        <select v-model.number="form.warehouseId" class="input">
          <option disabled :value="null">Select warehouse</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold mb-1">Invoice Number</label>
        <input v-model="form.invoiceNumber" class="input" placeholder="PO-000001" />
      </div>

      <div>
        <label class="block font-semibold mb-1">Total Amount</label>
        <input v-model.number="form.totalAmount" type="number" min="1" class="input" />
      </div>

      <div>
        <label class="block font-semibold mb-1">Paid Amount</label>
        <input v-model.number="form.paidAmount" type="number" min="0" class="input" />
      </div>

      <div>
        <label class="block font-semibold mb-1">Payment Method</label>
        <select v-model="form.paymentMethod" class="input">
          <option value="cash">cash</option>
          <option value="credit">credit</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold mb-1">Note</label>
        <textarea v-model="form.note" class="input"></textarea>
      </div>

      <div class="flex justify-end gap-2">
        <RouterLink to="/purchases" class="btn-secondary">Cancel</RouterLink>
        <button class="btn-primary" @click="savePurchase">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePurchasesStore } from '@/stores/purchases'
import { useSuppliersStore } from '@/stores/suppliers'
import { useWarehouseStore } from '@/stores/warehouse'
import { RouterLink, useRouter } from 'vue-router'

const purchasesStore = usePurchasesStore()
const suppliersStore = useSuppliersStore()
const warehousesStore = useWarehouseStore()
const router = useRouter()

const suppliers = computed(() => suppliersStore.suppliers)
const warehouses = computed(() => warehousesStore.warehouses)

const form = ref({
  supplierId: null,
  warehouseId: null,
  invoiceNumber: `PO-${Date.now().toString().slice(-6)}`,
  totalAmount: 0,
  paidAmount: 0,
  paymentMethod: 'cash',
  note: ''
})

onMounted(async () => {
  await Promise.all([suppliersStore.fetchSuppliers(), warehousesStore.fetchWarehouses()])
})

async function savePurchase() {
  if (!form.value.supplierId || !form.value.warehouseId || form.value.totalAmount <= 0) return
  if (form.value.paidAmount > form.value.totalAmount) return

  await purchasesStore.addPurchase({
    supplierId: form.value.supplierId,
    warehouseId: form.value.warehouseId,
    invoiceNumber: form.value.invoiceNumber,
    totalAmount: form.value.totalAmount,
    paidAmount: form.value.paidAmount,
    paymentMethod: form.value.paymentMethod,
    note: form.value.note
  })

  router.push('/purchases')
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
