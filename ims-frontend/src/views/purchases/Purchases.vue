<template>
  <div class="space-y-4">
    <div class="flex items-center justify-end">
      <RouterLink v-if="canCreate" to="/purchases/new" class="btn-primary">+ New Purchase</RouterLink>
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
              <div class="inline-flex items-center gap-2">
                <RouterLink v-if="canView" class="icon-btn icon-view" :to="`/purchases/${p.id}`" title="View">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                  </svg>
                </RouterLink>
                <RouterLink v-if="canUpdate" class="icon-btn icon-edit" :to="`/purchases/${p.id}/edit`" title="Edit">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
                  </svg>
                </RouterLink>
                <button v-if="canDelete" class="icon-btn icon-delete" @click="deletePurchase(p.id)" title="Delete">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!purchases.length">
            <td colspan="8" class="p-6 text-center text-gray-500">No purchases found</td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-4 text-center text-purple-800">Loading...</div>
    </div>

    <Modal
      v-model:show="confirmVisible"
      :title="confirmTitle"
      type="confirm"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePurchasesStore } from '@/stores/purchases'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Modal from '@/components/Modal.vue'

const purchasesStore = usePurchasesStore()
const purchases = computed(() => purchasesStore.purchases)
const loading = computed(() => purchasesStore.loading)
const auth = useAuthStore()
const canCreate = computed(() => auth.hasPermission('purchases.create'))
const canView = computed(() => auth.hasPermission('purchases.view'))
const canUpdate = computed(() => auth.hasPermission('purchases.update'))
const canDelete = computed(() => auth.hasPermission('purchases.delete'))
const confirmVisible = ref(false)
const rowToDelete = ref(null)

onMounted(() => {
  purchasesStore.fetchPurchases()
})

function deletePurchase(id) {
  rowToDelete.value = purchases.value.find(p => p.id === id) || { id }
  confirmVisible.value = true
}

const confirmTitle = computed(() => {
  const id = rowToDelete.value?.id
  return id ? `Delete purchase #${id}?` : 'Delete this purchase?'
})

async function confirmDelete() {
  if (!rowToDelete.value) return
  await purchasesStore.deletePurchase(rowToDelete.value.id)
  rowToDelete.value = null
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
.badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; text-transform: capitalize; }
.badge-pending { background: #f59e0b; color: #fff; }
.badge-partial { background: #2563eb; color: #fff; }
.badge-paid { background: #16a34a; color: #fff; }
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: background-color .15s ease, border-color .15s ease;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.icon-view { color: rgb(76, 38, 131); }
.icon-view:hover { background: #f5f3ff; border-color: #c4b5fd; }
.icon-edit { color: #2563eb; }
.icon-edit:hover { background: #eff6ff; border-color: #93c5fd; }
.icon-delete { color: #dc2626; }
.icon-delete:hover { background: #fef2f2; border-color: #fca5a5; }
</style>
