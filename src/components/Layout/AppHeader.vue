<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SyncStatusIndicator from './SyncStatusIndicator.vue'

defineProps({
  isDesktop: {
    type: Boolean,
    required: true,
  },
  onToggleDrawer: {
    type: Function,
    required: true,
  },
})

// Dynamic page title based on route
const route = useRoute()
const routeTitles = {
  '/calculator/standard': 'Calculator',
  '/calculator/mortgage': 'Mortgage',
  '/calculator/fix-flip': 'Fix & Flip',
  '/calculator/buy-hold': 'Buy & Hold',
  '/calculator/brrr': 'BRRR',
  '/calculator/wholesale': 'Wholesale',
  '/calculator/noi': 'Net Operating Income',
  '/calculator/cash-on-cash': 'Cash-on-Cash',
  '/calculator/cashflow': 'Cashflow',
  '/calculator/cap-rate': 'Cap Rate',
  '/deals': 'My Deals',
  '/deals/new': 'Add New Deal',
  '/news': 'Market Updates',
  '/settings': 'Preferences',
  '/pricing': 'Pricing',
}

const isCalculatorRoute = computed(() => route.path.startsWith('/calculator'))
const pageTitle = computed(() => routeTitles[route.path] || '')
</script>

<template>
  <v-app-bar
    app
    color="primary"
    style="position: relative"
    dark
  >
    <!-- Desktop View -->
    <template v-if="isDesktop">
      <v-btn
        icon
        class="me-2"
        @click="onToggleDrawer"
      >
        <v-icon color="white">
          mdi-toolbox
        </v-icon>
      </v-btn>
      <v-app-bar-title>
        REI Tools
        <span v-if="isCalculatorRoute">
          |
          <v-icon
            class="mx-1"
            size="20"
          >mdi-calculator</v-icon>
        </span>
        <span v-if="pageTitle">{{ pageTitle }}</span>
      </v-app-bar-title>
      
      <v-spacer />
      
      <!-- Sync Status Indicator for Desktop -->
      <SyncStatusIndicator
        :show-text="true"
        class="me-3"
      />
    </template>

    <!-- Mobile View -->
    <template v-else>
      <v-app-bar-title>
        <span v-if="isCalculatorRoute">
          <v-icon
            class="mx-1"
            size="20"
          >mdi-calculator</v-icon>
        </span>
        <span v-if="pageTitle">{{ pageTitle }}</span>
      </v-app-bar-title>
      
      <!-- Sync Status Indicator for Mobile -->
      <SyncStatusIndicator
        :show-text="false"
        :compact="true"
        class="me-2"
      />
      
      <v-btn
        icon
        @click="onToggleDrawer"
      >
        <v-icon color="white">
          mdi-toolbox
        </v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>
