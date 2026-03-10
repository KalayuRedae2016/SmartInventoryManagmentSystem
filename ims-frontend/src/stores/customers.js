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
    if (Array.isArray(payload?.customers)) return payload.customers
    if (Array.isArray(payload?.data?.customers)) return payload.data.customers
    return []
  }

  function normalizeCustomer(item = {}) {
    let normalizedAdditionalInfo = item.additionalInfo || ''
    if (typeof normalizedAdditionalInfo === 'string') {
      try {
        const parsed = JSON.parse(normalizedAdditionalInfo)
        if (parsed && typeof parsed === 'object') {
          normalizedAdditionalInfo = parsed.note || ''
        }
      } catch {
        // Keep plain text additionalInfo as-is.
      }
    } else if (normalizedAdditionalInfo && typeof normalizedAdditionalInfo === 'object') {
      normalizedAdditionalInfo = normalizedAdditionalInfo.note || ''
    }

    return {
      ...item,
      additionalInfo: normalizedAdditionalInfo,
      status: item.status || 'active',
      profileImage: item.profileImage || ''
    }
  }

  function toFormData(payload) {
    const formData = new FormData()
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value)
        return
      }
      if (key !== 'profileImage') formData.append(key, String(value))
    })
    return formData
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
      email: String(payload.email || '').trim() || null,
      status: payload.status || 'active'
    }
    const hasImage = mapped.profileImage instanceof File
    const res = hasImage
      ? await api.post('/customers', toFormData(mapped), {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      : await api.post('/customers', mapped)
    customers.value.push(normalizeCustomer({ ...mapped, ...getResponseData(res, mapped) }))
  }

  async function updateCustomer(payload) {
    if (USE_MOCK) {
      const i = customers.value.findIndex(c => c.id === payload.id)
      if (i !== -1) customers.value[i] = normalizeCustomer(payload)
      return
    }
    const mapped = {
      ...payload,
      email: String(payload.email || '').trim() || null
    }
    const hasImage = mapped.profileImage instanceof File
    const res = hasImage
      ? await api.patch(`/customers/${payload.id}`, toFormData(mapped), {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      : await api.patch(`/customers/${payload.id}`, mapped)
    const updated = normalizeCustomer({ ...payload, ...getResponseData(res, payload) })
    const i = customers.value.findIndex(c => c.id === payload.id)
    if (i !== -1) customers.value[i] = updated
  }

  async function toggleCustomerStatus(customer) {
    const nextStatus = customer?.status === 'active' ? 'inactive' : 'active'
    await updateCustomer({ ...customer, status: nextStatus })
    if (!USE_MOCK) await fetchCustomers()
  }

  async function deleteCustomer(id) {
    if (!USE_MOCK) await api.delete(`/customers/${id}`)
    customers.value = customers.value.filter(c => c.id !== id)
  }

  return { customers, loading, fetchCustomers, addCustomer, updateCustomer, deleteCustomer, toggleCustomerStatus }
})
