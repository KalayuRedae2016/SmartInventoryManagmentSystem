<template>
  <div class="space-y-4">
    <DataTable
      :data="roles"
      :columns="columns"
      title="Global Roles"
      :can-edit="false"
      :can-delete="false"
      @export="exportData"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'

const columns = ['role', 'scope', 'description', 'permissions']

const roles = ref([
  {
    id: 'r-01',
    role: 'superadmin',
    scope: 'platform',
    description: 'Full platform control across all businesses',
    permissions: 'all'
  },
  {
    id: 'r-02',
    role: 'owner',
    scope: 'business',
    description: 'Full control of a single business',
    permissions: 'users, warehouses, products, purchases, sales, reports'
  },
  {
    id: 'r-03',
    role: 'admin',
    scope: 'business',
    description: 'Daily admin operations and approvals',
    permissions: 'users, customers, suppliers, purchases, sales'
  },
  {
    id: 'r-04',
    role: 'warehouse_manager',
    scope: 'operational',
    description: 'Approve transfers and monitor stock',
    permissions: 'warehouses, stock-transfers, stock'
  },
  {
    id: 'r-05',
    role: 'sale',
    scope: 'operational',
    description: 'Handle sales and returns',
    permissions: 'sales, customers'
  }
])

function exportData(format) {
  alert(`Exporting ${format}. Implement export logic.`)
}
</script>
