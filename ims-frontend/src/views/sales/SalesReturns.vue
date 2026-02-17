<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

/* =========================
   AUTH & RBAC
========================= */
const auth = useAuthStore()
const role = computed(() => auth.user?.role || '')

const canCreate = computed(() =>
  role.value === 'sale' || role.value === 'sales'
)

const canApprove = computed(() =>
  role.value === 'admin' || role.value === 'owner' || role.value === 'superadmin'
)

/* =========================
   STATE
========================= */
const sales = ref([])
const selectedSale = ref(null)
const returnQty = ref(1)
const reason = ref('')
const loading = ref(false)

/* =========================
   API
========================= */
const fetchInvoicedSales = async () => {
  loading.value = true
  try {
    const res = await api.get('/sales?status=invoiced')
    sales.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const submitReturn = async () => {
  if (!selectedSale.value) return

  await api.post(`/sales/${selectedSale.value.id}/return`, {
    quantity: returnQty.value,
    reason: reason.value
  })

  selectedSale.value = null
  returnQty.value = 1
  reason.value = ''
  fetchInvoicedSales()
}

const approveReturn = async (sale) => {
  await api.post(`/sales/${sale.id}/return/approve`)
  fetchInvoicedSales()
}

const rejectReturn = async (sale) => {
  await api.post(`/sales/${sale.id}/return/reject`)
  fetchInvoicedSales()
}

/* =========================
   LIFECYCLE
========================= */
onMounted(fetchInvoicedSales)
</script>

<template>
  <div class="page">
    <h1>Sale Returns</h1>

    <!-- ================= CREATE RETURN ================= -->
    <div v-if="canCreate" class="card">
      <h3>New Return</h3>

      <select v-model="selectedSale">
        <option disabled value="">Select Sale</option>
        <option
          v-for="s in sales"
          :key="s.id"
          :value="s"
        >
          #{{ s.id }} — {{ s.customer }}
        </option>
      </select>

      <input
        type="number"
        min="1"
        v-model="returnQty"
        placeholder="Return quantity"
      />

      <textarea
        v-model="reason"
        placeholder="Return reason"
      />

      <button
        class="btn danger"
        @click="submitReturn"
      >
        Submit Return
      </button>
    </div>

    <!-- ================= RETURN REQUESTS ================= -->
    <div class="card">
      <h3>Return Requests</h3>

      <table>
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Returned Qty</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="s in sales" :key="s.id">
            <td>{{ s.id }}</td>
            <td>{{ s.customer }}</td>

            <td>
              <span :class="`badge ${s.return_status}`">
                {{ s.return_status || '—' }}
              </span>
            </td>

            <td>{{ s.returned_quantity || 0 }}</td>

            <td>
              <button
                v-if="s.return_status === 'pending' && canApprove"
                class="btn success"
                @click="approveReturn(s)"
              >
                Approve
              </button>

              <button
                v-if="s.return_status === 'pending' && canApprove"
                class="btn danger"
                @click="rejectReturn(s)"
              >
                Reject
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading">Loading...</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
}

.card {
  background: #fff;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
}

select, input, textarea {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

/* ================= BADGES ================= */
.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.badge.pending { background: #f59e0b; color: #fff }
.badge.returned { background: #16a34a; color: #fff }
.badge.partial_return { background: #2563eb; color: #fff }
.badge.rejected { background: #dc2626; color: #fff }

/* ================= BUTTONS ================= */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn.success { background: #16a34a; color: #fff }
.btn.danger { background: #dc2626; color: #fff }
</style>
