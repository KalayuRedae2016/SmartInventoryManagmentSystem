import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getResponseData } from '@/services/api'
import { USE_MOCK } from '@/config/env'

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref([])
  const loading = ref(false)

  const mockData = [
    {
      id: '3b1f61a7-2d8a-49a1-8d7e-5b15e2d0e701',
      name: 'John Doe',
      email: 'john.doe@customer.com',
      phone: '0912345678',
      address: 'Mekelle, Block 12',
      status: 'active'
    }
  ]

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.rows)) return payload.rows
    return []
  }

  function normalizeCustomer(item = {}) {
    return {
      ...item,
      status: item.status || 'active'
    }
  }

  async function fetchCustomers() {
    loading.value = true
    try {
      if (USE_MOCK) {
        customers.value = [...mockData].map(normalizeCustomer)
        return
      }
      const res = await api.get('/customers')
      customers.value = asList(getResponseData(res, [])).map(normalizeCustomer)
    } catch (error) {
      if (USE_MOCK) customers.value = [...mockData].map(normalizeCustomer)
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addCustomer(payload) {
    if (USE_MOCK) {
      customers.value.push(normalizeCustomer({ ...payload, id: Date.now() }))
      return
    }
    const mapped = {
      ...payload,
      code: payload.code || `CUS-${Date.now().toString().slice(-6)}`,
      email: String(payload.email || '').trim() || null
    }
    const res = await api.post('/customers', mapped)
    customers.value.push(normalizeCustomer({ ...mapped, ...getResponseData(res, mapped) }))
  }

  async function updateCustomer(payload) {
    if (USE_MOCK) {
      const i = customers.value.findIndex(c => c.id === payload.id)
      if (i !== -1) customers.value[i] = normalizeCustomer(payload)
      return
    }
    const res = await api.patch(`/customers/${payload.id}`, {
      ...payload,
      email: String(payload.email || '').trim() || null
    })
    const updated = normalizeCustomer({ ...payload, ...getResponseData(res, payload) })
    const i = customers.value.findIndex(c => c.id === payload.id)
    if (i !== -1) customers.value[i] = updated
  }

  async function deleteCustomer(id) {
    if (!USE_MOCK) await api.delete(`/customers/${id}`)
    customers.value = customers.value.filter(c => c.id !== id)
  }

  return { customers, loading, fetchCustomers, addCustomer, updateCustomer, deleteCustomer }
})
