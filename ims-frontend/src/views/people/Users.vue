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
      :can-edit="canEdit"
      :can-delete="canDelete"
      title="Users"
      @edit="openEditModal"
      @delete="deleteUser"
    />

    <Modal
      v-model:show="modalVisible"
      :title="form.id ? 'Edit User' : 'Add User'"
      :modelValue="form"
      type="form"
      @submit="saveUser"
    >
      <template #default="{ formData }">
        <div class="space-y-3">
          <input v-model="formData.name" placeholder="Name" class="w-full rounded border px-2 py-1" />
          <input v-model="formData.email" placeholder="Email" class="w-full rounded border px-2 py-1" />
          <input v-model="formData.phone" placeholder="Phone" class="w-full rounded border px-2 py-1" />
          <input
            v-if="!formData.id"
            v-model="formData.password"
            type="password"
            placeholder="Temporary password"
            class="w-full rounded border px-2 py-1"
          />

          <div v-if="!formData.id" class="space-y-2 rounded border p-2">
            <label class="block text-sm text-gray-700">Role Mode</label>
            <div class="flex flex-wrap gap-4 text-sm">
              <label class="flex items-center gap-2">
                <input v-model="formData.roleMode" type="radio" value="existing" @change="onRoleModeChanged(formData)" />
                <span>Select Existing Role</span>
              </label>
              <label class="flex items-center gap-2">
                <input v-model="formData.roleMode" type="radio" value="new" @change="onRoleModeChanged(formData)" />
                <span>Create New Role</span>
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-700">Role</label>
            <select
              v-model.number="formData.roleId"
              class="w-full rounded border px-2 py-1"
              :disabled="!formData.id && formData.roleMode === 'new'"
              @change="onRoleChanged(formData)"
            >
              <option :value="0" disabled>Select role</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>

          <div v-if="!formData.id && formData.roleMode === 'new'">
            <label class="mb-1 block text-sm text-gray-700">New Role Name</label>
            <input
              v-model="formData.roleName"
              placeholder="Enter new role name"
              class="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-700">Permissions (User Override)</label>
            <div class="permissions-grid">
              <label v-for="permission in permissions" :key="permission.id" class="permission-item">
                <input
                  type="checkbox"
                  :checked="formData.permissionIds.includes(permission.id)"
                  @change="togglePermission(formData, permission.id)"
                />
                <span>{{ permission.key }}</span>
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

const columns = ['name', 'email', 'phone', 'role', 'permissionsCount', 'status']
const users = ref([])
const roles = ref([])
const permissions = ref([])

const modalVisible = ref(false)
const form = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  password: '',
  roleMode: 'existing',
  roleId: 0,
  roleName: '',
  permissionIds: [],
  status: 'active'
})

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions(), fetchUsers()])
})

async function fetchRoles() {
  const res = await api.get('/roles')
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
      permissionAdds: Array.isArray(item.permissionAdds) ? item.permissionAdds : [],
      permissionRemoves: Array.isArray(item.permissionRemoves) ? item.permissionRemoves : [],
      status: item.isActive ? 'active' : 'inactive',
      permissionsCount: Array.isArray(item.permissions) ? item.permissions.length : 0
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
  form.roleMode = 'existing'
  form.roleId = 0
  form.roleName = ''
  form.permissionIds = []
  form.status = 'active'
}

function permissionIdByKey(key) {
  const found = permissions.value.find(permission => permission.key === key)
  return found?.id || null
}

function rolePermissionIds(roleId) {
  const role = roles.value.find(item => item.id === Number(roleId))
  if (!role) return []
  if (Array.isArray(role.permissionIds) && role.permissionIds.length) return [...role.permissionIds]
  const keys = Array.isArray(role.permissions) ? role.permissions : []
  return keys.map(permissionIdByKey).filter(Boolean)
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
  form.roleMode = 'existing'
  form.roleId = user.roleId || 0
  form.roleName = ''
  form.permissionIds = buildEffectivePermissionIds(user)
  form.status = user.status || 'active'
  modalVisible.value = true
}

function onRoleChanged(formData) {
  // Prefill overrides from selected role as baseline.
  formData.permissionIds = rolePermissionIds(formData.roleId)
}

function onRoleModeChanged(formData) {
  if (formData.roleMode === 'existing') {
    formData.roleName = ''
    formData.permissionIds = rolePermissionIds(formData.roleId)
    return
  }
  formData.roleId = 0
  formData.permissionIds = []
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

    if (formData.roleMode === 'existing' && !formData.roleId) {
      alert('Role is required.')
      return
    }

    if (formData.roleMode === 'new' && !String(formData.roleName || '').trim()) {
      alert('Role name is required for new role.')
      return
    }

    await auth.signup({
      fullName: formData.name,
      phoneNumber: formData.phone,
      email: formData.email,
      password: formData.password,
      roleId: formData.roleMode === 'existing' ? formData.roleId : undefined,
      roleName: formData.roleMode === 'new' ? String(formData.roleName).trim() : undefined,
      permissionIds: formData.permissionIds
    })
  } else {
    if (!formData.roleId) {
      alert('Role is required.')
      return
    }
    await api.patch(`/users/${formData.id}`, {
      fullName: formData.name,
      phoneNumber: formData.phone,
      email: formData.email,
      roleId: formData.roleId,
      permissionIds: formData.permissionIds,
      isActive: formData.status === 'active'
    })
  }

  await fetchUsers()
  await fetchRoles()
}

async function deleteUser(user) {
  await api.delete(`/users/${user.id}`)
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
}
</style>
