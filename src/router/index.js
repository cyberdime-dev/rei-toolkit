import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@/services/authGuard.js'

// Dynamic imports for code splitting
const Home = () => import('@/views/Home.vue')
const LoginView = () => import('@/components/Auth/LoginView.vue')
const RegisterView = () => import('@/components/Auth/RegisterView.vue')
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
const PricingView = () => import('@/views/PricingView.vue')
const CheckoutSuccess = () => import('@/views/CheckoutSuccess.vue')
const NotFound = () => import('@/components/NotFound.vue')

const routes = [
  // Public Routes
  { 
    path: '/', 
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false },
  },
  { 
    path: '/pricing', 
    name: 'Pricing',
    component: PricingView,
    meta: { requiresAuth: false },
  },
  { 
    path: '/checkout/success', 
    name: 'CheckoutSuccess',
    component: CheckoutSuccess,
    meta: { requiresAuth: true },
  },
  { 
    path: '/login', 
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false, redirectIfAuth: true },
  },
  { 
    path: '/register', 
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false, redirectIfAuth: true },
  },

  // Protected Routes - Default Dashboard
  { 
    path: '/dashboard', 
    redirect: '/calculator/standard',
    meta: { requiresAuth: true },
  },
  { 
    path: '/calculator', 
    redirect: '/calculator/standard',
    meta: { requiresAuth: true },
  },

  // Core Features - Protected
  { 
    path: '/deals', 
    name: 'Deals',
    component: DealList,
    meta: { requiresAuth: true, requiredPermissions: ['deals:read'] },
  },
  { 
    path: '/deals/new', 
    name: 'NewDeal',
    component: DealList,
    meta: { requiresAuth: true, requiredPermissions: ['deals:create'] },
  },
  { 
    path: '/news', 
    name: 'News',
    component: NewsList,
    meta: { requiresAuth: true, requiredPermissions: ['news:read'] },
  },
  { 
    path: '/settings', 
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true },
  },

  // Calculators - Some have free access
  { 
    path: '/calculator/standard', 
    name: 'StandardCalculator',
    component: StandardCalculator,
    meta: { requiresAuth: true, allowFree: true },
  },
  { 
    path: '/calculator/mortgage', 
    name: 'MortgageCalculator',
    component: Mortgage,
    meta: { requiresAuth: true, allowFree: true },
  },
  { 
    path: '/calculator/fix-flip', 
    name: 'FixAndFlipCalculator',
    component: FixAndFlip,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/buy-hold', 
    name: 'BuyAndHoldCalculator',
    component: BuyAndHold,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/brrr', 
    name: 'BrrrCalculator',
    component: Brrr,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/wholesale', 
    name: 'WholesaleCalculator',
    component: Wholesale,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/noi', 
    name: 'NOICalculator',
    component: NOI,
    meta: { requiresAuth: true, allowFree: true },
  },
  { 
    path: '/calculator/cash-on-cash', 
    name: 'CashOnCashCalculator',
    component: CashOnCash,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/cashflow', 
    name: 'CashflowCalculator',
    component: Cashflow,
    meta: { requiresAuth: true, requiredPermissions: ['calculator:advanced'] },
  },
  { 
    path: '/calculator/cap-rate', 
    name: 'CapRateCalculator',
    component: CapRate,
    meta: { requiresAuth: true, allowFree: true },
  },

  // 404 Catch All
  { 
    path: '/:pathMatch(.*)*', 
    name: 'NotFound', 
    component: NotFound,
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Apply authentication guards
router.beforeEach(authGuard.createRouterGuard())

export default router
