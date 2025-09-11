import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import StandardCalculator from '../components/Calculators/StandardCalculator.vue'
import MortgageCalculator from '../components/Calculators/MortgageCalculator.vue'
import FixAndFlipCalculator from '../components/Calculators/FixAndFlipCalculator.vue'
import BuyAndHoldCalculator from '../components/Calculators/BuyAndHoldCalculator.vue'
import BrrrCalculator from '../components/Calculators/BrrrCalculator.vue'
import WholesaleCalculator from '../components/Calculators/WholesaleCalculator.vue'
import NoiCalculator from '../components/Calculators/NoiCalculator.vue'
import CashOnCashCalculator from '../components/Calculators/CashOnCashCalculator.vue'
import CashflowCalculator from '../components/Calculators/CashflowCalculator.vue'
import CapRateCalculator from '../components/Calculators/CapRateCalculator.vue'
import NotFound from '../components/NotFound.vue'

// Create a test router
const createTestRouter = () => {
  const routes = [
    { path: '/', redirect: '/calculator/standard' },
    { path: '/calculator', redirect: '/calculator/standard' },
    { path: '/calculator/standard', component: StandardCalculator },
    { path: '/calculator/mortgage', component: MortgageCalculator },
    { path: '/calculator/fix-flip', component: FixAndFlipCalculator },
    { path: '/calculator/buy-hold', component: BuyAndHoldCalculator },
    { path: '/calculator/brrr', component: BrrrCalculator },
    { path: '/calculator/wholesale', component: WholesaleCalculator },
    { path: '/calculator/noi', component: NoiCalculator },
    { path: '/calculator/cash-on-cash', component: CashOnCashCalculator },
    { path: '/calculator/cashflow', component: CashflowCalculator },
    { path: '/calculator/cap-rate', component: CapRateCalculator },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ]

  return createRouter({
    history: createWebHistory(),
    routes,
  })
}

describe('Router Integration Tests', () => {
  let router
  let wrapper // eslint-disable-line no-unused-vars

  beforeEach(async () => {
    router = createTestRouter()
    wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    await router.isReady()
  })

  it('redirects root path to standard calculator', async () => {
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/standard')
  })

  it('redirects /calculator to standard calculator', async () => {
    await router.push('/calculator')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/standard')
  })

  it('navigates to standard calculator', async () => {
    await router.push('/calculator/standard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/standard')
  })

  it('navigates to mortgage calculator', async () => {
    await router.push('/calculator/mortgage')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/mortgage')
  })

  it('navigates to fix and flip calculator', async () => {
    await router.push('/calculator/fix-flip')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/fix-flip')
  })

  it('navigates to buy and hold calculator', async () => {
    await router.push('/calculator/buy-hold')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/buy-hold')
  })

  it('navigates to BRRR calculator', async () => {
    await router.push('/calculator/brrr')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/brrr')
  })

  it('navigates to wholesale calculator', async () => {
    await router.push('/calculator/wholesale')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/wholesale')
  })

  it('navigates to NOI calculator', async () => {
    await router.push('/calculator/noi')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/noi')
  })

  it('navigates to cash-on-cash calculator', async () => {
    await router.push('/calculator/cash-on-cash')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/cash-on-cash')
  })

  it('navigates to cashflow calculator', async () => {
    await router.push('/calculator/cashflow')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/cashflow')
  })

  it('navigates to cap rate calculator', async () => {
    await router.push('/calculator/cap-rate')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/calculator/cap-rate')
  })

  it('shows 404 page for invalid routes', async () => {
    await router.push('/invalid-route')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/invalid-route')
    expect(router.currentRoute.value.name).toBe('NotFound')
  })

  it('handles deep linking to calculator routes', async () => {
    const routes = [
      '/calculator/standard',
      '/calculator/mortgage',
      '/calculator/fix-flip',
      '/calculator/buy-hold',
      '/calculator/brrr',
      '/calculator/wholesale',
      '/calculator/noi',
      '/calculator/cash-on-cash',
      '/calculator/cashflow',
      '/calculator/cap-rate',
    ]

    for (const route of routes) {
      await router.push(route)
      await router.isReady()
      expect(router.currentRoute.value.path).toBe(route)
    }
  })
})
