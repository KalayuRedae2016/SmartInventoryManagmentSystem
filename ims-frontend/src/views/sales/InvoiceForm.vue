<template>
  <div class="space-y-4">
    <h2 class="title">{{ isEditMode ? 'Edit Invoice' : 'New Invoice' }}</h2>

    <div>
      <label class="label">Customer</label>
      <select v-model.number="form.customerId" class="input">
        <option disabled :value="null">Select customer</option>
        <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <p class="subtext">customerId: {{ form.customerId ?? '-' }}</p>
    </div>

    <div>
      <label class="label">Warehouse</label>
      <select v-model.number="form.warehouseId" class="input">
        <option disabled :value="null">Select warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <p class="subtext">warehouseId: {{ form.warehouseId ?? '-' }}</p>
    </div>

    <input v-model="form.invoiceNumber" placeholder="Invoice Number" class="input" />
    <input v-model="form.saleDate" type="date" placeholder="Sale Date" class="input" />
    <input v-model.number="form.totalAmount" type="number" min="1" placeholder="Total Amount" class="input" />

    <select v-model="form.paymentMethod" class="input">
      <option value="cash">cash</option>
      <option value="bank_transfer">bank_transfer</option>
      <option value="mobile_payment">mobile_payment</option>
    </select>

    <input
      v-model.number="form.paidAmount"
      type="number"
      min="0"
      :disabled="!isDeferredPayment"
      :placeholder="isDeferredPayment ? 'Optional paid amount' : 'Auto equals total for cash'"
      class="input"
    />
    <p class="subtext">{{ isDeferredPayment ? 'Paid amount is optional.' : 'For cash, paid amount is auto set to total amount.' }}</p>

    <button class="btn" @click="save">{{ isEditMode ? 'Update' : 'Save' }}</button>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useCustomersStore } from '@/stores/customers'
import { useWarehouseStore } from '@/stores/warehouse'
import { useRoute, useRouter } from 'vue-router'

const salesStore = useSalesStore()
const customersStore = useCustomersStore()
const warehousesStore = useWarehouseStore()
const router = useRouter()
const route = useRoute()
const isEditMode = computed(() => !!route.params.id)

const customers = computed(() => customersStore.customers)
const warehouses = computed(() => warehousesStore.warehouses)
const isDeferredPayment = computed(() => form.value.paymentMethod !== 'cash')

const form = ref({
  customerId: null,
  warehouseId: null,
  invoiceNumber: `SO-${Date.now().toString().slice(-6)}`,
  saleDate: new Date().toISOString().slice(0, 10),
  totalAmount: null,
  paidAmount: 0,
  paymentMethod: 'cash'
})

onMounted(async () => {
  await Promise.all([customersStore.fetchCustomers(), warehousesStore.fetchWarehouses()])
  if (isEditMode.value) {
    const existing = await salesStore.fetchSaleById(route.params.id)
    if (!existing) return
    form.value = {
      customerId: Number(existing.customerId ?? existing.customer_id ?? null),
      warehouseId: Number(existing.warehouseId ?? existing.warehouse_id ?? null),
      invoiceNumber: existing.invoiceNumber || `SO-${Date.now().toString().slice(-6)}`,
      saleDate: String(existing.saleDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      totalAmount: existing.totalAmount == null || existing.totalAmount === '' ? null : Number(existing.totalAmount),
      paidAmount: Number(existing.paidAmount || 0),
      paymentMethod: existing.paymentMethod || 'cash'
    }
  }
})

watch(
  () => [form.value.paymentMethod, form.value.totalAmount],
  () => {
    if (!isDeferredPayment.value) {
      form.value.paidAmount = Number(form.value.totalAmount || 0)
    }
  },
  { immediate: true }
)

async function save() {
  if (!form.value.customerId || !form.value.warehouseId || form.value.totalAmount <= 0) return
  const totalAmount = Number(form.value.totalAmount || 0)
  const paidAmount = isDeferredPayment.value
    ? Number(form.value.paidAmount || 0)
    : totalAmount

  const payload = {
    customerId: form.value.customerId,
    warehouseId: form.value.warehouseId,
    invoiceNumber: String(form.value.invoiceNumber || '').trim() || `SO-${Date.now().toString().slice(-6)}`,
    saleDate: form.value.saleDate || new Date().toISOString().slice(0, 10),
    totalAmount,
    paidAmount,
    paymentMethod: form.value.paymentMethod,
    note: ''
  }

  if (isEditMode.value) {
    await salesStore.updateSale({ id: route.params.id, ...payload })
  } else {
    await salesStore.addSale(payload)
  }

  router.push('/sales/invoices')
}
</script>

<style scoped>
.title {
  color: rgb(76, 38, 131);
}
.input {
  display: block;
  margin-bottom: 10px;
  padding: 8px;
  width: 320px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.subtext {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}
.btn {
  background: rgb(76, 38, 131);
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
}
</style>
