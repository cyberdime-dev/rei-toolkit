<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import "@mdi/font/css/materialdesignicons.css";
import { useTheme } from "vuetify";

// Sets system's dark mode preference and saves it to localStorage
// const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
// const savedTheme = localStorage.getItem("theme");
// const selectedTheme = savedTheme || (prefersDark ? "dark" : "light");
// vuetify.framework.theme.global.name.value = selectedTheme;

const theme = useTheme();

const isDarkTheme = ref(theme.global.name.value === "dark");

const toggleTheme = () => {
  theme.global.name.value = isDarkTheme.value ? "dark" : "light";
  localStorage.setItem("theme", isDarkTheme.value ? "dark" : "light");
};

const drawer = ref(false);
const isDesktop = ref(window.innerWidth >= 960);

// Control expanded groups
const expandedGroups = ref(["residential", "commercial"]);

function handleResize() {
  isDesktop.value = window.innerWidth >= 960;
  if (isDesktop.value) drawer.value = true;
}

function closeDrawer() {
  if (!isDesktop.value) drawer.value = false;
}

function toggleDrawer() {
  drawer.value = !drawer.value;
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Dynamic page title based on route
const route = useRoute();
const routeTitles = {
  "/calculator/standard": "Calculator",
  "/calculator/mortgage": "Mortgage",
  "/calculator/fix-flip": "Fix & Flip",
  "/calculator/buy-hold": "Buy & Hold",
  "/calculator/brrr": "BRRR",
  "/calculator/wholesale": "Wholesale",
  "/calculator/noi": "Net Operating Income",
  "/calculator/cash-on-cash": "Cash-on-Cash",
  "/calculator/cashflow": "Cashflow",
  "/calculator/cap-rate": "Cap Rate",
};

const isCalculatorRoute = computed(() => route.path.startsWith("/calculator")); // Check if current route for icon
const pageTitle = computed(() => routeTitles[route.path] || ""); // Compute page title based on current route
</script>

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

<template>
  <v-app>
    <!-- Top App Bar -->
    <v-app-bar app color="primary" style="position: relative" dark>
      <!-- Desktop View -->
      <template v-if="isDesktop">
        <v-btn icon @click="toggleDrawer" class="me-2">
          <v-icon color="white">mdi-toolbox</v-icon>
        </v-btn>
        <v-app-bar-title>
          REI Tools
          <span v-if="isCalculatorRoute">
            |
            <v-icon class="mx-1" size="20">mdi-calculator</v-icon>
          </span>
          <span v-if="pageTitle">{{ pageTitle }}</span>
        </v-app-bar-title>
      </template>
      <!-- Mobile View -->
      <template v-else>
        <v-app-bar-title>
          <span v-if="isCalculatorRoute">
            <v-icon class="mx-1" size="20">mdi-calculator</v-icon>
          </span>
          <span v-if="pageTitle">{{ pageTitle }}</span>
        </v-app-bar-title>
        <v-spacer />
        <v-btn icon @click="toggleDrawer">
          <v-icon color="white">mdi-toolbox</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="isDesktop"
      :temporary="!isDesktop"
      app
      :right="!isDesktop"
    >
      <v-list dense nav v-model="expandedGroups">
        <!-- Tools Group -->
        <v-list-group value="calculator" prepend-icon="mdi-calculator">
          <template #activator>
            <v-list-item-title
              ><v-icon class="mx-1" size="20">mdi-hammer-wrench</v-icon
              >Tools</v-list-item-title
            >
          </template>
          <v-list-item to="/calculator/standard" link @click="closeDrawer">
            <v-list-item-title>Calculator</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item to="/calculator/mortgage" link @click="closeDrawer">
            <v-list-item-title>Mortgage</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item to="/calculator/fix-flip" link @click="closeDrawer">
            <v-list-item-title>Fix &amp; Flip</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/wholesale" link @click="closeDrawer">
            <v-list-item-title>Wholesale</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/buy-hold" link @click="closeDrawer">
            <v-list-item-title>Buy &amp; Hold</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/brrr" link @click="closeDrawer">
            <v-list-item-title>BRRR</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/cashflow" link @click="closeDrawer">
            <v-list-item-title>Cashflow</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item to="/calculator/noi" link @click="closeDrawer">
            <v-list-item-title>Net Operating Income</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/cash-on-cash" link @click="closeDrawer">
            <v-list-item-title>Cash-on-Cash</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/cap-rate" link @click="closeDrawer">
            <v-list-item-title>Cap Rate</v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-divider class="my-4" />
        <!-- News Group -->
        <v-list-group>
          <template #activator>
            <v-list-item-title
              ><v-icon class="mx-1" size="20">mdi-newspaper</v-icon
              >News</v-list-item-title
            >
          </template>
          <!-- RE Market News -->
        </v-list-group>
        <v-divider class="my-4" />
        <!-- User Group -->
        <v-list-group>
          <template #activator>
            <v-list-item-title
              ><v-icon class="mx-1" size="20">mdi-cog-box</v-icon
              >Settings</v-list-item-title
            >
          </template>
          <!-- Preferences: Select Default Starting Screen. -->
          <!-- Login / Log Out -->
        </v-list-group>
      </v-list>

      <v-list class="mt-auto">
        <v-list-item>
          <v-list-item-title>Dark Mode</v-list-item-title>
          <template #append>
            <v-switch v-model="isDarkTheme" inset @change="toggleTheme"></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main class="pa-4">
      <router-view />
    </v-main>
  </v-app>
</template>
