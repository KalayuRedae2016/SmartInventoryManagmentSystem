<template>
  <div class="layout-shell flex min-h-screen bg-gray-50">
    <!-- ================= Sidebar ================= -->
    <aside v-show="isSidebarOpen" class="w-56 bg-brand text-white flex flex-col">
      <!-- Logo -->
      <div
        class="p-4 text-2xl font-bold border-b border-white/20 flex items-center justify-center"
      >
        GRAND INVENTORY
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <!-- ================= Dashboard ================= -->
        <RouterLink
          v-if="can('dashboard.view')"
          to="/"
          class="menu-link"
          active-class="menu-active"
        >
          [D] Dashboard
        </RouterLink>

        <!-- Warehouses -->
        <RouterLink
          v-if="can('warehouses.view')"
          to="/warehouses"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/warehouses' }"
        >
          [W] Warehouses
        </RouterLink>



        
        <!-- ================= Products ================= -->
        <RouterLink
          v-if="can('products.view')"
          to="/products"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/products') }"
        >
          [P] Products
        </RouterLink>

        <RouterLink
          v-if="can('stock.view')"
          to="/stock"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/stock' }"
        >
          [ST] Stock
        </RouterLink>

        <!-- ================= Purchases ================= -->
        <RouterLink
          v-if="can('purchases.view') || can('purchases.create')"
          to="/purchases"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/purchases') }"
        >
          [PU] Purchases
        </RouterLink>

        <!-- ================= Sales ================= -->
        <RouterLink
          v-if="can('sales.view')"
          to="/sales/invoices"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/sales') }"
        >
          [S] Sales
        </RouterLink>

        <!-- Stock Transactions -->
        <RouterLink
          v-if="can('stock.history')"
          to="/stock-transactions"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/stock-transactions' }"
        >
          [T] Stock Transactions
        </RouterLink>

        <!-- Stock Transfers -->
        <RouterLink
          v-if="can('stock.transfer')"
          to="/stock-transfers"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/stock-transfers' }"
        >
          [TR] Stock Transfers
        </RouterLink>

        <!-- Stock Adjustments -->
        <RouterLink
          v-if="can('stock.adjust')"
          to="/stock-adjustments"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/stock-adjustments' }"
        >
          [A] Stock Adjustments
        </RouterLink>

        <!-- ================= Users ================= -->
        <RouterLink
          v-if="can('role:view') || can('roles.view')"
          to="/roles"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/roles' }"
        >
          [RL] Roles
        </RouterLink>

        <!-- ================= Users ================= -->
        <RouterLink
          v-if="can('users.view')"
          to="/users"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/users' }"
        >
          [U] Users
        </RouterLink>

        <!-- ================= Customers ================= -->
        <RouterLink
          v-if="can('customers.view')"
          to="/customers"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/customers' }"
        >
          [C] Customers
        </RouterLink>

        <!-- ================= Suppliers ================= -->
        <RouterLink
          v-if="canAnySupplier"
          to="/suppliers"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/suppliers' }"
        >
          [SU] Suppliers
        </RouterLink>


        <!-- ================= Requests ================= -->
        <RouterLink
          v-if="can('requests.view')"
          to="/customer-requests"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/customer-requests' }"
        >
          [R] Requests
        </RouterLink>

        <!-- ================= Reports ================= -->
        <RouterLink
          v-if="can('reports.view')"
          to="/reports"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/reports' }"
        >
          [RP] Reports
        </RouterLink>

      </nav>

    </aside>

    <button
      type="button"
      class="sidebar-toggle"
      :class="isSidebarOpen ? 'sidebar-toggle-open' : 'sidebar-toggle-closed'"
      :aria-label="isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
      @click="toggleSidebar"
    >
      <svg
        v-if="isSidebarOpen"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          fill-rule="evenodd"
          d="M12.79 4.23a.75.75 0 0 1-.02 1.06L8.81 9h7.44a.75.75 0 0 1 0 1.5H8.81l3.96 3.71a.75.75 0 1 1-1.04 1.08l-5.25-4.92a.75.75 0 0 1 0-1.08l5.25-4.92a.75.75 0 0 1 1.06.02Z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          fill-rule="evenodd"
          d="M7.21 15.77a.75.75 0 0 1 .02-1.06L11.19 11H3.75a.75.75 0 0 1 0-1.5h7.44L7.23 5.79a.75.75 0 1 1 1.04-1.08l5.25 4.92a.75.75 0 0 1 0 1.08l-5.25 4.92a.75.75 0 0 1-1.06-.02Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- ================= Main Content ================= -->
    <main class="flex-1 p-6 overflow-auto">
      <div
        v-if="passwordSuccess"
        class="fixed right-6 top-6 z-[60] rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow"
      >
        {{ passwordSuccess }}
      </div>
      <div class="mb-4 flex items-center justify-end">
        <div class="flex items-center gap-3">
          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-gray-100"
              @click="isProfileMenuOpen = !isProfileMenuOpen"
            >
              <div class="user-avatar">
                <img
                  v-if="userPhotoUrl && !avatarImageFailed"
                  :src="userPhotoUrl"
                  alt=""
                  class="user-avatar-img"
                  @error="avatarImageFailed = true"
                />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div class="leading-tight text-left">
                <div class="text-sm font-semibold text-gray-800">{{ userDisplayName }}</div>
                <div class="text-xs text-gray-500">{{ userRoleLabel }}</div>
              </div>
            </button>
            <div
              v-if="isProfileMenuOpen"
              class="absolute right-0 z-40 mt-2 w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
            >
              <button
                type="button"
                class="w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                @click="handleEditProfile"
              >
                Edit Profile
              </button>
              <button
                type="button"
                class="w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                @click="openPasswordModal"
              >
                Change Password
              </button>
              <button
                type="button"
                class="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                @click="handleLogout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="isProfileModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closeProfileModal"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Update Profile</h2>
          <form class="space-y-3" @submit.prevent="submitProfileUpdate">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Full Name</label>
              <input v-model="profileForm.fullName" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="text" @blur="validateField('fullName')" />
              <p v-if="profileFieldErrors.fullName" class="mt-1 text-xs text-red-600">{{ profileFieldErrors.fullName }}</p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Phone Number</label>
              <input v-model="profileForm.phoneNumber" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="text" @blur="validateField('phoneNumber')" />
              <p v-if="profileFieldErrors.phoneNumber" class="mt-1 text-xs text-red-600">{{ profileFieldErrors.phoneNumber }}</p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input v-model="profileForm.email" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="email" @blur="validateField('email')" />
              <p v-if="profileFieldErrors.email" class="mt-1 text-xs text-red-600">{{ profileFieldErrors.email }}</p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Address</label>
              <input v-model="profileForm.address" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="text" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Profile Image</label>
              <input class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" type="file" accept="image/*" @change="onProfileImageChange" />
            </div>
            <p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                @click="closeProfileModal"
                :disabled="isProfileSaving"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:opacity-95 disabled:opacity-60"
                :disabled="isProfileSaving"
              >
                {{ isProfileSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div
        v-if="isPasswordModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closePasswordModal"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Update Password</h2>
          <form class="space-y-3" @submit.prevent="submitPasswordUpdate">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Current Password</label>
              <input
                v-model="passwordForm.currentPassword"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="password"
                autocomplete="current-password"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">New Password</label>
              <input
                v-model="passwordForm.newPassword"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="password"
                autocomplete="new-password"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Confirm New Password</label>
              <input
                v-model="passwordForm.confirmPassword"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="password"
                autocomplete="new-password"
                @paste.prevent
              />
            </div>
            <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                @click="closePasswordModal"
                :disabled="isPasswordSaving"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:opacity-95 disabled:opacity-60"
                :disabled="isPasswordSaving"
              >
                {{ isPasswordSaving ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, watchEffect, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { API_BASE_URL } from '@/config/env'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const usersStore = useUsersStore()
const SIDEBAR_STORAGE_KEY = 'ims_sidebar_open'

const can = auth.can
const canAnySupplier = computed(
  () =>
    can('suppliers.view') ||
    can('suppliers.create') ||
    can('suppliers.update') ||
    can('suppliers.delete')
)

const systemOpen = ref(true)

const userDisplayName = computed(() => auth.user?.fullName || auth.user?.name || 'User')
const userRoleLabel = computed(() => {
  const role = auth.user?.role
  if (!role) return 'User'
  if (typeof role === 'string') return role
  return role.name || role.code || 'User'
})
const userInitials = computed(() => {
  const name = userDisplayName.value || 'User'
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const userProfile = computed(() => {
  if (!usersStore.users?.length) return null
  const currentRole =
    typeof auth.user?.role === 'string'
      ? auth.user?.role
      : auth.user?.role?.name || auth.user?.role?.code || ''
  const byId = usersStore.users.find(u => u.id === auth.user?.id)
  if (byId) return byId
  const byName = usersStore.users.find(u => u.name === auth.user?.name)
  if (byName) return byName
  const byRole = usersStore.users.find(u => u.role === currentRole)
  return byRole || null
})

function getApiOrigin() {
  const raw = String(API_BASE_URL || '').trim()
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

function resolveImageUrl(value) {
  const raw = String(value || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const origin = getApiOrigin()

  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw

  if (/^(https?:)?\/\//i.test(raw)) {
    if (!origin) return raw
    const uploadsIndex = raw.indexOf('/uploads/')
    if (uploadsIndex >= 0) {
      return `${origin}${raw.slice(uploadsIndex)}`
    }
    return raw
  }

  if (!origin) return raw

  if (raw.startsWith('/uploads/')) return `${origin}${raw}`
  if (raw.startsWith('uploads/')) return `${origin}/${raw}`
  if (raw.startsWith('/api/ims/uploads/')) return `${origin}${raw.replace('/api/ims', '')}`
  if (raw.includes('/uploads/')) return `${origin}${raw.slice(raw.indexOf('/uploads/'))}`
  return `${origin}/${raw.replace(/^\/+/, '')}`
}

const userPhotoUrlRaw = computed(() => auth.user?.profileImage || userProfile.value?.photoUrl || '')
const userPhotoUrl = computed(() => resolveImageUrl(userPhotoUrlRaw.value))
const avatarImageFailed = ref(false)
const isSidebarOpen = ref(true)

watch(userPhotoUrl, () => {
  avatarImageFailed.value = false
})
const isProfileModalOpen = ref(false)
const isPasswordModalOpen = ref(false)
const isProfileMenuOpen = ref(false)
const isProfileSaving = ref(false)
const isPasswordSaving = ref(false)
const profileError = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const profileForm = ref({
  fullName: '',
  phoneNumber: '',
  email: '',
  address: '',
  profileImage: null
})
const profileFieldErrors = ref({
  fullName: '',
  phoneNumber: '',
  email: ''
})
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
let passwordSuccessTimer = null

onMounted(() => {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) isSidebarOpen.value = stored === '1'
  } catch {
    isSidebarOpen.value = true
  }
  usersStore.fetchUsers()
})

/* Auto expand based on route */
watchEffect(() => {
  systemOpen.value = route.path.startsWith('/system')
})

function logout() {
  auth.logout()
  router.push('/login')
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarOpen.value ? '1' : '0')
  } catch {
    // Ignore localStorage errors in restrictive browser modes.
  }
}

function openProfileModal() {
  profileError.value = ''
  profileFieldErrors.value = {
    fullName: '',
    phoneNumber: '',
    email: ''
  }
  profileForm.value = {
    fullName: auth.user?.fullName || '',
    phoneNumber: auth.user?.phoneNumber || '',
    email: auth.user?.email || '',
    address: auth.user?.address || '',
    profileImage: null
  }
  isProfileModalOpen.value = true
}

function handleEditProfile() {
  isProfileMenuOpen.value = false
  openProfileModal()
}

function handleLogout() {
  isProfileMenuOpen.value = false
  logout()
}

function openPasswordModal() {
  isProfileMenuOpen.value = false
  clearPasswordFeedback()
  resetPasswordForm()
  isPasswordModalOpen.value = true
}

function closePasswordModal(force = false) {
  if (isPasswordSaving.value && !force) return
  clearPasswordFeedback()
  resetPasswordForm()
  isPasswordModalOpen.value = false
}

function closeProfileModal() {
  if (isProfileSaving.value) return
  isProfileModalOpen.value = false
}

function onProfileImageChange(event) {
  const file = event?.target?.files?.[0] || null
  profileForm.value.profileImage = file
}

function validateField(field) {
  const fullName = String(profileForm.value.fullName || '').trim()
  const phoneNumber = String(profileForm.value.phoneNumber || '').trim()
  const email = String(profileForm.value.email || '').trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneDigits = phoneNumber.replace(/\D/g, '')

  if (field === 'fullName') {
    profileFieldErrors.value.fullName = fullName ? '' : 'Full name is required.'
  }
  if (field === 'phoneNumber') {
    profileFieldErrors.value.phoneNumber =
      !phoneNumber || phoneDigits.length < 8 || phoneDigits.length > 15
        ? 'Phone number must be 8 to 15 digits.'
        : ''
  }
  if (field === 'email') {
    profileFieldErrors.value.email = !emailRegex.test(email) ? 'Enter a valid email address.' : ''
  }
}

function validateProfileForm() {
  validateField('fullName')
  validateField('phoneNumber')
  validateField('email')
  return !profileFieldErrors.value.fullName && !profileFieldErrors.value.phoneNumber && !profileFieldErrors.value.email
}

async function submitProfileUpdate() {
  profileError.value = ''
  if (!validateProfileForm()) return
  isProfileSaving.value = true
  try {
    await auth.updateProfile({
      fullName: profileForm.value.fullName,
      phoneNumber: profileForm.value.phoneNumber,
      email: profileForm.value.email,
      address: profileForm.value.address,
      profileImage: profileForm.value.profileImage
    })
    isProfileModalOpen.value = false
  } catch (error) {
    profileError.value = error?.message || 'Unable to update profile.'
  } finally {
    isProfileSaving.value = false
  }
}

async function submitPasswordUpdate() {
  clearPasswordFeedback()

  const currentPassword = String(passwordForm.value.currentPassword || '')
  const newPassword = String(passwordForm.value.newPassword || '')
  const confirmPassword = String(passwordForm.value.confirmPassword || '')

  if (!currentPassword || !newPassword || !confirmPassword) {
    passwordError.value = 'All password fields are required.'
    return
  }
  if (newPassword.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (newPassword !== confirmPassword) {
    passwordError.value = 'New password and confirm password do not match.'
    return
  }

  isPasswordSaving.value = true
  try {
    await auth.updatePassword({ currentPassword, newPassword })
    closePasswordModal(true)
    showPasswordSuccess('Password updated successfully.')
  } catch (error) {
    passwordError.value = error?.message || 'Unable to update password.'
  } finally {
    isPasswordSaving.value = false
  }
}

function resetPasswordForm() {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

function clearPasswordFeedback() {
  passwordError.value = ''
}

function showPasswordSuccess(message) {
  passwordSuccess.value = message
  if (passwordSuccessTimer) clearTimeout(passwordSuccessTimer)
  passwordSuccessTimer = setTimeout(() => {
    passwordSuccess.value = ''
    passwordSuccessTimer = null
  }, 3000)
}

onBeforeUnmount(() => {
  if (passwordSuccessTimer) clearTimeout(passwordSuccessTimer)
})
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
}
.layout-shell {
  position: relative;
}
.sidebar-toggle {
  position: absolute;
  top: 14px;
  z-index: 45;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: left 0.18s ease, background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.sidebar-toggle:hover {
  background: #f9fafb;
  color: rgb(76, 38, 131);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}
.sidebar-toggle:focus-visible {
  outline: 2px solid rgba(76, 38, 131, 0.45);
  outline-offset: 2px;
}
.sidebar-toggle-open {
  left: calc(14rem - 14px);
}
.sidebar-toggle-closed {
  left: 10px;
}

/* Main menu */
.menu-link {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
  cursor: pointer;
}
.menu-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Sub menu */
.submenu-link {
  display: block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.2s;
}
.submenu-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Active */
.menu-active {
  background: rgba(255, 255, 255, 0.25);
  font-weight: bold;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgb(76, 38, 131);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  overflow: hidden;
}
.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
