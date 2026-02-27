<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/DataTable.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

const BRAND = 'rgb(76, 38, 131)'
const auth = useAuthStore()

const isCustomer = computed(() => auth.hasPermission('requests.create'))
const canApprove = computed(() => auth.hasPermission('requests.approve'))

const requests = ref([])
const loading = ref(false)

const showConfirm = ref(false)
const selectedAction = ref(null)
const selectedRequest = ref(null)

const showCreateForm = ref(false)
const createForm = ref({
  request_type: 'purchase',
  description: ''
})

const mockRequests = [
  {
    id: 1,
    customer: 'Abel Tesfay',
    request_type: 'purchase',
    description: 'Request to buy laptops',
    status: 'pending',
    created_at: '2026-02-01T09:00:00Z'
  },
  {
    id: 2,
    customer: 'Mulu Desta',
    request_type: 'service',
    description: 'Account issue',
    status: 'approved',
    created_at: '2026-01-28T11:30:00Z'
  }
]

async function fetchRequests() {
  loading.value = true
  try {
    requests.value = [...mockRequests]
  } finally {
    loading.value = false
  }
}

onMounted(fetchRequests)

function openCreateForm() {
  createForm.value = { request_type: 'purchase', description: '' }
  showCreateForm.value = true
}

function createRequest() {
  const description = String(createForm.value.description || '').trim()
  if (!description) return

  requests.value.unshift({
    id: Date.now(),
    customer: auth.user?.fullName || auth.user?.name || 'Customer',
    request_type: createForm.value.request_type,
    description,
    status: 'pending',
    created_at: new Date().toISOString()
  })
  showCreateForm.value = false
}

function confirmAction(action, row) {
  selectedAction.value = action
  selectedRequest.value = row
  showConfirm.value = true
}

function executeAction() {
  const req = selectedRequest.value
  if (!req) return
  if (selectedAction.value === 'approve') req.status = 'approved'
  if (selectedAction.value === 'reject') req.status = 'rejected'
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

const columns = ['customer', 'request_type', 'description', 'status', 'created_at']
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Customer Requests</h1>
      <button
        v-if="isCustomer"
        class="px-4 py-2 rounded text-white"
        :style="{ backgroundColor: BRAND }"
        @click="openCreateForm"
      >
        + New Request
      </button>
    </div>

    <div v-if="showCreateForm" class="rounded border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Request Type</label>
        <select v-model="createForm.request_type" class="w-full rounded border px-3 py-2">
          <option value="purchase">purchase</option>
          <option value="service">service</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Description</label>
        <textarea v-model="createForm.description" class="w-full rounded border px-3 py-2" rows="3" />
      </div>
      <div class="flex justify-end gap-2">
        <button class="px-3 py-2 rounded border" @click="showCreateForm = false">Cancel</button>
        <button class="px-3 py-2 rounded text-white" :style="{ backgroundColor: BRAND }" @click="createRequest">Submit</button>
      </div>
    </div>

    <DataTable :data="requests" :columns="columns" :canEdit="false" :canDelete="false">
      <template #rowActions="{ row }">
        <div v-if="canApprove && row.status === 'pending'" class="space-x-2">
          <button class="text-green-600 hover:underline" @click="confirmAction('approve', row)">Approve</button>
          <button class="text-red-600 hover:underline" @click="confirmAction('reject', row)">Reject</button>
        </div>
        <button v-if="isCustomer && row.status === 'pending'" class="text-gray-600 hover:underline" @click="cancelRequest(row)">
          Cancel
        </button>
      </template>
    </DataTable>

    <ConfirmationDialog
      :show="showConfirm"
      title="Confirm Action"
      message="Are you sure you want to continue?"
      @confirm="executeAction"
      @close="resetDialog"
    />
  </div>
</template>

