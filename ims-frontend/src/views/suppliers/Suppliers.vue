<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between border-b pb-3">
      <h1 class="text-2xl font-bold text-brand">Suppliers</h1>
      <button
        v-if="canCreate"
        @click="openAddModal"
        class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
      >
        Add Supplier
      </button>
    </div>

    <Datatable
      :data="suppliers"
      :columns="columns"
      :can-edit="false"
      :can-delete="false"
      title="Suppliers"
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
        <button v-if="canDelete" class="icon-btn icon-delete" title="Delete" @click="deleteSupplier(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
        <button
          v-if="canUpdate"
          class="icon-btn"
          :class="row.status === 'active' ? 'icon-deactivate' : 'icon-activate'"
          :title="row.status === 'active' ? 'Deactivate Supplier' : 'Activate Supplier'"
          @click="toggleSupplierStatus(row)"
        >
          <svg v-if="row.status === 'active'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 20a9 9 0 1 1 8.6-11.7 1 1 0 1 1-1.9.6A7 7 0 1 0 19 12a1 1 0 1 1 2 0 9 9 0 0 1-9 10Z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v9.1l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.1V3a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
        </button>
      </template>
    </Datatable>

    <Modal
      v-model:show="modalVisible"
      :title="editItem?.id ? 'Edit Supplier' : 'Add Supplier'"
      :modelValue="editItem"
      type="form"
      @submit="saveSupplier"
    >
      <template #default="{ formData }">
        <div class="space-y-2">
          <input v-model="formData.code" placeholder="Code" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.email" placeholder="Email" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.country" placeholder="Country" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.city" placeholder="City" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.address" placeholder="Address" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.taxNumber" placeholder="Tax Number" class="w-full border px-2 py-1 rounded" />
          <textarea v-model="formData.additionalInfo" placeholder="Additional Info" rows="3" class="w-full border px-2 py-1 rounded"></textarea>
          <input type="file" accept="image/*" class="w-full border px-2 py-1 rounded" @change="onProfileImageSelected" />
          <img
            v-if="profilePreviewUrl"
            :src="profilePreviewUrl"
            alt="Profile preview"
            class="w-16 h-16 rounded-full object-cover border"
          />
          <select v-model="formData.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </template>
    </Modal>

    <div v-if="viewModalVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Supplier Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="sm:col-span-2" v-if="viewItem.profileImage">
            <img :src="viewItem.profileImage" alt="" class="w-20 h-20 rounded-full object-cover border" />
          </div>
          <div class="detail-row"><span class="detail-label">ID</span><span>{{ viewItem.id || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Code</span><span>{{ viewItem.code || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Name</span><span>{{ viewItem.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span>{{ viewItem.email || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Phone</span><span>{{ viewItem.phone || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Country</span><span>{{ viewItem.country || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">City</span><span>{{ viewItem.city || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Address</span><span>{{ viewItem.address || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Tax Number</span><span>{{ viewItem.taxNumber || '-' }}</span></div>
          <div class="detail-row sm:col-span-2"><span class="detail-label">Additional Info</span><span>{{ viewItem.additionalInfo || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Status</span><span class="capitalize">{{ viewItem.status || '-' }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="closeViewModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import Datatable from '@/components/Datatable.vue'
import Modal from '@/components/Modal.vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canCreate = computed(() => auth.hasPermission('suppliers.create'))
const canView = computed(() => auth.hasPermission('suppliers.view'))
const canUpdate = computed(() => auth.hasPermission('suppliers.update'))
const canDelete = computed(() => auth.hasPermission('suppliers.delete'))

const suppliersStore = useSuppliersStore()
const suppliers = suppliersStore.suppliers

const columns = ['name', 'email', 'phone', 'address', 'status']

const modalVisible = ref(false)
const editItem = reactive({})
const viewModalVisible = ref(false)
const viewItem = reactive({})
const profilePreviewUrl = ref('')

onMounted(async () => {
  try {
    await suppliersStore.fetchSuppliers()
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to load suppliers')
  }
})

function openAddModal() {
  Object.assign(editItem, {
    id: null,
    code: '',
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    taxNumber: '',
    additionalInfo: '',
    profileImage: null,
    status: 'active'
  })
  profilePreviewUrl.value = ''
  modalVisible.value = true
}

function openEditModal(row) {
  Object.assign(editItem, {
    country: '',
    city: '',
    taxNumber: '',
    additionalInfo: '',
    ...row
  })
  editItem.profileImage = null
  profilePreviewUrl.value = row.profileImage || ''
  modalVisible.value = true
}

function openViewModal(row) {
  Object.assign(viewItem, { ...row })
  viewModalVisible.value = true
}

function closeViewModal() {
  viewModalVisible.value = false
}

function onProfileImageSelected(event) {
  const file = event?.target?.files?.[0] || null
  editItem.profileImage = file
  profilePreviewUrl.value = file ? URL.createObjectURL(file) : ''
}

async function deleteSupplier(row) {
  if (!canDelete.value) {
    alert('You do not have permission to delete suppliers.')
    return
  }
  if (confirm(`Are you sure you want to delete ${row.name}?`)) {
    try {
      await suppliersStore.deleteSupplier(row.id)
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || 'Unable to delete supplier')
    }
  }
}

async function saveSupplier(supplier) {
  if (!canCreate.value && !canUpdate.value) {
    alert('You do not have permission to save suppliers.')
    return
  }
  if (!String(supplier.name || '').trim()) {
    alert('Supplier name is required.')
    return
  }

  try {
    if (supplier.id) {
      await suppliersStore.updateSupplier(supplier)
    } else {
      await suppliersStore.addSupplier({
        ...supplier,
        business_id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date().toISOString()
      })
    }
    profilePreviewUrl.value = ''
  } catch (error) {
    if (error?.response?.status === 409) {
      alert('Supplier with same name/code already exists.')
      return
    }
    alert(error?.response?.data?.message || error?.message || 'Unable to save supplier')
  }
}

async function toggleSupplierStatus(row) {
  if (!canUpdate.value) {
    alert('You do not have permission to update supplier status.')
    return
  }
  try {
    await suppliersStore.toggleSupplierStatus(row)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to update supplier status')
  }
}
</script>

<style scoped>
.text-brand { color: rgb(76, 38, 131); }
.bg-brand { background-color: rgb(76, 38, 131); }
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
