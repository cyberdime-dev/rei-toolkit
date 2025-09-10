<script setup>
// Move all imports to top, group by type
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppHeader from './components/Layout/AppHeader.vue'
import AppNavigation from './components/Layout/AppNavigation.vue'
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

onMounted(() => {
  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <v-app>
    <AppHeader
      :is-desktop="isDesktop"
      :on-toggle-drawer="toggleDrawer"
    />

    <AppNavigation
      :drawer="drawer"
      :is-desktop="isDesktop"
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
  </v-app>
</template>

<style scoped>
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
