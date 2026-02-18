<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Forgot Password</h1>
      <p>Enter your email and we will send a reset link.</p>

      <form class="auth-form" @submit.prevent="submit">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <RouterLink class="auth-link" to="/login">Back to login</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const email = ref('')
const loading = ref(false)

async function submit() {
  if (!email.value) {
    alert('Please enter your email address.')
    return
  }

  try {
    loading.value = true
    await api.post('/auth/forgetPassword', { email: email.value })
    alert('If the email exists, OTP instructions were sent successfully.')
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Failed to request password reset.'
    alert(message)
  } finally {
    loading.value = false
  }
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
  width: min(420px, 100%);
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
  height: 46px;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(95deg, #4c2683, #6334a3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
