import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { getResponseData, getAuthToken, setAuthToken } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(readStoredUser())
  const token = ref(getAuthToken() || null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const rolePermissions = {
    superadmin: ['*'],
    owner: [
      'dashboard.view',
      'products.view',
      'categories.view',
      'brands.view',
      'units.view',
      'stock.view',
      'stock.transfer',
      'stock.adjust',
      'stock.approve',
      'stock.history',
      'warehouses.view',
      'purchases.view',
      'sales.view',
      'users.view',
      'customers.view',
      'suppliers.view',
      'requests.view',
      'reports.view'
    ],
    admin: [
      'dashboard.view',
      'products.view',
      'categories.view',
      'brands.view',
      'units.view',
      'stock.view',
      'stock.transfer',
      'stock.adjust',
      'stock.approve',
      'stock.history',
      'warehouses.view',
      'purchases.view',
      'sales.view',
      'customers.view',
      'suppliers.view',
      'users.view',
      'reports.view'
    ],
    warehouse_manager: [
      'dashboard.view',
      'products.view',
      'stock.view',
      'stock.transfer',
      'stock.adjust',
      'stock.approve',
      'stock.history',
      'warehouses.view'
    ],
    store_keeper: ['dashboard.view', 'stock.view', 'stock.transfer', 'stock.adjust', 'stock.history'],
    sale: ['dashboard.view', 'sales.view', 'customers.view'],
    purchase: ['dashboard.view', 'purchases.view', 'suppliers.view'],
    finance: ['dashboard.view', 'purchases.view', 'reports.view'],
    accountant: ['dashboard.view', 'purchases.view', 'reports.view'],
    support: ['dashboard.view'],
    employee: [
      'dashboard.view',
      'products.view',
      'stock.view',
      'stock.history',
      'purchases.view',
      'sales.view',
      'customers.view',
      'suppliers.view'
    ],
    customer: ['dashboard.view']
  }

  function normalizeRole(value) {
    const rawValue =
      value && typeof value === 'object'
        ? value.name || value.code || value.role || value.value || ''
        : value || ''

    const raw = String(rawValue || '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')

    if (!raw) return 'employee'
    if (raw === 'super_admin') return 'superadmin'
    if (raw === 'wh_manager') return 'warehouse_manager'
    if (raw === 'manager') return 'warehouse_manager'
    if (raw === 'sales') return 'sale'
    return raw
  }

  function can(permission) {
    if (!user.value) return false
    const role = normalizeRole(user.value.role)
    const perms = rolePermissions[role] || []
    if (perms.includes('*')) return true
    return perms.includes(permission)
  }

  async function fetchMe() {
    if (!token.value) return null
    try {
      const res = await api.get('/auth/me')
      const payload = getResponseData(res, {})
      const me = payload?.user || payload?.data || payload || {}
      const resolvedRole = me?.role?.name || me?.role || payload?.role || ''
      user.value = {
        ...me,
        role: normalizeRole(resolvedRole)
      }
      storeUser(user.value)
      return user.value
    } catch {
      const decoded = decodeJwtPayload(token.value)
      if (!decoded) throw new Error('Unable to restore user session from token.')
      user.value = {
        id: decoded.id ?? decoded.userId ?? null,
        role: normalizeRole(decoded.role || decoded.userRole || '')
      }
      storeUser(user.value)
      return user.value
    }
  }

  async function login(payload) {
    if (typeof payload === 'string') throw new Error('Use phone number and password for login.')

    const username = payload?.username || payload?.email || payload?.phoneNumber || ''
    const password = payload?.password || ''
    const fallbackRole = normalizeRole(payload?.role || 'employee')

    if (!username || !password) throw new Error('Phone number and password are required.')

    const phoneCandidates = buildPhoneCandidates(username)
    const endpointCandidates = []
    const endpoints = ['/auth/login', '/auth/signin', '/auth/sign-in']

    endpoints.forEach(endpoint => {
      phoneCandidates.forEach(phone => {
        endpointCandidates.push({
          endpoint,
          body: { phoneNumber: phone, password },
          config: { headers: { 'Content-Type': 'application/json' } }
        })
        endpointCandidates.push({
          endpoint,
          body: { phone: phone, password },
          config: { headers: { 'Content-Type': 'application/json' } }
        })
        endpointCandidates.push({
          endpoint,
          body: { phone_number: phone, password },
          config: { headers: { 'Content-Type': 'application/json' } }
        })
        endpointCandidates.push({
          endpoint,
          body: { identifier: phone, password },
          config: { headers: { 'Content-Type': 'application/json' } }
        })
        endpointCandidates.push({
          endpoint,
          body: new URLSearchParams({ phoneNumber: phone, password }),
          config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        })
        endpointCandidates.push({
          endpoint,
          body: new URLSearchParams({ phone: phone, password }),
          config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        })
        endpointCandidates.push({
          endpoint,
          body: new URLSearchParams({ phone_number: phone, password }),
          config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        })
        endpointCandidates.push({
          endpoint,
          body: new URLSearchParams({ identifier: phone, password }),
          config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        })
      })

      endpointCandidates.push({
        endpoint,
        body: { email: username, password },
        config: { headers: { 'Content-Type': 'application/json' } }
      })
      endpointCandidates.push({
        endpoint,
        body: { username, password },
        config: { headers: { 'Content-Type': 'application/json' } }
      })
    })

    let res = null
    let lastError = null

    for (const candidate of endpointCandidates) {
      try {
        res = await api.post(candidate.endpoint, candidate.body, candidate.config)
        break
      } catch (error) {
        const status = error?.response?.status
        lastError = error
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) continue
        break
      }
    }

    if (!res) {
      const status = lastError?.response?.status
      const backendMessage = extractErrorMessage(lastError)
      const networkCode = lastError?.code || ''
      const networkMessage = lastError?.message || ''
      if (status === 401 || status === 403) {
        throw new Error(backendMessage || 'Invalid credentials or unauthorized user.')
      }
      if (status === 400 || status === 422) {
        throw new Error(backendMessage || 'Login payload rejected by backend. Check required field names.')
      }
      if (!status) {
        throw new Error(
          backendMessage ||
            `Login request failed before response (${networkCode || 'network error'}). ${networkMessage}`
        )
      }
      throw new Error(backendMessage || `Login failed (HTTP ${status}).`)
    }

    const authPayload = getResponseData(res, {})
    const nextToken = authPayload?.token || res?.data?.token || ''
    const nextUser = authPayload?.user || res?.data?.user || null

    if (!nextToken) throw new Error('Login response did not include a token.')

    token.value = nextToken
    setAuthToken(nextToken)

    if (nextUser) {
      user.value = { ...nextUser, role: normalizeRole(nextUser.role) }
      storeUser(user.value)
    } else {
      await fetchMe()
    }

    if (user.value && !user.value.role) user.value.role = fallbackRole
    return true
  }

  async function signup(payload) {
    const fullName = String(payload?.fullName || '').trim()
    const phoneNumber = String(payload?.phoneNumber || '').trim()
    const email = String(payload?.email || '').trim()
    const password = String(payload?.password || '')

    if (!fullName || !phoneNumber || !email || !password) {
      throw new Error('Full name, phone number, email, and password are required.')
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('phoneNumber', phoneNumber)
    formData.append('email', email)
    formData.append('password', password)

    try {
      await api.post('/auth/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return true
    } catch (error) {
      const status = error?.response?.status
      const backendMessage = extractErrorMessage(error)
      if (status === 400 || status === 409 || status === 422) {
        throw new Error(backendMessage || 'Signup payload rejected by backend.')
      }
      throw new Error(backendMessage || `Signup failed${status ? ` (HTTP ${status})` : ''}.`)
    }
  }

  function logout() {
    user.value = null
    token.value = null
    setAuthToken('')
    localStorage.removeItem('ims_user')
  }

  async function initAuth() {
    if (!token.value) return
    try {
      await fetchMe()
    } catch {
      logout()
    }
  }

  function readStoredUser() {
    try {
      const raw = localStorage.getItem('ims_user')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null
      return { ...parsed, role: normalizeRole(parsed.role) }
    } catch {
      return null
    }
  }

  function storeUser(nextUser) {
    if (!nextUser || typeof nextUser !== 'object') return
    localStorage.setItem('ims_user', JSON.stringify(nextUser))
  }

  function decodeJwtPayload(rawToken) {
    try {
      const parts = String(rawToken || '').split('.')
      if (parts.length < 2) return null
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      return JSON.parse(atob(padded))
    } catch {
      return null
    }
  }

  function extractErrorMessage(error) {
    const data = error?.response?.data
    if (!data) return ''
    if (typeof data === 'string') {
      const plain = data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      if (/bad request/i.test(plain)) return 'Bad request from backend.'
      if (/unauthorized/i.test(plain)) return 'Unauthorized.'
      return plain.slice(0, 180)
    }
    return data?.message || data?.error || ''
  }

  function buildPhoneCandidates(input) {
    const raw = String(input || '').trim()
    const digits = raw.replace(/[^\d]/g, '')
    const set = new Set([raw])

    if (digits) set.add(digits)
    if (digits.startsWith('0')) set.add(`+251${digits.slice(1)}`)
    if (digits.startsWith('251')) {
      set.add(`+${digits}`)
      set.add(`0${digits.slice(3)}`)
    }
    if (digits.startsWith('9') && digits.length === 9) {
      set.add(`0${digits}`)
      set.add(`+251${digits}`)
    }

    return Array.from(set).filter(Boolean)
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    signup,
    logout,
    can,
    fetchMe,
    initAuth
  }
})
