<template>
  <Modal :show="open" title="Bulk Upload Products" @close="$emit('close')">
    <div class="space-y-4">

      <!-- File Input -->
      <input
        type="file"
        accept=".csv,.xlsx"
        @change="handleFile"
        class="border p-2 w-full"
      />

      <!-- Global Error -->
      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>

      <!-- Preview Table -->
      <div v-if="rows.length" class="max-h-64 overflow-auto border">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th v-for="h in headers" :key="h" class="px-2 py-1 border">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in rows"
              :key="i"
              :class="invalidRows.find(r => r.index === i) ? 'bg-red-100' : ''"
            >
              <td v-for="h in headers" :key="h" class="px-2 py-1 border">
                {{ row[h] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button
          class="btn-primary"
          :disabled="rows.length === 0 || invalidRows.length > 0"
          @click="upload"
        >
          Upload
        </button>
      </div>

      <!-- Invalid Rows Summary -->
      <div v-if="invalidRows.length" class="text-red-700 text-sm mt-2">
        <h4 class="font-semibold">Invalid Rows:</h4>
        <ul>
          <li v-for="row in invalidRows" :key="row.index">
            Row {{ row.index + 2 }}: {{ row.errors.join(', ') }}
          </li>
        </ul>
      </div>

    </div>
  </Modal>
</template>

<script setup>
import * as XLSX from 'xlsx'
import { ref } from 'vue'
import Modal from './Modal.vue'

defineProps({ open: Boolean })
const emit = defineEmits(['close', 'uploaded'])

const rows = ref([])
const headers = ref([])
const error = ref('')
const invalidRows = ref([])

/* Required columns */
const REQUIRED_COLUMNS = [
  'name',
  'category',
  'brand',
  'unit',
  'price',
  'quantity',
  'location'
]

/* -----------------------------
   FILE HANDLER
------------------------------ */
function handleFile(e) {
  error.value = ''
  rows.value = []
  invalidRows.value = []

  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      if (!json.length) {
        error.value = 'File is empty'
        return
      }

      headers.value = Object.keys(json[0])

      // Check missing required columns
      const missing = REQUIRED_COLUMNS.filter(
        col => !headers.value.includes(col)
      )
      if (missing.length) {
        error.value = `Missing required columns: ${missing.join(', ')}`
        return
      }

      rows.value = json

      // Row-level validation
      rows.value.forEach((row, index) => {
        const rowErrors = []
        if (!row.name) rowErrors.push('Missing name')
        if (!row.category) rowErrors.push('Missing category')
        if (!row.brand) rowErrors.push('Missing brand')
        if (!row.unit) rowErrors.push('Missing unit')
        if (isNaN(row.price) || Number(row.price) <= 0)
          rowErrors.push('Invalid price')
        if (isNaN(row.quantity) || Number(row.quantity) < 0)
          rowErrors.push('Invalid quantity')
        if (!row.location) rowErrors.push('Missing location')

        if (rowErrors.length) {
          invalidRows.value.push({ index, errors: rowErrors })
        }
      })

    } catch (err) {
      error.value = 'Error reading file. Make sure it is CSV or XLSX.'
    }
  }

  reader.readAsArrayBuffer(file)
}

/* -----------------------------
   UPLOAD FUNCTION
------------------------------ */
function upload() {
  if (invalidRows.value.length > 0) return

  // Emit validated rows to parent (Products.vue)
  emit('uploaded', rows.value)
  emit('close')
}
</script>

<style scoped>
.btn-primary {
  @apply bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50;
}
.btn-secondary {
  @apply bg-gray-200 px-4 py-2 rounded hover:bg-gray-300;
}
</style>
