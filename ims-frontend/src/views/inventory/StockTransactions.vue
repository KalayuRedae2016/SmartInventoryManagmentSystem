<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Inventory / Stock Transactions</h1>

    <button @click="addStock" class="bg-brand text-white px-3 py-1 rounded">Add Stock</button>

    <DataTable
      :data="stock"
      :columns="['id','product','type','quantity','date']"
      @edit="editStock"
      @delete="deleteStock"
      @export="exportData"
    />
  </div>
</template>

<script setup>
import DataTable from '@/components/DataTable.vue'
import { useInventoryStore } from '@/stores/inventory'
const store = useInventoryStore()
const stock = store.stock

function addStock() {
  const id = stock.length + 1
  stock.push({ id, product: 'New Product', type: 'in', quantity: 0, date: new Date().toISOString().slice(0,10) })
}

function editStock(item) {
  const newQty = prompt('Quantity', item.quantity)
  if (newQty !== null) item.quantity = parseInt(newQty)
}

function deleteStock(item) {
  if (confirm('Delete this stock entry?')) {
    const index = stock.findIndex(s => s.id === item.id)
    if (index >= 0) stock.splice(index, 1)
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
