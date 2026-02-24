<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-brand">Units</h2>
      <button @click="openAdd" class="bg-brand text-white px-4 py-2 rounded hover:bg-purple-700 transition">
        + Add Unit
      </button>
    </div>

    <DataTable
      :data="store.units"
      :columns="['name', 'description', 'status']"
      :canEdit="false"
      :canDelete="false"
    >
      <template #rowActions="{ row }">
        <button class="icon-btn icon-view" title="View" @click="openView(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </button>
        <button class="icon-btn icon-edit" title="Edit" @click="openEdit(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
          </svg>
        </button>
        <button class="icon-btn icon-delete" title="Delete" @click="remove(row)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
        <button
          class="icon-btn"
          :class="row.isActive ? 'icon-deactivate' : 'icon-activate'"
          :title="row.isActive ? 'Deactivate Unit' : 'Activate Unit'"
          @click="toggleStatus(row)"
        >
          <svg v-if="row.isActive" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 20a9 9 0 1 1 8.6-11.7 1 1 0 1 1-1.9.6A7 7 0 1 0 19 12a1 1 0 1 1 2 0 9 9 0 0 1-9 10Z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a1 1 0 0 1 1 1v9.1l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.1V3a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
        </button>
      </template>
    </DataTable>

    <Modal
      v-model:show="showModal"
      :title="editingId ? 'Edit Unit' : 'Add Unit'"
      :modelValue="form"
      type="form"
      @submit="save"
    >
      <template #default="{ formData }">
        <div class="space-y-3">
          <input v-model="formData.name" placeholder="Name" class="input" />
          <textarea v-model="formData.description" placeholder="Description" class="input"></textarea>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="formData.isActive" type="checkbox" />
            <span>isActive</span>
          </label>
        </div>
      </template>
    </Modal>

    <div v-if="showViewModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">Unit Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="detail-row"><span class="detail-label">id</span><span>{{ viewItem.id ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">businessId</span><span>{{ viewItem.businessId ?? '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">name</span><span>{{ viewItem.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">description</span><span>{{ viewItem.description || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">isActive</span><span>{{ String(Boolean(viewItem.isActive)) }}</span></div>
          <div class="detail-row"><span class="detail-label">createdAt</span><span>{{ formatDateTime(viewItem.createdAt) }}</span></div>
          <div class="detail-row"><span class="detail-label">updatedAt</span><span>{{ formatDateTime(viewItem.updatedAt) }}</span></div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" @click="closeView">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { useUnitsStore } from '@/stores/units'

const store = useUnitsStore()

const showModal = ref(false)
const showViewModal = ref(false)
const editingId = ref(null)
const viewItem = reactive({})

const form = reactive({
  id: null,
  businessId: 1,
  name: '',
  description: '',
  isActive: true
})

onMounted(() => {
  store.fetchUnits()
})

function openAdd() {
  editingId.value = null
  Object.assign(form, {
    id: null,
    businessId: 1,
    name: '',
    description: '',
    isActive: true
  })
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    id: row.id,
    businessId: row.businessId ?? 1,
    name: row.name || '',
    description: row.description || '',
    isActive: Boolean(row.isActive)
  })
  showModal.value = true
}

function openView(row) {
  Object.assign(viewItem, row)
  showViewModal.value = true
}

function closeView() {
  showViewModal.value = false
}

async function save(formData) {
  if (!String(formData.name || '').trim()) {
    alert('Name is required.')
    return
  }
  if (!String(formData.description || '').trim()) {
    alert('Description is required.')
    return
  }

  try {
    if (editingId.value) {
      await store.updateUnit({
        id: editingId.value,
        name: String(formData.name || '').trim(),
        description: String(formData.description || '').trim(),
        isActive: Boolean(formData.isActive)
      })
    } else {
      await store.addUnit({
        businessId: 1,
        name: String(formData.name || '').trim(),
        description: String(formData.description || '').trim(),
        isActive: Boolean(formData.isActive)
      })
    }
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to save unit')
    return
  }
}

async function remove(row) {
  if (!confirm(`Delete unit "${row.name}"?`)) return
  try {
    await store.deleteUnit(row.id)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to delete unit')
  }
}

async function toggleStatus(row) {
  try {
    await store.toggleUnitStatus(row)
  } catch (error) {
    alert(error?.response?.data?.message || error?.message || 'Unable to update unit status')
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
.text-brand {
  color: rgb(76,38,131);
}
.bg-brand {
  background: rgb(76,38,131);
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
