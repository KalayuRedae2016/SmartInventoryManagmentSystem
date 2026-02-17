<template>
  <section class="txn-page">
    <header class="txn-head">
      <h1>Stock Transaction History</h1>
      <p>Transaction Information (Header Section)</p>
    </header>

    <div class="toolbar">
      <input
        v-model.trim="searchText"
        type="text"
        placeholder="Search Transaction ID / Reference"
      />

      <select v-model="typeFilter">
        <option value="">All Types</option>
        <option value="Stock In">Stock In</option>
        <option value="Stock Out">Stock Out</option>
        <option value="Transfer">Transfer</option>
        <option value="Adjustment">Adjustment</option>
        <option value="Return">Return</option>
      </select>

      <select v-model="statusFilter">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="txn-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Transaction Type</th>
            <th>Transaction Date</th>
            <th>Reference Number</th>
            <th>Warehouse</th>
            <th>From Location</th>
            <th>To Location</th>
            <th>Supplier</th>
            <th>Customer / Department</th>
            <th>Requested By</th>
            <th>Approved By</th>
            <th>Status</th>
            <th>Remarks / Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredRows.length">
            <td colspan="13" class="empty">No transactions found.</td>
          </tr>
          <tr v-for="row in filteredRows" :key="row.key">
            <td>{{ row.transactionId }}</td>
            <td>{{ row.transactionType }}</td>
            <td>{{ row.transactionDate }}</td>
            <td>{{ row.referenceNumber }}</td>
            <td>{{ row.warehouse }}</td>
            <td>{{ row.fromLocation }}</td>
            <td>{{ row.toLocation }}</td>
            <td>{{ row.supplier }}</td>
            <td>{{ row.customerDepartment }}</td>
            <td>{{ row.requestedBy }}</td>
            <td>{{ row.approvedBy }}</td>
            <td>
              <span class="status" :class="statusClass(row.status)">{{ row.status }}</span>
            </td>
            <td>{{ row.remarks }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStockStore } from '@/stores/stock'
import { useStockTransfersStore } from '@/stores/stockTransfers'
import { useWarehouseStore } from '@/stores/warehouse'
import { useUsersStore } from '@/stores/users'
import { useSuppliersStore } from '@/stores/suppliers'
import { useCustomersStore } from '@/stores/customers'
import { usePurchasesStore } from '@/stores/purchases'
import { useSalesStore } from '@/stores/sales'

const stockStore = useStockStore()
const transferStore = useStockTransfersStore()
const warehouseStore = useWarehouseStore()
const usersStore = useUsersStore()
const suppliersStore = useSuppliersStore()
const customersStore = useCustomersStore()
const purchasesStore = usePurchasesStore()
const salesStore = useSalesStore()

const searchText = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

onMounted(async () => {
  await Promise.all([
    stockStore.fetchStock(),
    transferStore.fetchTransfers(),
    warehouseStore.fetchWarehouses(),
    Promise.resolve(usersStore.fetchUsers()),
    Promise.resolve(suppliersStore.fetchSuppliers()),
    Promise.resolve(customersStore.fetchCustomers()),
    purchasesStore.fetchPurchases(),
    salesStore.fetchSales()
  ])
})

const rows = computed(() => {
  const stockRows = (stockStore.transactions || []).map(t => mapStockTransaction(t))
  const transferRows = (transferStore.transfers || []).map(t => mapTransferTransaction(t))

  return [...transferRows, ...stockRows].sort(
    (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
  )
})

const filteredRows = computed(() => {
  return rows.value.filter(row => {
    const term = searchText.value.toLowerCase()
    const matchesSearch =
      !term ||
      row.transactionId.toLowerCase().includes(term) ||
      row.referenceNumber.toLowerCase().includes(term)

    const matchesType = !typeFilter.value || row.transactionType === typeFilter.value
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value

    return matchesSearch && matchesType && matchesStatus
  })
})

function mapStockTransaction(t) {
  const note = String(t.note || '')
  const transferMatch = note.match(/^From (.+) to (.+)$/i)
  const warehouseMatch = note.match(/\(([^)]+)\)$/)
  const txType = normalizeStockType(t.type, note)
  const refId = extractUuidFromText(note)
  const referenceNumber = deriveReferenceNumber(note, refId, txType)

  const supplierName =
    txType === 'Stock In'
      ? resolveSupplierName(refId) || inferPartyByName(note, suppliersStore.suppliers)
      : '-'

  const customerName =
    txType === 'Stock Out'
      ? resolveCustomerName(refId) || inferPartyByName(note, customersStore.customers)
      : '-'

  return {
    key: `stock-${t.id}`,
    transactionId: `TXN-${t.id}`,
    transactionType: txType,
    transactionDate: t.date || '-',
    referenceNumber,
    warehouse: warehouseMatch ? warehouseMatch[1] : '-',
    fromLocation: transferMatch ? transferMatch[1] : '-',
    toLocation: transferMatch ? transferMatch[2] : '-',
    supplier: supplierName || '-',
    customerDepartment: customerName || '-',
    requestedBy: '-',
    approvedBy: '-',
    status: 'Completed',
    remarks: note || '-'
  }
}

function mapTransferTransaction(t) {
  const fromRaw = t.fromWarehouseId || t.from_warehouse_id || '-'
  const toRaw = t.toWarehouseId || t.to_warehouse_id || '-'
  const fromLocation = resolveWarehouseName(fromRaw)
  const toLocation = resolveWarehouseName(toRaw)
  const requestedBy = resolveUserName(t.requested_by || t.createdBy)
  const approvedBy = resolveUserName(t.approved_by)

  return {
    key: `transfer-${t.id}`,
    transactionId: `TRF-${String(t.id).slice(0, 8)}`,
    transactionType: 'Transfer',
    transactionDate: formatDateOnly(t.created_at),
    referenceNumber: `TRN-${String(t.id).slice(0, 8)}`,
    warehouse: fromLocation !== '-' ? fromLocation : '-',
    fromLocation,
    toLocation,
    supplier: '-',
    customerDepartment: '-',
    requestedBy,
    approvedBy,
    status: normalizeStatus(t.status),
    remarks: 'Stock transfer'
  }
}

function resolveWarehouseName(idOrName) {
  if (!idOrName || idOrName === '-') return '-'

  const value = String(idOrName)
  const byId = warehouseStore.warehouses.find(w => String(w.id) === value)
  if (byId?.name) return byId.name

  const byCode = warehouseStore.warehouses.find(w => String(w.code || '') === value)
  if (byCode?.name) return byCode.name

  return value
}

function resolveUserName(idOrName) {
  if (!idOrName || idOrName === '-') return '-'
  const value = String(idOrName)

  const byId = usersStore.users.find(u => String(u.id) === value)
  if (byId?.name) return byId.name

  const byName = usersStore.users.find(u => String(u.name).toLowerCase() === value.toLowerCase())
  if (byName?.name) return byName.name

  return value
}

function resolveSupplierName(id) {
  if (!id) return ''
  const fromSupplier = suppliersStore.suppliers.find(s => String(s.id) === String(id))
  if (fromSupplier?.name) return fromSupplier.name

  const fromPurchase = purchasesStore.purchases.find(
    p => String(p.id) === String(id) || String(p.supplier_id) === String(id)
  )
  if (fromPurchase?.supplier) return fromPurchase.supplier

  return ''
}

function resolveCustomerName(id) {
  if (!id) return ''
  const fromCustomer = customersStore.customers.find(c => String(c.id) === String(id))
  if (fromCustomer?.name) return fromCustomer.name

  const fromSale = salesStore.sales.find(
    s => String(s.id) === String(id) || String(s.customer_id) === String(id)
  )
  if (fromSale?.customer) return fromSale.customer

  return ''
}

function inferPartyByName(note, list) {
  const text = String(note || '').toLowerCase()
  const hit = (list || []).find(p => text.includes(String(p.name || '').toLowerCase()))
  return hit?.name || ''
}

function extractUuidFromText(text) {
  const m = String(text || '').match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
  )
  return m ? m[0] : ''
}

function deriveReferenceNumber(note, extractedId, txType) {
  const direct = String(note || '').match(/\b(?:PO|SO|GRN|RET|ADJ|TRN)-[A-Z0-9-]+\b/i)
  if (direct) return direct[0].toUpperCase()

  if (txType === 'Stock In' && extractedId) return `PO-${extractedId.slice(0, 8)}`
  if (txType === 'Stock Out' && extractedId) return `SO-${extractedId.slice(0, 8)}`
  if (txType === 'Return' && extractedId) return `RET-${extractedId.slice(0, 8)}`
  if (txType === 'Adjustment') return 'ADJ-MANUAL'

  return '-'
}

function normalizeStockType(type, note) {
  const raw = String(type || '').toUpperCase()
  const lowerNote = String(note || '').toLowerCase()

  if (raw === 'IN') return lowerNote.includes('return') ? 'Return' : 'Stock In'
  if (raw === 'OUT') return lowerNote.includes('return') ? 'Return' : 'Stock Out'
  if (raw === 'TRANSFER') return 'Transfer'
  if (raw === 'ADJUSTMENT') return 'Adjustment'
  return 'Return'
}

function normalizeStatus(status) {
  const s = String(status || '').toLowerCase()
  if (!s) return 'Draft'
  if (s === 'pending') return 'Pending'
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  if (s === 'completed') return 'Completed'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'canceled') return 'Cancelled'
  if (s === 'draft') return 'Draft'
  return 'Draft'
}

function formatDateOnly(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 10)
}

function statusClass(status) {
  if (status === 'Approved') return 'approved'
  if (status === 'Pending') return 'pending'
  if (status === 'Rejected') return 'rejected'
  if (status === 'Completed') return 'completed'
  if (status === 'Cancelled') return 'cancelled'
  return 'draft'
}
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
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.txn-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
}

.txn-table thead {
  background: rgb(76, 38, 131);
  color: #fff;
}

.txn-table th,
.txn-table td {
  text-align: left;
  vertical-align: top;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.86rem;
}

.txn-table tbody tr:hover {
  background: #faf8ff;
}

.empty {
  text-align: center;
  color: #6b7280;
  font-weight: 600;
}

.status {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status.draft {
  background: #f3f4f6;
  color: #374151;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status.completed {
  background: #e0e7ff;
  color: #3730a3;
}

.status.cancelled {
  background: #f1f5f9;
  color: #475569;
}

@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
