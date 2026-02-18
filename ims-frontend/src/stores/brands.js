import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useBrandsStore = defineStore('brands', () => {
  const brands = ref([])
  const loading = ref(false)

  const mockData = [
    { id: 1, name: 'Dell', description: 'Brand', country: 'USA' },
    { id: 2, name: 'HP', description: 'Brand', country: 'USA' }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeBrand(item) {
    return {
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      country: item.country || ''
    }
  }

  async function fetchBrands() {
    loading.value = true
    try {
      if (USE_MOCK) {
        brands.value = [...mockData]
        return
      }
      const res = await api.get('/brands')
      brands.value = asList(getResponseData(res, [])).map(normalizeBrand)
    } catch (error) {
      if (USE_MOCK) brands.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addBrand(b) {
    if (USE_MOCK) {
      brands.value.push({ ...b, id: Date.now() })
      return
    }
    const payload = {
      businessId: 1,
      name: b.name,
      country: b.country || '',
      description: b.description || b.name || ''
    }
    const res = await api.post('/brands', payload)
    brands.value.push(normalizeBrand(getResponseData(res, payload)))
  }

  async function updateBrand(b) {
    if (USE_MOCK) {
      const i = brands.value.findIndex(x => x.id === b.id)
      if (i !== -1) brands.value[i] = b
      return
    }
    const res = await api.patch(`/brands/${b.id}`, b)
    const updated = normalizeBrand(getResponseData(res, b))
    const i = brands.value.findIndex(x => x.id === b.id)
    if (i !== -1) brands.value[i] = updated
  }

  async function deleteBrand(id) {
    if (!USE_MOCK) await api.delete(`/brands/${id}`)
    brands.value = brands.value.filter(b => b.id !== id)
  }

  return { brands, loading, fetchBrands, addBrand, updateBrand, deleteBrand }
})
