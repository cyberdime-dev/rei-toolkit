<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from './components/Layout/AppHeader.vue'
import AppNavigation from './components/Layout/AppNavigation.vue'
import ThemeToggle from './components/Layout/ThemeToggle.vue'
import '@mdi/font/css/materialdesignicons.css'

const drawer = ref(false)
const isDesktop = ref(window.innerWidth >= 960)

function handleResize() {
  isDesktop.value = window.innerWidth >= 960
  if (isDesktop.value) drawer.value = true
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
    <v-main class="pa-4">
      <router-view />
    </v-main>

    <!-- Theme Toggle in Footer -->
    <v-footer app>
      <v-row justify="center">
        <ThemeToggle />
      </v-row>
    </v-footer>
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
