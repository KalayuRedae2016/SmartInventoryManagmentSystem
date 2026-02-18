<template>
  <div class="space-y-4">
    <h2 class="title">New Invoice</h2>

    <select v-model.number="form.customerId" class="input">
      <option disabled :value="null">Select customer</option>
      <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>

    <select v-model.number="form.warehouseId" class="input">
      <option disabled :value="null">Select warehouse</option>
      <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
    </select>

    <input v-model.number="form.totalAmount" type="number" min="1" placeholder="Total Amount" class="input" />
    <input v-model.number="form.paidAmount" type="number" min="0" placeholder="Paid Amount" class="input" />

    <select v-model="form.paymentMethod" class="input">
      <option value="cash">cash</option>
      <option value="bank">bank</option>
      <option value="mobile">mobile</option>
    </select>

    <button class="btn" @click="save">Save</button>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useCustomersStore } from '@/stores/customers'
import { useWarehouseStore } from '@/stores/warehouse'
import { useRouter } from 'vue-router'

const salesStore = useSalesStore()
const customersStore = useCustomersStore()
const warehousesStore = useWarehouseStore()
const router = useRouter()

const customers = computed(() => customersStore.customers)
const warehouses = computed(() => warehousesStore.warehouses)

const form = ref({
  customerId: null,
  warehouseId: null,
  totalAmount: 0,
  paidAmount: 0,
  paymentMethod: 'cash'
})

onMounted(async () => {
  await Promise.all([customersStore.fetchCustomers(), warehousesStore.fetchWarehouses()])
})

async function save() {
  if (!form.value.customerId || !form.value.warehouseId || form.value.totalAmount <= 0) return

  await salesStore.addSale({
    customerId: form.value.customerId,
    warehouseId: form.value.warehouseId,
    invoiceNumber: `SO-${Date.now().toString().slice(-6)}`,
    saleDate: new Date().toISOString().slice(0, 10),
    totalAmount: form.value.totalAmount,
    paidAmount: form.value.paidAmount,
    paymentMethod: form.value.paymentMethod,
    note: ''
  })

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
.btn {
  background: rgb(76, 38, 131);
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
}
</style>
