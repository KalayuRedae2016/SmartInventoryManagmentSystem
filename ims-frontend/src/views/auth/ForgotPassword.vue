<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1>Reset Password</h1>
      <p v-if="step === 1">Enter your email to receive an OTP.</p>
      <p v-else-if="step === 2">Enter the OTP sent to your email.</p>
      <p v-else>Set your new password.</p>

      <form v-if="step === 1" class="auth-form" @submit.prevent="requestOtp">
        <label for="email">Email Address</label>
        <input id="email" v-model.trim="email" type="email" placeholder="you@example.com" required />
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send OTP' }}
        </button>
      </form>

      <form v-else-if="step === 2" class="auth-form" @submit.prevent="verifyOtp">
        <label for="otp">OTP Code</label>
        <input id="otp" v-model.trim="otp" type="text" placeholder="Enter OTP code" required />
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Verify OTP' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="resetPassword">
        <label for="newPassword">New Password</label>
        <input
          id="newPassword"
          v-model="newPassword"
          type="password"
          placeholder="Enter new password"
          autocomplete="new-password"
          required
        />

        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          autocomplete="new-password"
          required
        />

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <p v-if="message" class="status-message">{{ message }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <button v-if="step > 1" class="ghost-btn" @click="goBack">Back</button>
      <RouterLink class="auth-link" to="/login">Back to login</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const step = ref(1)
const loading = ref(false)

const email = ref('')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const message = ref('')
const errorMessage = ref('')

function clearFeedback() {
  message.value = ''
  errorMessage.value = ''
}

function extractError(error, fallback) {
  const data = error?.response?.data
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || fallback
  }
  return data?.message || data?.error || error?.message || fallback
}

async function requestOtp() {
  if (!email.value) return
  clearFeedback()
  loading.value = true
  try {
    await api.post('/auth/forgetPassword', { email: email.value })
    message.value = 'OTP sent successfully. Please check your email.'
    step.value = 2
  } catch (error) {
    errorMessage.value = extractError(error, 'Failed to send OTP.')
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  if (!email.value || !otp.value) return
  clearFeedback()
  loading.value = true
  try {
    await api.post('/auth/verifyOTP', {
      email: email.value,
      passwordResetOTP: otp.value
    })
    message.value = 'OTP verified. You can now set a new password.'
    step.value = 3
  } catch (error) {
    errorMessage.value = extractError(error, 'OTP verification failed.')
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  if (!newPassword.value || !confirmPassword.value) return
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Password and confirm password do not match.'
    return
  }

  clearFeedback()
  loading.value = true
  try {
    await api.patch('/auth/resetPassword', {
      email: email.value,
      newPassword: newPassword.value
    })
    message.value = 'Password reset successful. Redirecting to login...'
    setTimeout(() => router.push('/login'), 1000)
  } catch (error) {
    errorMessage.value = extractError(error, 'Password reset failed.')
  } finally {
    loading.value = false
  }
}

function goBack() {
  clearFeedback()
  if (step.value > 1) step.value -= 1
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

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-message {
  margin: 12px 0 0;
  color: #dcfce7;
  font-size: 0.9rem;
}

.error-message {
  margin: 12px 0 0;
  color: #fee2e2;
  font-size: 0.9rem;
}

.ghost-btn {
  margin-top: 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
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
