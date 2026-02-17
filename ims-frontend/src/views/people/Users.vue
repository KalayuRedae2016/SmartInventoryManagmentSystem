<template>
  <div>
    <!-- Header: Title + Add User -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-700">Users</h1>
      <button
        v-if="canAdd"
        @click="openAddModal"
        class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
      >
        Add User
      </button>
    </div>

    <!-- Datatable -->
    <Datatable
      :data="users"
      :columns="columns"
      :can-edit="true"
      :can-delete="true"
      title="Users"
      @edit="openEditModal"
      @delete="deleteUser"
    >
      <template #cell="{ row, col, value }">
        <div v-if="col === 'name'" class="flex items-center gap-2">
          <div class="avatar">
            <img v-if="row.photoUrl" :src="row.photoUrl" alt="" class="avatar-img" />
            <div v-else class="avatar-fallback">{{ initials(row.name) }}</div>
          </div>
          <span>{{ row.name }}</span>
        </div>
        <span v-else-if="col === 'documents'">{{ row.documents?.length || 0 }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>

      <template #rowActions="{ row }">
        <button class="text-brand hover:underline" @click="openProfile(row)">Profile</button>
      </template>
    </Datatable>

    <!-- Add/Edit Modal -->
    <Modal
      v-model:show="modalVisible"
      :title="editItem?.id ? 'Edit User' : 'Add User'"
      :modelValue="editItem"
      type="form"
      @submit="saveUser"
    >
      <template #default="{ formData }">
        <div class="space-y-3">
          <input v-model="formData.name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.email" placeholder="Email" class="w-full border px-2 py-1 rounded" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full border px-2 py-1 rounded" />

          <select v-model="formData.role" class="w-full border px-2 py-1 rounded">
            <option value="" disabled>Select role</option>
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>

          <select v-model="formData.status" class="w-full border px-2 py-1 rounded">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>

          <div class="space-y-2">
            <label class="text-sm text-gray-600">Profile Photo</label>
            <input type="file" accept="image/*" class="w-full" @change="onPhotoChange(formData, )" />
            <div v-if="formData.photo" class="text-xs text-gray-500">Selected: {{ formData.photo }}</div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-gray-600">Additional Documents</label>
            <input type="file" multiple class="w-full" @change="onDocsChange(formData, )" />
            <div v-if="formData.documents?.length" class="text-xs text-gray-500">
              Files: {{ formData.documents.join(', ') }}
            </div>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Profile Modal -->
    <div v-if="profileVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div class="bg-white w-full max-w-lg rounded shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-gray-700">User Profile</h2>
          <button class="text-gray-500 hover:text-gray-700" @click="closeProfile">Close</button>
        </div>

        <div class="flex items-center gap-4 mb-4">
          <div class="profile-avatar">
            <img v-if="profileUser?.photoUrl" :src="profileUser.photoUrl" alt="" class="avatar-img" />
            <div v-else class="avatar-fallback">{{ initials(profileUser?.name) }}</div>
          </div>
          <div>
            <div class="text-lg font-semibold">{{ profileUser?.name }}</div>
            <div class="text-sm text-gray-500">{{ profileUser?.email }}</div>
            <div class="text-sm text-gray-500">{{ profileUser?.phone }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">Role:</span> {{ profileUser?.role }}</div>
          <div><span class="text-gray-500">Status:</span> {{ profileUser?.status }}</div>
        </div>

        <div class="mt-4">
          <div class="text-sm text-gray-500 mb-2">Documents</div>
          <ul class="list-disc pl-5 text-sm">
            <li v-for="doc in (profileUser?.documents || [])" :key="doc">{{ doc }}</li>
            <li v-if="!profileUser?.documents?.length" class="text-gray-400">No documents</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Datatable from '@/components/Datatable.vue'
import Modal from '@/components/Modal.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canAdd = auth.can('users.create')

// Columns for datatable
const columns = ['name', 'email', 'phone', 'role', 'status', 'documents']
const roles = ['superadmin', 'admin', 'owner', 'support', 'accountant', 'sale', 'store_keeper', 'customer']

// Modal state
const modalVisible = ref(false)
const editItem = reactive({})

// Profile modal state
const profileVisible = ref(false)
const profileUser = ref(null)

// Mock data for users
const users = ref([
  {
    id: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin User',
    email: 'admin@ims.local',
    phone: '0900000001',
    role: 'superadmin',
    status: 'active',
    photo: 'admin.jpg',
    photoUrl: '',
    documents: ['id-card.pdf'],
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-20T12:00:00Z'
  },
  {
    id: '3f6a7b8c-9d0e-4f12-8a34-5b6c7d8e9f02',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Owner One',
    email: 'owner@ims.local',
    phone: '0900000002',
    role: 'owner',
    status: 'active',
    photo: 'owner.jpg',
    photoUrl: '',
    documents: [],
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-20T12:00:00Z'
  },
  {
    id: '4a5b6c7d-8e9f-4a10-9b21-2c3d4e5f6a03',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Store Keeper One',
    email: 'storekeeper@ims.local',
    phone: '0900000003',
    role: 'store_keeper',
    status: 'active',
    photo: '',
    photoUrl: '',
    documents: [],
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-21T08:00:00Z'
  },
  {
    id: '5b6c7d8e-9f01-4b12-9c34-5d6e7f8a9b04',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Sales User',
    email: 'sales@ims.local',
    phone: '0900000004',
    role: 'sale',
    status: 'inactive',
    photo: '',
    photoUrl: '',
    documents: ['contract.pdf'],
    created_at: '2026-01-18T14:00:00Z',
    updated_at: '2026-01-25T09:00:00Z'
  },
  {
    id: '6c7d8e9f-0123-4c56-9d78-9e0f1a2b3c05',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Accountant One',
    email: 'accountant@ims.local',
    phone: '0900000005',
    role: 'accountant',
    status: 'active',
    photo: '',
    photoUrl: '',
    documents: [],
    created_at: '2026-01-20T15:00:00Z',
    updated_at: '2026-01-28T10:00:00Z'
  },
  {
    id: '7d8e9f01-2345-4d67-9e89-0f1a2b3c4d06',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Customer One',
    email: 'customer@ims.local',
    phone: '0900000006',
    role: 'customer',
    status: 'active',
    photo: '',
    photoUrl: '',
    documents: [],
    created_at: '2026-01-22T16:00:00Z',
    updated_at: '2026-01-29T11:00:00Z'
  }
])

function openAddModal() {
  Object.assign(editItem, {
    id: null,
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    photo: '',
    photoUrl: '',
    documents: []
  })
  modalVisible.value = true
}

function openEditModal(user) {
  Object.assign(editItem, { ...user })
  modalVisible.value = true
}

function deleteUser(user) {
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    users.value = users.value.filter(u => u.id !== user.id)
  }
}

function saveUser(user) {
  if (user.id) {
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx >= 0) users.value[idx] = { ...users.value[idx], ...user }
  } else {
    users.value.push({
      ...user,
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      business_id: '11111111-1111-1111-1111-111111111111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
}

function onPhotoChange(formData, e) {
  const file = e.target.files?.[0]
  if (!file) return
  formData.photo = file.name
  const reader = new FileReader()
  reader.onload = () => {
    formData.photoUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function onDocsChange(formData, e) {
  const files = Array.from(e.target.files || [])
  formData.documents = files.map(f => f.name)
}

function openProfile(user) {
  profileUser.value = user
  profileVisible.value = true
}

function closeProfile() {
  profileVisible.value = false
  profileUser.value = null
}

function initials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}
.text-brand {
  color: rgb(76, 38, 131);
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  overflow: hidden;
  background: #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  overflow: hidden;
  background: #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-fallback {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}
</style>
