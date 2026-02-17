<template>
  <div class="bg-white shadow rounded overflow-hidden">
    <!-- Header: Search + Add + Export -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-200 space-y-2 md:space-y-0">
      
      <!-- Title / Add slot -->
      <div class="flex items-center space-x-2">
        <h2 v-if="title" class="font-semibold text-lg text-gray-700">{{ title }}</h2>
        <slot name="add">
          <button
            v-if="canAdd"
            @click="$emit('add')"
            class="bg-brand text-white px-3 py-1 rounded hover:bg-purple-700 transition"
          >
            Add
          </button>
        </slot>
      </div>

      <!-- Search + Export -->
      <div class="flex flex-wrap items-center space-x-2 w-full md:w-auto">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search..."
          class="border px-2 py-1 rounded w-full md:w-64 focus:ring focus:ring-brand/50 focus:outline-none"
        />

        <slot name="export">
          <button
            v-for="type in exports"
            :key="type"
            @click="$emit('export', type)"
            class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition"
          >
            {{ type.toUpperCase() }}
          </button>
        </slot>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-brand text-white">
          <tr>
            <th
              v-for="col in columns"
              :key="col"
              class="px-4 py-2 cursor-pointer select-none"
              @click="sortByColumn(col)"
              scope="col"
            >
              <span class="capitalize">{{ col }}</span>
              <span v-if="sortColumn === col">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th v-if="showActions" class="px-4 py-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in paginatedData"
            :key="row.id"
            class="border-b hover:bg-gray-50 transition"
          >
            <td v-for="col in columns" :key="col" class="px-4 py-2">
              <slot name="cell" :row="row" :col="col" :value="row[col]">
                {{ row[col] ?? '-' }}
              </slot>
            </td>

            <td v-if="showActions" class="px-4 py-2 space-x-2">
              <button
                v-if="canEdit"
                @click="$emit('edit', row)"
                class="text-blue-600 hover:underline focus:outline-none focus:ring focus:ring-blue-200 rounded"
              >
                Edit
              </button>

              <button
                v-if="canDelete"
                @click="$emit('delete', row)"
                class="text-red-600 hover:underline focus:outline-none focus:ring focus:ring-red-200 rounded"
              >
                Delete
              </button>

              <slot name="rowActions" :row="row" />
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="!paginatedData.length">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="px-4 py-4 text-center text-gray-400">
              No records found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 space-y-2 md:space-y-0">
      <div>
        Showing <strong>{{ paginatedData.length }}</strong> of <strong>{{ filteredData.length }}</strong>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, useSlots } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  columns: { type: Array, required: true },

  canAdd: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },

  title: { type: String, default: '' },
})

const exports = ['csv', 'excel', 'pdf']

const searchTerm = ref('')
const sortColumn = ref('')
const sortOrder = ref('asc')
const currentPage = ref(1)
const perPage = ref(5)

const slots = useSlots()
const showActions = computed(() => props.canEdit || props.canDelete || !!slots.rowActions)

const filteredData = computed(() => {
  if (!searchTerm.value) return props.data
  return props.data.filter(row =>
    props.columns.some(col =>
      String(row[col] ?? '')
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase())
    )
  )
})

const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value
  return [...filteredData.value].sort((a, b) => {
    const A = a[sortColumn.value]
    const B = b[sortColumn.value]
    if (A < B) return sortOrder.value === 'asc' ? -1 : 1
    if (A > B) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedData.value.length / perPage.value))
)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return sortedData.value.slice(start, start + perPage.value)
})

function sortByColumn(col) {
  if (sortColumn.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortOrder.value = 'asc'
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

watch([searchTerm, () => props.data], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}
</style>
