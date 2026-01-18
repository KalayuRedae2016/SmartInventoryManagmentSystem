<template>
  <div style="display:flex; height:100vh;">
    <!-- Sidebar -->
    <aside style="width:220px; background:#2c3e50; color:white; padding:20px;">
      <h1 style="font-size:20px; margin-bottom:20px;">Inventory</h1>
      <ul style="list-style:none; padding:0;">
        <li style="margin-bottom:10px;"><router-link to="/dashboard" style="color:white; text-decoration:none;">Dashboard</router-link></li>
        <li style="margin-bottom:10px;"><router-link to="/products" style="color:white; text-decoration:none;">Products</router-link></li>
        <li style="margin-bottom:10px;"><router-link to="/stock-in" style="color:white; text-decoration:none;">Stock In</router-link></li>
        <li><router-link to="/stock-out" style="color:white; text-decoration:none;">Stock Out</router-link></li>
      </ul>
    </aside>

    <!-- Main Content -->
    <div style="flex:1; display:flex; flex-direction:column;">
      <!-- Navbar -->
      <nav style="background:#34495e; color:white; padding:10px 20px;">
        <span>Smart Inventory System</span>
      </nav>

      <!-- Page Content -->
      <main style="flex:1; padding:20px; overflow:auto;">
        <slot />
      </main>
    </div>
  </div>
</template>
