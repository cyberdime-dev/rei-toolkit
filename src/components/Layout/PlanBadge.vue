<template>
  <v-chip
    v-if="showBadge"
    :color="badgeColor"
    :variant="badgeVariant"
    :size="size"
    :prepend-icon="badgeIcon"
    class="plan-badge"
    @click="handleBadgeClick"
  >
    {{ badgeText }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'

const props = defineProps({
  size: {
    type: String,
    default: 'small',
  },
  showForFree: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()

// Get current user and subscription info
const currentUser = computed(() => authService.currentUser)
const userProfile = computed(() => authService.userProfile)
const subscription = computed(() => userProfile.value?.subscription)

// Determine if user is authenticated
const isAuthenticated = computed(() => !!currentUser.value && !currentUser.value.isAnonymous)

// Plan information
const currentPlan = computed(() => {
  if (!isAuthenticated.value) return 'free'
  return subscription.value?.plan || 'free'
})

const isActiveSubscription = computed(() => {
  return subscription.value?.status === 'active' && ['pro', 'team'].includes(currentPlan.value)
})

// Badge display logic
const showBadge = computed(() => {
  // Always show for premium users
  if (isActiveSubscription.value) return true
  
  // Show for free users only if showForFree prop is true
  return props.showForFree
})

// Badge styling and content
const badgeConfig = computed(() => {
  const plan = currentPlan.value.toLowerCase()
  
  const configs = {
    free: {
      text: 'Free',
      color: 'grey-lighten-1',
      variant: 'outlined',
      icon: 'mdi-account-outline',
    },
    pro: {
      text: 'Pro',
      color: 'primary',
      variant: 'flat',
      icon: 'mdi-star',
    },
    team: {
      text: 'Team',
      color: 'success',
      variant: 'flat',
      icon: 'mdi-account-group',
    },
  }
  
  return configs[plan] || configs.free
})

const badgeText = computed(() => badgeConfig.value.text)
const badgeColor = computed(() => badgeConfig.value.color)
const badgeVariant = computed(() => badgeConfig.value.variant)
const badgeIcon = computed(() => badgeConfig.value.icon)

// Handle badge click
const handleBadgeClick = () => {
  if (!props.clickable) return
  
  // Free users go to pricing page
  if (currentPlan.value === 'free') {
    router.push('/pricing')
  } else {
    // Premium users go to billing/account management
    router.push('/settings?tab=billing')
  }
}
</script>

<style scoped>
.plan-badge {
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.plan-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.plan-badge .v-chip__prepend {
  margin-inline-end: 4px;
}
</style>
