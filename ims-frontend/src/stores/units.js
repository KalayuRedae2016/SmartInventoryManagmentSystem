import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useUnitsStore = defineStore('units', () => {
  const units = ref([])
  const loading = ref(false)

  const mockData = [
    { id: 1, name: 'Piece', symbol: 'pc' },
    { id: 2, name: 'Kilogram', symbol: 'kg' }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeUnit(item) {
    return {
      id: item.id,
      name: item.name || '',
      symbol: item.symbol || ''
    }
  }

  async function fetchUnits() {
    loading.value = true
    try {
      if (USE_MOCK) {
        units.value = [...mockData]
        return
      }
      const res = await api.get('/units')
      units.value = asList(getResponseData(res, [])).map(normalizeUnit)
    } catch (error) {
      if (USE_MOCK) units.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addUnit(u) {
    if (USE_MOCK) {
      units.value.push({ ...u, id: Date.now() })
      return
    }
    const res = await api.post('/units', u)
    units.value.push(normalizeUnit(getResponseData(res, u)))
  }

  async function updateUnit(u) {
    if (USE_MOCK) {
      const i = units.value.findIndex(x => x.id === u.id)
      if (i !== -1) units.value[i] = u
      return
    }
    const res = await api.put(`/units/${u.id}`, u)
    const updated = normalizeUnit(getResponseData(res, u))
    const i = units.value.findIndex(x => x.id === u.id)
    if (i !== -1) units.value[i] = updated
  }

  async function deleteUnit(id) {
    if (!USE_MOCK) await api.delete(`/units/${id}`)
    units.value = units.value.filter(u => u.id !== id)
  }

  return { units, loading, fetchUnits, addUnit, updateUnit, deleteUnit }
})
