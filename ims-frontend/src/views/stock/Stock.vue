<!-- src/views/stock/Stock.vue -->
<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-brand">Stock Management</h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Total Products in Stock" :value="totalProducts" />
      <StatCard title="Low Stock Items" :value="lowStockCount" />
      <StatCard title="Stock Movements Today" :value="dailyStockMovements" />
    </div>

    <!-- Stock Actions -->
    <div class="bg-white p-4 rounded shadow space-y-3">
      <h2 class="text-xl font-bold mb-2">Stock Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select v-model="action.product" class="input">
          <option disabled value="">Select Product</option>
          <option v-for="p in products" :key="p.id" :value="p.name">
            {{ p.name }}
          </option>
        </select>
        <select v-model="action.warehouse" class="input">
          <option disabled value="">Select Warehouse</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.name">
            {{ w.name }}
          </option>
        </select>
        <input
          v-model.number="action.qty"
          type="number"
          min="1"
          class="input"
          placeholder="Quantity"
        />
        <div class="flex gap-2">
          <button class="btn-primary" @click="stockIn" :disabled="!canSubmit">
            Stock IN
          </button>
          <button class="btn-danger" @click="stockOut" :disabled="!canSubmit">
            Stock OUT
          </button>
        </div>
      </div>
    </div>

    <!-- Stock Table -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold mb-2">Current Stock</h2>
      <table class="w-full border-collapse border">
        <thead class="bg-gray-200">
          <tr>
            <th class="border px-4 py-2">Product</th>
            <th class="border px-4 py-2">Warehouse</th>
            <th class="border px-4 py-2">Quantity</th>
            <th class="border px-4 py-2">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in stockList" :key="item.id">
            <td class="border px-4 py-2">{{ item.productName }}</td>
            <td class="border px-4 py-2">{{ item.warehouseName }}</td>
            <td class="border px-4 py-2">{{ item.quantity }}</td>
            <td class="border px-4 py-2">{{ item.updatedAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock Chart -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold mb-2">Stock Movements Overview</h2>
      <canvas id="stockChart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import StatCard from '@/components/StatCard.vue'
import { useStockStore } from '@/stores/stock'
import { useProductsStore } from '@/stores/products'
import { useWarehouseStore } from '@/stores/warehouse'
import Chart from 'chart.js/auto'

const stockStore = useStockStore()
const productsStore = useProductsStore()
const warehouseStore = useWarehouseStore()

// Stock Summary
const totalProducts = ref(0)
const lowStockCount = ref(0)
const dailyStockMovements = ref(0)
const stockList = ref([])
const products = ref([])
const warehouses = ref([])
const action = ref({
  product: '',
  warehouse: '',
  qty: 1
})
const canSubmit = computed(() =>
  !!action.value.product && !!action.value.warehouse && action.value.qty > 0
)

onMounted(async () => {
  await Promise.all([
    stockStore.fetchStock(),
    productsStore.fetchProducts(),
    warehouseStore.fetchWarehouses()
  ])
  products.value = productsStore.products
  warehouses.value = warehouseStore.warehouses
  stockList.value = stockStore.stocks
  totalProducts.value = stockList.value.length
  lowStockCount.value = stockList.value.filter(s => s.quantity <= 5).length
  dailyStockMovements.value = stockStore.dailyMovements.length

  // Stock Movements Chart
  const ctx = document.getElementById('stockChart').getContext('2d')
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: stockStore.dailyMovements.map(m => m.date),
      datasets: [
        {
          label: 'Stock In/Out',
          data: stockStore.dailyMovements.map(m => m.quantity),
          borderColor: '#4c2683',
          fill: false
        }
      ]
    },
    options: { responsive: true }
  })
})

function stockIn() {
  if (!action.value.product || !action.value.warehouse || action.value.qty <= 0) return
  stockStore.increase(action.value.product, action.value.qty, action.value.warehouse, 'Manual IN')
}

function stockOut() {
  if (!action.value.product || !action.value.warehouse || action.value.qty <= 0) return
  stockStore.decrease(action.value.product, action.value.qty, action.value.warehouse, 'Manual OUT')
}
</script>

<style scoped>
.text-brand {
  color: rgb(76, 38, 131);
}
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
.btn-danger {
  background: #dc2626;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
}
</style>
