<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
        lg="4"
        xl="3"
      >
        <v-card elevation="8">
          <v-card-title class="text-h4 text-center py-6">
            Join REI Toolkit
          </v-card-title>
          
          <v-card-text>
            <!-- Social Registration Options -->
            <div class="mb-6">
              <v-btn
                :loading="loading.google"
                :disabled="loading.social"
                block
                large
                outlined
                class="mb-3"
                color="red"
                @click="registerWithGoogle"
              >
                <v-icon left>
                  mdi-google
                </v-icon>
                Sign up with Google
              </v-btn>
              
              <v-btn
                :loading="loading.github"
                :disabled="loading.social"
                block
                large
                outlined
                color="grey darken-3"
                @click="registerWithGitHub"
              >
                <v-icon left>
                  mdi-github
                </v-icon>
                Sign up with GitHub
              </v-btn>
            </div>
            
            <v-divider class="mb-6">
              <span class="px-3 text-caption text--secondary">OR</span>
            </v-divider>
            
            <!-- Email Registration Form -->
            <v-form
              ref="registerForm"
              v-model="formValid"
              @submit.prevent="registerWithEmail"
            >
              <v-text-field
                v-model="registrationData.email"
                label="Email"
                type="email"
                outlined
                :rules="emailRules"
                required
                prepend-inner-icon="mdi-email"
                class="mb-3"
              />
              
              <v-text-field
                v-model="registrationData.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                outlined
                :rules="passwordRules"
                required
                prepend-inner-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                class="mb-3"
                @click:append="showPassword = !showPassword"
              />
              
              <v-text-field
                v-model="registrationData.confirmPassword"
                label="Confirm Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                outlined
                :rules="confirmPasswordRules"
                required
                prepend-inner-icon="mdi-lock-check"
                :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                class="mb-3"
                @click:append="showConfirmPassword = !showConfirmPassword"
              />
              
              <v-text-field
                v-model="registrationData.displayName"
                label="Display Name (Optional)"
                outlined
                prepend-inner-icon="mdi-account"
                class="mb-3"
              />
              
              <!-- Terms and Privacy -->
              <v-checkbox
                v-model="acceptedTerms"
                :rules="termsRules"
                required
                color="primary"
                class="mb-3"
              >
                <template #label>
                  <div class="text-caption">
                    I agree to the 
                    <a
                      href="/terms"
                      target="_blank"
                      @click.stop
                    >Terms of Service</a>
                    and 
                    <a
                      href="/privacy"
                      target="_blank"
                      @click.stop
                    >Privacy Policy</a>
                  </div>
                </template>
              </v-checkbox>
              
              <v-btn
                block
                large
                color="primary"
                type="submit"
                :loading="loading.email"
                :disabled="!formValid || !acceptedTerms"
                class="mb-3"
              >
                Create Account
              </v-btn>
            </v-form>
            
            <!-- Navigation Links -->
            <div class="text-center mt-4">
              <div class="text-body-2 mb-2">
                Already have an account?
                <router-link
                  to="/login"
                  class="text-primary text-decoration-none"
                >
                  Sign in here
                </router-link>
              </div>
              
              <div class="text-caption text--secondary">
                Want to try first?
                <a
                  href="#"
                  class="text-primary text-decoration-none"
                  @click.prevent="startTrial"
                >
                  Skip to free version
                </a>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.message }}
      <template #action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    
    <!-- Email Verification Dialog -->
    <v-dialog
      v-model="emailVerificationDialog"
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5">
          Verify Your Email
        </v-card-title>
        
        <v-card-text>
          <v-icon
            large
            color="primary"
            class="mb-4"
          >
            mdi-email-check
          </v-icon>
          
          <p class="text-body-1 mb-4">
            We've sent a verification email to <strong>{{ registrationData.email }}</strong>.
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <v-alert
            type="info"
            outlined
            class="mb-4"
          >
            <div class="text-body-2">
              <strong>Didn't receive the email?</strong>
              <br />
              • Check your spam/junk folder
              <br />
              • Make sure {{ registrationData.email }} is correct
              <br />
              • Wait a few minutes and try resending
            </div>
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            :loading="loading.resend"
            text
            @click="resendVerificationEmail"
          >
            Resend Email
          </v-btn>
          <v-btn
            color="primary"
            @click="goToLogin"
          >
            Continue to Login
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService.js'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const registerForm = ref(null)
    
    // Form data
    const registrationData = reactive({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    })
    
    // UI state
    const formValid = ref(false)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const acceptedTerms = ref(false)
    const emailVerificationDialog = ref(false)
    
    // Loading states
    const loading = reactive({
      email: false,
      google: false,
      github: false,
      social: false,
      resend: false,
    })
    
    // Snackbar
    const snackbar = reactive({
      show: false,
      message: '',
      color: 'success',
      timeout: 5000,
    })
    
    // Validation rules
    const emailRules = [
      v => !!v || 'Email is required',
      v => /.+@.+\..+/.test(v) || 'Email must be valid',
    ]
    
    const passwordRules = [
      v => !!v || 'Password is required',
      v => v.length >= 8 || 'Password must be at least 8 characters',
      v => /(?=.*[a-z])/.test(v) || 'Password must contain a lowercase letter',
      v => /(?=.*[A-Z])/.test(v) || 'Password must contain an uppercase letter',
      v => /(?=.*\d)/.test(v) || 'Password must contain a number',
    ]
    
    const confirmPasswordRules = [
      v => !!v || 'Please confirm your password',
      v => v === registrationData.password || 'Passwords do not match',
    ]
    
    const termsRules = [
      v => !!v || 'You must accept the terms and conditions',
    ]
    
    // Methods
    const showSnackbar = (message, color = 'success') => {
      snackbar.message = message
      snackbar.color = color
      snackbar.show = true
    }
    
    const registerWithEmail = async () => {
      if (!registerForm.value.validate()) return
      
      loading.email = true
      try {
        const result = await authService.registerWithEmail(
          registrationData.email,
          registrationData.password,
          {
            displayName: registrationData.displayName || null,
            sendEmailVerification: true,
          },
        )
        
        if (result.success) {
          emailVerificationDialog.value = true
          showSnackbar('Account created successfully! Please verify your email.')
        } else {
          showSnackbar(result.error, 'error')
        }
      } catch (error) {
        showSnackbar('Registration failed. Please try again.', 'error')
        console.error('Registration error:', error)
      }
      loading.email = false
    }
    
    const registerWithGoogle = async () => {
      loading.google = true
      loading.social = true
      try {
        const result = await authService.signInWithGoogle()
        
        if (result.success) {
          showSnackbar('Successfully registered with Google!')
          router.push(result.redirectTo || '/dashboard')
        } else {
          showSnackbar(result.error, 'error')
        }
      } catch (error) {
        showSnackbar('Google registration failed. Please try again.', 'error')
        console.error('Google registration error:', error)
      }
      loading.google = false
      loading.social = false
    }
    
    const registerWithGitHub = async () => {
      loading.github = true
      loading.social = true
      try {
        const result = await authService.signInWithGitHub()
        
        if (result.success) {
          showSnackbar('Successfully registered with GitHub!')
          router.push(result.redirectTo || '/dashboard')
        } else {
          showSnackbar(result.error, 'error')
        }
      } catch (error) {
        showSnackbar('GitHub registration failed. Please try again.', 'error')
        console.error('GitHub registration error:', error)
      }
      loading.github = false
      loading.social = false
    }
    
    const startTrial = async () => {
      try {
        const result = await authService.startTrialMode()
        
        if (result.success) {
          showSnackbar('Trial mode started! Explore the app with limited features.')
          router.push('/dashboard')
        } else {
          showSnackbar(result.error, 'error')
        }
      } catch (error) {
        showSnackbar('Failed to start trial. Please try again.', 'error')
        console.error('Trial start error:', error)
      }
    }
    
    const resendVerificationEmail = async () => {
      loading.resend = true
      try {
        const result = await authService.sendEmailVerification()
        
        if (result.success) {
          showSnackbar('Verification email sent!')
        } else {
          showSnackbar(result.error, 'error')
        }
      } catch (error) {
        showSnackbar('Failed to resend email. Please try again.', 'error')
        console.error('Resend verification error:', error)
      }
      loading.resend = false
    }
    
    const goToLogin = () => {
      emailVerificationDialog.value = false
      router.push('/login')
    }
    
    return {
      // Refs
      registerForm,
      
      // Reactive data
      registrationData,
      formValid,
      showPassword,
      showConfirmPassword,
      acceptedTerms,
      emailVerificationDialog,
      loading,
      snackbar,
      
      // Rules
      emailRules,
      passwordRules,
      confirmPasswordRules,
      termsRules,
      
      // Methods
      registerWithEmail,
      registerWithGoogle,
      registerWithGitHub,
      startTrial,
      resendVerificationEmail,
      goToLogin,
    }
  },
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

.v-text-field {
  border-radius: 8px;
}

.text-primary {
  color: #1976D2 !important;
}

.text-primary:hover {
  color: #1565C0 !important;
}

a {
  transition: color 0.2s ease;
}

.v-divider span {
  background-color: white;
  color: rgba(0, 0, 0, 0.54);
}

.v-icon.large {
  font-size: 48px !important;
  display: block;
  margin: 0 auto;
}
</style>
