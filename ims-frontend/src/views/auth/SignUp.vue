<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Create Account</h1>
      <p>Fill in your details to create a new account.</p>

      <form class="auth-form" @submit.prevent="submit">
        <label for="name">Full Name</label>
        <input id="name" v-model="name" type="text" placeholder="Your full name" required />

        <label for="email">Email Address</label>
        <input id="email" v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required />

        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" placeholder="Create password" autocomplete="new-password" required />

        <button type="submit" class="submit-btn">Create Account</button>
      </form>

      <RouterLink class="auth-link" to="/login">Already have an account? Sign in</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')

function submit() {
  alert(`Account created for ${name.value}`)
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: linear-gradient(120deg, #6334a3, #4c2683);
}

.auth-card {
  width: min(460px, 100%);
  border-radius: 20px;
  padding: 26px;
  color: #f6f3ff;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08));
  box-shadow: 0 24px 46px rgba(26, 11, 54, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.auth-card h1 {
  margin: 0;
  font-size: 1.8rem;
}

.auth-card p {
  margin: 8px 0 18px;
  color: rgba(246, 243, 255, 0.85);
}

.auth-form {
  display: grid;
  gap: 10px;
}

.auth-form label {
  font-size: 0.88rem;
}

.auth-form input {
  height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0 12px;
  outline: none;
}

.auth-form input::placeholder {
  color: rgba(255, 255, 255, 0.62);
}

.auth-form input:focus {
  border-color: rgba(255, 255, 255, 0.48);
}

.submit-btn {
  margin-top: 6px;
  height: 46px;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(95deg, #4c2683, #6334a3);
}

.auth-link {
  display: inline-block;
  margin-top: 16px;
  color: #e9ddff;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
