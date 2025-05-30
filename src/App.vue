<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import "@mdi/font/css/materialdesignicons.css";

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
  "/calculator/fix-flip": "Fix & Flip",
  "/calculator/buy-hold": "Buy & Hold",
  "/calculator/brrr": "BRRR",
  "/calculator/wholesale": "Wholesale",
  "/calculator/noi": "Net Operating Income",
  "/calculator/cash-on-cash": "Cash-on-Cash",
};

const isCalculatorRoute = computed(() => route.path.startsWith("/calculator")); // Check if current route for icon
const pageTitle = computed(() => routeTitles[route.path] || ""); // Compute page title based on current route
</script>

<template>
  <v-app>
    <!-- Top App Bar -->
    <v-app-bar app color="primary" style="position: relative" dark>
      <!-- Desktop View -->
      <template v-if="isDesktop">
        <v-btn icon @click="toggleDrawer" class="me-2">
          <v-icon color="white">mdi-menu</v-icon>
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
          <v-icon color="white">mdi-menu</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="isDesktop"
      :temporary="!isDesktop"
      app
    >
      <v-list dense nav v-model="expandedGroups">
        <!-- Calculator Group -->
        <v-list-group value="calculator" prepend-icon="mdi-calculator">
          <template #activator>
            <v-list-item-title
              ><v-icon class="mx-1" size="20">mdi-calculator</v-icon
              >Calculators</v-list-item-title
            >
          </template>
          <v-list-item to="/calculator/standard" link @click="closeDrawer">
            <v-list-item-title>Calculator</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/fix-flip" link @click="closeDrawer">
            <v-list-item-title>Fix & Flip</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/buy-hold" link @click="closeDrawer">
            <v-list-item-title>Buy & Hold</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/brrr" link @click="closeDrawer">
            <v-list-item-title>BRRR</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/wholesale" link @click="closeDrawer">
            <v-list-item-title>Wholesale</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/noi" link @click="closeDrawer">
            <v-list-item-title>Net Operating Income</v-list-item-title>
          </v-list-item>
          <v-list-item to="/calculator/cash-on-cash" link @click="closeDrawer">
            <v-list-item-title>Cash-on-Cash</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main class="pa-4">
      <router-view />
    </v-main>
  </v-app>
</template>
