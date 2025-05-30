import { createRouter, createWebHistory } from 'vue-router'
import StandardCalculator from '@/components/Calculators/StandardCalculator.vue'
import Mortgage from '@/components/Calculators/MortgageCalculator.vue'
import FixAndFlip from '@/components/Calculators/FixAndFlipCalculator.vue'
import BuyAndHold from '@/components/Calculators/BuyAndHoldCalculator.vue'
import Brrr from '@/components/Calculators/BrrrCalculator.vue'
import Wholesale from '@/components/Calculators/WholesaleCalculator.vue'
import NOI from '@/components/Calculators/NoiCalculator.vue'
import CashOnCash from '@/components/Calculators/CashOnCashCalculator.vue'

const routes = [
  { path: '/', redirect: '/calculator/standard' },
  { path: '/calculator', redirect: '/calculator/standard' }, // <-- Add this line

  // Calculators
  { path: '/calculator/standard', component: StandardCalculator },
    { path: '/calculator/mortgage', component: Mortgage },
  { path: '/calculator/fix-flip', component: FixAndFlip },
  { path: '/calculator/buy-hold', component: BuyAndHold },
  { path: '/calculator/brrr', component: Brrr },
  { path: '/calculator/wholesale', component: Wholesale },
  { path: '/calculator/noi', component: NOI },
  { path: '/calculator/cash-on-cash', component: CashOnCash },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
