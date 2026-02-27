<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-purple-800">{{ isEditMode ? 'Edit Purchase' : 'New Purchase' }}</h1>
      <RouterLink to="/purchases" class="btn-secondary">Back to Purchases</RouterLink>
    </div>

    <div class="bg-white rounded shadow p-6 space-y-4">
      <div>
        <label class="block font-semibold mb-1">Supplier</label>
        <select v-model.number="form.supplierId" class="input">
          <option disabled :value="null">Select supplier</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <p class="text-xs text-gray-500">supplierId: {{ form.supplierId ?? '-' }}</p>
      </div>

      <div>
        <label class="block font-semibold mb-1">Warehouse</label>
        <select v-model.number="form.warehouseId" class="input">
          <option disabled :value="null">Select warehouse</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
        <p class="text-xs text-gray-500">warehouseId: {{ form.warehouseId ?? '-' }}</p>
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
        <label class="block font-semibold mb-1">Payment Method</label>
        <select v-model="form.paymentMethod" class="input">
          <option value="cash">cash</option>
          <option value="credit">credit</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold mb-1">Paid Amount</label>
        <input
          v-model.number="form.paidAmount"
          type="number"
          min="0"
          class="input"
          :disabled="!isCreditPayment"
          :placeholder="isCreditPayment ? 'Optional for credit' : 'Auto equals total for cash'"
        />
        <p class="text-xs text-gray-500">
          {{ isCreditPayment ? 'Optional for credit purchases.' : 'For cash purchases, paidAmount is set to totalAmount.' }}
        </p>
      </div>

      <div>
        <label class="block font-semibold mb-1">Note</label>
        <textarea v-model="form.note" class="input"></textarea>
      </div>

      <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

      <div class="flex justify-end gap-2">
        <RouterLink to="/purchases" class="btn-secondary">Cancel</RouterLink>
        <button class="btn-primary" :disabled="saving" @click="savePurchase">
          {{ saving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePurchasesStore } from '@/stores/purchases'
import { useSuppliersStore } from '@/stores/suppliers'
import { useWarehouseStore } from '@/stores/warehouse'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const purchasesStore = usePurchasesStore()
const suppliersStore = useSuppliersStore()
const warehousesStore = useWarehouseStore()
const router = useRouter()
const route = useRoute()
const isEditMode = computed(() => !!route.params.id)

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
const saving = ref(false)
const formError = ref('')
const isCreditPayment = computed(() => form.value.paymentMethod === 'credit')

onMounted(async () => {
  formError.value = ''
  try {
    await Promise.all([suppliersStore.fetchSuppliers(), warehousesStore.fetchWarehouses()])
    if (isEditMode.value) {
      const existing = await purchasesStore.fetchPurchaseById(route.params.id)
      if (!existing) {
        formError.value = 'Purchase not found.'
        return
      }
      form.value = {
        supplierId: Number(existing.supplierId ?? existing.supplier_id ?? null),
        warehouseId: Number(existing.warehouseId ?? existing.warehouse_id ?? null),
        invoiceNumber: existing.invoiceNumber || '',
        totalAmount: Number(existing.totalAmount || 0),
        paidAmount: Number(existing.paidAmount || 0),
        paymentMethod: existing.paymentMethod || 'cash',
        note: existing.note || ''
      }
    }
  } catch {
    formError.value = 'Unable to load suppliers or warehouses. Please create them first.'
  }
})

watch(
  () => [form.value.paymentMethod, form.value.totalAmount],
  () => {
    if (!isCreditPayment.value) {
      form.value.paidAmount = Number(form.value.totalAmount || 0)
    }
  },
  { immediate: true }
)

async function savePurchase() {
  formError.value = ''
  if (!form.value.supplierId) {
    formError.value = 'Supplier is required.'
    return
  }
  if (!form.value.warehouseId) {
    formError.value = 'Warehouse is required.'
    return
  }
  if (form.value.totalAmount <= 0) {
    formError.value = 'Total amount must be greater than 0.'
    return
  }
  const totalAmount = Number(form.value.totalAmount || 0)
  const paidAmount = isCreditPayment.value
    ? Number(form.value.paidAmount || 0)
    : totalAmount

  if (paidAmount < 0) {
    formError.value = 'Paid amount cannot be negative.'
    return
  }
  if (paidAmount > totalAmount) {
    formError.value = 'Paid amount cannot exceed total amount.'
    return
  }

  saving.value = true
  try {
    const payload = {
      supplierId: form.value.supplierId,
      warehouseId: form.value.warehouseId,
      invoiceNumber: form.value.invoiceNumber,
      totalAmount,
      paidAmount,
      paymentMethod: form.value.paymentMethod,
      note: form.value.note
    }
    if (isEditMode.value) {
      await purchasesStore.updatePurchase({ id: route.params.id, ...payload })
    } else {
      await purchasesStore.addPurchase(payload)
    }
    router.push('/purchases')
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Failed to save purchase.'
  } finally {
    saving.value = false
  }
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
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-secondary {
  background: #eee;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
