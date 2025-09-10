<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import '@mdi/font/css/materialdesignicons.css'
import { useTheme } from 'vuetify'

// Sets system's dark mode preference and saves it to localStorage
// const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
// const savedTheme = localStorage.getItem("theme");
// const selectedTheme = savedTheme || (prefersDark ? "dark" : "light");
// vuetify.framework.theme.global.name.value = selectedTheme;

const theme = useTheme()

const isDarkTheme = ref(theme.global.name.value === 'dark')

const toggleTheme = () => {
  theme.global.name.value = isDarkTheme.value ? 'dark' : 'light'
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
}

const drawer = ref(false)
const isDesktop = ref(window.innerWidth >= 960)

// Control expanded groups
const expandedGroups = ref(['residential', 'commercial'])

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
}

const isCalculatorRoute = computed(() => route.path.startsWith('/calculator')) // Check if current route for icon
const pageTitle = computed(() => routeTitles[route.path] || '') // Compute page title based on current route
</script>

<template>
  <v-app>
    <!-- Top App Bar -->
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
          @click="toggleDrawer"
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
        <v-spacer />
        <v-btn
          icon
          @click="toggleDrawer"
        >
          <v-icon color="white">
            mdi-toolbox
          </v-icon>
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
      <v-list
        v-model="expandedGroups"
        dense
        nav
      >
        <!-- Tools Group -->
        <v-list-group
          value="mdi-calculator"
          prepend-icon="mdi-mdi-calculator"
        >
          <template #activator>
            <v-list-item-title>
              <v-icon
                class="mx-1"
                size="20"
              >
                mdi-hammer-wrench
              </v-icon>
              Tools
            </v-list-item-title>
          </template>
          <v-list-item
            to="/calculator/standard"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Calculator</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            to="/calculator/mortgage"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Mortgage</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            to="/calculator/fix-flip"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Fix &amp; Flip</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/wholesale"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Wholesale</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            to="/calculator/buy-hold"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Buy &amp; Hold</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/brrr"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>BRRR</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cashflow"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Cashflow</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            to="/calculator/noi"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Net Operating Income</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cash-on-cash"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Cash-on-Cash</v-list-item-title>
          </v-list-item>
          <v-list-item
            to="/calculator/cap-rate"
            link
            @click="closeDrawer"
          >
            <v-list-item-title>Cap Rate</v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-divider class="my-4" />
        <!-- Deal Management -->
        <v-list-item
          to="/deals"
          link
          @click="closeDrawer"
        >
          <template #prepend>
            <v-icon size="20">
              mdi-handshake-outline
            </v-icon>
          </template>
          <v-list-item-title>Deal Management</v-list-item-title>
        </v-list-item>
        <v-divider class="my-4" />
        <!-- News -->
        <v-list-item
          to="/news"
          link
          @click="closeDrawer"
        >
          <template #prepend>
            <v-icon size="20">
              mdi-newspaper
            </v-icon>
          </template>
          <v-list-item-title>News</v-list-item-title>
        </v-list-item>
        <v-divider class="my-4" />
        <!-- Settings -->
        <v-list-item
          to="/settings"
          link
          @click="closeDrawer"
        >
          <template #prepend>
            <v-icon size="20">
              mdi-cog-box
            </v-icon>
          </template>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-list class="mt-auto">
        <v-list-item>
          <v-list-item-title>Dark Mode</v-list-item-title>
          <template #append>
            <v-switch
              v-model="isDarkTheme"
              inset
              @change="toggleTheme"
            />
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

<!-- 🧰 Core Features (Must-Have)
🔢 1. Deal Calculators
Buy & Hold

Fix & Flip

BRRR

Wholesale Assignment Fee

Commercial: NOI, Cap Rate, Cash-on-Cash Return

Standard Calculator

📁 2. Deal Management
Save deals

Tag with statuses (e.g., analyzing, offer sent, under contract, closed)

Export as PDF or CSV

📄 3. Deal Reports
Printable and shareable reports (for partners, lenders, buyers)

Include deal summary, ROI projections, comps, repair costs

🚀 Value-Add Features (Premium Tiers)
📊 4. Comps + ARV Estimator
Estimate After Repair Value using public or partner data

Pull local comps (from Zillow, Redfin, or MLS API if integrated)

🛠️ 5. Repair Cost Estimator
Category-based (roof, kitchen, HVAC, paint, etc.)

Prebuilt templates for different rehab levels (light, medium, full)

🧮 6. Offer Calculator
Use MAO (Max Allowable Offer) formulas

Customize formulas based on strategy

🧭 7. Strategy Suggestions
Based on deal numbers, suggest best-fit strategy (flip vs. rental)

“What-if” scenarios

👥 CRM + Lead Tools (Upsell Opportunities)
📞 8. Basic CRM
Track seller leads

Notes, statuses, follow-up reminders

🔍 9. Skip Tracing + Lead Lists (Affiliate/Partner APIs)
Allow importing lists and appending owner contact info

Filter by equity, absentee, foreclosure, etc.

💰 Monetization Features
📦 10. Templates & Docs (One-time purchases or upsell)
Assignment contracts

LOIs

Seller scripts

Repair estimate spreadsheets

🔌 11. Integrations
Zapier

REsimpli, Podio, or other investor CRMs

Mailchimp (for marketing leads)

💼 Admin & SaaS Features
💳 12. Pricing Tiers
Free: 1 deal/month

Pro: Unlimited deals + reports

Premium: CRM + integrations

📈 13. Analytics Dashboard (optional)
Track KPIs like ROI by zip code, best-performing strategies, etc. -->
