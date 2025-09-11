<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5 d-flex align-center">
            <v-icon left>
              mdi-credit-card-outline
            </v-icon>
            Billing & Subscription
          </v-card-title>
          
          <v-card-text>
            <!-- Current Subscription Status -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-card 
                  variant="outlined" 
                  :color="subscriptionColor"
                  class="mb-4"
                >
                  <v-card-title class="text-h6">
                    Current Plan
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-chip 
                        :color="subscriptionColor"
                        variant="elevated"
                        class="mr-2"
                      >
                        {{ currentPlan }}
                      </v-chip>
                      <span class="text-body-1">
                        {{ subscriptionStatus }}
                      </span>
                    </div>
                    
                    <div
                      v-if="subscription.currentPeriodEnd"
                      class="text-body-2 text-medium-emphasis"
                    >
                      {{ subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews' }} on 
                      {{ formatDate(subscription.currentPeriodEnd) }}
                    </div>
                    
                    <div
                      v-if="subscription.status === 'none'"
                      class="text-body-2 text-medium-emphasis"
                    >
                      You're currently using the free version with local storage.
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  variant="outlined"
                  class="mb-4"
                >
                  <v-card-title class="text-h6">
                    Usage Overview
                  </v-card-title>
                  <v-card-text>
                    <div class="mb-2">
                      <div class="d-flex justify-space-between">
                        <span>Deals Created:</span>
                        <span>{{ usage.dealsCount || 0 }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span>Calculations:</span>
                        <span>{{ usage.calculationsCount || 0 }}</span>
                      </div>
                    </div>
                    
                    <!-- Free tier limits -->
                    <div
                      v-if="!isPremium"
                      class="mt-3"
                    >
                      <v-divider class="mb-2" />
                      <div class="text-caption text-medium-emphasis">
                        Free Tier Limits
                      </div>
                      <v-progress-linear
                        :model-value="(usage.dealsCount / 10) * 100"
                        color="primary"
                        height="8"
                        class="mb-1"
                      />
                      <div class="text-caption">
                        {{ usage.dealsCount }}/10 deals
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- Action Buttons -->
            <v-row>
              <v-col cols="12">
                <div class="d-flex flex-wrap gap-3">
                  <!-- Upgrade Button (Free Users) -->
                  <v-btn
                    v-if="!isPremium"
                    color="primary"
                    variant="elevated"
                    prepend-icon="mdi-arrow-up-bold"
                    :loading="loading"
                    @click="showUpgradeDialog = true"
                  >
                    Upgrade to Premium
                  </v-btn>
                  
                  <!-- Customer Portal Button (Premium Users) -->
                  <v-btn
                    v-if="isPremium"
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-cog-outline"
                    :loading="loading"
                    @click="openCustomerPortal"
                  >
                    Manage Subscription
                  </v-btn>
                  
                  <!-- View Plans Button -->
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-eye-outline"
                    @click="showPlansDialog = true"
                  >
                    View All Plans
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Upgrade Dialog -->
    <v-dialog
      v-model="showUpgradeDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title class="text-h5">
          Choose Your Plan
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <!-- Pro Plan -->
            <v-col
              cols="12"
              md="6"
            >
              <v-card 
                variant="outlined"
                :class="{ 'border-primary': selectedPlan === 'pro' }"
                style="cursor: pointer"
                @click="selectedPlan = 'pro'"
              >
                <v-card-title class="text-h6">
                  Pro Plan
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 font-weight-bold mb-2">
                    $19<span class="text-body-1">/month</span>
                  </div>
                  <v-list dense>
                    <v-list-item
                      v-for="feature in plans.PRO.features"
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
              </v-card>
            </v-col>
            
            <!-- Team Plan -->
            <v-col
              cols="12"
              md="6"
            >
              <v-card 
                variant="outlined"
                :class="{ 'border-primary': selectedPlan === 'team' }"
                style="cursor: pointer"
                @click="selectedPlan = 'team'"
              >
                <v-card-title class="text-h6">
                  Team Plan
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 font-weight-bold mb-2">
                    $49<span class="text-body-1">/month</span>
                  </div>
                  <v-list dense>
                    <v-list-item
                      v-for="feature in plans.TEAM.features"
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
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showUpgradeDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="checkoutLoading"
            :disabled="!selectedPlan"
            @click="proceedToCheckout"
          >
            Subscribe Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Plans Info Dialog -->
    <v-dialog
      v-model="showPlansDialog"
      max-width="800"
    >
      <v-card>
        <v-card-title class="text-h5">
          REI Toolkit Plans
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <!-- Free Plan -->
            <v-col
              cols="12"
              md="4"
            >
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  Free
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 font-weight-bold mb-2">
                    $0<span class="text-body-1">/month</span>
                  </div>
                  <v-list dense>
                    <v-list-item class="px-0">
                      <template #prepend>
                        <v-icon
                          size="small"
                          color="success"
                        >
                          mdi-check
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">
                        All calculators
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item class="px-0">
                      <template #prepend>
                        <v-icon
                          size="small"
                          color="success"
                        >
                          mdi-check
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">
                        Local storage (up to 10 deals)
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item class="px-0">
                      <template #prepend>
                        <v-icon
                          size="small"
                          color="success"
                        >
                          mdi-check
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">
                        PDF exports
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
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
              >
                <v-card-title class="text-h6">
                  Pro
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 font-weight-bold mb-2">
                    $19<span class="text-body-1">/month</span>
                  </div>
                  <v-list dense>
                    <v-list-item
                      v-for="feature in plans.PRO.features"
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
              </v-card>
            </v-col>
            
            <!-- Team Plan -->
            <v-col
              cols="12"
              md="4"
            >
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  Team
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 font-weight-bold mb-2">
                    $49<span class="text-body-1">/month</span>
                  </div>
                  <v-list dense>
                    <v-list-item
                      v-for="feature in plans.TEAM.features"
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
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showPlansDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
import { authService } from '@/services/authService.js'
import { stripeService } from '@/services/stripeService.js'

// Reactive data
const loading = ref(false)
const checkoutLoading = ref(false)
const subscription = ref({})
const usage = ref({})
const showUpgradeDialog = ref(false)
const showPlansDialog = ref(false)
const selectedPlan = ref('')
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
})

// Get plans from Stripe service
const plans = stripeService.getPlans()

// Computed properties
const currentPlan = computed(() => {
  const plan = subscription.value?.plan || 'free'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
})

const subscriptionStatus = computed(() => {
  const status = subscription.value?.status || 'none'
  switch (status) {
    case 'active':
      return 'Active'
    case 'past_due':
      return 'Past Due'
    case 'canceled':
      return 'Canceled'
    case 'unpaid':
      return 'Unpaid'
    default:
      return 'Free Plan'
  }
})

const subscriptionColor = computed(() => {
  const status = subscription.value?.status || 'none'
  switch (status) {
    case 'active':
      return 'success'
    case 'past_due':
      return 'warning'
    case 'canceled':
    case 'unpaid':
      return 'error'
    default:
      return 'primary'
  }
})

const isPremium = computed(() => {
  return authService.isPremiumUser()
})

// Methods
const loadSubscriptionData = async () => {
  try {
    loading.value = true
    
    // Get subscription from auth service
    subscription.value = await authService.getSubscription()
    
    // Get usage data from user profile
    const userProfile = authService.getUserProfile()
    usage.value = userProfile?.usage || {}
    
  } catch (error) {
    console.error('Error loading subscription data:', error)
    showSnackbar('Failed to load subscription data', 'error')
  } finally {
    loading.value = false
  }
}

const proceedToCheckout = async () => {
  if (!selectedPlan.value) return
  
  try {
    checkoutLoading.value = true
    await stripeService.redirectToCheckout(selectedPlan.value)
  } catch (error) {
    console.error('Checkout error:', error)
    showSnackbar(error.message || 'Failed to start checkout', 'error')
  } finally {
    checkoutLoading.value = false
  }
}

const openCustomerPortal = async () => {
  try {
    loading.value = true
    await stripeService.redirectToPortal()
  } catch (error) {
    console.error('Portal error:', error)
    showSnackbar(error.message || 'Failed to open billing portal', 'error')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
  loadSubscriptionData()
})
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
