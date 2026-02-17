import { defineStore } from 'pinia'
import { ref } from 'vue'
import { USE_MOCK } from '@/config/env'
import api, { getResponseData } from '@/services/api'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])

  const mockData = [
    {
      id: '2f7b6c19-6a4c-4c4a-9b2a-6c8f2c9a1f01',
      business_id: '11111111-1111-1111-1111-111111111111',
      name: 'Admin User',
      email: 'admin@ims.local',
      phone: '0900000001',
      role: 'admin',
      status: 'active',
      created_at: '2026-01-10T09:00:00Z',
      updated_at: '2026-01-20T12:00:00Z'
    }
  ]

  async function fetchUsers() {
    if (USE_MOCK) {
      users.value = [...mockData]
      return
    }

    try {
      const res = await api.get('/users')
      const payload = getResponseData(res, [])
      users.value = Array.isArray(payload) ? payload : []
    } catch {
      // Users list endpoint may be restricted; keep fallback user.
      users.value = [...mockData]
    }
  }

  return { users, fetchUsers }
})
