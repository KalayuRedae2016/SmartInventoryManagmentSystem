import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { getResponseData, getAuthToken, setAuthToken } from '@/services/api'
import { hasPermission as hasPermissionUtil, normalizePermissions, normalizeRole } from '@/utils/rbac'

const USER_STORAGE_KEY = 'ims_user'
const PERMISSIONS_STORAGE_KEY = 'ims_permissions'

function extractErrorMessage(error) {
  const data = error?.response?.data
  if (!data) return ''
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return data?.message || data?.error || ''
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(readJsonStorage(USER_STORAGE_KEY, null))
  const permissions = ref(normalizePermissions(readJsonStorage(PERMISSIONS_STORAGE_KEY, [])))
  const token = ref(getAuthToken() || null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  function setAuthState({ nextUser, nextPermissions, nextToken }) {
    user.value = nextUser || null
    permissions.value = normalizePermissions(nextPermissions)

    if (user.value) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions.value))

    if (typeof nextToken === 'string') {
      token.value = nextToken || null
      setAuthToken(nextToken)
    }
  }

  function resolveRole(payload) {
    return normalizeRole(payload?.role || payload?.user?.role || user.value?.role)
  }

  function resolvePermissions(payload) {
    // Prefer explicit top-level permissions from auth endpoints.
    if (Array.isArray(payload?.permissions)) return payload.permissions
    if (Array.isArray(payload?.role?.permissions)) return payload.role.permissions
    if (Array.isArray(payload?.user?.role?.permissions)) return payload.user.role.permissions
    return permissions.value
  }

  function buildUser(payload) {
    const srcUser = payload?.user || payload?.data || payload || {}
    return {
      ...srcUser,
      role: resolveRole(payload)
    }
  }

  function hasPermission(permission) {
    return hasPermissionUtil(
      {
        role: user.value?.role,
        permissions: permissions.value
      },
      permission
    )
  }

  function can(permission) {
    return hasPermission(permission)
  }

  async function fetchMe() {
    if (!token.value) return null

    const res = await api.get('/auth/getMe')
    const payload = res?.data || getResponseData(res, {})
    const nextUser = buildUser(payload)
    const nextPermissions = resolvePermissions(payload)

    setAuthState({
      nextUser,
      nextPermissions,
      nextToken: token.value
    })

    return nextUser
  }

  async function login(payload) {
    const phoneNumber = String(payload?.phoneNumber || '').trim()
    const password = String(payload?.password || '')
    if (!phoneNumber || !password) throw new Error('Phone number and password are required.')

    let res
    try {
      res = await api.post('/auth/login', { phoneNumber, password })
    } catch (error) {
      const backendMessage = extractErrorMessage(error)
      throw new Error(backendMessage || 'Invalid phone number or password.')
    }

    const payloadData = res?.data || {}
    const nextToken = payloadData?.token || ''
    if (!nextToken) throw new Error('Login response did not include a token.')

    const nextUser = buildUser(payloadData)
    const nextPermissions = resolvePermissions(payloadData)

    setAuthState({
      nextUser,
      nextPermissions,
      nextToken
    })

    return true
  }

  async function signup(payload) {
    const fullName = String(payload?.fullName || '').trim()
    const phoneNumber = String(payload?.phoneNumber || '').trim()
    const email = String(payload?.email || '').trim()
    const password = String(payload?.password || '')
    const roleId = Number(payload?.roleId || 0)
    const roleName = String(payload?.roleName || '').trim()
    const permissionIds = Array.isArray(payload?.permissionIds) ? payload.permissionIds : []
    const profileImage = payload?.profileImage

    if (!fullName || !phoneNumber || !email || !password) {
      throw new Error('Full name, phone number, email, and password are required.')
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('phoneNumber', phoneNumber)
    formData.append('email', email)
    formData.append('password', password)
    if (profileImage instanceof File) formData.append('profileImage', profileImage)
    if (roleId) formData.append('roleId', String(roleId))
    if (roleName) formData.append('roleName', roleName)
    if (permissionIds.length) formData.append('permissionIds', JSON.stringify(permissionIds))

    try {
      await api.post('/auth/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return true
    } catch (error) {
      const backendMessage = extractErrorMessage(error)
      throw new Error(backendMessage || 'Signup failed.')
    }
  }

  async function updateProfile(payload) {
    if (!token.value || !user.value) throw new Error('You must be logged in.')

    const fullName = String(payload?.fullName || '').trim()
    const phoneNumber = String(payload?.phoneNumber || '').trim()
    const email = String(payload?.email || '').trim()
    const address = String(payload?.address || '').trim()
    const profileImage = payload?.profileImage

    const formData = new FormData()
    if (fullName) formData.append('fullName', fullName)
    if (phoneNumber) formData.append('phoneNumber', phoneNumber)
    if (email) formData.append('email', email)
    if (address) formData.append('address', address)
    if (profileImage instanceof File) formData.append('profileImage', profileImage)

    if (![...formData.keys()].length) return user.value

    try {
      const res = await api.patch('/auth/updateMe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const payloadData = res?.data || getResponseData(res, {})
      const updatedUser = {
        ...user.value,
        ...(payloadData?.data || payloadData?.user || {}),
        role: user.value?.role
      }
      setAuthState({
        nextUser: updatedUser,
        nextPermissions: permissions.value,
        nextToken: token.value
      })
      return updatedUser
    } catch (error) {
      const backendMessage = extractErrorMessage(error)
      throw new Error(backendMessage || 'Profile update failed.')
    }
  }

  async function updatePassword(payload) {
    if (!token.value || !user.value) throw new Error('You must be logged in.')

    const currentPassword = String(payload?.currentPassword || '')
    const newPassword = String(payload?.newPassword || '')
    if (!currentPassword || !newPassword) {
      throw new Error('Please provide both current and new passwords.')
    }

    try {
      await api.patch('/auth/updatemyPassword', { currentPassword, newPassword })
      return true
    } catch (error) {
      const backendMessage = extractErrorMessage(error)
      throw new Error(backendMessage || 'Password update failed.')
    }
  }

  function logout() {
    user.value = null
    permissions.value = []
    token.value = null
    setAuthToken('')
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY)
  }

  async function initAuth() {
    // Always start logged out on a fresh page load so that
    // the user is explicitly prompted to log in.
    logout()
  }

  return {
    user,
    token,
    permissions,
    isAuthenticated,
    login,
    signup,
    updateProfile,
    updatePassword,
    logout,
    can,
    hasPermission,
    fetchMe,
    initAuth
  }
})
