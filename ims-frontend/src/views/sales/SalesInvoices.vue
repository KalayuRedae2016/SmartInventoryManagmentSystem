<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-4">Sale Invoices</h1>

    <table class="w-full border-collapse border">
      <thead class="bg-gray-200">
        <tr>
          <th class="border px-4 py-2">Invoice ID</th>
          <th class="border px-4 py-2">Customer</th>
          <th class="border px-4 py-2">Request ID</th>
          <th class="border px-4 py-2">Total Amount</th>
          <th class="border px-4 py-2">Status</th>
          <th v-if="isAdmin" class="border px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <td class="border px-4 py-2">{{ invoice.id }}</td>
          <td class="border px-4 py-2">{{ invoice.customerName }}</td>
          <td class="border px-4 py-2">{{ invoice.requestId }}</td>
          <td class="border px-4 py-2">{{ invoice.total }}</td>
          <td class="border px-4 py-2">{{ invoice.status }}</td>
          <td v-if="isAdmin" class="border px-4 py-2 space-x-2">
            <button 
              v-if="invoice.status==='Pending'" 
              class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              @click="markPaid(invoice.id)">
              Mark Paid
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Auth store
const auth = useAuthStore()
const role = computed(() => auth.user?.role || '')
const isAdmin = computed(() =>
  ['support', 'admin', 'owner', 'superadmin'].includes(role.value)
)

// Mock customer requests
const requests = ref([
  {
    id: 1,
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
    customerName: 'Customer A',
    type: 'sale',
    status: 'Approved',
    total: 100,
    created_at: '2026-01-25T10:00:00Z'
  },
  {
    id: 2,
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
    customerName: 'Customer B',
    type: 'sale',
    status: 'Pending',
    total: 50,
    created_at: '2026-01-28T09:15:00Z'
  },
])

// Auto-generate invoices from approved requests
const invoices = ref([])

function generateInvoices() {
  invoices.value = requests.value
    .filter(r => r.status === 'Approved')
    .map(r => ({
      id: r.id, // same as request id for simplicity
      requestId: r.id,
      customerName: r.customerName,
      total: r.total,
      status: 'Pending'
    }))
}

// Watch requests for new approvals
watch(requests, () => {
  generateInvoices()
}, { deep: true, immediate: true })

function markPaid(id) {
  const inv = invoices.value.find(i => i.id === id)
  if (inv) inv.status = 'Paid'
}
</script>

<style scoped>
.text-brand { color: rgb(76,38,131); }
</style>
