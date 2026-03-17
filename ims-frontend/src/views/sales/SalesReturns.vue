<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCustomersStore } from '@/stores/customers'
import { useWarehouseStore } from '@/stores/warehouse'
import api, { getResponseData } from '@/services/api'

const auth = useAuthStore()
const customersStore = useCustomersStore()
const warehousesStore = useWarehouseStore()

const canCreate = computed(() => auth.hasPermission('sale-return.create') || auth.hasPermission('sales.create'))
const canView = computed(() => auth.hasPermission('sale-return.view') || auth.hasPermission('sales.view'))
const canDelete = computed(() => auth.hasPermission('sale-return.delete') || auth.hasPermission('sales.delete'))

const sales = ref([])
const returns = ref([])
const loading = ref(false)
const formError = ref('')
const viewModalVisible = ref(false)
const viewItem = ref(null)

const customers = computed(() => customersStore.customers || [])
const warehouses = computed(() => warehousesStore.warehouses || [])

const form = ref({
  saleId: null,
  warehouseId: null,
  customerId: null,
  paymentMethod: 'cash',
  returnDate: new Date().toISOString().slice(0, 10)
})

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function normalizeReturn(item = {}) {
  return {
    ...item,
    saleId: item.saleId ?? item.sale_id ?? null,
    warehouseId: item.warehouseId ?? item.warehouse_id ?? null,
    customerId: item.customerId ?? item.customer_id ?? null,
    paymentMethod: item.paymentMethod ?? item.payment_method ?? '',
    returnDate: item.returnDate ?? item.return_date ?? '',
    customerName: item.customer?.name || item.customerName || '-',
    warehouseName: item.warehouse?.name || item.warehouseName || '-'
  }
}

async function fetchSales() {
  const res = await api.get('/sales')
  sales.value = asList(getResponseData(res, [])).map(s => ({
    ...s,
    customerName: s.customer?.name || s.customerName || s.customer || '-',
    warehouseName: s.warehouse?.name || s.warehouseName || '-'
  }))
}

async function fetchReturns() {
  const res = await api.get('/sale-returns')
  returns.value = asList(getResponseData(res, [])).map(normalizeReturn)
}

onMounted(async () => {
  loading.value = true
  formError.value = ''
  try {
    await Promise.all([
      fetchSales(),
      fetchReturns(),
      customersStore.fetchCustomers(),
      warehousesStore.fetchWarehouses()
    ])
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to load sale return data.'
  } finally {
    loading.value = false
  }
})

function onSaleSelected() {
  const sale = sales.value.find(s => Number(s.id) === Number(form.value.saleId))
  if (!sale) return
  form.value.customerId = Number(sale.customerId ?? sale.customer_id ?? form.value.customerId)
  form.value.warehouseId = Number(sale.warehouseId ?? sale.warehouse_id ?? form.value.warehouseId)
}

async function submitReturn() {
  formError.value = ''
  if (!form.value.saleId || !form.value.warehouseId || !form.value.customerId || !form.value.paymentMethod) {
    formError.value = 'saleId, warehouseId, customerId and paymentMethod are required.'
    return
  }
  try {
    await api.post('/sale-returns', {
      saleId: Number(form.value.saleId),
      warehouseId: Number(form.value.warehouseId),
      customerId: Number(form.value.customerId),
      paymentMethod: form.value.paymentMethod,
      paidAmount: 0,
      returnDate: form.value.returnDate
    })
    form.value.saleId = null
    form.value.warehouseId = null
    form.value.customerId = null
    form.value.paymentMethod = 'cash'
    form.value.returnDate = new Date().toISOString().slice(0, 10)
    await fetchReturns()
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to submit sale return.'
  }
}

function openViewModal(item) {
  viewItem.value = item
  viewModalVisible.value = true
}

async function deleteReturn(item) {
  if (!confirm(`Delete return #${item.id}?`)) return
  try {
    await api.delete(`/sale-returns/${item.id}`)
    await fetchReturns()
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to delete return.'
  }
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Sale Returns</h1>

    <div v-if="canCreate" class="card">
      <h3 class="text-lg font-semibold mb-3">New Return</h3>

      <select v-model.number="form.saleId" class="input" @change="onSaleSelected">
        <option :value="null" disabled>Select Sale</option>
        <option v-for="s in sales" :key="s.id" :value="s.id">
          #{{ s.id }} - {{ s.customerName }}
        </option>
      </select>

      <select v-model.number="form.warehouseId" class="input">
        <option :value="null" disabled>Select Warehouse</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>

      <select v-model.number="form.customerId" class="input">
        <option :value="null" disabled>Select Customer</option>
        <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <select v-model="form.paymentMethod" class="input">
        <option value="cash">cash</option>
        <option value="bank_transfer">bank_transfer</option>
        <option value="mobile_payment">mobile_payment</option>
      </select>

      <input v-model="form.returnDate" class="input" type="date" />

      <button class="btn-primary" @click="submitReturn">Submit Return</button>
      <p v-if="formError" class="text-red-600 text-sm mt-2">{{ formError }}</p>
    </div>

    <div class="card">
      <h3 class="text-lg font-semibold mb-3">Return Requests</h3>

      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse border text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="th text-xs md:text-sm">ID</th>
              <th class="th text-xs md:text-sm">Sale ID</th>
              <th class="th text-xs md:text-sm">Warehouse ID</th>
              <th class="th text-xs md:text-sm">Customer ID</th>
              <th class="th text-xs md:text-sm">Payment</th>
              <th class="th text-xs md:text-sm">Return Date</th>
              <th class="th text-xs md:text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in returns" :key="item.id">
              <td class="td text-xs md:text-sm">{{ item.id }}</td>
              <td class="td text-xs md:text-sm">{{ item.saleId || '-' }}</td>
              <td class="td text-xs md:text-sm">{{ item.warehouseId || '-' }}</td>
              <td class="td text-xs md:text-sm">{{ item.customerId || '-' }}</td>
              <td class="td text-xs md:text-sm">{{ item.paymentMethod || '-' }}</td>
              <td class="td text-xs md:text-sm">{{ formatDate(item.returnDate) }}</td>
              <td class="td text-xs md:text-sm">
              <div class="inline-flex items-center gap-2">
                <button v-if="canView" class="icon-btn icon-view" title="View" @click="openViewModal(item)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                  </svg>
                </button>
                <button v-if="canDelete" class="icon-btn icon-delete" title="Delete" @click="deleteReturn(item)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                  </svg>
                </button>
              </div>
              </td>
            </tr>
            <tr v-if="!returns.length">
              <td class="td text-center text-gray-500" colspan="7">No returns found</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="loading" class="text-sm text-gray-500 mt-2">Loading...</p>
    </div>

    <div v-if="viewModalVisible && viewItem" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Sale Return Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="detail-row"><span class="detail-label">ID</span><span>{{ viewItem.id || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Sale ID</span><span>{{ viewItem.saleId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Warehouse ID</span><span>{{ viewItem.warehouseId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Customer ID</span><span>{{ viewItem.customerId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Payment Method</span><span>{{ viewItem.paymentMethod || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Return Date</span><span>{{ formatDate(viewItem.returnDate) }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="viewModalVisible = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
}
.btn-primary {
  background: rgb(76, 38, 131);
  color: #fff;
  border-radius: 6px;
  padding: 8px 12px;
}
.th, .td {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: left;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.icon-view { color: rgb(76, 38, 131); }
.icon-delete { color: #dc2626; }
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
