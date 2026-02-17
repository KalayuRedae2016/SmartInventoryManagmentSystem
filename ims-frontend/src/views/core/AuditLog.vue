<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Audit Log</h1>
      <span class="text-sm text-gray-500">
        Total Records: {{ logs.length }}
      </span>
    </div>

    <!-- Audit Table -->
    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="border px-3 py-2 text-left">Action</th>
            <th class="border px-3 py-2 text-left">Timestamp</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="hover:bg-gray-50"
          >
            <td class="border px-3 py-2">
              {{ log.message }}
            </td>
            <td class="border px-3 py-2">
              {{ formatDate(log.timestamp) }}
            </td>
          </tr>

          <tr v-if="logs.length === 0">
            <td colspan="2" class="text-center py-6 text-gray-500">
              No audit records found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuditStore } from '@/stores/audit'

/* Store */
const auditStore = useAuditStore()
const { logs } = storeToRefs(auditStore)

/* Helpers */
function formatDate(value) {
  return new Date(value).toLocaleString()
}
</script>

<style scoped>
/* Optional styling safety */
table {
  width: 100%;
}
</style>
