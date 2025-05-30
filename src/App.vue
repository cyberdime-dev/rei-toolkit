<script setup>
import { ref, onMounted, onUnmounted } from "vue";
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
</script>

<template>
  <v-app>
    <!-- Top App Bar -->
    <v-app-bar app color="primary" style="position: relative" dark>
      <template v-if="isDesktop">
        <v-btn icon @click="toggleDrawer" class="me-2">
          <v-icon color="white">mdi-menu</v-icon>
        </v-btn>
        <v-app-bar-title>REI Tools by Cyberdime</v-app-bar-title>
      </template>
      <template v-else>
        <v-app-bar-title>REI Tools</v-app-bar-title>
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
            <v-list-item-title>Calculators</v-list-item-title>
          </template>
          <v-list-item to="/calculator/standard" link @click="closeDrawer">
            <v-list-item-title>Standard Calculator</v-list-item-title>
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
