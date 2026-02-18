<template>
  <div class="login-page">
    <div class="bg-orb orb-left"></div>
    <div class="bg-orb orb-right"></div>

    <section class="login-card">
      <header class="login-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
      </header>

      <form class="login-form" @submit.prevent="submitLogin">
        <div class="field-wrap">
          <label for="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            v-model="phoneNumber"
            type="tel"
            placeholder="Enter phone number"
            autocomplete="tel"
          />
        </div>

        <div class="field-wrap">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter password"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="icon-btn"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M2 12C3.9 7.9 7.5 5 12 5C16.5 5 20.1 7.9 22 12C20.1 16.1 16.5 19 12 19C7.5 19 3.9 16.1 2 12Z"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" />
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? 'Signing In...' : 'Sign In' }}
        </button>

        <div class="form-meta">
          <label class="remember-me">
            <input v-model="rememberMe" type="checkbox" />
            <span>Remember me</span>
          </label>
          <RouterLink to="/forgot-password" class="text-link">Forgot password?</RouterLink>
        </div>

        <p v-if="loginError" class="login-error">{{ loginError }}</p>
      </form>

      <p class="footer-text">
        Don&#39;t have an account?
        <RouterLink to="/sign-up" class="text-link">Sign up</RouterLink>
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const phoneNumber = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const submitting = ref(false)
const loginError = ref('')

async function submitLogin() {
  if (!phoneNumber.value || !password.value) {
    loginError.value = 'Please enter phone number and password'
    return
  }

  loginError.value = ''
  submitting.value = true

  try {
    await auth.login({
      phoneNumber: phoneNumber.value,
      password: password.value
    })
    await router.push('/')
  } catch (error) {
    loginError.value = error?.message || 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:root {
  --brand-color: #4c2683;
  --brand-strong: #391d69;
  --brand-soft: #6334a3;
}

.login-page {
  --surface-1: rgba(255, 255, 255, 0.92);
  --surface-2: rgba(255, 255, 255, 0.98);
  --text-main: #2c1750;
  --text-soft: rgba(44, 23, 80, 0.82);
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 15%, rgba(143, 98, 214, 0.35), transparent 36%),
    radial-gradient(circle at 80% 80%, rgba(129, 96, 185, 0.26), transparent 42%),
    linear-gradient(120deg, var(--brand-soft), var(--brand-color));
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
  pointer-events: none;
}

.orb-left {
  width: 290px;
  height: 290px;
  background: rgba(255, 255, 255, 0.75);
  top: -120px;
  left: -100px;
}

.orb-right {
  width: 250px;
  height: 250px;
  background: rgba(255, 255, 255, 0.06);
  bottom: -90px;
  right: -90px;
}

.login-card {
  position: relative;
  width: min(420px, 100%);
  z-index: 1;
  border-radius: 24px;
  padding: 30px;
  color: #241348;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(247, 241, 255, 0.9));
  border: 1px solid rgba(94, 55, 150, 0.26);
  box-shadow: 0 28px 60px rgba(26, 11, 54, 0.25);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h1 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.login-header p {
  margin: 8px 0 0;
  color: #3a2367;
  font-size: 0.95rem;
}

.login-form {
  display: grid;
  gap: 14px;
}

.field-wrap {
  display: grid;
  gap: 6px;
}

.field-wrap label {
  font-size: 0.9rem;
  color: #3a2367;
  font-weight: 700;
}

.field-wrap input {
  width: 100%;
  font-weight: 600;
  height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(99, 52, 163, 0.25);
  background: var(--surface-1);
  color: #241348;
  padding: 0 14px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.field-wrap input::placeholder {
  color: rgba(58, 35, 103, 0.6);
}

.field-wrap input:focus {
  border-color: rgba(99, 52, 163, 0.55);
  background: var(--surface-2);
  box-shadow: 0 0 0 3px rgba(99, 52, 163, 0.18);
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 44px;
}

.icon-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: rgba(58, 35, 103, 0.78);
  padding: 0;
  border-radius: 8px;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  color: #2c1750;
  background: rgba(255, 255, 255, 0.9);
}

.form-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #3a2367;
  font-weight: 700;
}

.remember-me input {
  width: 14px;
  height: 14px;
  accent-color: var(--brand-color);
}

.text-link {
  font-weight: 700;
  border: none;
  background: transparent;
  color: #5b2f9a;
  font-size: 0.9rem;
  padding: 0;
  text-decoration: none;
}

.text-link:hover {
  color: #3a2367;
  text-decoration: underline;
}

.submit-btn {
  margin-top: 2px;
  height: 48px;
  border: none;
  border-radius: 12px;
  color: var(--brand-color);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(95deg, var(--brand-color), var(--brand-soft));
  box-shadow: 0 14px 26px rgba(22, 9, 45, 0.32);
}

.submit-btn:hover {
  filter: brightness(1.06);
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.login-error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.88rem;
  font-weight: 700;
}

.footer-text {
  margin: 16px 0 0;
  text-align: center;
  color: #3a2367;
  font-size: 0.92rem;
}

@media (max-width: 520px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    border-radius: 20px;
    padding: 22px 18px;
  }

  .login-header h1 {
    font-size: 1.75rem;
  }
}
</style>
