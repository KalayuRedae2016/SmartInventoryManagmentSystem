import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import Products from '../pages/Products.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/products', component: Products },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
