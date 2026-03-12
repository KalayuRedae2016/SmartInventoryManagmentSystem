<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Customers</h1>

    <button v-if="canCreate" @click="openAddModal" class="bg-brand text-white px-3 py-1 rounded">Add Customer</button>

    <DataTable
      :data="customers"
      :columns="['code', 'name', 'phone', 'email', 'city', 'status']"
      @export="exportData"
    >
      <template #cell="{ col, value, row }">
        <img
          v-if="col === 'name' && row.profileImage"
          :src="row.profileImage"
          alt=""
          class="inline-block w-7 h-7 rounded-full object-cover mr-2 align-middle"
        />
        <span class="align-middle">{{ value ?? '-' }}</span>
      </template>
      <template #rowActions="{ row }">
        <button v-if="canView" class="icon-btn icon-view" title="View" @click="openViewModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </button>
        <button v-if="canUpdate" class="icon-btn icon-edit" title="Edit" @click="openEditModal(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
          </svg>
        </button>
        <button v-if="canDelete" class="icon-btn icon-delete" title="Delete" @click="deleteCustomer(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
        <button
          v-if="canUpdate"
          class="icon-btn"
          :class="row.status === 'active' ? 'icon-deactivate' : 'icon-activate'"
          :title="row.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'"
          @click="toggleCustomerStatus(row)"
        >
          <svg v-if="row.status === 'active'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 20a9 9 0 1 1 8.6-11.7 1 1 0 1 1-1.9.6A7 7 0 1 0 19 12a1 1 0 1 1 2 0 9 9 0 0 1-9 10Z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v9.1l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.1V3a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
        </button>
      </template>
    </DataTable>

    <Modal
      v-model:show="modalVisible"
      :title="editingId ? 'Edit Customer' : 'Add Customer'"
      :modelValue="form"
      type="form"
      :closeOnSubmit="false"
      @submit="saveCustomer"
    >
      <template #default>
        <div class="space-y-2">
          <input v-model="form.code" placeholder="Code" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.name" placeholder="Customer Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.phone" placeholder="Phone Number" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.email" placeholder="Email (optional)" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.country" placeholder="Country" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.city" placeholder="City" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.address" placeholder="Address" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.taxNumber" placeholder="Tax Number" class="w-full border px-2 py-1 rounded" />
          <textarea v-model="form.additionalInfo" placeholder="Additional Info" rows="3" class="w-full border px-2 py-1 rounded"></textarea>
          <input type="file" accept="image/*" class="w-full border px-2 py-1 rounded" @change="onProfileImageSelected" />
          <img
            v-if="profilePreviewUrl"
            :src="profilePreviewUrl"
            alt="Profile preview"
            class="w-16 h-16 rounded-full object-cover border"
          />
          <select v-model="form.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </template>
    </Modal>

    <div v-if="notice.show" class="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-red-100 overflow-hidden">
        <div class="px-5 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white">
          <h3 class="text-lg font-semibold">{{ notice.title }}</h3>
        </div>
        <div class="px-5 py-5">
          <p class="text-sm text-gray-700 leading-relaxed">{{ notice.message }}</p>
        </div>
        <div class="px-5 py-4 border-t bg-gray-50 flex justify-end">
          <button class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition" @click="notice.show = false">
            OK
          </button>
        </div>
      </div>
    </div>

    <div v-if="viewModalVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Customer Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="sm:col-span-2" v-if="viewCustomer.profileImage">
            <img :src="viewCustomer.profileImage" alt="" class="w-20 h-20 rounded-full object-cover border" />
          </div>
          <div class="detail-row"><span class="detail-label">ID</span><span>{{ viewCustomer.id || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Code</span><span>{{ viewCustomer.code || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Name</span><span>{{ viewCustomer.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Phone</span><span>{{ viewCustomer.phone || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span>{{ viewCustomer.email || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Country</span><span>{{ viewCustomer.country || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">City</span><span>{{ viewCustomer.city || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Address</span><span>{{ viewCustomer.address || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Tax Number</span><span>{{ viewCustomer.taxNumber || '-' }}</span></div>
          <div class="detail-row sm:col-span-2"><span class="detail-label">Additional Info</span><span>{{ viewCustomer.additionalInfo || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Status</span><span class="capitalize">{{ viewCustomer.status || '-' }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="closeViewModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useCustomersStore } from '@/stores/customers'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canCreate = computed(() => auth.hasPermission('customers.create'))
const canView = computed(() => auth.hasPermission('customers.view'))
const canUpdate = computed(() => auth.hasPermission('customers.update'))
const canDelete = computed(() => auth.hasPermission('customers.delete'))

const store = useCustomersStore()
const { customers } = storeToRefs(store)

const modalVisible = ref(false)
const editingId = ref(null)
const viewModalVisible = ref(false)
const viewCustomer = reactive({})
const profilePreviewUrl = ref('')
const notice = reactive({
  show: false,
  title: '',
  message: ''
})
const form = reactive({
  code: '',
  name: '',
  phone: '',
  email: '',
  country: '',
  city: '',
  address: '',
  taxNumber: '',
  additionalInfo: '',
  profileImage: null,
  status: 'active'
})

onMounted(() => {
  store.fetchCustomers()
})

function openAddModal() {
  editingId.value = null
  form.code = ''
  form.name = ''
  form.phone = ''
  form.email = ''
  form.country = ''
  form.city = ''
  form.address = ''
  form.taxNumber = ''
  form.additionalInfo = ''
  form.profileImage = null
  profilePreviewUrl.value = ''
  form.status = 'active'
  modalVisible.value = true
}

function openEditModal(customer) {
  editingId.value = customer.id
  form.code = customer.code || ''
  form.name = customer.name || ''
  form.phone = customer.phone || ''
  form.email = customer.email || ''
  form.country = customer.country || ''
  form.city = customer.city || ''
  form.address = customer.address || ''
  form.taxNumber = customer.taxNumber || ''
  form.additionalInfo = customer.additionalInfo || ''
  form.profileImage = null
  profilePreviewUrl.value = customer.profileImage || ''
  form.status = customer.status || 'active'
  modalVisible.value = true
}

function openViewModal(customer) {
  Object.assign(viewCustomer, customer)
  viewModalVisible.value = true
}

function closeViewModal() {
  viewModalVisible.value = false
}

function onProfileImageSelected(event) {
  const file = event?.target?.files?.[0] || null
  form.profileImage = file
  profilePreviewUrl.value = file ? URL.createObjectURL(file) : ''
}

async function saveCustomer() {
  if (!canCreate.value && !canUpdate.value) {
    showNotice('Permission Denied', 'You do not have permission to save customers.')
    return
  }
  try {
    if (!String(form.name || '').trim()) {
      showNotice('Validation Error', 'Customer name is required.')
      return
    }

    if (editingId.value) {
      await store.updateCustomer({
        id: editingId.value,
        code: String(form.code || '').trim(),
        name: String(form.name || '').trim(),
        phone: String(form.phone || '').trim(),
        email: String(form.email || '').trim(),
        country: String(form.country || '').trim(),
        city: String(form.city || '').trim(),
        address: String(form.address || '').trim(),
        taxNumber: String(form.taxNumber || '').trim(),
        additionalInfo: String(form.additionalInfo || '').trim(),
        profileImage: form.profileImage,
        status: form.status || 'active'
      })
      modalVisible.value = false
      return
    }

    await store.addCustomer({
      code: String(form.code || '').trim() || `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(form.name || '').trim(),
      phone: String(form.phone || '').trim(),
      email: String(form.email || '').trim(),
      country: String(form.country || '').trim(),
      city: String(form.city || '').trim(),
      address: String(form.address || '').trim(),
      taxNumber: String(form.taxNumber || '').trim(),
      additionalInfo: String(form.additionalInfo || '').trim(),
      profileImage: form.profileImage,
      status: form.status || 'active'
    })
    modalVisible.value = false
  } catch (error) {
    const status = error?.response?.status
    if (status === 409) {
      showNotice('Duplicate Customer', 'Customer with same name/code already exists. Use a different name.')
      return
    }
    showNotice('Save Failed', error?.response?.data?.message || error?.message || 'Unable to save customer')
  }
}

async function deleteCustomer(customer) {
  if (!canDelete.value) {
    alert('You do not have permission to delete customers.')
    return
  }
  if (!confirm('Delete this customer?')) return
  try {
    await store.deleteCustomer(customer.id)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to delete customer')
  }
}

async function toggleCustomerStatus(customer) {
  if (!canUpdate.value) {
    alert('You do not have permission to update customer status.')
    return
  }
  try {
    await store.toggleCustomerStatus(customer)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to update customer status')
  }
}

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}

function showNotice(title, message) {
  notice.title = title
  notice.message = message
  notice.show = true
}
</script>

<style scoped>
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
.icon-activate { color: #059669; }
.icon-activate:hover { background: #ecfdf5; border-color: #6ee7b7; }
.icon-deactivate { color: #d97706; }
.icon-deactivate:hover { background: #fffbeb; border-color: #fcd34d; }
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
