<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Welcome section data
const welcomeData = ref({
  title: 'Welcome to REI Toolkit',
  subtitle: 'Your comprehensive real estate investment analysis platform',
  description: 'Calculate returns, analyze deals, and make informed investment decisions with our suite of professional-grade calculators.',
})

// Calculator categories
const calculatorCategories = ref([
  {
    title: 'Residential Calculators',
    icon: 'mdi-home',
    color: 'primary',
    calculators: [
      { name: 'Mortgage Calculator', route: '/calculator/mortgage', icon: 'mdi-calculator', description: 'Calculate monthly payments and loan details' },
      { name: 'Fix & Flip', route: '/calculator/fix-and-flip', icon: 'mdi-hammer-wrench', description: 'Analyze renovation project profitability' },
      { name: 'Wholesale', route: '/calculator/wholesale', icon: 'mdi-handshake', description: 'Calculate wholesale deal margins' },
      { name: 'Buy & Hold', route: '/calculator/buy-and-hold', icon: 'mdi-key', description: 'Long-term rental property analysis' },
      { name: 'BRRR', route: '/calculator/brrr', icon: 'mdi-repeat', description: 'Buy, Rehab, Rent, Refinance strategy' },
    ],
  },
  {
    title: 'Commercial Calculators',
    icon: 'mdi-office-building',
    color: 'secondary',
    calculators: [
      { name: 'NOI Calculator', route: '/calculator/noi', icon: 'mdi-chart-line', description: 'Net Operating Income analysis' },
      { name: 'Cash-on-Cash', route: '/calculator/cash-on-cash', icon: 'mdi-cash', description: 'Return on cash invested' },
      { name: 'Cashflow', route: '/calculator/cashflow', icon: 'mdi-trending-up', description: 'Property cashflow analysis' },
      { name: 'Cap Rate', route: '/calculator/cap-rate', icon: 'mdi-percent', description: 'Capitalization rate calculator' },
    ],
  },
])

// Quick stats
const quickStats = ref([
  { title: 'Calculators Available', value: '9+', icon: 'mdi-calculator', color: 'primary' },
  { title: 'Investment Strategies', value: '5', icon: 'mdi-strategy', color: 'secondary' },
  { title: 'Deal Analysis Tools', value: 'Pro', icon: 'mdi-chart-areaspline', color: 'success' },
  { title: 'Property Types', value: 'All', icon: 'mdi-domain', color: 'info' },
])

// Navigation functions
function navigateToCalculator(route) {
  try {
    router.push(route)
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

function navigateToDeals() {
  try {
    router.push('/deals')
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

function navigateToNews() {
  try {
    router.push('/news')
  } catch (error) {
    console.error('Navigation error:', error)
  }
}
</script>

<template>
  <div class="home-container">
    <!-- Hero Section -->
    <v-row class="hero-section mb-8">
      <v-col cols="12">
        <div class="text-center hero-content">
          <h1 class="display-1 font-weight-bold mb-4">
            {{ welcomeData.title }}
          </h1>
          <h2 class="headline font-weight-regular mb-4 text-medium-emphasis">
            {{ welcomeData.subtitle }}
          </h2>
          <p
            class="body-1 mb-6 mx-auto"
            style="max-width: 600px;"
          >
            {{ welcomeData.description }}
          </p>
          
          <div class="hero-actions">
            <v-btn
              color="primary"
              size="large"
              class="mr-4 mb-2"
              @click="navigateToCalculator('/calculator/standard')"
            >
              <v-icon left>
                mdi-calculator
              </v-icon>
              Start Calculating
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              class="mb-2"
              @click="navigateToDeals()"
            >
              <v-icon left>
                mdi-briefcase
              </v-icon>
              Manage Deals
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row class="quick-stats mb-8">
      <v-col
        v-for="stat in quickStats"
        :key="stat.title"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          class="stat-card h-100"
          elevation="2"
        >
          <v-card-text class="text-center">
            <v-icon
              :color="stat.color"
              size="48"
              class="mb-3"
            >
              {{ stat.icon }}
            </v-icon>
            <div class="text-h4 font-weight-bold mb-1">
              {{ stat.value }}
            </div>
            <div class="text-subtitle-2 text-medium-emphasis">
              {{ stat.title }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Calculator Categories -->
    <div class="calculator-sections">
      <v-row
        v-for="category in calculatorCategories"
        :key="category.title"
        class="mb-8"
      >
        <v-col cols="12">
          <div class="category-header mb-4">
            <v-icon
              :color="category.color"
              size="32"
              class="mr-3"
            >
              {{ category.icon }}
            </v-icon>
            <h3 class="text-h5 font-weight-bold">
              {{ category.title }}
            </h3>
          </div>
          
          <v-row>
            <v-col
              v-for="calc in category.calculators"
              :key="calc.name"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card
                class="calculator-card h-100"
                elevation="2"
                hover
                @click="navigateToCalculator(calc.route)"
              >
                <v-card-text class="text-center">
                  <v-icon
                    :color="category.color"
                    size="40"
                    class="mb-3"
                  >
                    {{ calc.icon }}
                  </v-icon>
                  <div class="text-h6 font-weight-bold mb-2">
                    {{ calc.name }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ calc.description }}
                  </div>
                </v-card-text>
                
                <v-card-actions class="justify-center">
                  <v-btn
                    :color="category.color"
                    variant="text"
                    size="small"
                  >
                    <v-icon
                      left
                      size="small"
                    >
                      mdi-launch
                    </v-icon>
                    Open Calculator
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>

    <!-- Additional Tools Section -->
    <v-row class="additional-tools">
      <v-col cols="12">
        <h3 class="text-h5 font-weight-bold mb-4">
          <v-icon
            color="info"
            size="32"
            class="mr-3"
          >
            mdi-tools
          </v-icon>
          Additional Tools
        </h3>
        
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="tool-card h-100"
              elevation="2"
              hover
              @click="navigateToDeals()"
            >
              <v-card-text class="text-center">
                <v-icon
                  color="info"
                  size="40"
                  class="mb-3"
                >
                  mdi-briefcase
                </v-icon>
                <div class="text-h6 font-weight-bold mb-2">
                  Deal Management
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Track and analyze your investment deals
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="tool-card h-100"
              elevation="2"
              hover
              @click="navigateToNews()"
            >
              <v-card-text class="text-center">
                <v-icon
                  color="warning"
                  size="40"
                  class="mb-3"
                >
                  mdi-newspaper
                </v-icon>
                <div class="text-h6 font-weight-bold mb-2">
                  Market News
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Stay updated with real estate market trends
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="tool-card h-100"
              elevation="2"
              hover
              @click="navigateToCalculator('/calculator/standard')"
            >
              <v-card-text class="text-center">
                <v-icon
                  color="success"
                  size="40"
                  class="mb-3"
                >
                  mdi-calculator-variant
                </v-icon>
                <div class="text-h6 font-weight-bold mb-2">
                  Standard Calculator
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Basic mathematical calculator
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.home-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  background-clip: border-box;
  color: rgb(var(--v-theme-on-primary));
  border-radius: 16px;
  padding: 48px 24px;
  margin-bottom: 32px;
}

.hero-content h1,
.hero-content h2,
.hero-content p {
  color: rgb(var(--v-theme-on-primary));
}

.hero-actions {
  margin-top: 24px;
}

.stat-card {
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.calculator-card,
.tool-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.calculator-card:hover,
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.additional-tools {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgb(var(--v-theme-outline));
}

@media (max-width: 768px) {
  .home-container {
    padding: 16px;
  }
  
  .hero-section {
    padding: 32px 16px;
  }
  
  .hero-actions .v-btn {
    display: block;
    width: 100%;
    margin-bottom: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .calculator-card,
  .tool-card {
    transition: none;
  }
  
  .stat-card:hover,
  .calculator-card:hover,
  .tool-card:hover {
    transform: none;
  }
}
</style>
