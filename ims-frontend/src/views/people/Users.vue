<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-700">Users</h1>
      <button v-if="canAdd" class="bg-brand rounded px-3 py-1 text-white" @click="openAddModal">
        Add User
      </button>
    </div>

    <Datatable
      :data="users"
      :columns="columns"
      :can-edit="false"
      :can-delete="false"
      title="Users"
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
        <button
          class="icon-btn icon-view"
          title="View"
          @click="openViewModal(row)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5c5.5 0 9.5 4.3 10.8 6.1a1.5 1.5 0 0 1 0 1.8C21.5 14.7 17.5 19 12 19S2.5 14.7 1.2 12.9a1.5 1.5 0 0 1 0-1.8C2.5 9.3 6.5 5 12 5Zm0 2C8 7 4.8 10 3.3 12 4.8 14 8 17 12 17s7.2-3 8.7-5C19.2 10 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </button>
        <button
          v-if="canEdit"
          class="icon-btn icon-edit"
          title="Edit"
          @click="openEditModal(row)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.3V21h3.7l10.9-10.9-3.7-3.7L3 17.3Zm18.7-11a1 1 0 0 0 0-1.4L19.1 2.3a1 1 0 0 0-1.4 0l-1.9 1.9 3.7 3.7 2.2-1.6Z" />
          </svg>
        </button>
        <button
          v-if="canDelete"
          class="icon-btn icon-delete"
          title="Delete"
          @click="deleteUser(row)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
          </svg>
        </button>
        <button
          v-if="canEdit"
          class="icon-btn"
          :class="row.status === 'active' ? 'icon-deactivate' : 'icon-activate'"
          :title="row.status === 'active' ? 'Deactivate User' : 'Activate User'"
          @click="toggleUserStatus(row)"
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
      :title="form.id ? 'Edit User' : 'Add User'"
      :modelValue="form"
      maxWidth="max-w-3xl"
      type="form"
      @submit="saveUser"
    >
      <template #default="{ formData }">
        <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input v-model="formData.name" placeholder="Name" class="w-full rounded border px-2 py-1" />
            <input v-model="formData.email" placeholder="Email" class="w-full rounded border px-2 py-1" />
            <input v-model="formData.phone" placeholder="Phone" class="w-full rounded border px-2 py-1" />
            <input type="file" accept="image/*" class="w-full rounded border px-2 py-1" @change="onProfileImageSelected" />
          </div>
          <img
            v-if="profilePreviewUrl"
            :src="profilePreviewUrl"
            alt="Profile preview"
            class="w-16 h-16 rounded-full object-cover border"
          />
          <input
            v-if="!formData.id"
            v-model="formData.password"
            type="password"
            placeholder="Temporary password"
            class="w-full rounded border px-2 py-1"
          />

          <div>
            <label class="mb-1 block text-sm text-gray-700">Role</label>
            <select
              v-model.number="formData.roleId"
              class="w-full rounded border px-2 py-1"
              @change="onRoleChanged(formData)"
            >
              <option :value="0" disabled>Select role</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-700">Permissions (User Override)</label>
            <p class="mb-2 text-xs text-gray-500">
              `Default` = from selected role, `Added` = extra user permission, `Revoked` = removed from role default.
            </p>
            <div class="permissions-grid">
              <label
                v-for="permission in permissions"
                :key="permission.id"
                class="permission-item"
                :class="permissionVisualClass(formData, permission.id)"
              >
                <input
                  type="checkbox"
                  :checked="formData.permissionIds.includes(permission.id)"
                  @change="togglePermission(formData, permission.id)"
                />
                <span>{{ permission.key }}</span>
                <span v-if="permissionState(formData, permission.id) !== 'none'" class="permission-badge">
                  {{ permissionStateLabel(permissionState(formData, permission.id)) }}
                </span>
              </label>
            </div>
          </div>

          <select v-model="formData.status" class="w-full rounded border px-2 py-1">
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

    <div v-if="viewModalVisible" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded shadow w-full max-w-lg">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-semibold text-gray-800">User Profile Details</h3>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="sm:col-span-2" v-if="viewUser.profileImage">
            <img :src="viewUser.profileImage" alt="" class="w-20 h-20 rounded-full object-cover border" />
          </div>
          <div class="detail-row"><span class="detail-label">ID</span><span>{{ viewUser.id || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Name</span><span>{{ viewUser.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span>{{ viewUser.email || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Phone</span><span>{{ viewUser.phone || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Role</span><span>{{ viewUser.role || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Role ID</span><span>{{ viewUser.roleId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Status</span><span class="capitalize">{{ viewUser.status || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">Permission Adds</span><span>{{ formatPermissionList(viewUser.permissionAdds) }}</span></div>
          <div class="detail-row"><span class="detail-label">Permission Removes</span><span>{{ formatPermissionList(viewUser.permissionRemoves) }}</span></div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import Datatable from '@/components/Datatable.vue'
import Modal from '@/components/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import api, { getResponseData } from '@/services/api'

const auth = useAuthStore()
const canAdd = computed(() => auth.hasPermission('users.create'))
const canEdit = computed(() => auth.hasPermission('users.update'))
const canDelete = computed(() => auth.hasPermission('users.delete'))

const columns = ['name', 'email', 'phone', 'role', 'status']
const users = ref([])
const roles = ref([])
const permissions = ref([])
const viewModalVisible = ref(false)
const viewUser = reactive({})
const profilePreviewUrl = ref('')

const modalVisible = ref(false)
const confirmVisible = ref(false)
const rowToDelete = ref(null)
const form = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  password: '',
  roleId: 0,
  permissionIds: [],
  status: 'active',
  profileImage: null
})

onMounted(async () => {
  await Promise.allSettled([fetchRoles(), fetchPermissions(), fetchUsers()])
})

async function fetchRoles() {
  const res = await api.get('/roles', { params: { businessId: auth.user?.businessId || 1 } })
  const payload = getResponseData(res, [])
  roles.value = Array.isArray(payload) ? payload : []
}

async function fetchPermissions() {
  const res = await api.get('/permissions')
  const payload = getResponseData(res, [])
  permissions.value = Array.isArray(payload) ? payload : []
}

async function fetchUsers() {
  try {
    const res = await api.get('/users')
    const payload = res?.data?.users || getResponseData(res, [])
    const list = Array.isArray(payload) ? payload : []
    users.value = list.map(item => ({
      id: item.id,
      name: item.fullName || item.name || '-',
      email: item.email || '-',
      phone: item.phoneNumber || item.phone || '-',
      roleId: item.roleId || 0,
      role: item.role?.name || item.roleName || '-',
      profileImage: item.profileImage || '',
      permissionAdds: Array.isArray(item.permissionAdds) ? item.permissionAdds : [],
      permissionRemoves: Array.isArray(item.permissionRemoves) ? item.permissionRemoves : [],
      status: item.isActive ? 'active' : 'inactive'
    }))
  } catch {
    users.value = []
  }
}

function resetForm() {
  form.id = null
  form.name = ''
  form.email = ''
  form.phone = ''
  form.password = ''
  form.roleId = 0
  form.permissionIds = []
  form.status = 'active'
  form.profileImage = null
  profilePreviewUrl.value = ''
}

function permissionIdByKey(key) {
  const found = permissions.value.find(permission => permission.key === key)
  return found?.id || null
}

function flattenRolePermissionKeys(rolePermissions) {
  if (Array.isArray(rolePermissions)) return rolePermissions
  if (!rolePermissions || typeof rolePermissions !== 'object') return []
  return Object.entries(rolePermissions).flatMap(([moduleName, actions]) => {
    if (!Array.isArray(actions)) return []
    return actions.map(action => `${moduleName}.${action}`)
  })
}

function rolePermissionIds(roleId) {
  const role = roles.value.find(item => item.id === Number(roleId))
  if (!role) return []
  if (Array.isArray(role.permissionIds) && role.permissionIds.length) return [...role.permissionIds]
  const keys = flattenRolePermissionKeys(role.permissions)
  return keys.map(permissionIdByKey).filter(Boolean)
}

function permissionState(formData, permissionId) {
  const defaults = new Set(rolePermissionIds(formData.roleId))
  if (!defaults.size) return 'none'
  const isDefault = defaults.has(permissionId)
  const isChecked = formData.permissionIds.includes(permissionId)
  if (isDefault && isChecked) return 'default'
  if (!isDefault && isChecked) return 'added'
  if (isDefault && !isChecked) return 'revoked'
  return 'none'
}

function permissionStateLabel(state) {
  if (state === 'default') return 'Default'
  if (state === 'added') return 'Added'
  if (state === 'revoked') return 'Revoked'
  return ''
}

function permissionVisualClass(formData, permissionId) {
  const state = permissionState(formData, permissionId)
  if (state === 'default') return 'permission-default'
  if (state === 'added') return 'permission-added'
  if (state === 'revoked') return 'permission-revoked'
  return ''
}

function buildEffectivePermissionIds({ roleId, permissionAdds, permissionRemoves }) {
  const base = new Set(rolePermissionIds(roleId))
  const addIds = (Array.isArray(permissionAdds) ? permissionAdds : [])
    .map(permissionIdByKey)
    .filter(Boolean)
  const removeIds = (Array.isArray(permissionRemoves) ? permissionRemoves : [])
    .map(permissionIdByKey)
    .filter(Boolean)

  addIds.forEach(id => base.add(id))
  removeIds.forEach(id => base.delete(id))
  return Array.from(base)
}

function openAddModal() {
  resetForm()
  modalVisible.value = true
}

function openEditModal(user) {
  form.id = user.id
  form.name = user.name
  form.email = user.email
  form.phone = user.phone
  form.password = ''
  form.roleId = user.roleId || 0
  form.permissionIds = buildEffectivePermissionIds(user)
  form.status = user.status || 'active'
  form.profileImage = null
  profilePreviewUrl.value = user.profileImage || ''
  modalVisible.value = true
}

function openViewModal(user) {
  Object.assign(viewUser, user)
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

function formatPermissionList(value) {
  if (!Array.isArray(value) || !value.length) return '-'
  return value.join(', ')
}

function onRoleChanged(formData) {
  // Load selected role default permissions (checked by default).
  formData.permissionIds = rolePermissionIds(formData.roleId)
}

function togglePermission(formData, permissionId) {
  if (formData.permissionIds.includes(permissionId)) {
    formData.permissionIds = formData.permissionIds.filter(id => id !== permissionId)
    return
  }
  formData.permissionIds = [...formData.permissionIds, permissionId]
}

async function saveUser(formData) {
  if (!formData.id) {
    if (!formData.password) {
      alert('Password is required for new user.')
      return
    }

    if (!formData.roleId) {
      alert('Role is required.')
      return
    }

    await auth.signup({
      fullName: formData.name,
      phoneNumber: formData.phone,
      email: formData.email,
      password: formData.password,
      profileImage: form.profileImage,
      roleId: formData.roleId,
      permissionIds: formData.permissionIds
    })
  } else {
    if (!formData.roleId) {
      alert('Role is required.')
      return
    }
    if (form.profileImage instanceof File) {
      const fd = new FormData()
      fd.append('fullName', formData.name)
      fd.append('phoneNumber', formData.phone)
      fd.append('email', formData.email)
      fd.append('roleId', String(formData.roleId))
      fd.append('permissionIds', JSON.stringify(formData.permissionIds || []))
      fd.append('isActive', String(formData.status === 'active'))
      fd.append('profileImage', form.profileImage)
      await api.patch(`/users/${formData.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      await api.patch(`/users/${formData.id}`, {
        fullName: formData.name,
        phoneNumber: formData.phone,
        email: formData.email,
        roleId: formData.roleId,
        permissionIds: formData.permissionIds,
        isActive: formData.status === 'active'
      })
    }
  }

  await fetchUsers()
  await fetchRoles()
  profilePreviewUrl.value = ''
}

async function deleteUser(user) {
  rowToDelete.value = user
  confirmVisible.value = true
}

const confirmTitle = computed(() => {
  const name = rowToDelete.value?.name ? `"${rowToDelete.value.name}"` : null
  return name ? `Delete user ${name}?` : 'Delete this user?'
})

async function confirmDelete() {
  if (!rowToDelete.value) return
  await api.delete(`/users/${rowToDelete.value.id}`)
  await fetchUsers()
  rowToDelete.value = null
}

async function toggleUserStatus(user) {
  await api.patch(`/users/${user.id}/status`)
  await fetchUsers()
}
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}

.permissions-grid {
  max-height: 180px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 6px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
}

.permission-default {
  background: #eff6ff;
}

.permission-added {
  background: #ecfdf5;
}

.permission-revoked {
  background: #fef2f2;
}

.permission-badge {
  margin-left: auto;
  font-size: 10px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  color: #374151;
  background: #fff;
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
