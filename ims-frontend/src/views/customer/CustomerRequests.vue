<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/DataTable.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

/* =========================
   CONSTANTS
========================= */
const BRAND = 'rgb(76, 38, 131)'

/* =========================
   AUTH & ROLE
========================= */
const auth = useAuthStore()
const role = computed(() => auth.user?.role)

/* =========================
   RBAC RULES
========================= */
const isCustomer = computed(() => role.value === 'customer')
const canApprove = computed(() =>
  ['support', 'admin', 'owner'].includes(role.value)
)

/* =========================
   DATA
========================= */
const requests = ref([])
const loading = ref(false)

/* =========================
   MODALS
========================= */
const showConfirm = ref(false)
const selectedAction = ref(null)
const selectedRequest = ref(null)

/* =========================
   MOCK DATA (REPLACE WITH API)
========================= */
const mockRequests = [
  {
    id: 1,
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
    customer: 'Abel Tesfay',
    request_type: 'purchase',
    description: 'Request to buy laptops',
    status: 'pending',
    reviewed_by: null,
    created_at: '2026-02-01T09:00:00Z',
    reviewed_at: null
  },
  {
    id: 2,
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
    customer: 'Mulu Desta',
    request_type: 'service',
    description: 'Account issue',
    status: 'approved',
    reviewed_by: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
    created_at: '2026-01-28T11:30:00Z',
    reviewed_at: '2026-01-29T10:00:00Z'
  }
]

/* =========================
   FETCH
========================= */
async function fetchRequests() {
  loading.value = true
  try {
    // 🔁 replace later with API
    requests.value = [...mockRequests]
  } finally {
    loading.value = false
  }
}

onMounted(fetchRequests)

/* =========================
   ACTION HANDLERS
========================= */
function confirmAction(action, row) {
  selectedAction.value = action
  selectedRequest.value = row
  showConfirm.value = true
}

function executeAction() {
  const req = selectedRequest.value
  if (!req) return

  if (selectedAction.value === 'approve') {
    req.status = 'approved'
  }
  if (selectedAction.value === 'reject') {
    req.status = 'rejected'
  }

  resetDialog()
}

function cancelRequest(row) {
  row.status = 'cancelled'
}

function resetDialog() {
  showConfirm.value = false
  selectedAction.value = null
  selectedRequest.value = null
}

/* =========================
   TABLE CONFIG
========================= */
const columns = ['customer', 'request_type', 'description', 'status', 'created_at']
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Customer Requests</h1>

      <!-- Customer Action -->
      <button
        v-if="isCustomer"
        class="px-4 py-2 rounded text-white"
        :style="{ backgroundColor: BRAND }"
      >
        ➕ New Request
      </button>
    </div>

    <!-- Table -->
    <DataTable
      :data="requests"
      :columns="columns"
      :canEdit="false"
      :canDelete="false"
    >
      <!-- Status Column -->
      <template #cell-status="{ row }">
        <span
          class="px-2 py-1 rounded text-xs font-semibold text-white"
          :class="{
            'bg-yellow-500': row.status === 'pending',
            'bg-green-600': row.status === 'approved',
            'bg-red-600': row.status === 'rejected',
            'bg-gray-400': row.status === 'cancelled'
          }"
        >
          {{ row.status }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #actions="{ row }">
        <!-- Approve / Reject -->
        <div v-if="canApprove && row.status === 'pending'" class="space-x-2">
          <button
            class="text-green-600 hover:underline"
            @click="confirmAction('approve', row)"
          >
            ✔ Approve
          </button>
          <button
            class="text-red-600 hover:underline"
            @click="confirmAction('reject', row)"
          >
            ✖ Reject
          </button>
        </div>

        <!-- Customer Cancel -->
        <button
          v-if="isCustomer && row.status === 'pending'"
          class="text-gray-600 hover:underline"
          @click="cancelRequest(row)"
        >
          ❌ Cancel
        </button>
      </template>
    </DataTable>

    <!-- Confirm Dialog -->
    <ConfirmationDialog
      :show="showConfirm"
      title="Confirm Action"
      message="Are you sure you want to continue?"
      @confirm="executeAction"
      @close="resetDialog"
    />
  </div>
</template>
