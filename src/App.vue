<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from './components/Layout/AppHeader.vue'
import AppNavigation from './components/Layout/AppNavigation.vue'
import '@mdi/font/css/materialdesignicons.css'

// Persist drawer open/closed preference in localStorage.
const stored = localStorage.getItem('drawer')
const drawer = ref(stored !== null ? stored === 'true' : window.innerWidth >= 960)
const isDesktop = ref(window.innerWidth >= 960)

// Save changes to localStorage
import { watch } from 'vue'
watch(drawer, (val) => {
  try {
    localStorage.setItem('drawer', val ? 'true' : 'false')
  } catch {
    // ignore storage errors (private mode, quotas)
  }
})

function handleResize() {
  isDesktop.value = window.innerWidth >= 960
  // If user has not persisted a preference, default to open on desktop and closed on mobile
  if (localStorage.getItem('drawer') === null) {
    drawer.value = isDesktop.value
  }
}

function closeDrawer() {
  if (!isDesktop.value) drawer.value = false
}

function toggleDrawer() {
  drawer.value = !drawer.value
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
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
      :on-drawer-update="(val) => drawer = val"
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
@media (max-width: 600px) {
  .mobile-card {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    max-width: 100vw !important;
    max-height: 100vh !important;
    height: 100vh !important;
    border-radius: 0 !important;
    z-index: 10;
    margin: 0 !important;
    box-sizing: border-box;
    overflow-y: auto;
    padding-top: 80px !important; /* Adjust for app bar height */
  }
}
</style>

<style scoped>
/* iOS-style content shell for main area */
.app-main {
  background: var(--v-theme-surface, #f2f5f8);
  min-height: calc(100vh - 64px); /* account for app bar */
}

.main-viewport {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.content-shell {
  /* content shell with a max width to keep lines readable */
  width: 100%;
  max-width: 1400px;
  margin: 24px auto;
  /* Make shell transparent so inner cards render directly on the app surface */
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 18px 24px;
}

@media (max-width: 768px) {
  .content-shell {
    margin: 8px;
    border-radius: 0;
    padding: 12px;
  }
}
</style>
