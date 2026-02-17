<template>
  <div class="space-y-6">
    

    

    <!-- Main Content -->
    <div class="bg-white rounded shadow overflow-x-auto p-4">
      <!-- List or child routes -->
      <RouterView>
        <!-- fallback if no child route, show list -->
        <template #default>
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="th">ID</th>
                <th class="th">Supplier</th>
                <th class="th">Status</th>
                <th class="th">Payment</th>
                <th class="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in purchases"
                :key="p.id"
                class="border-t hover:bg-gray-50"
              >
                <td class="td">
                  <RouterLink :to="`/purchases/${p.id}`" class="underline text-blue-600">
                    {{ p.id }}
                  </RouterLink>
                </td>
                <td class="td">{{ p.supplier }}</td>
                <td class="td">
                  <span :class="statusClass(p.status)">{{ p.status }}</span>
                </td>
                <td class="td">
                  <span :class="statusClass(p.payment_status)">{{ p.payment_status }}</span>
                </td>
                <td class="td text-right space-x-2">
                  <button
                    v-if="p.status === 'draft' && canCreate"
                    class="btn-primary"
                    @click="submitPurchase(p)"
                  >
                    Submit
                  </button>

                  <button
                    v-if="p.status === 'pending' && canApprove"
                    class="btn-approve"
                    @click="approvePurchase(p)"
                  >
                    Approve
                  </button>
                  <button
                    v-if="p.status === 'pending' && canApprove"
                    class="btn-reject"
                    @click="rejectPurchase(p)"
                  >
                    Reject
                  </button>

                  <button
                    v-if="p.status === 'approved' && p.payment_status !== 'paid' && canPay"
                    class="btn-primary"
                    @click="recordPayment(p)"
                  >
                    Record Payment
                  </button>
                </td>
              </tr>

              <tr v-if="!purchases.length">
                <td colspan="5" class="p-6 text-center text-gray-500">
                  No purchases found
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="loading" class="p-4 text-center text-purple-800">Loading...</div>
        </template>
      </RouterView>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePurchasesStore } from '@/stores/purchases'
import { RouterLink, RouterView } from 'vue-router'

const auth = useAuthStore()
const purchasesStore = usePurchasesStore()

const userRoles = auth.user?.roles || []
const canApprove = computed(() => userRoles.includes('admin') || userRoles.includes('owner'))
const canCreate = computed(() => userRoles.includes('purchase'))
const canPay = computed(() => userRoles.includes('admin') || userRoles.includes('accountant'))

const purchases = computed(() => purchasesStore.purchases)
const loading = computed(() => purchasesStore.loading)

onMounted(async () => {
  await purchasesStore.fetchPurchases()
})

function submitPurchase(p) { p.status = 'pending' }
function approvePurchase(p) { p.status = 'approved' }
function rejectPurchase(p) { p.status = 'rejected' }
function recordPayment(p) { p.payment_status = 'paid' }

const statusClass = status => ({
  draft: 'badge badge-draft',
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  rejected: 'badge badge-rejected',
  unpaid: 'badge badge-unpaid',
  paid: 'badge badge-paid'
}[status] || 'badge')
</script>

<style scoped>
.th { padding: 10px; text-align: left; font-weight: 600; }
.td { padding: 10px; }

.btn-primary {
  background: rgb(76, 38, 131);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-approve { color: #16a34a; font-weight: 600; cursor: pointer; }
.btn-reject { color: #dc2626; font-weight: 600; cursor: pointer; }

/* Badges */
.badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; text-transform: capitalize; }
.badge-draft { background: #ccc; }
.badge-pending { background: #f59e0b; color: #fff; }
.badge-approved { background: #16a34a; color: #fff; }
.badge-rejected { background: #dc2626; color: #fff; }
.badge-unpaid { background: gray; color: #fff; }
.badge-paid { background: darkgreen; color: #fff; }
</style>
