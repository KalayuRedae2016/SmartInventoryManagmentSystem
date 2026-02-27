<template>
  <div class="space-y-4">
    <div class="rounded border border-gray-200 bg-white p-4">
      <h2 class="text-sm font-semibold text-gray-700">Role Setup</h2>
      <p class="mb-3 text-xs text-gray-500">
        Enter a role name and select permissions from the backend master list.
      </p>

      <form class="space-y-3" @submit.prevent="saveRole">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Role Name</label>
          <input
            v-model.trim="form.name"
            type="text"
            class="w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. Inventory Supervisor"
            required
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <input
            v-model.trim="form.description"
            type="text"
            class="w-full rounded border px-3 py-2 text-sm"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label class="mb-2 block text-xs font-medium text-gray-600">Permissions</label>
          <div class="permissions-grid">
            <label v-for="permission in permissions" :key="permission.id" class="permission-item">
              <input
                type="checkbox"
                :value="permission.id"
                :checked="form.permissionIds.includes(permission.id)"
                @change="togglePermission(permission.id)"
              />
              <span>{{ permission.key }}</span>
            </label>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="submit"
            class="bg-brand rounded px-4 py-2 text-sm text-white disabled:opacity-50"
            :disabled="(!canCreate && !form.id) || (!canEdit && !!form.id)"
          >
            {{ form.id ? 'Update Role' : 'Create Role' }}
          </button>
          <button
            v-if="form.id && canEdit"
            type="button"
            class="rounded border px-4 py-2 text-sm"
            @click="toggleRoleStatus(form)"
          >
            {{ form.isActive ? 'Deactivate' : 'Activate' }}
          </button>
          <button type="button" class="rounded border px-4 py-2 text-sm" @click="resetForm">
            Reset
          </button>
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
      </form>
    </div>

    <DataTable
      :data="rows"
      :columns="columns"
      title="Business Roles"
      :can-edit="canEdit"
      :can-delete="canDelete"
      @edit="editRole"
      @delete="requestDeleteRole"
    >
      <template #cell="{ col, value }">
        <span v-if="col === 'isActive'" :class="value ? 'text-green-700' : 'text-red-600'">
          {{ value ? 'active' : 'inactive' }}
        </span>
        <pre v-else-if="col === 'permissions'" class="permissions-json">{{ formatPermissions(value) }}</pre>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
      <template #rowActions="{ row }">
        <button v-if="canEdit" class="text-xs text-brand hover:underline" @click="toggleRoleStatus(row)">
          {{ row.isActive ? 'Deactivate' : 'Activate' }}
        </button>
      </template>
    </DataTable>

    <div
      v-if="deleteConfirmVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeDeleteConfirm"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h3 class="text-base font-semibold text-gray-900">Delete Role</h3>
        <p class="mt-2 text-sm text-gray-600">
          Are you sure you want to delete
          <strong>{{ deleteTarget?.name || 'this role' }}</strong>?
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button class="rounded border px-3 py-1.5 text-sm" @click="closeDeleteConfirm">Cancel</button>
          <button class="rounded bg-red-600 px-3 py-1.5 text-sm text-white" @click="confirmDeleteRole">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import api, { getResponseData } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const columns = ['name', 'code', 'permissions', 'description', 'isActive']
const roles = ref([])
const permissions = ref([])
const formError = ref('')
const deleteConfirmVisible = ref(false)
const deleteTarget = ref(null)

const form = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  isActive: true,
  permissionIds: []
})

const canEdit = computed(() => auth.hasPermission('role:update') || auth.hasPermission('roles.update'))
const canDelete = computed(() => auth.hasPermission('role:delete') || auth.hasPermission('roles.delete'))
const canCreate = computed(() => auth.hasPermission('role:create') || auth.hasPermission('roles.create'))

const rows = computed(() =>
  roles.value.map(role => ({
    ...role,
    isActive: Boolean(role.isActive),
    permissions: buildPermissionsObject(role.permissions)
  }))
)

function toCode(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function buildPermissionsObject(list) {
  if (!Array.isArray(list)) return {}
  const grouped = {}
  list.forEach(raw => {
    const value = String(raw || '').trim()
    if (!value) return
    const sep = value.includes('.') ? '.' : value.includes(':') ? ':' : ''
    if (!sep) {
      if (!grouped.misc) grouped.misc = []
      if (!grouped.misc.includes(value)) grouped.misc.push(value)
      return
    }
    const [moduleName, action] = value.split(sep)
    if (!moduleName || !action) return
    if (!grouped[moduleName]) grouped[moduleName] = []
    if (!grouped[moduleName].includes(action)) grouped[moduleName].push(action)
  })
  return grouped
}

function formatPermissions(value) {
  try {
    return JSON.stringify(value || {}, null, 2)
  } catch {
    return '{}'
  }
}

function resetForm() {
  form.id = null
  form.name = ''
  form.code = ''
  form.description = ''
  form.isActive = true
  form.permissionIds = []
}

function togglePermission(permissionId) {
  if (form.permissionIds.includes(permissionId)) {
    form.permissionIds = form.permissionIds.filter(id => id !== permissionId)
    return
  }
  form.permissionIds = [...form.permissionIds, permissionId]
}

async function fetchPermissions() {
  const res = await api.get('/permissions')
  permissions.value = asList(getResponseData(res, []))
}

async function fetchRoles() {
  const res = await api.get('/roles', {
    params: { businessId: auth.user?.businessId || 1 }
  })
  roles.value = asList(getResponseData(res, []))
}

async function saveRole() {
  formError.value = ''
  if (!canCreate.value && !form.id) return
  if (!canEdit.value && form.id) return

  const payload = {
    businessId: auth.user?.businessId || 1,
    name: form.name,
    description: form.description,
    isActive: form.isActive,
    permissionIds: form.permissionIds
  }

  try {
    if (form.id) {
      await api.patch(`/roles/${form.id}`, payload)
    } else {
      await api.post('/roles', payload)
    }
    await fetchRoles()
    resetForm()
  } catch (error) {
    if (error?.response?.status === 409) {
      const inputCode = toCode(form.name)
      const existing = roles.value.find(
        r => String(r.code || '').toUpperCase() === inputCode
      )
      if (existing) {
        editRole(existing)
        formError.value = `Role "${existing.name}" already exists. Opened it for editing instead.`
        return
      }
      formError.value = 'Role with same name/code already exists. Use a different role name.'
      return
    }
    formError.value = error?.response?.data?.message || error?.message || 'Unable to save role.'
  }
}

function editRole(role) {
  form.id = role.id
  form.name = role.name
  form.code = role.code || ''
  form.description = role.description || ''
  form.isActive = Boolean(role.isActive)
  form.permissionIds = Array.isArray(role.permissionIds) ? [...role.permissionIds] : []
}

function requestDeleteRole(role) {
  deleteTarget.value = role
  deleteConfirmVisible.value = true
}

function closeDeleteConfirm() {
  deleteConfirmVisible.value = false
  deleteTarget.value = null
}

async function confirmDeleteRole() {
  const role = deleteTarget.value
  if (!role) return
  try {
    await api.delete(`/roles/${role.id}`)
    await fetchRoles()
    closeDeleteConfirm()
  } catch (error) {
    formError.value = error?.response?.data?.message || error?.message || 'Unable to delete role.'
  }
}

async function toggleRoleStatus(role) {
  formError.value = ''
  const nextStatus = !Boolean(role.isActive)
  try {
    await api.patch(`/roles/${role.id}/status`)
  } catch {
    try {
      await api.patch(`/roles/${role.id}`, { isActive: nextStatus })
    } catch (error) {
      formError.value = error?.response?.data?.message || error?.message || 'Unable to change role status.'
      return
    }
  }
  await fetchRoles()
  if (form.id === role.id) form.isActive = nextStatus
}

onMounted(async () => {
  await Promise.all([fetchPermissions(), fetchRoles()])
})
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}

.permissions-grid {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.permissions-json {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 11px;
  line-height: 1.35;
  max-width: 420px;
  margin: 0;
}
</style>
