import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuditStore = defineStore('audit', () => {
  const logs = ref([])

  function log(message) {
    logs.value.unshift({
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    })
    console.log('[AUDIT]', message)
  }

  return {
    logs,
    log
  }
})
