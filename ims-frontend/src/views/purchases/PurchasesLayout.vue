<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between border-b pb-3 gap-3">
      <h1 class="text-2xl font-bold text-brand">Purchases</h1>
      <div class="flex gap-2 flex-1 justify-end">
        <RouterLink to="/purchases" class="tab">Purchases</RouterLink>
        <RouterLink to="/purchases/new" class="tab">New Purchase</RouterLink>
        <RouterLink to="/purchases/returns" class="tab">Purchase Returns</RouterLink>
      </div>
    </div>

    <RouterView />
  </div>
</template>

<script setup></script>

<style scoped>
.tab {
  padding: 6px 12px;
  border-radius: 6px;
  background: #e5e7eb;
  font-weight: 500;
}
.text-brand { color: rgb(76, 38, 131); }
.router-link-active {
  background: rgb(76, 38, 131);
  color: white;
}
</style>
