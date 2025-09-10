<script setup>
import { ref, computed } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

// Use a different name than `props` to avoid shadowing template activator props
const p = defineProps({
  drawer: {
    type: Boolean,
    required: true,
  },
  isDesktop: {
    type: Boolean,
    required: true,
  },
  onDrawerUpdate: {
    type: Function,
    required: true,
  },
  onCloseDrawer: {
    type: Function,
    required: true,
  },
  // Configurable drawer width (px)
  drawerWidth: {
    type: Number,
    default: 300,
  },
})

const expandedGroups = ref(['tools', 'residential', 'commercial']) // Keep groups expanded

const computedWidth = computed(() => {
  // On small screens, cap the width to keep the layout usable
  if (!p.isDesktop) return Math.min(240, p.drawerWidth)
  return p.drawerWidth
})
</script>

<template>
  <v-navigation-drawer
    :model-value="drawer"
    :permanent="isDesktop"
    :temporary="!isDesktop"
    app
    :width="computedWidth"
    :right="!isDesktop"
    @update:model-value="onDrawerUpdate"
  >
    <v-list
      v-model:opened="expandedGroups"
      dense
      nav
    >
      <!-- Tools Group -->
      <v-list-group
        value="tools"
        prepend-icon="mdi-hammer-wrench"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props">
            <v-list-item-title>Calculators</v-list-item-title>
          </v-list-item>
        </template>

        <!-- Basic Calculator -->
        <v-list-item
          to="/calculator/standard"
          link
          @click="onCloseDrawer"
        >
          <template #prepend>
            <v-icon size="small">
              mdi-calculator
            </v-icon>
          </template>
          <v-list-item-title>Standard Calculator</v-list-item-title>
        </v-list-item>

        <!-- Residential Group -->
        <v-list-group value="residential">
          <template #activator="{ props }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon size="small">
                  mdi-home
                </v-icon>
              </template>
              <v-list-item-title>Residential</v-list-item-title>
            </v-list-item>
          </template>

          <v-list-item
            to="/calculator/mortgage"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Mortgage</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/fix-flip"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Fix &amp; Flip</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/wholesale"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Wholesale</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/buy-hold"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Buy &amp; Hold</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/brrr"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>BRRR</v-list-item-title>
          </v-list-item>
        </v-list-group>

        <!-- Commercial Group -->
        <v-list-group value="commercial">
          <template #activator="{ props }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon size="small">
                  mdi-office-building
                </v-icon>
              </template>
              <v-list-item-title>Commercial</v-list-item-title>
            </v-list-item>
          </template>

          <v-list-item
            to="/calculator/noi"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Net Operating Income</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cash-on-cash"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Cash-on-Cash</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cashflow"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Cashflow</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cap-rate"
            link
            @click="onCloseDrawer"
          >
            <v-list-item-title>Cap Rate</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list-group>

      <!-- Deal Management -->
      <v-list-item
        to="/deals"
        link
        @click="onCloseDrawer"
      >
        <template #prepend>
          <v-icon>mdi-briefcase</v-icon>
        </template>
        <v-list-item-title>Deal Management</v-list-item-title>
      </v-list-item>

      <!-- News -->
      <v-list-item
        to="/news"
        link
        @click="onCloseDrawer"
      >
        <template #prepend>
          <v-icon>mdi-newspaper</v-icon>
        </template>
        <v-list-item-title>News</v-list-item-title>
      </v-list-item>

      <!-- Settings -->
      <v-list-item
        to="/settings"
        link
        @click="onCloseDrawer"
      >
        <template #prepend>
          <v-icon>mdi-cog</v-icon>
        </template>
        <v-list-item-title>Settings</v-list-item-title>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- Theme Toggle -->
      <v-list-item>
        <template #prepend>
          <v-icon>mdi-theme-light-dark</v-icon>
        </template>
        <v-list-item-title>Theme</v-list-item-title>
        <template #append>
          <ThemeToggle />
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
/* Use responsive CSS variable for drawer width (fallback provided by prop)
   and allow titles to wrap instead of truncating. */
:deep(.v-navigation-drawer) {
  --app-drawer-width: 300px;
}

:deep(.v-list-item__title) {
  white-space: normal;
}

:deep(.v-list-item__content) {
  gap: 12px;
}

@media (max-width: 600px) {
  :deep(.v-navigation-drawer) {
    --app-drawer-width: 220px;
  }
}
</style>
