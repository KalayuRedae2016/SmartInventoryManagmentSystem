<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-brand">Sale Invoices</h1>
      <RouterLink v-if="canCreate" to="/sales/invoice/new" class="btn-primary">+ New Invoice</RouterLink>
    </div>
    <table class="w-full border-collapse border">
      <thead class="bg-gray-200">
        <tr>
          <th class="border px-4 py-2">Invoice #</th>
          <th class="border px-4 py-2">Sale Date</th>
          <th class="border px-4 py-2">Customer</th>
          <th class="border px-4 py-2">Warehouse ID</th>
          <th class="border px-4 py-2">Total</th>
          <th class="border px-4 py-2">Paid</th>
          <th class="border px-4 py-2">Payment</th>
          <th class="border px-4 py-2">Status</th>
          <th class="border px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <td class="border px-4 py-2">{{ invoice.invoiceNumber || invoice.id }}</td>
          <td class="border px-4 py-2">{{ formatDate(invoice.saleDate) }}</td>
          <td class="border px-4 py-2">{{ invoice.customer }}</td>
          <td class="border px-4 py-2">{{ invoice.warehouseId || '-' }}</td>
          <td class="border px-4 py-2">{{ invoice.totalAmount }}</td>
          <td class="border px-4 py-2">{{ invoice.paidAmount }}</td>
          <td class="border px-4 py-2">{{ invoice.paymentMethod || '-' }}</td>
          <td class="border px-4 py-2">{{ invoice.status }}</td>
          <td class="border px-4 py-2">
            <div class="inline-flex items-center gap-2">
              <RouterLink v-if="canView" :to="`/sales/invoice/${invoice.id}`" class="icon-btn icon-view" title="View">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                </svg>
              </RouterLink>
              <RouterLink v-if="canUpdate" :to="`/sales/invoice/${invoice.id}/edit`" class="icon-btn icon-edit" title="Edit">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
                </svg>
              </RouterLink>
              <button v-if="canDelete" class="icon-btn icon-delete" title="Delete" @click="deleteInvoice(invoice)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'

const store = useSalesStore()
const invoices = computed(() => store.sales)
const auth = useAuthStore()
const canCreate = computed(() => auth.hasPermission('sales.create'))
const canView = computed(() => auth.hasPermission('sales.view'))
const canUpdate = computed(() => auth.hasPermission('sales.update'))
const canDelete = computed(() => auth.hasPermission('sales.delete'))

onMounted(() => {
  store.fetchSales()
})

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

async function deleteInvoice(invoice) {
  if (!confirm(`Delete invoice ${invoice.invoiceNumber || invoice.id}?`)) return
  await store.deleteSale(invoice.id)
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
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
.icon-edit { color: #2563eb; }
.icon-delete { color: #dc2626; }
</style>
