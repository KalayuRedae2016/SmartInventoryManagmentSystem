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

  async function fetchCustomers() {
    loading.value = true
    try {
      if (USE_MOCK) {
        customers.value = [...mockData]
        return
      }
      const res = await api.get('/customers')
      customers.value = asList(getResponseData(res, []))
    } catch (error) {
      if (USE_MOCK) customers.value = [...mockData]
      else throw error
    } finally {
      loading.value = false
    }
  }

  async function addCustomer(payload) {
    if (USE_MOCK) {
      customers.value.push({ ...payload, id: Date.now() })
      return
    }
    const res = await api.post('/customers', payload)
    customers.value.push(getResponseData(res, payload))
  }

  async function updateCustomer(payload) {
    if (USE_MOCK) {
      const i = customers.value.findIndex(c => c.id === payload.id)
      if (i !== -1) customers.value[i] = payload
      return
    }
    const res = await api.put(`/customers/${payload.id}`, payload)
    const updated = getResponseData(res, payload)
    const i = customers.value.findIndex(c => c.id === payload.id)
    if (i !== -1) customers.value[i] = updated
  }

  async function deleteCustomer(id) {
    if (!USE_MOCK) await api.delete(`/customers/${id}`)
    customers.value = customers.value.filter(c => c.id !== id)
  }

  return { customers, loading, fetchCustomers, addCustomer, updateCustomer, deleteCustomer }
})
