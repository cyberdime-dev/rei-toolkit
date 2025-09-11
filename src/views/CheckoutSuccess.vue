/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */
<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        lg="6"
      >
        <v-card
          class="text-center pa-8"
          elevation="4"
        >
          <!-- Success Icon -->
          <v-icon
            size="80"
            color="success"
            class="mb-4"
          >
            mdi-check-circle
          </v-icon>
          
          <!-- Success Message -->
          <h1 class="text-h4 font-weight-bold mb-4">
            Welcome to REI Toolkit Pro!
          </h1>
          
          <p class="text-body-1 text-medium-emphasis mb-6">
            Your subscription has been successfully activated. You now have access to all premium features.
          </p>
          
          <!-- Features Unlocked -->
          <v-card
            variant="outlined"
            class="mb-6"
          >
            <v-card-title class="text-h6">
              What's New for You:
            </v-card-title>
            <v-card-text>
              <v-list class="bg-transparent">
                <v-list-item
                  v-for="feature in unlockedFeatures"
                  :key="feature"
                >
                  <template #prepend>
                    <v-icon
                      size="small"
                      color="success"
                    >
                      mdi-check
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ feature }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
          
          <!-- Next Steps -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">
              Next Steps:
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Start exploring your new premium features, or manage your subscription anytime.
            </p>
          </div>
          
          <!-- Action Buttons -->
          <v-row
            class="mx-0"
            justify="center"
          >
            <v-col
              cols="12"
              sm="auto"
            >
              <v-btn
                color="primary"
                variant="elevated"
                size="large"
                :to="redirectPath"
                class="mb-2"
              >
                <v-icon
                  start
                  size="small"
                >
                  mdi-calculator
                </v-icon>
                Start Calculating
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="auto"
            >
              <v-btn
                variant="outlined"
                size="large"
                class="mb-2"
                :loading="portalLoading"
                @click="openBillingPortal"
              >
                <v-icon
                  start
                  size="small"
                >
                  mdi-credit-card
                </v-icon>
                Manage Billing
              </v-btn>
            </v-col>
          </v-row>
          
          <!-- Support -->
          <v-divider class="my-6" />
          <p class="text-caption text-medium-emphasis">
            Need help? 
            <a
              href="mailto:support@rei-toolkit.com"
              class="text-decoration-none"
            >
              Contact our support team
            </a>
          </p>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Snackbar for messages -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/authService.js'
import { stripeService } from '@/services/stripeService.js'

const route = useRoute()
const router = useRouter()

// Reactive data
const portalLoading = ref(false)
const subscription = ref(null)
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
})

// Unlocked features based on plan
const unlockedFeatures = computed(() => {
  if (!subscription.value) return []
  
  const features = {
    pro: [
      'Unlimited deals & calculations',
      'Cloud sync across devices',
      'Professional branded reports',
      'Advanced analytics dashboard',
      'Priority customer support',
      'Custom property categories',
    ],
    team: [
      'Everything in Pro',
      'Real-time team collaboration',
      'Shared deal pipeline',
      'Role-based permissions',
      'Team analytics & reporting',
      'Client portal access',
      'Bulk import/export',
      'API access',
    ],
  }
  
  return features[subscription.value.plan] || []
})

// Redirect path based on user's previous activity
const redirectPath = computed(() => {
  // Check if there's a return path in query params
  if (route.query.return_url) {
    return route.query.return_url
  }
  
  // Default to deals page for premium users
  return '/deals'
})

// Methods
const loadSubscriptionData = async () => {
  try {
    const sub = await authService.getSubscription()
    subscription.value = sub
    
    // If no subscription found, something went wrong
    if (!sub || sub.plan === 'free') {
      showSnackbar('Unable to verify subscription. Please contact support.', 'warning')
    }
  } catch (error) {
    console.error('Error loading subscription:', error)
    showSnackbar('Error loading subscription data', 'error')
  }
}

const openBillingPortal = async () => {
  try {
    portalLoading.value = true
    await stripeService.redirectToBillingPortal()
  } catch (error) {
    console.error('Error opening billing portal:', error)
    showSnackbar('Unable to open billing portal. Please try again.', 'error')
  } finally {
    portalLoading.value = false
  }
}

const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color,
  }
}

// Lifecycle
onMounted(async () => {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  // Load subscription data
  await loadSubscriptionData()
  
  // Auto-redirect after 10 seconds if user doesn't take action
  window.setTimeout(() => {
    if (route.name === 'CheckoutSuccess') {
      router.push(redirectPath.value)
    }
  }, 10000)
})
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-list-item {
  min-height: 36px;
}
</style>
