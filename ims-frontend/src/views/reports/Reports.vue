
<template>
  <div class="reports-page">
    <div class="reports-head">
      <div>
        <h1 class="reports-title">Reports</h1>
        <p class="reports-subtitle">Operational and financial insights with live data</p>
      </div>
      <button class="refresh-btn" :disabled="loading" @click="loadAllData">
        {{ loading ? 'Refreshing...' : 'Refresh Data' }}
      </button>
    </div>

    <div class="filters-wrap">
      <div class="filter-field">
        <label class="filter-label">From</label>
        <input v-model="fromDate" type="date" class="filter-input" />
      </div>
      <div class="filter-field">
        <label class="filter-label">To</label>
        <input v-model="toDate" type="date" class="filter-input" />
      </div>
      <div class="filter-field">
        <label class="filter-label">Period</label>
        <select v-model="period" class="filter-input">
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>This Quarter</option>
          <option>This Year</option>
          <option>Custom</option>
        </select>
      </div>
    </div>

    <section v-if="activeReport" class="active-report">
      <div class="section-head">
        <h2 class="section-title">{{ activeReport.title }}</h2>
        <p class="section-desc">{{ activeReport.description }}</p>
      </div>

      <div v-if="loading" class="state-card">Loading report data...</div>
      <div v-else-if="error" class="state-card state-error">{{ error }}</div>
      <div v-else>
        <div class="metrics-grid">
          <article v-for="metric in activeReport.metrics" :key="metric.label" class="metric-card">
            <p class="metric-label">{{ metric.label }}</p>
            <p class="metric-value">{{ metric.value }}</p>
          </article>
        </div>

        <div class="table-card">
          <div class="table-head">
            <h3>{{ activeReport.tableTitle }}</h3>
            <span>{{ activeReport.rows.length }} row(s)</span>
          </div>
          <div class="table-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th v-for="column in activeReport.columns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!activeReport.rows.length">
                  <td :colspan="activeReport.columns.length" class="table-empty">No data for selected filter.</td>
                </tr>
                <tr v-for="(row, idx) in activeReport.rows" :key="idx">
                  <td v-for="column in activeReport.columns" :key="column">{{ row[column] ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section class="catalog-section">
      <h3 class="catalog-title">Sales</h3>
      <div class="catalog-grid">
        <RouterLink to="/reports?type=sales-summary" class="report-card"><strong>Sales Summary</strong><span>Revenue and invoice performance</span></RouterLink>
        <RouterLink to="/reports?type=sales-returns" class="report-card"><strong>Sales Returns</strong><span>Return volume and value impact</span></RouterLink>
        <RouterLink to="/reports?type=profit-loss" class="report-card"><strong>Profit and Loss</strong><span>Income versus cost overview</span></RouterLink>
      </div>
    </section>

    <section class="catalog-section">
      <h3 class="catalog-title">Purchases</h3>
      <div class="catalog-grid">
        <RouterLink to="/reports?type=purchases-summary" class="report-card"><strong>Purchases Summary</strong><span>Spending and payment status</span></RouterLink>
        <RouterLink to="/reports?type=purchase-returns" class="report-card"><strong>Purchase Returns</strong><span>Returned purchases trend</span></RouterLink>
        <RouterLink to="/reports?type=supplier-ledger" class="report-card"><strong>Supplier Ledger</strong><span>Supplier balances and due amounts</span></RouterLink>
      </div>
    </section>

    <section class="catalog-section">
      <h3 class="catalog-title">Inventory</h3>
      <div class="catalog-grid">
        <RouterLink to="/reports?type=inventory-valuation" class="report-card"><strong>Inventory Valuation</strong><span>Current stock quantity and value</span></RouterLink>
        <RouterLink to="/reports?type=stock-transactions" class="report-card"><strong>Stock Transactions</strong><span>Movement logs by type</span></RouterLink>
        <RouterLink to="/reports?type=low-stock" class="report-card"><strong>Low Stock</strong><span>Products under minimum stock</span></RouterLink>
      </div>
    </section>

    <section class="catalog-section">
      <h3 class="catalog-title">Finance & People</h3>
      <div class="catalog-grid">
        <RouterLink to="/reports?type=customer-ledger" class="report-card"><strong>Customer Ledger</strong><span>Customer balances and receivables</span></RouterLink>
        <RouterLink to="/reports?type=tax-summary" class="report-card"><strong>Tax Summary</strong><span>Tax fields if available in records</span></RouterLink>
        <RouterLink to="/reports?type=user-activity" class="report-card"><strong>User Activity</strong><span>User footprint across transactions</span></RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api, { getResponseData } from '@/services/api'

const route = useRoute()

const loading = ref(false)
const error = ref('')
const period = ref('This Month')
const fromDate = ref('')
const toDate = ref('')

const dataset = reactive({
  sales: [],
  saleReturns: [],
  purchases: [],
  purchaseReturns: [],
  products: [],
  stocks: [],
  stockTransactions: [],
  customers: [],
  suppliers: [],
  users: []
})

function safeNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.sales)) return payload.sales
  if (Array.isArray(payload?.purchases)) return payload.purchases
  if (Array.isArray(payload?.customers)) return payload.customers
  if (Array.isArray(payload?.suppliers)) return payload.suppliers
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.stocks)) return payload.stocks
  if (Array.isArray(payload?.transactions)) return payload.transactions
  return []
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(safeNumber(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(safeNumber(value))
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function resolveDate(item, keys) {
  for (const key of keys) {
    if (item?.[key]) return item[key]
  }
  return null
}

function toDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function applyPeriod(value) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fmt = d => d.toISOString().slice(0, 10)

  if (value === 'Custom') return

  let start = today
  let end = today

  if (value === 'Today') {
    start = today
    end = today
  } else if (value === 'This Week') {
    const day = today.getDay()
    const weekStartDelta = day === 0 ? 6 : day - 1
    start = new Date(today)
    start.setDate(today.getDate() - weekStartDelta)
    end = new Date(start)
    end.setDate(start.getDate() + 6)
  } else if (value === 'This Month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  } else if (value === 'This Quarter') {
    const qStartMonth = Math.floor(today.getMonth() / 3) * 3
    start = new Date(today.getFullYear(), qStartMonth, 1)
    end = new Date(today.getFullYear(), qStartMonth + 3, 0)
  } else if (value === 'This Year') {
    start = new Date(today.getFullYear(), 0, 1)
    end = new Date(today.getFullYear(), 11, 31)
  }

  fromDate.value = fmt(start)
  toDate.value = fmt(end)
}

watch(period, value => {
  applyPeriod(value)
})

function filterByDate(list, keys) {
  const start = toDateOnly(fromDate.value)
  const end = toDateOnly(toDate.value)
  if (!start || !end) return list

  return list.filter(item => {
    const dateValue = resolveDate(item, keys)
    if (!dateValue) return true
    const parsed = toDateOnly(dateValue)
    if (!parsed) return true
    return parsed >= start && parsed <= end
  })
}

function normalizeBaseEntities() {
  const customerMap = new Map(dataset.customers.map(c => [Number(c.id), c]))
  const supplierMap = new Map(dataset.suppliers.map(s => [Number(s.id), s]))
  const userMap = new Map(dataset.users.map(u => [Number(u.id), u]))
  const productMap = new Map(dataset.products.map(p => [Number(p.id), p]))

  const warehouseMap = new Map()
  dataset.stocks.forEach(stock => {
    const id = Number(stock.warehouseId ?? stock.warehouse_id ?? stock.warehouse?.id)
    const name = stock.warehouseName || stock.warehouse?.name
    if (id && name) warehouseMap.set(id, name)
  })
  dataset.stockTransactions.forEach(tx => {
    const id = Number(tx.warehouseId ?? tx.warehouse_id ?? tx.warehouse?.id)
    const name = tx.warehouseName || tx.warehouse?.name
    if (id && name) warehouseMap.set(id, name)
  })

  return { customerMap, supplierMap, userMap, productMap, warehouseMap }
}

const reportData = computed(() => {
  const reportType = String(route.query.type || '')
  const sales = filterByDate(dataset.sales, ['saleDate', 'sale_date', 'createdAt', 'created_at'])
  const saleReturns = filterByDate(dataset.saleReturns, ['returnDate', 'return_date', 'createdAt', 'created_at'])
  const purchases = filterByDate(dataset.purchases, ['purchaseDate', 'purchase_date', 'createdAt', 'created_at'])
  const purchaseReturns = filterByDate(dataset.purchaseReturns, ['returnDate', 'return_date', 'createdAt', 'created_at'])
  const stocks = filterByDate(dataset.stocks, ['updatedAt', 'createdAt', 'created_at'])
  const transactions = filterByDate(dataset.stockTransactions, ['createdAt', 'created_at'])

  const { customerMap, supplierMap, userMap, productMap, warehouseMap } = normalizeBaseEntities()
  if (reportType === 'sales-summary') {
    const total = sales.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const paid = sales.reduce((sum, row) => sum + safeNumber(row.paidAmount ?? row.paid_amount), 0)
    return {
      title: 'Sales Summary',
      description: 'Sales revenue, paid amount, and invoice status across the selected period.',
      metrics: [
        { label: 'Total Revenue', value: formatCurrency(total) },
        { label: 'Invoices', value: formatNumber(sales.length) },
        { label: 'Collected Payments', value: formatCurrency(paid) }
      ],
      tableTitle: 'Sales Details',
      columns: ['Invoice', 'Date', 'Customer', 'Payment', 'Status', 'Total', 'Paid', 'Due'],
      rows: sales
        .map(row => ({
          Invoice: row.invoiceNumber || row.invoice_number || `Sale #${row.id}`,
          Date: formatDateTime(row.saleDate || row.sale_date || row.createdAt || row.created_at),
          Customer: row.customer?.name || customerMap.get(Number(row.customerId ?? row.customer_id))?.name || '-',
          Payment: row.paymentMethod || row.payment_method || '-',
          Status: row.status || '-',
          Total: formatCurrency(row.totalAmount ?? row.total_amount),
          Paid: formatCurrency(row.paidAmount ?? row.paid_amount),
          Due: formatCurrency(row.dueAmount ?? row.due_amount)
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'sales-returns') {
    const total = saleReturns.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    return {
      title: 'Sales Returns',
      description: 'Returned sales with customer, refund method, and total return value.',
      metrics: [
        { label: 'Return Records', value: formatNumber(saleReturns.length) },
        { label: 'Return Value', value: formatCurrency(total) },
        { label: 'Unique Customers', value: formatNumber(new Set(saleReturns.map(r => r.customerId ?? r.customer_id)).size) }
      ],
      tableTitle: 'Return Details',
      columns: ['Sale Ref', 'Date', 'Customer', 'Warehouse', 'Payment Method', 'Amount'],
      rows: saleReturns
        .map(row => ({
          'Sale Ref': row.saleId || row.sale_id || '-',
          Date: formatDateTime(row.returnDate || row.return_date || row.createdAt || row.created_at),
          Customer: customerMap.get(Number(row.customerId ?? row.customer_id))?.name || '-',
          Warehouse: warehouseMap.get(Number(row.warehouseId ?? row.warehouse_id)) || '-',
          'Payment Method': row.paymentMethod || row.payment_method || '-',
          Amount: formatCurrency(row.totalAmount ?? row.total_amount)
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'profit-loss') {
    const totalSales = sales.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const totalPurchases = purchases.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const salesReturnValue = saleReturns.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const purchaseReturnValue = purchaseReturns.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const net = totalSales - salesReturnValue - (totalPurchases - purchaseReturnValue)

    return {
      title: 'Profit and Loss',
      description: 'Computed from sales, purchase, and return values within the selected period.',
      metrics: [
        { label: 'Net Sales', value: formatCurrency(totalSales - salesReturnValue) },
        { label: 'Net Purchases', value: formatCurrency(totalPurchases - purchaseReturnValue) },
        { label: 'Estimated Net', value: formatCurrency(net) }
      ],
      tableTitle: 'P&L Breakdown',
      columns: ['Metric', 'Amount'],
      rows: [
        { Metric: 'Gross Sales', Amount: formatCurrency(totalSales) },
        { Metric: 'Sales Returns', Amount: formatCurrency(salesReturnValue) },
        { Metric: 'Net Sales', Amount: formatCurrency(totalSales - salesReturnValue) },
        { Metric: 'Gross Purchases', Amount: formatCurrency(totalPurchases) },
        { Metric: 'Purchase Returns', Amount: formatCurrency(purchaseReturnValue) },
        { Metric: 'Net Purchases', Amount: formatCurrency(totalPurchases - purchaseReturnValue) },
        { Metric: 'Estimated Net Result', Amount: formatCurrency(net) }
      ]
    }
  }

  if (reportType === 'purchases-summary') {
    const total = purchases.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    const paid = purchases.reduce((sum, row) => sum + safeNumber(row.paidAmount ?? row.paid_amount), 0)
    const due = purchases.reduce((sum, row) => sum + safeNumber(row.dueAmount ?? row.due_amount), 0)
    return {
      title: 'Purchases Summary',
      description: 'Purchase spending and settlement progress by invoice.',
      metrics: [
        { label: 'Total Purchases', value: formatCurrency(total) },
        { label: 'Paid', value: formatCurrency(paid) },
        { label: 'Due', value: formatCurrency(due) }
      ],
      tableTitle: 'Purchase Details',
      columns: ['Invoice', 'Date', 'Supplier', 'Payment', 'Status', 'Total', 'Paid', 'Due'],
      rows: purchases
        .map(row => ({
          Invoice: row.invoiceNumber || row.invoice_number || `Purchase #${row.id}`,
          Date: formatDateTime(row.purchaseDate || row.purchase_date || row.createdAt || row.created_at),
          Supplier: row.supplier?.name || supplierMap.get(Number(row.supplierId ?? row.supplier_id))?.name || '-',
          Payment: row.paymentMethod || row.payment_method || '-',
          Status: row.status || '-',
          Total: formatCurrency(row.totalAmount ?? row.total_amount),
          Paid: formatCurrency(row.paidAmount ?? row.paid_amount),
          Due: formatCurrency(row.dueAmount ?? row.due_amount)
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'purchase-returns') {
    const total = purchaseReturns.reduce((sum, row) => sum + safeNumber(row.totalAmount ?? row.total_amount), 0)
    return {
      title: 'Purchase Returns',
      description: 'Returned purchases with supplier and warehouse context.',
      metrics: [
        { label: 'Return Records', value: formatNumber(purchaseReturns.length) },
        { label: 'Return Value', value: formatCurrency(total) },
        { label: 'Unique Suppliers', value: formatNumber(new Set(purchaseReturns.map(r => r.supplierId ?? r.supplier_id)).size) }
      ],
      tableTitle: 'Purchase Return Details',
      columns: ['Purchase Ref', 'Date', 'Supplier', 'Warehouse', 'Payment Method', 'Amount'],
      rows: purchaseReturns
        .map(row => ({
          'Purchase Ref': row.purchaseId || row.purchase_id || '-',
          Date: formatDateTime(row.returnDate || row.return_date || row.createdAt || row.created_at),
          Supplier: supplierMap.get(Number(row.supplierId ?? row.supplier_id))?.name || '-',
          Warehouse: warehouseMap.get(Number(row.warehouseId ?? row.warehouse_id)) || '-',
          'Payment Method': row.paymentMethod || row.payment_method || '-',
          Amount: formatCurrency(row.totalAmount ?? row.total_amount)
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'supplier-ledger') {
    const supplierRows = dataset.suppliers.map(row => ({
      Name: row.name || '-',
      Code: row.code || '-',
      Phone: row.phone || '-',
      Email: row.email || '-',
      'Purchase Due': formatCurrency(row.totalPurchaseDue ?? row.total_purchase_due),
      'Return Due': formatCurrency(row.totalPurchaseReturnDue ?? row.total_purchase_return_due),
      Status: row.status || (row.isActive ? 'active' : 'inactive')
    }))
    const dueTotal = dataset.suppliers.reduce((sum, row) => sum + safeNumber(row.totalPurchaseDue ?? row.total_purchase_due), 0)

    return {
      title: 'Supplier Ledger',
      description: 'Supplier profile with payable and return due balances.',
      metrics: [
        { label: 'Suppliers', value: formatNumber(dataset.suppliers.length) },
        { label: 'Total Purchase Due', value: formatCurrency(dueTotal) },
        { label: 'Active Suppliers', value: formatNumber(dataset.suppliers.filter(s => s.status === 'active' || s.isActive).length) }
      ],
      tableTitle: 'Supplier Ledger Details',
      columns: ['Name', 'Code', 'Phone', 'Email', 'Purchase Due', 'Return Due', 'Status'],
      rows: supplierRows.slice(0, 80)
    }
  }

  if (reportType === 'inventory-valuation') {
    const totalQty = stocks.reduce((sum, row) => sum + safeNumber(row.quantity ?? row.newStock ?? row.new_stock), 0)
    const totalValue = stocks.reduce((sum, row) => {
      const productId = Number(row.productId ?? row.product_id)
      const quantity = safeNumber(row.quantity ?? row.newStock ?? row.new_stock)
      const cost = safeNumber(productMap.get(productId)?.defaultCostPrice ?? productMap.get(productId)?.cost_price)
      return sum + quantity * cost
    }, 0)

    return {
      title: 'Inventory Valuation',
      description: 'Stock quantity and estimated value using product default cost price.',
      metrics: [
        { label: 'Stock Lines', value: formatNumber(stocks.length) },
        { label: 'Total Quantity', value: formatNumber(totalQty) },
        { label: 'Estimated Value', value: formatCurrency(totalValue) }
      ],
      tableTitle: 'Inventory Detail',
      columns: ['Product', 'SKU', 'Warehouse', 'Quantity', 'Unit Cost', 'Line Value'],
      rows: stocks
        .map(row => {
          const productId = Number(row.productId ?? row.product_id)
          const product = productMap.get(productId) || {}
          const quantity = safeNumber(row.quantity ?? row.newStock ?? row.new_stock)
          const unitCost = safeNumber(product.defaultCostPrice ?? product.cost_price)
          return {
            Product: product.name || row.productName || '-',
            SKU: product.sku || row.productSku || '-',
            Warehouse: row.warehouseName || row.warehouse?.name || warehouseMap.get(Number(row.warehouseId ?? row.warehouse_id)) || '-',
            Quantity: formatNumber(quantity),
            'Unit Cost': formatCurrency(unitCost),
            'Line Value': formatCurrency(quantity * unitCost)
          }
        })
        .slice(0, 80)
    }
  }
  if (reportType === 'stock-transactions') {
    const inQty = transactions
      .filter(row => String(row.type || '').toUpperCase() === 'IN')
      .reduce((sum, row) => sum + safeNumber(row.quantity), 0)
    const outQty = transactions
      .filter(row => ['OUT', 'TRANSFER'].includes(String(row.type || '').toUpperCase()))
      .reduce((sum, row) => sum + safeNumber(row.quantity), 0)

    return {
      title: 'Stock Transactions',
      description: 'Stock movement records with reference and operator details.',
      metrics: [
        { label: 'Transactions', value: formatNumber(transactions.length) },
        { label: 'IN Quantity', value: formatNumber(inQty) },
        { label: 'OUT/TRANSFER Quantity', value: formatNumber(outQty) }
      ],
      tableTitle: 'Transaction Details',
      columns: ['Type', 'Reference', 'Product', 'Warehouse', 'Qty', 'Performed By', 'Date'],
      rows: transactions
        .map(row => ({
          Type: row.type || '-',
          Reference: row.referenceType && row.referenceId ? `${row.referenceType} #${row.referenceId}` : row.referenceType || '-',
          Product: row.product?.name || row.productName || productMap.get(Number(row.productId ?? row.product_id))?.name || '-',
          Warehouse: row.warehouse?.name || row.warehouseName || warehouseMap.get(Number(row.warehouseId ?? row.warehouse_id)) || '-',
          Qty: formatNumber(row.quantity),
          'Performed By': row.user?.fullName || row.user?.name || userMap.get(Number(row.performedBy))?.fullName || '-',
          Date: formatDateTime(row.createdAt || row.created_at)
        }))
        .slice(0, 120)
    }
  }

  if (reportType === 'low-stock') {
    const lowStockRows = dataset.products.filter(row => {
      const qty = safeNumber(row.quantity)
      const min = safeNumber(row.minimumStock ?? row.min_stock ?? row.reorderLevel)
      return qty <= min
    })

    return {
      title: 'Low Stock',
      description: 'Products currently at or below their configured minimum stock.',
      metrics: [
        { label: 'Low Stock Items', value: formatNumber(lowStockRows.length) },
        {
          label: 'Critical (Zero Stock)',
          value: formatNumber(lowStockRows.filter(row => safeNumber(row.quantity) <= 0).length)
        },
        {
          label: 'Total Shortfall',
          value: formatNumber(
            lowStockRows.reduce((sum, row) => {
              const diff = safeNumber(row.minimumStock ?? row.min_stock ?? row.reorderLevel) - safeNumber(row.quantity)
              return sum + (diff > 0 ? diff : 0)
            }, 0)
          )
        }
      ],
      tableTitle: 'Low Stock Products',
      columns: ['Product', 'SKU', 'Category', 'Current Qty', 'Minimum Stock', 'Status'],
      rows: lowStockRows
        .map(row => ({
          Product: row.name || row.productName || '-',
          SKU: row.sku || '-',
          Category: row.category?.name || row.category || '-',
          'Current Qty': formatNumber(row.quantity),
          'Minimum Stock': formatNumber(row.minimumStock ?? row.min_stock ?? row.reorderLevel),
          Status: safeNumber(row.quantity) <= 0 ? 'critical' : 'low'
        }))
        .slice(0, 100)
    }
  }

  if (reportType === 'customer-ledger') {
    const dueTotal = dataset.customers.reduce((sum, row) => sum + safeNumber(row.totalSaleDue ?? row.total_sale_due), 0)
    const returnDueTotal = dataset.customers.reduce((sum, row) => sum + safeNumber(row.totalSalesReturnDue ?? row.total_sales_return_due), 0)

    return {
      title: 'Customer Ledger',
      description: 'Customer balances including sale due and sales return due totals.',
      metrics: [
        { label: 'Customers', value: formatNumber(dataset.customers.length) },
        { label: 'Sale Due', value: formatCurrency(dueTotal) },
        { label: 'Sales Return Due', value: formatCurrency(returnDueTotal) }
      ],
      tableTitle: 'Customer Ledger Details',
      columns: ['Name', 'Code', 'Phone', 'Email', 'Sale Due', 'Return Due', 'Status'],
      rows: dataset.customers
        .map(row => ({
          Name: row.name || '-',
          Code: row.code || '-',
          Phone: row.phone || '-',
          Email: row.email || '-',
          'Sale Due': formatCurrency(row.totalSaleDue ?? row.total_sale_due),
          'Return Due': formatCurrency(row.totalSalesReturnDue ?? row.total_sales_return_due),
          Status: row.status || (row.isActive ? 'active' : 'inactive')
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'tax-summary') {
    const allRecords = [...sales, ...purchases]
    const taxSales = sales.reduce((sum, row) => sum + safeNumber(row.taxAmount ?? row.tax_amount), 0)
    const taxPurchases = purchases.reduce((sum, row) => sum + safeNumber(row.taxAmount ?? row.tax_amount), 0)

    return {
      title: 'Tax Summary',
      description: 'Tax values are shown only if tax fields are provided by the backend payload.',
      metrics: [
        { label: 'Output Tax', value: formatCurrency(taxSales) },
        { label: 'Input Tax', value: formatCurrency(taxPurchases) },
        { label: 'Estimated Payable', value: formatCurrency(taxSales - taxPurchases) }
      ],
      tableTitle: 'Tax Source Rows',
      columns: ['Source', 'Reference', 'Date', 'Tax Amount'],
      rows: allRecords
        .filter(row => row.taxAmount != null || row.tax_amount != null)
        .map(row => ({
          Source: row.saleDate || row.sale_date ? 'Sale' : 'Purchase',
          Reference: row.invoiceNumber || row.invoice_number || row.id,
          Date: formatDateTime(row.saleDate || row.sale_date || row.purchaseDate || row.purchase_date || row.createdAt || row.created_at),
          'Tax Amount': formatCurrency(row.taxAmount ?? row.tax_amount)
        }))
        .slice(0, 80)
    }
  }

  if (reportType === 'user-activity') {
    const activeUsers = dataset.users.filter(row => row.isActive || row.status === 'active')
    const rows = transactions.map(row => {
      const user = row.user || userMap.get(Number(row.performedBy)) || {}
      return {
        User: user.fullName || user.name || '-',
        Activity: row.type || '-',
        Reference: row.referenceType && row.referenceId ? `${row.referenceType} #${row.referenceId}` : row.referenceType || '-',
        Product: row.product?.name || row.productName || productMap.get(Number(row.productId ?? row.product_id))?.name || '-',
        Qty: formatNumber(row.quantity),
        Date: formatDateTime(row.createdAt || row.created_at)
      }
    })

    return {
      title: 'User Activity',
      description: 'User participation inferred from stock transactions.',
      metrics: [
        { label: 'Total Users', value: formatNumber(dataset.users.length) },
        { label: 'Active Users', value: formatNumber(activeUsers.length) },
        { label: 'Logged Activities', value: formatNumber(rows.length) }
      ],
      tableTitle: 'Activity Details',
      columns: ['User', 'Activity', 'Reference', 'Product', 'Qty', 'Date'],
      rows: rows.slice(0, 120)
    }
  }

  return null
})

const activeReport = computed(() => reportData.value)

async function loadAllData() {
  loading.value = true
  error.value = ''

  const sources = [
    { key: 'sales', url: '/sales', required: true },
    { key: 'saleReturns', url: '/sale-returns', required: false },
    { key: 'purchases', url: '/purchases', required: true },
    { key: 'purchaseReturns', url: '/purchase-returns', required: false },
    { key: 'products', url: '/products', required: true },
    { key: 'stocks', url: '/stocks', required: false },
    { key: 'stockTransactions', url: '/stock-transactions', required: true },
    { key: 'customers', url: '/customers', required: true },
    { key: 'suppliers', url: '/suppliers', required: true },
    { key: 'users', url: '/users', required: false }
  ]

  const results = await Promise.allSettled(sources.map(source => api.get(source.url)))

  const pick = result => (result.status === 'fulfilled' ? asList(getResponseData(result.value, [])) : [])

  sources.forEach((source, index) => {
    dataset[source.key] = pick(results[index])
  })

  const failedRequired = sources.filter((source, index) => {
    if (!source.required) return false
    return results[index].status === 'rejected'
  })

  if (failedRequired.length) {
    const labels = failedRequired.map(source => source.key).join(', ')
    error.value = `Some core data failed to load: ${labels}. Showing available data.`
  }

  loading.value = false
}

onMounted(async () => {
  applyPeriod(period.value)
  await loadAllData()
})
</script>

<style scoped>
.reports-page {
  display: grid;
  gap: 16px;
}

.reports-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.reports-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: rgb(76, 38, 131);
}

.reports-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.92rem;
}

.refresh-btn {
  border: 1px solid rgba(76, 38, 131, 0.35);
  background: #fff;
  color: rgb(76, 38, 131);
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-wrap {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  color: #6b7280;
}

.filter-input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 0.9rem;
  background: #fff;
}

.active-report {
  display: grid;
  gap: 10px;
}

.section-head {
  display: grid;
  gap: 4px;
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.section-desc {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
}

.metric-label {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}

.metric-value {
  margin: 6px 0 0;
  color: rgb(76, 38, 131);
  font-size: 1.1rem;
  font-weight: 800;
}

.state-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  color: #4b5563;
}

.state-error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.table-head h3 {
  margin: 0;
  color: #111827;
  font-size: 0.95rem;
}

.table-head span {
  font-size: 0.8rem;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.report-table thead {
  background: rgb(76, 38, 131);
  color: #fff;
}

.report-table th,
.report-table td {
  padding: 8px;
  text-align: left;
  font-size: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  white-space: normal;
  word-break: break-word;
}

.report-table tbody tr:hover {
  background: #faf8ff;
}

.table-empty {
  text-align: center;
  color: #6b7280;
}

.catalog-section {
  display: grid;
  gap: 8px;
}

.catalog-title {
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.report-card {
  display: grid;
  gap: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 12px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

.report-card strong {
  color: #111827;
  font-size: 0.92rem;
}

.report-card span {
  color: #6b7280;
  font-size: 0.82rem;
}

.report-card:hover {
  transform: translateY(-1px);
  border-color: rgba(76, 38, 131, 0.35);
  box-shadow: 0 8px 18px rgba(76, 38, 131, 0.1);
}

@media (max-width: 1024px) {
  .catalog-grid,
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .reports-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-wrap,
  .catalog-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
