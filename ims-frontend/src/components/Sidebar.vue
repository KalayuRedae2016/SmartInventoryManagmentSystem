<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-52 bg-brand text-white flex flex-col">
      <!-- Logo -->
      <div class="p-4 text-2xl font-bold border-b border-white/20 flex items-center justify-center">
        IMS
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <!-- Dashboard -->
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



        
        <!-- Products -->
        <RouterLink
          v-if="can('products.view')"
          to="/products"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/products') }"
        >
          [P] Products
        </RouterLink>

        <!-- Stock Transactions -->
        



        <!-- Sales -->
        <RouterLink
          v-if="can('sales.view')"
          to="/sales"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/sales' }"
        >
          [S] Sales
        </RouterLink>

        <!-- Stock Transactions -->
<RouterLink
          v-if="can('stock.transfer')"
          to="/stock-transfers"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/stock-transfers' }"
        >
          [T] Stock Transactions
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


        <!-- Purchases -->
        <RouterLink
          v-if="can('purchases.view') || can('purchases.create')"
          to="/purchases"
          class="menu-link"
          :class="{ 'menu-active': $route.path.startsWith('/purchases') }"
        >
          [PU] Purchases
        </RouterLink>



        <!-- Users -->
        <RouterLink
          v-if="can('users.view')"
          to="/users"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/users' }"
        >
          [U] Users
        </RouterLink>

        <!-- Customers -->
        <RouterLink
          v-if="can('customers.view')"
          to="/customers"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/customers' }"
        >
          [C] Customers
        </RouterLink>

        <!-- Suppliers -->
        <RouterLink
          v-if="can('suppliers.view')"
          to="/suppliers"
          class="menu-link"
          :class="{ 'menu-active': .path === '/suppliers' }"
        >
          [SU] Suppliers
        </RouterLink>


        <!-- Customer Requests -->
        <RouterLink
          v-if="can('requests.view')"
          to="/customer-requests"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/customer-requests' }"
        >
          [R] Requests
        </RouterLink>

        <!-- Reports -->
        <RouterLink
          v-if="can('reports.view')"
          to="/reports"
          class="menu-link"
          :class="{ 'menu-active': $route.path === '/reports' }"
        >
          [RP] Reports
        </RouterLink>

      </nav>

      <!-- Logout -->
      <div class="p-3 border-t border-white/20">
        <button class="w-full bg-white text-brand py-2 rounded hover:bg-gray-100 transition" @click="logout">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'


const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const can = auth.can

// Auto-expand collapsibles based on current route
watchEffect(() => {
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.bg-brand { background-color: rgb(76, 38, 131); }

/* Main menu */
.menu-link {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
  cursor: pointer;
}
.menu-link:hover { background: rgba(255, 255, 255, 0.15); }

/* Sub menu */
.submenu-link {
  display: block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  transition: background 0.2s;
}
.submenu-link:hover { background: rgba(255, 255, 255, 0.15); }

/* Active */
.menu-active {
  background: rgba(255, 255, 255, 0.25);
  font-weight: bold;
}
</style>
