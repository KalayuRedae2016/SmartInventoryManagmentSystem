<template>
  <section class="txn-page">
    <header class="txn-head">
      <h1>Stock Transactions</h1>
      <p>Full stock movement log</p>
    </header>

    <div class="toolbar">
      <input v-model.trim="searchText" type="text" placeholder="Search type/reference/product/warehouse/note" />
      <select v-model="typeFilter">
        <option value="">All Types</option>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
        <option value="TRANSFER">TRANSFER</option>
        <option value="ADJUST">ADJUST</option>
      </select>
      <select v-model="referenceTypeFilter">
        <option value="">All Reference Types</option>
        <option value="PURCHASE">PURCHASE</option>
        <option value="SALE">SALE</option>
        <option value="RETURN">RETURN</option>
        <option value="ADJUSTMENT">ADJUSTMENT</option>
        <option value="TRANSFER">TRANSFER</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="txn-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Reference Type</th>
            <th>Reference</th>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Quantity</th>
            <th>Performed By</th>
            <th>Note</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="empty">Loading...</td>
          </tr>
          <tr v-else-if="!filteredRows.length">
            <td colspan="9" class="empty">No transactions found.</td>
          </tr>
          <tr v-for="row in filteredRows" :key="row.id">
            <td>{{ row.type }}</td>
            <td>{{ row.referenceType }}</td>
            <td>{{ row.referenceInfo }}</td>
            <td>{{ row.productDisplay }}</td>
            <td>{{ row.warehouseDisplay }}</td>
            <td>{{ row.quantity }}</td>
            <td>{{ row.performedByDisplay }}</td>
            <td>{{ row.note || '-' }}</td>
            <td>{{ row.createdAtDisplay }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { getResponseData } from '@/services/api'

const rows = ref([])
const loading = ref(false)
const searchText = ref('')
const typeFilter = ref('')
const referenceTypeFilter = ref('')

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function buildReferenceInfo(item) {
  const referenceType = item.referenceType || item.reference_type || ''
  const referenceId = item.referenceId ?? item.reference_id
  const note = String(item.note || '')
  const readableRef = note.match(/\b(?:INV|PO|SO|RET|TRN)-[A-Z0-9-]+\b/i)?.[0]
  if (readableRef) return readableRef.toUpperCase()
  if (referenceType && referenceId) return `${referenceType} #${referenceId}`
  if (referenceId) return `Ref #${referenceId}`
  return '-'
}

function normalizeTransaction(item = {}) {
  const productName = item.product?.name || item.productName || '-'
  const productSku = item.product?.sku || item.productSku || ''
  const warehouseName = item.warehouse?.name || item.warehouseName || '-'
  const userName = item.user?.fullName || item.user?.name || item.performedByName || '-'

  return {
    id: item.id,
    type: item.type || '-',
    referenceType: item.referenceType || '-',
    referenceInfo: buildReferenceInfo(item),
    productDisplay: productSku ? `${productName} (${productSku})` : productName,
    warehouseDisplay: warehouseName,
    quantity: item.quantity ?? 0,
    performedByDisplay: userName,
    note: item.note || '',
    createdAtDisplay: formatDateTime(item.createdAt || item.created_at)
  }
}

async function fetchTransactions() {
  loading.value = true
  try {
    const res = await api.get('/stock-transactions')
    rows.value = asList(getResponseData(res, [])).map(normalizeTransaction)
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchTransactions)

const filteredRows = computed(() => {
  const term = searchText.value.toLowerCase()
  return rows.value.filter(row => {
    const matchesTerm =
      !term ||
      String(row.type).toLowerCase().includes(term) ||
      String(row.referenceType).toLowerCase().includes(term) ||
      String(row.referenceInfo).toLowerCase().includes(term) ||
      String(row.productDisplay).toLowerCase().includes(term) ||
      String(row.warehouseDisplay).toLowerCase().includes(term) ||
      String(row.note).toLowerCase().includes(term)

    const matchesType = !typeFilter.value || row.type === typeFilter.value
    const matchesRef = !referenceTypeFilter.value || row.referenceType === referenceTypeFilter.value
    return matchesTerm && matchesType && matchesRef
  })
})
</script>

<style scoped>
.txn-page {
  display: grid;
  gap: 14px;
}
.txn-head h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: rgb(76, 38, 131);
}
.txn-head p {
  margin: 4px 0 0;
  color: #6b7280;
  font-weight: 600;
}
.toolbar {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 10px;
}
.toolbar input,
.toolbar select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  padding: 10px 12px;
  font-size: 0.92rem;
}
.table-wrap {
  overflow-x: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.txn-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 0;
  table-layout: fixed;
}
.txn-table thead {
  background: rgb(76, 38, 131);
  color: #fff;
}
.txn-table th,
.txn-table td {
  text-align: left;
  vertical-align: top;
  padding: 8px 8px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.txn-table tbody tr:hover {
  background: #faf8ff;
}
.empty {
  text-align: center;
  color: #6b7280;
  font-weight: 600;
}
@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
