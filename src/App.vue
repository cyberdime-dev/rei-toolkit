<script setup>
/* global setTimeout, clearTimeout */

// Move all imports to top, group by type
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/Layout/AppHeader.vue'
import AppNavigation from './components/Layout/AppNavigation.vue'
import { authService } from './services/authService.js'
import '@mdi/font/css/materialdesignicons.css'

// Simple debounce function to avoid external dependency
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Authentication state
const isAuthenticated = ref(false)
const currentUser = ref(null)
const isLoading = ref(true)

// Router state
const route = useRoute()

// Check if current route requires auth layout
const isAuthRoute = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

// Persist drawer open/closed preference in localStorage.
const stored = localStorage.getItem('drawer')
const drawer = ref(stored !== null ? stored === 'true' : window.innerWidth >= 960)
const isDesktop = ref(window.innerWidth >= 960)

// Save changes to localStorage
watch(drawer, (val) => {
  try {
    localStorage.setItem('drawer', val ? 'true' : 'false')
  } catch {
    // ignore storage errors (private mode, quotas)
  }
})

// Add debouncing to prevent excessive calls
const handleResize = debounce(() => {
  isDesktop.value = window.innerWidth >= 960
  if (localStorage.getItem('drawer') === null) {
    drawer.value = isDesktop.value
  }
}, 100)

function closeDrawer() {
  if (!isDesktop.value) drawer.value = false
}

function toggleDrawer() {
  drawer.value = !drawer.value
}

function updateDrawer(val) {
  drawer.value = val
}

// Initialize authentication state
async function initAuth() {
  try {
    isLoading.value = true
    
    // Set up auth state listener
    authService.onAuthStateChanged((user) => {
      isAuthenticated.value = !!user
      currentUser.value = user
      isLoading.value = false
    })
  } catch (error) {
    console.error('Failed to initialize authentication:', error)
    isLoading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize, { passive: true })
  initAuth()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <v-app>
    <!-- Loading Screen -->
    <div
      v-if="isLoading"
      class="loading-screen"
    >
      <v-progress-circular
        size="64"
        color="primary"
        indeterminate
      />
      <div class="loading-text mt-4">
        Loading REI Toolkit...
      </div>
    </div>

    <!-- Authentication Routes (Login/Register) -->
    <template v-else-if="isAuthRoute">
      <router-view />
    </template>

    <!-- Main App Layout (Protected Routes) -->
    <template v-else>
      <AppHeader
        :is-desktop="isDesktop"
        :current-user="currentUser"
        :on-toggle-drawer="toggleDrawer"
      />

      <AppNavigation
        :drawer="drawer"
        :is-desktop="isDesktop"
        :current-user="currentUser"
        :on-drawer-update="updateDrawer"
        :on-close-drawer="closeDrawer"
      />

      <!-- Main Content Area -->
      <v-main class="app-main">
        <v-container
          fluid
          class="main-viewport pa-0"
        >
          <div class="content-shell">
            <router-view />
          </div>
        </v-container>
      </v-main>
    </template>
  </v-app>
</template>

<style scoped>
/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-background));
  z-index: 9999;
}

.loading-text {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-background));
  opacity: 0.7;
}

/* iOS-style content shell for main area */
.app-main {
  background: rgb(var(--v-theme-surface));
  min-height: calc(100vh - 64px);
  transition: background-color 0.2s ease;
}

.main-viewport {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.content-shell {
  width: 100%;
  max-width: 1400px;
  margin: 24px auto;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 18px 24px;
}

@media (max-width: 768px) {
  .content-shell {
    margin: 8px;
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-main {
    transition: none;
  }
}
</style>
