<template>
  <div class="space-y-4">
    <div class="flex items-center justify-end">
      <RouterLink to="/purchases/new" class="btn-primary">+ New Purchase</RouterLink>
    </div>

    <div class="bg-white rounded shadow overflow-x-auto p-4">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="th">ID</th>
            <th class="th">Supplier</th>
            <th class="th">Warehouse</th>
            <th class="th">Total</th>
            <th class="th">Paid</th>
            <th class="th">Due</th>
            <th class="th">Status</th>
            <th class="th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in purchases" :key="p.id" class="border-t hover:bg-gray-50">
            <td class="td">
              <RouterLink :to="`/purchases/${p.id}`" class="underline text-blue-600">{{ p.id }}</RouterLink>
            </td>
            <td class="td">{{ p.supplier }}</td>
            <td class="td">{{ p.warehouse?.name || p.warehouseName || '-' }}</td>
            <td class="td">{{ p.totalAmount }}</td>
            <td class="td">{{ p.paidAmount }}</td>
            <td class="td">{{ p.dueAmount }}</td>
            <td class="td"><span :class="statusClass(p.status)">{{ p.status }}</span></td>
            <td class="td text-right">
              <button class="btn-danger" @click="deletePurchase(p.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="!purchases.length">
            <td colspan="8" class="p-6 text-center text-gray-500">No purchases found</td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-4 text-center text-purple-800">Loading...</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { usePurchasesStore } from '@/stores/purchases'
import { RouterLink } from 'vue-router'

const purchasesStore = usePurchasesStore()
const purchases = computed(() => purchasesStore.purchases)
const loading = computed(() => purchasesStore.loading)

onMounted(() => {
  purchasesStore.fetchPurchases()
})

async function deletePurchase(id) {
  await purchasesStore.deletePurchase(id)
}

const statusClass = status => ({
  pending: 'badge badge-pending',
  partial: 'badge badge-partial',
  paid: 'badge badge-paid'
}[status] || 'badge')
</script>

<style scoped>
.th { padding: 10px; text-align: left; font-weight: 600; }
.td { padding: 10px; }
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-danger {
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
}
.badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; text-transform: capitalize; }
.badge-pending { background: #f59e0b; color: #fff; }
.badge-partial { background: #2563eb; color: #fff; }
.badge-paid { background: #16a34a; color: #fff; }
</style>
