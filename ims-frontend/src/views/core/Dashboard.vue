<template>
  <div class="space-y-6">
    <!-- Page Title -->
    <div class="flex items-end justify-between border-b pb-3">
      <div>
        <h1 class="text-3xl font-bold text-brand">Dashboard</h1>
        <p class="text-sm text-gray-500">Key operational overview</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="section-card">
        <h2 class="section-title">Inventory</h2>
        <div class="section-row">
          <RouterLink to="/products" class="section-row-link">Products</RouterLink>
          <span class="section-value">{{ productsCount }}</span>
        </div>
        <div class="section-row">
          <RouterLink to="/warehouses" class="section-row-link">Warehouses</RouterLink>
          <span class="section-value">{{ warehousesCount }}</span>
        </div>
        <div class="section-row">
          <RouterLink to="/stock-transactions" class="section-row-link">Stock Transactions</RouterLink>
          <span class="section-value">{{ transfersCount }}</span>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">Commerce</h2>
        <div class="section-row">
          <RouterLink to="/sales/invoices" class="section-row-link">Sales</RouterLink>
          <span class="section-value">{{ salesCount }}</span>
        </div>
        <div class="section-row">
          <RouterLink to="/purchases" class="section-row-link">Purchases</RouterLink>
          <span class="section-value">{{ purchasesCount }}</span>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">
          <span class="section-link">People</span>
        </h2>
        <div class="section-row">
          <RouterLink to="/users" class="section-row-link">Users</RouterLink>
          <span class="section-value">{{ usersCount }}</span>
        </div>
        <div class="section-row">
          <RouterLink to="/customers" class="section-row-link">Customers</RouterLink>
          <span class="section-value">{{ customersCount }}</span>
        </div>
        <div class="section-row">
          <RouterLink to="/suppliers" class="section-row-link">Suppliers</RouterLink>
          <span class="section-value">{{ suppliersCount }}</span>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">
          <span class="section-link">Reports</span>
        </h2>
        <div class="section-row">
          <RouterLink to="/reports" class="section-row-link">Open Reports</RouterLink>
          <span class="section-value">-</span>
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
import { useSuppliersStore } from '@/stores/suppliers'
import { useWarehouseStore } from '@/stores/warehouse'
import { useStockTransfersStore } from '@/stores/stockTransfers'

// Pinia stores
const productsStore = useProductsStore()
const salesStore = useSalesStore()
const purchasesStore = usePurchasesStore()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()
const suppliersStore = useSuppliersStore()
const warehouseStore = useWarehouseStore()
const stockTransfersStore = useStockTransfersStore()

// ? Computed values
const productsCount = computed(() =>
  Array.isArray(productsStore.products) ? productsStore.products.length : 0
)
const salesCount = computed(() =>
  Array.isArray(salesStore.sales) ? salesStore.sales.length : 0
)

const purchasesCount = computed(() =>
  Array.isArray(purchasesStore.purchases) ? purchasesStore.purchases.length : 0
)

const customersCount = computed(() =>
  Array.isArray(customersStore.customers) ? customersStore.customers.length : 0
)
const usersCount = computed(() =>
  Array.isArray(usersStore.users) ? usersStore.users.length : 0
)
const suppliersCount = computed(() =>
  Array.isArray(suppliersStore.suppliers) ? suppliersStore.suppliers.length : 0
)
const warehousesCount = computed(() =>
  Array.isArray(warehouseStore.warehouses) ? warehouseStore.warehouses.length : 0
)
const transfersCount = computed(() =>
  Array.isArray(stockTransfersStore.transfers) ? stockTransfersStore.transfers.length : 0
)

onMounted(() => {
  productsStore.fetchProducts()
  salesStore.fetchSales()
  purchasesStore.fetchPurchases()
  customersStore.fetchCustomers()
  usersStore.fetchUsers()
  suppliersStore.fetchSuppliers()
  warehouseStore.fetchWarehouses()
  stockTransfersStore.fetchTransfers()
})
</script>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
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
  align-items: center;
  font-size: 14px;
  padding: 4px 0;
  color: #374151;
}
.section-row-link {
  color: rgb(76, 38, 131);
  font-weight: 600;
}
.section-row-link:hover {
  text-decoration: underline;
}
.section-value {
  font-weight: 600;
  color: #111827;
}
</style>
