import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)

  const mockData = [
    { id: 1, name: 'Electronics', description: 'Electronic items', isActive: true },
    { id: 2, name: 'Accessories', description: 'Computer accessories', isActive: true }
  ]

  function normalizeCategory(item) {
    return {
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      createdAt: item.createdAt || item.created_at || '',
      updatedAt: item.updatedAt || item.updated_at || ''
    }
  }

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  async function fetchCategories() {
    loading.value = true
    try {
      if (USE_MOCK) {
        categories.value = [...mockData]
        return
      }
      const res = await api.get('/categories')
      categories.value = asList(getResponseData(res, [])).map(normalizeCategory)
    } catch (error) {
      if (USE_MOCK) categories.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addCategory(data) {
    if (USE_MOCK) {
      categories.value.push({ ...data, id: Date.now() })
      return
    }
    const payload = {
      businessId: 1,
      name: data.name,
      description: data.description || data.name || ''
    }
    const res = await api.post('/categories', payload)
    categories.value.push(normalizeCategory(getResponseData(res, payload)))
  }

  async function updateCategory(data) {
    if (USE_MOCK) {
      const i = categories.value.findIndex(c => c.id === data.id)
      if (i !== -1) categories.value[i] = data
      return
    }
    const res = await api.patch(`/categories/${data.id}`, data)
    const updated = normalizeCategory(getResponseData(res, data))
    const i = categories.value.findIndex(c => c.id === data.id)
    if (i !== -1) categories.value[i] = updated
  }

  async function deleteCategory(id) {
    if (!USE_MOCK) await api.delete(`/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return {
    categories,
    loading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
