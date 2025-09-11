/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */
<template>
  <v-container class="py-8">
    <!-- Hero Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <div class="text-center">
          <h1 class="text-h3 font-weight-bold mb-4">
            Choose Your Plan
          </h1>
          <p class="text-h6 text-medium-emphasis mb-6">
            Start free, upgrade when you need more power
          </p>
          
          <!-- Billing Toggle -->
          <v-chip-group
            v-model="billingPeriod"
            mandatory
            class="mb-8"
          >
            <v-chip
              value="monthly"
              variant="outlined"
            >
              Monthly
            </v-chip>
            <v-chip
              value="annual"
              variant="outlined"
            >
              Annual
              <v-chip
                size="small"
                color="success"
                class="ml-2"
              >
                Save 20%
              </v-chip>
            </v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>
    
    <!-- Pricing Cards -->
    <v-row>
      <!-- Free Plan -->
      <v-col
        cols="12"
        md="4"
      >
        <v-card
          variant="outlined"
          class="h-100 d-flex flex-column"
        >
          <v-card-title class="text-h5 text-center pa-6">
            Free
          </v-card-title>
          
          <v-card-text class="flex-grow-1">
            <div class="text-center mb-6">
              <div class="text-h3 font-weight-bold">
                $0
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Forever free
              </div>
            </div>
            
            <v-list class="bg-transparent">
              <v-list-item
                v-for="feature in freeFeatures"
                :key="feature"
                class="px-0"
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
          
          <v-card-actions class="pa-6">
            <v-btn
              v-if="!isAuthenticated"
              variant="outlined"
              block
              size="large"
              @click="$router.push('/login')"
            >
              Get Started Free
            </v-btn>
            <v-btn
              v-else-if="currentPlan === 'free'"
              variant="outlined"
              block
              size="large"
              disabled
            >
              Current Plan
            </v-btn>
            <v-btn
              v-else
              variant="outlined"
              block
              size="large"
              @click="contactSupport"
            >
              Downgrade
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- Pro Plan -->
      <v-col
        cols="12"
        md="4"
      >
        <v-card
          variant="outlined"
          color="primary"
          class="h-100 d-flex flex-column position-relative"
        >
          <!-- Popular Badge -->
          <v-chip
            color="primary"
            variant="elevated"
            class="position-absolute"
            style="top: -12px; left: 50%; transform: translateX(-50%); z-index: 1;"
          >
            Most Popular
          </v-chip>
          
          <v-card-title class="text-h5 text-center pa-6 pt-8">
            Pro
          </v-card-title>
          
          <v-card-text class="flex-grow-1">
            <div class="text-center mb-6">
              <div class="text-h3 font-weight-bold">
                ${{ billingPeriod === 'annual' ? '15' : '19' }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                per month{{ billingPeriod === 'annual' ? ', billed annually' : '' }}
              </div>
              <div
                v-if="billingPeriod === 'annual'"
                class="text-caption text-success"
              >
                Save $48/year
              </div>
            </div>
            
            <v-list class="bg-transparent">
              <v-list-item
                v-for="feature in proFeatures"
                :key="feature"
                class="px-0"
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
          
          <v-card-actions class="pa-6">
            <v-btn
              v-if="!isAuthenticated"
              color="primary"
              variant="elevated"
              block
              size="large"
              @click="$router.push('/login')"
            >
              Start Pro Trial
            </v-btn>
            <v-btn
              v-else-if="currentPlan === 'pro'"
              color="primary"
              variant="elevated"
              block
              size="large"
              disabled
            >
              Current Plan
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="elevated"
              block
              size="large"
              :loading="checkoutLoading.pro"
              @click="selectPlan('pro')"
            >
              {{ currentPlan === 'free' ? 'Upgrade to Pro' : 'Switch to Pro' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- Team Plan -->
      <v-col
        cols="12"
        md="4"
      >
        <v-card
          variant="outlined"
          class="h-100 d-flex flex-column"
        >
          <v-card-title class="text-h5 text-center pa-6">
            Team
          </v-card-title>
          
          <v-card-text class="flex-grow-1">
            <div class="text-center mb-6">
              <div class="text-h3 font-weight-bold">
                ${{ billingPeriod === 'annual' ? '39' : '49' }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                per month{{ billingPeriod === 'annual' ? ', billed annually' : '' }}
              </div>
              <div
                v-if="billingPeriod === 'annual'"
                class="text-caption text-success"
              >
                Save $120/year
              </div>
            </div>
            
            <v-list class="bg-transparent">
              <v-list-item
                v-for="feature in teamFeatures"
                :key="feature"
                class="px-0"
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
          
          <v-card-actions class="pa-6">
            <v-btn
              v-if="!isAuthenticated"
              variant="outlined"
              block
              size="large"
              @click="$router.push('/login')"
            >
              Start Team Trial
            </v-btn>
            <v-btn
              v-else-if="currentPlan === 'team'"
              variant="outlined"
              block
              size="large"
              disabled
            >
              Current Plan
            </v-btn>
            <v-btn
              v-else
              variant="outlined"
              block
              size="large"
              :loading="checkoutLoading.team"
              @click="selectPlan('team')"
            >
              {{ currentPlan === 'free' ? 'Upgrade to Team' : 'Switch to Team' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- FAQ Section -->
    <v-row class="mt-12">
      <v-col cols="12">
        <h2 class="text-h4 text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <v-expansion-panels>
          <v-expansion-panel
            v-for="faq in faqs"
            :key="faq.question"
          >
            <v-expansion-panel-title>
              {{ faq.question }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ faq.answer }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
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
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService.js'
import { stripeService } from '@/services/stripeService.js'

const router = useRouter()

// Reactive data
const billingPeriod = ref('monthly')
const checkoutLoading = ref({
  pro: false,
  team: false,
})
const currentPlan = ref('free')
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
})

// Plan features
const freeFeatures = [
  'All real estate calculators',
  'Local data storage',
  'Up to 10 deals',
  'PDF exports',
  'Dark/light theme',
  'Mobile responsive',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited deals & calculations',
  'Cloud sync across devices',
  'Professional branded reports',
  'Advanced analytics dashboard',
  'Priority customer support',
  'Custom property categories',
]

const teamFeatures = [
  'Everything in Pro',
  'Real-time team collaboration',
  'Shared deal pipeline',
  'Role-based permissions',
  'Team analytics & reporting',
  'Client portal access',
  'Bulk import/export',
  'API access',
]

// FAQ data
const faqs = [
  {
    question: 'Can I cancel my subscription at any time?',
    answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to premium features until the end of your current billing period.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains safe! You can export all your deals and calculations before canceling. Free users keep access to local storage features.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee for all new subscriptions. If you\'re not satisfied, contact support for a full refund.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We use Stripe for secure payment processing and never store your payment information on our servers.',
  },
  {
    question: 'Do you offer team discounts?',
    answer: 'Yes! Contact our sales team for custom pricing on teams with 10+ users.',
  },
]

// Computed properties
const isAuthenticated = computed(() => {
  return authService.isAuthenticated()
})

// Methods
const loadCurrentPlan = async () => {
  try {
    if (isAuthenticated.value) {
      const subscription = await authService.getSubscription()
      currentPlan.value = subscription.plan || 'free'
    }
  } catch (error) {
    console.error('Error loading current plan:', error)
  }
}

const selectPlan = async (plan) => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  
  try {
    checkoutLoading.value[plan] = true
    await stripeService.redirectToCheckout(plan)
  } catch (error) {
    console.error('Checkout error:', error)
    showSnackbar(error.message || 'Failed to start checkout', 'error')
  } finally {
    checkoutLoading.value[plan] = false
  }
}

const contactSupport = () => {
  // TODO: Implement support contact functionality
  showSnackbar('Please contact support to downgrade your plan', 'info')
}

const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color,
  }
}

// Lifecycle
onMounted(() => {
  loadCurrentPlan()
})
</script>

<style scoped>
.position-absolute {
  position: absolute !important;
}

.position-relative {
  position: relative !important;
}
</style>
