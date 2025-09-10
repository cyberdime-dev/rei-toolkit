import { createRouter, createWebHistory } from 'vue-router'

// Dynamic imports for code splitting
const DealList = () => import('@/components/DealManagement/DealList.vue')
const NewsList = () => import('@/components/News/NewsList.vue')
const Settings = () => import('@/components/Settings/Settings.vue')
const StandardCalculator = () =>
  import('@/components/Calculators/StandardCalculator.vue')
const Mortgage = () => import('@/components/Calculators/MortgageCalculator.vue')
const FixAndFlip = () =>
  import('@/components/Calculators/FixAndFlipCalculator.vue')
const BuyAndHold = () =>
  import('@/components/Calculators/BuyAndHoldCalculator.vue')
const Brrr = () => import('@/components/Calculators/BrrrCalculator.vue')
const Wholesale = () =>
  import('@/components/Calculators/WholesaleCalculator.vue')
const NOI = () => import('@/components/Calculators/NoiCalculator.vue')
const CashOnCash = () =>
  import('@/components/Calculators/CashOnCashCalculator.vue')
const Cashflow = () => import('@/components/Calculators/CashflowCalculator.vue')
const CapRate = () => import('@/components/Calculators/CapRateCalculator.vue')
const NotFound = () => import('@/components/NotFound.vue')

const routes = [
  { path: '/', redirect: '/calculator/standard' },
  { path: '/calculator', redirect: '/calculator/standard' },

  // Core Features
  { path: '/deals', component: DealList },
  { path: '/news', component: NewsList },
  { path: '/settings', component: Settings },

  // Calculators
  { path: '/calculator/standard', component: StandardCalculator },
  { path: '/calculator/mortgage', component: Mortgage },
  { path: '/calculator/fix-flip', component: FixAndFlip },
  { path: '/calculator/buy-hold', component: BuyAndHold },
  { path: '/calculator/brrr', component: Brrr },
  { path: '/calculator/wholesale', component: Wholesale },
  { path: '/calculator/noi', component: NOI },
  { path: '/calculator/cash-on-cash', component: CashOnCash },
  { path: '/calculator/cashflow', component: Cashflow },
  { path: '/calculator/cap-rate', component: CapRate },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
