<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-brand">Suppliers</h1>

    <button v-if="canCreate" @click="openAddModal" class="bg-brand text-white px-3 py-1 rounded">
      Add Supplier
    </button>

    <DataTable
      :data="suppliers"
      :columns="['id','name','phone','email','status']"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    >
      <template #rowActions="{ row }">
        <button
          v-if="canUpdate"
          class="icon-btn icon-edit"
          title="Edit"
          @click="openEditModal(row)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
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
        <button
          v-if="canDelete"
          class="icon-btn icon-delete"
          title="Delete"
          @click="requestDelete(row)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
      </template>
    </DataTable>

    <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    <p v-else-if="loading" class="text-sm text-gray-500">Loading suppliers...</p>

    <Modal
      v-model:show="modalVisible"
      :title="editingId ? 'Edit Supplier' : 'Add Supplier'"
      :modelValue="form"
      type="form"
      @submit="saveSupplier"
    >
      <template #default>
        <div class="space-y-2">
          <input v-model="form.code" placeholder="Code" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.name" placeholder="Supplier Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.phone" placeholder="Phone Number" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.email" placeholder="Email (optional)" class="w-full border px-2 py-1 rounded" />
          <input v-model="form.address" placeholder="Address" class="w-full border px-2 py-1 rounded" />
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

    <Modal
      v-model:show="confirmVisible"
      :title="confirmTitle"
      type="confirm"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canCreate = computed(() => auth.hasPermission('suppliers.create'))
const canUpdate = computed(() => auth.hasPermission('suppliers.update'))
const canDelete = computed(() => auth.hasPermission('suppliers.delete'))

const store = useSuppliersStore()
const { suppliers, loading } = storeToRefs(store)

const modalVisible = ref(false)
const editingId = ref(null)
const confirmVisible = ref(false)
const rowToDelete = ref(null)
const profilePreviewUrl = ref('')
const loadError = ref('')

const form = reactive({
  code: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  additionalInfo: '',
  profileImage: null,
  status: 'active'
})

onMounted(() => {
  loadError.value = ''
  store.fetchSuppliers().catch(error => {
    loadError.value = error?.response?.data?.message || error?.message || 'Unable to load suppliers.'
  })
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.additionalInfo = ''
  form.profileImage = null
  form.status = 'active'
  profilePreviewUrl.value = ''
}

function openAddModal() {
  editingId.value = null
  resetForm()
  modalVisible.value = true
}

function openEditModal(supplier) {
  editingId.value = supplier.id
  form.code = supplier.code || ''
  form.name = supplier.name || ''
  form.phone = supplier.phone || ''
  form.email = supplier.email || ''
  form.address = supplier.address || ''
  form.additionalInfo = supplier.additionalInfo || ''
  form.profileImage = null
  form.status = supplier.status || 'active'
  profilePreviewUrl.value = supplier.profileImage || ''
  modalVisible.value = true
}

function onProfileImageSelected(event) {
  const file = event?.target?.files?.[0] || null
  form.profileImage = file
  profilePreviewUrl.value = file ? URL.createObjectURL(file) : ''
}

async function saveSupplier() {
  if (!String(form.name || '').trim()) {
    return
  }
  if (editingId.value) {
    await store.updateSupplier({
      id: editingId.value,
      code: String(form.code || '').trim(),
      name: String(form.name || '').trim(),
      phone: String(form.phone || '').trim(),
      email: String(form.email || '').trim(),
      address: String(form.address || '').trim(),
      additionalInfo: String(form.additionalInfo || '').trim(),
      profileImage: form.profileImage,
      status: form.status || 'active'
    })
  } else {
    await store.addSupplier({
      code: String(form.code || '').trim(),
      name: String(form.name || '').trim(),
      phone: String(form.phone || '').trim(),
      email: String(form.email || '').trim(),
      address: String(form.address || '').trim(),
      additionalInfo: String(form.additionalInfo || '').trim(),
      profileImage: form.profileImage,
      status: form.status || 'active'
    })
  }
  modalVisible.value = false
}

async function toggleSupplierStatus(supplier) {
  await store.toggleSupplierStatus(supplier)
}

function requestDelete(supplier) {
  rowToDelete.value = supplier
  confirmVisible.value = true
}

const confirmTitle = computed(() => {
  const name = rowToDelete.value?.name ? `"${rowToDelete.value.name}"` : null
  return name ? `Delete supplier ${name}?` : 'Delete this supplier?'
})

async function confirmDelete() {
  if (!rowToDelete.value) return
  await store.deleteSupplier(rowToDelete.value.id)
  rowToDelete.value = null
}

function exportData() {
  // no-op
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
.icon-edit { color: #2563eb; }
.icon-edit:hover { background: #eff6ff; border-color: #93c5fd; }
.icon-delete { color: #dc2626; }
.icon-delete:hover { background: #fef2f2; border-color: #fca5a5; }
.icon-activate { color: #059669; }
.icon-activate:hover { background: #ecfdf5; border-color: #6ee7b7; }
.icon-deactivate { color: #d97706; }
.icon-deactivate:hover { background: #fffbeb; border-color: #fcd34d; }
.bg-brand {
  background-color: rgb(76, 38, 131);
}
.text-brand {
  color: rgb(76, 38, 131);
}
</style>
