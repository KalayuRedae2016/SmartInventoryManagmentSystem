import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref([])
  const loading = ref(false)

  const mockData = [
    {
      id: '7c1f27f2-9e5f-4f47-9b3b-1f0a5b9c5e21',
      name: 'ABC Supplier',
      email: 'abc@supplier.com',
      phone: '0911000000',
      address: 'Adigrat, Main St',
      status: 'active'
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  async function fetchSuppliers() {
    loading.value = true
    try {
      if (USE_MOCK) {
        suppliers.value = [...mockData]
        return
      }
      const res = await api.get('/suppliers')
      suppliers.value = asList(getResponseData(res, []))
    } catch (error) {
      if (USE_MOCK) suppliers.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addSupplier(payload) {
    if (USE_MOCK) {
      suppliers.value.push({ ...payload, id: Date.now() })
      return
    }
    const mapped = {
      ...payload,
      code: payload.code || `SUP-${Date.now().toString().slice(-6)}`
    }
    const res = await api.post('/suppliers', mapped)
    suppliers.value.push(getResponseData(res, mapped))
  }

  async function updateSupplier(payload) {
    if (USE_MOCK) {
      const i = suppliers.value.findIndex(s => s.id === payload.id)
      if (i !== -1) suppliers.value[i] = payload
      return
    }
    const res = await api.patch(`/suppliers/${payload.id}`, payload)
    const updated = getResponseData(res, payload)
    const i = suppliers.value.findIndex(s => s.id === payload.id)
    if (i !== -1) suppliers.value[i] = updated
  }

  async function deleteSupplier(id) {
    if (!USE_MOCK) await api.delete(`/suppliers/${id}`)
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  return { suppliers, loading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier }
})
