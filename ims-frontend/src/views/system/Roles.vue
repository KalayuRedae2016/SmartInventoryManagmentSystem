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
          <button type="button" class="rounded border px-4 py-2 text-sm" @click="resetForm">
            Reset
          </button>
        </div>
      </form>
    </div>

    <DataTable
      :data="rows"
      :columns="columns"
      title="Business Roles"
      :can-edit="canEdit"
      :can-delete="canDelete"
      @edit="editRole"
      @delete="deleteRole"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import api, { getResponseData } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const columns = ['name', 'description', 'permissionsCount']
const roles = ref([])
const permissions = ref([])

const form = reactive({
  id: null,
  name: '',
  description: '',
  permissionIds: []
})

const canEdit = computed(() => auth.hasPermission('roles.update'))
const canDelete = computed(() => auth.hasPermission('roles.delete'))
const canCreate = computed(() => auth.hasPermission('roles.create'))

const rows = computed(() =>
  roles.value.map(role => ({
    ...role,
    permissionsCount: Array.isArray(role.permissions) ? role.permissions.length : 0
  }))
)

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
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
  const payload = getResponseData(res, [])
  permissions.value = Array.isArray(payload) ? payload : []
}

async function fetchRoles() {
  const res = await api.get('/roles')
  const payload = getResponseData(res, [])
  roles.value = Array.isArray(payload) ? payload : []
}

async function saveRole() {
  if (!canCreate.value && !form.id) return
  if (!canEdit.value && form.id) return

  const payload = {
    businessId: auth.user?.businessId || 1,
    name: form.name,
    description: form.description,
    permissionIds: form.permissionIds
  }

  if (form.id) {
    await api.patch(`/roles/${form.id}`, payload)
  } else {
    await api.post('/roles', payload)
  }

  await fetchRoles()
  resetForm()
}

function editRole(role) {
  form.id = role.id
  form.name = role.name
  form.description = role.description || ''
  form.permissionIds = Array.isArray(role.permissionIds) ? [...role.permissionIds] : []
}

async function deleteRole(role) {
  await api.delete(`/roles/${role.id}`)
  await fetchRoles()
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
</style>
