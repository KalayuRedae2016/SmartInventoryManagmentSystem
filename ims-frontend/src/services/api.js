import axios from 'axios'
import { API_BASE_URL } from '@/config/env'

function normalizeBaseUrl(raw) {
  const cleaned = String(raw || '').replace(/\/+$/, '')
  if (cleaned.endsWith('/api/ims')) return cleaned
  if (cleaned.endsWith('/api')) return `${cleaned}/ims`
  return `${cleaned}/api/ims`
}

const api = axios.create({
  baseURL: normalizeBaseUrl(API_BASE_URL),
  headers: {
    'Content-Type': 'application/json'
  }
})

// In-memory token only: do not persist between reloads so
// every new visit requires an explicit login.
let authToken = ''

export function setAuthToken(token = '') {
  authToken = token || ''
  if (authToken) {
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function getAuthToken() {
  return authToken
}

export function getResponseData(res, fallback = null) {
  const payload = res?.data
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const listKeys = [
      'rows',
      'categories',
      'brands',
      'units',
      'products',
      'customers',
      'suppliers',
      'purchases',
      'sales',
      'users',
      'warehouses',
      'items',
      'stocks',
      'transactions'
    ]
    for (const key of listKeys) {
      if (Array.isArray(payload[key])) return payload[key]
    }

    const objectKeys = [
      'user',
      'customer',
      'supplier',
      'category',
      'brand',
      'unit',
      'product',
      'updatedCategory',
      'updatedBrand',
      'newUnit'
    ]
    for (const key of objectKeys) {
      if (payload[key] && typeof payload[key] === 'object') return payload[key]
    }
  }
  return payload ?? fallback
}

export default api
