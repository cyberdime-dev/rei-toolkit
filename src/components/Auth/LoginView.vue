<template>
  <v-container
    fluid
    class="auth-container"
  >
    <v-row
      justify="center"
      align="center"
      style="min-height: 100vh;"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
        lg="4"
        xl="3"
      >
        <v-card
          class="auth-card"
          elevation="8"
        >
          <!-- Header -->
          <v-card-title class="text-center py-6">
            <div class="d-flex flex-column align-center">
              <v-icon
                size="48"
                color="primary"
                class="mb-3"
              >
                mdi-calculator
              </v-icon>
              <h2 class="text-h4 font-weight-bold">
                REI Toolkit
              </h2>
              <p class="text-subtitle-1 text-medium-emphasis mt-2">
                Sign in to your account
              </p>
            </div>
          </v-card-title>

          <!-- Alert Messages -->
          <v-alert
            v-if="errorMessage"
            type="error"
            class="mx-4 mb-4"
            :text="errorMessage"
            closable
            @click:close="clearError"
          />

          <v-alert
            v-if="successMessage"
            type="success"
            class="mx-4 mb-4"
            :text="successMessage"
            closable
            @click:close="clearSuccess"
          />

          <!-- Login Form -->
          <v-card-text class="px-6 pb-6">
            <v-form
              ref="loginForm"
              v-model="formValid"
              @submit.prevent="handleEmailLogin"
            >
              <!-- Email Field -->
              <v-text-field
                v-model="email"
                label="Email Address"
                type="email"
                prepend-inner-icon="mdi-email"
                :rules="emailRules"
                :disabled="loading"
                variant="outlined"
                class="mb-3"
                required
              />

              <!-- Password Field -->
              <v-text-field
                v-model="password"
                :label="showPassword ? 'Password (visible)' : 'Password'"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="passwordRules"
                :disabled="loading"
                variant="outlined"
                class="mb-3"
                required
                @click:append-inner="showPassword = !showPassword"
                @keydown.enter="handleEmailLogin"
              />

              <!-- Sign In Button -->
              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="loading"
                :disabled="!formValid"
                block
                class="mb-4"
              >
                <v-icon start>
                  mdi-login
                </v-icon>
                Sign In
              </v-btn>
            </v-form>

            <!-- Divider -->
            <div class="d-flex align-center my-4">
              <v-divider class="flex-grow-1" />
              <span class="px-3 text-body-2 text-medium-emphasis">or continue with</span>
              <v-divider class="flex-grow-1" />
            </div>

            <!-- Social Login Buttons -->
            <div class="d-flex flex-column gap-2 mb-4">
              <!-- Google Sign In -->
              <v-btn
                color="surface-variant"
                size="large"
                :loading="googleLoading"
                :disabled="loading"
                block
                @click="handleGoogleLogin"
              >
                <v-icon
                  start
                  color="error"
                >
                  mdi-google
                </v-icon>
                Continue with Google
              </v-btn>

              <!-- GitHub Sign In -->
              <v-btn
                color="surface-variant"
                size="large"
                :loading="githubLoading"
                :disabled="loading"
                block
                @click="handleGitHubLogin"
              >
                <v-icon start>
                  mdi-github
                </v-icon>
                Continue with GitHub
              </v-btn>
            </div>

            <!-- Action Links -->
            <div class="text-center">
              <v-btn
                variant="text"
                size="small"
                color="primary"
                :disabled="loading"
                class="mb-2"
                @click="showForgotPassword = true"
              >
                Forgot your password?
              </v-btn>
              
              <div class="text-body-2 text-medium-emphasis">
                Don't have an account?
                <router-link
                  to="/auth/register"
                  class="text-primary text-decoration-none"
                >
                  Sign up here
                </router-link>
              </div>
              
              <div class="mt-3">
                <v-btn
                  variant="outlined"
                  size="small"
                  color="secondary"
                  :disabled="loading"
                  @click="handleTrialMode"
                >
                  <v-icon
                    start
                    size="small"
                  >
                    mdi-timer-sand
                  </v-icon>
                  Try for free (30 days)
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Forgot Password Dialog -->
    <v-dialog
      v-model="showForgotPassword"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-h6">
          Reset Password
        </v-card-title>
        
        <v-card-text>
          <p class="text-body-2 mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <v-text-field
            v-model="resetEmail"
            label="Email Address"
            type="email"
            prepend-inner-icon="mdi-email"
            :rules="emailRules"
            variant="outlined"
            :disabled="resetLoading"
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="resetLoading"
            @click="showForgotPassword = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="resetLoading"
            :disabled="!resetEmail || !isValidEmail(resetEmail)"
            @click="handlePasswordReset"
          >
            Send Reset Link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/* global setTimeout, URLSearchParams */

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService.js'
import { authGuard } from '../../services/authGuard.js'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    
    // Form state
    const loginForm = ref(null)
    const formValid = ref(false)
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const resetEmail = ref('')
    
    // Loading states
    const loading = ref(false)
    const googleLoading = ref(false)
    const githubLoading = ref(false)
    const resetLoading = ref(false)
    
    // UI state
    const showForgotPassword = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')
    
    // Validation rules
    const emailRules = [
      v => !!v || 'Email is required',
      v => isValidEmail(v) || 'Please enter a valid email address',
    ]
    
    const passwordRules = [
      v => !!v || 'Password is required',
      v => v.length >= 6 || 'Password must be at least 6 characters',
    ]
    
    // Helper functions
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
    
    const clearError = () => {
      errorMessage.value = ''
    }
    
    const clearSuccess = () => {
      successMessage.value = ''
    }
    
    const showError = (message) => {
      errorMessage.value = message
      successMessage.value = ''
    }
    
    const showSuccess = (message) => {
      successMessage.value = message
      errorMessage.value = ''
    }
    
    const redirectAfterLogin = () => {
      const redirectPath = authGuard.handlePostLoginRedirect()
      router.push(redirectPath)
    }
    
    // Authentication handlers
    const handleEmailLogin = async () => {
      if (!formValid.value) return
      
      loading.value = true
      clearError()
      
      try {
        const result = await authService.signInWithEmail(email.value, password.value)
        
        if (result.success) {
          showSuccess(result.message)
          
          // Small delay to show success message
          setTimeout(() => {
            redirectAfterLogin()
          }, 1000)
        } else {
          showError(result.error)
        }
      } catch (error) {
        showError('An unexpected error occurred. Please try again.')
        console.error('Login error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handleGoogleLogin = async () => {
      googleLoading.value = true
      clearError()
      
      try {
        const result = await authService.signInWithGoogle()
        
        if (result.success) {
          showSuccess(result.message)
          
          setTimeout(() => {
            redirectAfterLogin()
          }, 1000)
        } else {
          showError(result.error)
        }
      } catch (error) {
        showError('Google sign-in failed. Please try again.')
        console.error('Google login error:', error)
      } finally {
        googleLoading.value = false
      }
    }
    
    const handleGitHubLogin = async () => {
      githubLoading.value = true
      clearError()
      
      try {
        const result = await authService.signInWithGitHub()
        
        if (result.success) {
          showSuccess(result.message)
          
          setTimeout(() => {
            redirectAfterLogin()
          }, 1000)
        } else {
          showError(result.error)
        }
      } catch (error) {
        showError('GitHub sign-in failed. Please try again.')
        console.error('GitHub login error:', error)
      } finally {
        githubLoading.value = false
      }
    }
    
    const handleTrialMode = async () => {
      loading.value = true
      clearError()
      
      try {
        const result = await authService.signInAnonymously()
        
        if (result.success) {
          showSuccess(result.message)
          
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          showError(result.error)
        }
      } catch (error) {
        showError('Failed to start trial. Please try again.')
        console.error('Trial mode error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handlePasswordReset = async () => {
      if (!resetEmail.value || !isValidEmail(resetEmail.value)) return
      
      resetLoading.value = true
      
      try {
        const result = await authService.sendPasswordReset(resetEmail.value)
        
        if (result.success) {
          showSuccess(result.message)
          showForgotPassword.value = false
          resetEmail.value = ''
        } else {
          showError(result.error)
        }
      } catch (error) {
        showError('Failed to send reset email. Please try again.')
        console.error('Password reset error:', error)
      } finally {
        resetLoading.value = false
      }
    }
    
    // Check if user is already authenticated
    onMounted(() => {
      if (authService.isAuthenticated()) {
        router.push('/')
      }
      
      // Check for success message from registration
      const urlParams = new URLSearchParams(window.location.search)
      const message = urlParams.get('message')
      if (message) {
        showSuccess(decodeURIComponent(message))
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    })
    
    return {
      // Form refs
      loginForm,
      formValid,
      email,
      password,
      showPassword,
      resetEmail,
      
      // Loading states
      loading,
      googleLoading,
      githubLoading,
      resetLoading,
      
      // UI state
      showForgotPassword,
      errorMessage,
      successMessage,
      
      // Validation
      emailRules,
      passwordRules,
      isValidEmail,
      
      // Event handlers
      handleEmailLogin,
      handleGoogleLogin,
      handleGitHubLogin,
      handleTrialMode,
      handlePasswordReset,
      clearError,
      clearSuccess,
    }
  },
}
</script>

<style scoped>
.auth-container {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  min-height: 100vh;
}

.auth-card {
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
}

.gap-2 > * + * {
  margin-top: 8px;
}
</style>
