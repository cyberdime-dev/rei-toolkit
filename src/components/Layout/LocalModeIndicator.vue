<template>
  <v-chip
    v-if="showLocalModeIndicator"
    color="amber-lighten-2"
    variant="tonal"
    size="x-small"
    prepend-icon="mdi-content-save-outline"
    class="local-mode-indicator"
  >
    Local Mode
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { authService } from '@/services/authService'

// Get current user and subscription info
const currentUser = computed(() => authService.currentUser)
const userProfile = computed(() => authService.userProfile)
const subscription = computed(() => userProfile.value?.subscription)

// Check if user is in local mode (free tier without cloud sync)
const isLocalMode = computed(() => {
  // Show local mode for:
  // 1. Anonymous users
  // 2. Free tier users without active subscription
  if (!currentUser.value || currentUser.value.isAnonymous) {
    return true
  }
  
  const plan = subscription.value?.plan || 'free'
  const status = subscription.value?.status
  
  return plan === 'free' || status !== 'active'
})

const showLocalModeIndicator = computed(() => isLocalMode.value)
</script>

<style scoped>
.local-mode-indicator {
  font-size: 10px;
  height: 20px;
  opacity: 0.8;
}

.local-mode-indicator .v-chip__prepend {
  margin-inline-end: 2px;
}

.local-mode-indicator .v-chip__prepend .v-icon {
  font-size: 12px;
}
</style>
