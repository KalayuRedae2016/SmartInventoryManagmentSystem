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

let authToken = localStorage.getItem('ims_token') || ''

export function setAuthToken(token = '') {
  authToken = token || ''
  if (authToken) {
    localStorage.setItem('ims_token', authToken)
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`
  } else {
    localStorage.removeItem('ims_token')
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

if (authToken) {
  setAuthToken(authToken)
}

export default api
