import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

// Create a test router
const createTestRouter = () => {
  const routes = [
    { path: '/', redirect: '/calculator/standard' },
    { path: '/calculator', redirect: '/calculator/standard' },
    {
      path: '/calculator/standard',
      component: { template: '<div>Standard Calculator</div>' },
    },
    {
      path: '/calculator/mortgage',
      component: { template: '<div>Mortgage Calculator</div>' },
    },
    {
      path: '/calculator/fix-flip',
      component: { template: '<div>Fix & Flip Calculator</div>' },
    },
    {
      path: '/calculator/buy-hold',
      component: { template: '<div>Buy & Hold Calculator</div>' },
    },
    {
      path: '/calculator/brrr',
      component: { template: '<div>BRRR Calculator</div>' },
    },
    {
      path: '/calculator/wholesale',
      component: { template: '<div>Wholesale Calculator</div>' },
    },
    {
      path: '/calculator/noi',
      component: { template: '<div>NOI Calculator</div>' },
    },
    {
      path: '/calculator/cash-on-cash',
      component: { template: '<div>Cash-on-Cash Calculator</div>' },
    },
    {
      path: '/calculator/cashflow',
      component: { template: '<div>Cashflow Calculator</div>' },
    },
    {
      path: '/calculator/cap-rate',
      component: { template: '<div>Cap Rate Calculator</div>' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: { template: '<div>Not Found</div>' },
    },
  ]

  return createRouter({
    history: createWebHistory(),
    routes,
  })
}

describe('Navigation Integration Tests', () => {
  let router
  let wrapper

  beforeEach(async () => {
    router = createTestRouter()
    wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    await router.isReady()
  })

  it('renders navigation drawer', () => {
    const drawer = wrapper.findComponent({ name: 'v-navigation-drawer' })
    expect(drawer.exists()).toBe(true)
  })

  it('renders app bar with title', () => {
    const appBar = wrapper.findComponent({ name: 'v-app-bar' })
    expect(appBar.exists()).toBe(true)

    const title = appBar.findComponent({ name: 'v-app-bar-title' })
    expect(title.exists()).toBe(true)
  })

  it('shows calculator icon in app bar when on calculator route', async () => {
    await router.push('/calculator/standard')
    await wrapper.vm.$nextTick()

    const appBar = wrapper.findComponent({ name: 'v-app-bar' })
    const calculatorIcon = appBar.find('v-icon')
    expect(calculatorIcon.exists()).toBe(true)
  })

  it('renders all calculator navigation items', () => {
    const listItems = wrapper.findAll('v-list-item')
    const calculatorItems = listItems.filter(
      item =>
        item.text().includes('Calculator') ||
        item.text().includes('Mortgage') ||
        item.text().includes('Fix & Flip') ||
        item.text().includes('Buy & Hold') ||
        item.text().includes('BRRR') ||
        item.text().includes('Wholesale') ||
        item.text().includes('Net Operating Income') ||
        item.text().includes('Cash-on-Cash') ||
        item.text().includes('Cashflow') ||
        item.text().includes('Cap Rate')
    )

    expect(calculatorItems.length).toBeGreaterThan(8)
  })

  it('navigates to standard calculator when clicked', async () => {
    const standardLink = wrapper.find('v-list-item[to="/calculator/standard"]')
    expect(standardLink.exists()).toBe(true)

    await standardLink.trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/calculator/standard')
  })

  it('navigates to mortgage calculator when clicked', async () => {
    const mortgageLink = wrapper.find('v-list-item[to="/calculator/mortgage"]')
    expect(mortgageLink.exists()).toBe(true)

    await mortgageLink.trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/calculator/mortgage')
  })

  it('navigates to fix and flip calculator when clicked', async () => {
    const fixFlipLink = wrapper.find('v-list-item[to="/calculator/fix-flip"]')
    expect(fixFlipLink.exists()).toBe(true)

    await fixFlipLink.trigger('click')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/calculator/fix-flip')
  })

  it('renders dark mode toggle', () => {
    const darkModeSwitch = wrapper.findComponent({ name: 'v-switch' })
    expect(darkModeSwitch.exists()).toBe(true)
  })

  it('toggles drawer when toolbox button is clicked', async () => {
    const toolboxButton = wrapper.find('v-btn')
    expect(toolboxButton.exists()).toBe(true)

    const initialDrawerState = wrapper.vm.drawer
    await toolboxButton.trigger('click')

    expect(wrapper.vm.drawer).toBe(!initialDrawerState)
  })

  it('closes drawer on mobile when navigation item is clicked', async () => {
    // Mock mobile view
    wrapper.vm.isDesktop = false
    wrapper.vm.drawer = true

    const standardLink = wrapper.find('v-list-item[to="/calculator/standard"]')
    await standardLink.trigger('click')

    expect(wrapper.vm.drawer).toBe(false)
  })

  it('keeps drawer open on desktop when navigation item is clicked', async () => {
    // Mock desktop view
    wrapper.vm.isDesktop = true
    wrapper.vm.drawer = true

    const standardLink = wrapper.find('v-list-item[to="/calculator/standard"]')
    await standardLink.trigger('click')

    expect(wrapper.vm.drawer).toBe(true)
  })

  it('renders empty navigation groups for future features', () => {
    const listGroups = wrapper.findAll('v-list-group')
    expect(listGroups.length).toBeGreaterThan(1) // Should have multiple groups
  })

  it('handles responsive drawer behavior', async () => {
    // Test desktop behavior
    wrapper.vm.isDesktop = true
    expect(wrapper.vm.drawer).toBe(true) // Should be open on desktop

    // Test mobile behavior
    wrapper.vm.isDesktop = false
    expect(wrapper.vm.drawer).toBe(false) // Should be closed on mobile
  })
})
