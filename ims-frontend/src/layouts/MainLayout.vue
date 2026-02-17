<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- ================= Sidebar ================= -->
    <aside class="w-56 bg-brand text-white flex flex-col">
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

        <!-- Stock Transactions -->
        



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


        <!-- ================= Purchases ================= -->
        <RouterLink
          v-if="can('purchases.view') || can('purchases.create')"
          to="/purchases"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/purchases') }"
        >
          [PU] Purchases
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
          v-if="can('suppliers.view')"
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

      <!-- ================= Logout ================= -->
      <div class="p-3 border-t border-white/20">
        <button
          class="w-full bg-white text-brand py-2 rounded hover:bg-gray-100 transition"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- ================= Main Content ================= -->
    <main class="flex-1 p-6 overflow-auto">
      <div class="flex justify-end items-center mb-4">
        <div class="flex items-center gap-3">
          <div class="user-avatar">
            <img v-if="userPhotoUrl" :src="userPhotoUrl" alt="" class="user-avatar-img" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="leading-tight">
            <div class="text-sm font-semibold text-gray-800">{{ userDisplayName }}</div>
            <div class="text-xs text-gray-500">{{ userRoleLabel }}</div>
          </div>
        </div>
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, watchEffect, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const usersStore = useUsersStore()

const can = auth.can

const systemOpen = ref(true)

const userDisplayName = computed(() => auth.user?.name || 'User')
const userRoleLabel = computed(() => {
  const role = auth.user?.role || 'user'
  const map = {
    superadmin: 'Super Admin',
    owner: 'Owner',
    admin: 'Admin',
    support: 'Support',
    accountant: 'Accountant',
    sale: 'Sales',
    store_keeper: 'Store Keeper',
    warehouse_manager: 'Warehouse Manager',
    purchase: 'Purchase',
    customer: 'Customer'
  }
  return map[role] || role
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
  const byId = usersStore.users.find(u => u.id === auth.user?.id)
  if (byId) return byId
  const byName = usersStore.users.find(u => u.name === auth.user?.name)
  if (byName) return byName
  const byRole = usersStore.users.find(u => u.role === auth.user?.role)
  return byRole || null
})

const userPhotoUrl = computed(() => userProfile.value?.photoUrl || '')

onMounted(() => {
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
</script>

<style scoped>
.bg-brand {
  background-color: rgb(76, 38, 131);
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
