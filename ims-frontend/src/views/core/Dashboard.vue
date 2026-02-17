<template>
  <div class="space-y-6">
    <!-- Page Title -->
    <div class="flex items-end justify-between border-b pb-3">
      <div>
        <h1 class="text-3xl font-bold text-brand">Dashboard</h1>
        <p class="text-sm text-gray-500">Key operational overview across Inventory, Sales, Purchases, Stock, and People</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <RouterLink to="/products" class="stat-card card-link">
        <p class="stat-label">Products</p>
        <p class="stat-value text-brand">{{ productsCount }}</p>
        <p class="stat-sub">Low stock: {{ lowStockCount }}</p>
      </RouterLink>
      <RouterLink to="/sales/invoices" class="stat-card card-link">
        <p class="stat-label">Sales</p>
        <p class="stat-value text-green-600">{{ salesCount }}</p>
        <p class="stat-sub">Pending: {{ salesPendingCount }}</p>
      </RouterLink>
      <RouterLink to="/purchases" class="stat-card card-link">
        <p class="stat-label">Purchases</p>
        <p class="stat-value text-blue-600">{{ purchasesCount }}</p>
        <p class="stat-sub">Pending: {{ purchasesPendingCount }}</p>
      </RouterLink>
      <RouterLink to="/stock-transfers" class="stat-card card-link">
        <p class="stat-label">Stock Transactions</p>
        <p class="stat-value text-purple-700">{{ transfersCount }}</p>
        <p class="stat-sub">Pending: {{ transfersPendingCount }}</p>
      </RouterLink>
    </div>

    <!-- Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="section-card">
        <h2 class="section-title">
          <RouterLink to="/products" class="section-link">Inventory</RouterLink>
        </h2>
        <div class="section-row">
          <span>Warehouses</span>
          <span class="section-value">{{ warehousesCount }}</span>
        </div>
        <div class="section-row">
          <span>Active Products</span>
          <span class="section-value">{{ activeProductsCount }}</span>
        </div>
        <div class="section-row">
          <span>Low Stock Items</span>
          <span class="section-value text-red-600">{{ lowStockCount }}</span>
        </div>
        <div class="section-links">
          <RouterLink to="/products" class="link">View Products</RouterLink>
          <RouterLink to="/warehouses" class="link">View Warehouses</RouterLink>
          <RouterLink to="/stock-transfers" class="link">Stock Transactions</RouterLink>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">
          <RouterLink to="/sales/invoices" class="section-link">Sales</RouterLink>
        </h2>
        <div class="section-row">
          <span>Total Sales</span>
          <span class="section-value">{{ salesCount }}</span>
        </div>
        <div class="section-row">
          <span>Pending Sales</span>
          <span class="section-value">{{ salesPendingCount }}</span>
        </div>
        <div class="section-row">
          <span>Total Amount</span>
          <span class="section-value">{{ formatCurrency(totalSalesAmount) }}</span>
        </div>
        <div class="section-links">
          <RouterLink to="/sales/invoices" class="link">Invoices</RouterLink>
          <RouterLink to="/sales/payments" class="link">Payments</RouterLink>
          <RouterLink to="/sales/returns" class="link">Returns</RouterLink>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">
          <RouterLink to="/purchases" class="section-link">Purchases</RouterLink>
        </h2>
        <div class="section-row">
          <span>Total Purchases</span>
          <span class="section-value">{{ purchasesCount }}</span>
        </div>
        <div class="section-row">
          <span>Pending Purchases</span>
          <span class="section-value">{{ purchasesPendingCount }}</span>
        </div>
        <div class="section-row">
          <span>Total Amount</span>
          <span class="section-value">{{ formatCurrency(totalPurchasesAmount) }}</span>
        </div>
        <div class="section-links">
          <RouterLink to="/purchases" class="link">Purchases</RouterLink>
          <RouterLink to="/purchases/new" class="link">New Purchase</RouterLink>
          <RouterLink to="/purchases/returns" class="link">Returns</RouterLink>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="section-card">
        <h2 class="section-title">
          <RouterLink to="/users" class="section-link">People</RouterLink>
        </h2>
        <div class="section-row">
          <span>Users</span>
          <span class="section-value">{{ usersCount }}</span>
        </div>
        <div class="section-row">
          <span>Customers</span>
          <span class="section-value">{{ customersCount }}</span>
        </div>
        <div class="section-links">
          <RouterLink to="/users" class="link">Users</RouterLink>
          <RouterLink to="/customers" class="link">Customers</RouterLink>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">
          <RouterLink to="/reports" class="section-link">Reports</RouterLink>
        </h2>
        <p class="text-sm text-gray-500 mb-2">Access standard business reports for quick decisions.</p>
        <div class="section-links">
          <RouterLink to="/reports" class="link">Open Reports</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useSalesStore } from '@/stores/sales'
import { usePurchasesStore } from '@/stores/purchases'
import { useCustomersStore } from '@/stores/customers'
import { useUsersStore } from '@/stores/users'
import { useWarehouseStore } from '@/stores/warehouse'
import { useStockTransfersStore } from '@/stores/stockTransfers'

// Pinia stores
const productsStore = useProductsStore()
const salesStore = useSalesStore()
const purchasesStore = usePurchasesStore()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()
const warehouseStore = useWarehouseStore()
const stockTransfersStore = useStockTransfersStore()

// ? Computed values
const productsCount = computed(() =>
  Array.isArray(productsStore.products) ? productsStore.products.length : 0
)
const lowStockCount = computed(() =>
  Array.isArray(productsStore.products)
    ? productsStore.products.filter(p => p.quantity <= 5).length
    : 0
)
const activeProductsCount = computed(() =>
  Array.isArray(productsStore.products)
    ? productsStore.products.filter(p => p.status === 'active').length
    : 0
)

const salesCount = computed(() =>
  Array.isArray(salesStore.sales) ? salesStore.sales.length : 0
)
const salesPendingCount = computed(() =>
  Array.isArray(salesStore.sales)
    ? salesStore.sales.filter(s => s.status === 'pending').length
    : 0
)
const totalSalesAmount = computed(() =>
  Array.isArray(salesStore.sales)
    ? salesStore.sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
    : 0
)

const purchasesCount = computed(() =>
  Array.isArray(purchasesStore.purchases) ? purchasesStore.purchases.length : 0
)
const purchasesPendingCount = computed(() =>
  Array.isArray(purchasesStore.purchases)
    ? purchasesStore.purchases.filter(p => p.status === 'pending').length
    : 0
)
const totalPurchasesAmount = computed(() =>
  Array.isArray(purchasesStore.purchases)
    ? purchasesStore.purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)
    : 0
)

const customersCount = computed(() =>
  Array.isArray(customersStore.customers) ? customersStore.customers.length : 0
)
const usersCount = computed(() =>
  Array.isArray(usersStore.users) ? usersStore.users.length : 0
)
const warehousesCount = computed(() =>
  Array.isArray(warehouseStore.warehouses) ? warehouseStore.warehouses.length : 0
)

const transfersCount = computed(() =>
  Array.isArray(stockTransfersStore.transfers) ? stockTransfersStore.transfers.length : 0
)
const transfersPendingCount = computed(() =>
  Array.isArray(stockTransfersStore.transfers)
    ? stockTransfersStore.transfers.filter(t => t.status === 'pending').length
    : 0
)

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0)
}

onMounted(() => {
  productsStore.fetchProducts()
  salesStore.fetchSales()
  purchasesStore.fetchPurchases()
  customersStore.fetchCustomers()
  usersStore.fetchUsers()
  warehouseStore.fetchWarehouses()
  stockTransfersStore.fetchTransfers()
})
</script>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.card-link {
  display: block;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.card-link:hover {
  transform: translateY(-2px);
  border-color: rgba(76, 38, 131, 0.35);
  box-shadow: 0 6px 14px rgba(76, 38, 131, 0.12);
}
.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
}
.stat-sub {
  font-size: 12px;
  color: #6b7280;
}
.section-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}
.section-link {
  color: #111827;
}
.section-link:hover {
  color: rgb(76, 38, 131);
}
.section-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
  color: #374151;
}
.section-value {
  font-weight: 600;
  color: #111827;
}
.section-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.link {
  color: rgb(76, 38, 131);
  font-weight: 600;
  font-size: 13px;
}
</style>
