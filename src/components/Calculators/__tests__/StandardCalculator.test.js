/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StandardCalculator from '../StandardCalculator.vue'

describe('StandardCalculator', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(StandardCalculator)
  })

  it('renders calculator display', () => {
    expect(wrapper.find('v-text-field').exists()).toBe(true)
  })

  it('renders all calculator buttons', () => {
    const buttons = wrapper.findAll('v-btn')
    // Should have 16 buttons (0-9, +, -, *, /, =, ., Clear)
    expect(buttons.length).toBeGreaterThan(15)
  })

  it('displays numbers when buttons are clicked', async () => {
    const display = wrapper.find('v-text-field')

    // Click number 5
    const button5 = wrapper.findAll('v-btn').find(btn => btn.text() === '5')
    await button5.trigger('click')

    expect(display.props('modelValue')).toBe('5')
  })

  it('performs basic addition', async () => {
    const display = wrapper.find('v-text-field')

    // Click 2 + 3 =
    const button2 = wrapper.findAll('v-btn').find(btn => btn.text() === '2')
    const buttonPlus = wrapper.findAll('v-btn').find(btn => btn.text() === '+')
    const button3 = wrapper.findAll('v-btn').find(btn => btn.text() === '3')
    const buttonEquals = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '=')

    await button2.trigger('click')
    await buttonPlus.trigger('click')
    await button3.trigger('click')
    await buttonEquals.trigger('click')

    expect(display.props('modelValue')).toBe('5')
  })

  it('performs basic subtraction', async () => {
    const display = wrapper.find('v-text-field')

    // Click 7 - 2 =
    const button7 = wrapper.findAll('v-btn').find(btn => btn.text() === '7')
    const buttonMinus = wrapper.findAll('v-btn').find(btn => btn.text() === '-')
    const button2 = wrapper.findAll('v-btn').find(btn => btn.text() === '2')
    const buttonEquals = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '=')

    await button7.trigger('click')
    await buttonMinus.trigger('click')
    await button2.trigger('click')
    await buttonEquals.trigger('click')

    expect(display.props('modelValue')).toBe('5')
  })

  it('performs basic multiplication', async () => {
    const display = wrapper.find('v-text-field')

    // Click 3 * 4 =
    const button3 = wrapper.findAll('v-btn').find(btn => btn.text() === '3')
    const buttonMultiply = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '*')
    const button4 = wrapper.findAll('v-btn').find(btn => btn.text() === '4')
    const buttonEquals = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '=')

    await button3.trigger('click')
    await buttonMultiply.trigger('click')
    await button4.trigger('click')
    await buttonEquals.trigger('click')

    expect(display.props('modelValue')).toBe('12')
  })

  it('performs basic division', async () => {
    const display = wrapper.find('v-text-field')

    // Click 8 / 2 =
    const button8 = wrapper.findAll('v-btn').find(btn => btn.text() === '8')
    const buttonDivide = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '/')
    const button2 = wrapper.findAll('v-btn').find(btn => btn.text() === '2')
    const buttonEquals = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '=')

    await button8.trigger('click')
    await buttonDivide.trigger('click')
    await button2.trigger('click')
    await buttonEquals.trigger('click')

    expect(display.props('modelValue')).toBe('4')
  })

  it('clears display when Clear button is clicked', async () => {
    const display = wrapper.find('v-text-field')

    // Enter some numbers
    const button5 = wrapper.findAll('v-btn').find(btn => btn.text() === '5')
    await button5.trigger('click')
    expect(display.props('modelValue')).toBe('5')

    // Click Clear
    const clearButton = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === 'Clear')
    await clearButton.trigger('click')

    expect(display.props('modelValue')).toBe('')
  })

  it('shows error for invalid expressions', async () => {
    const display = wrapper.find('v-text-field')

    // Try to calculate invalid expression
    const button5 = wrapper.findAll('v-btn').find(btn => btn.text() === '5')
    const buttonPlus = wrapper.findAll('v-btn').find(btn => btn.text() === '+')
    const buttonEquals = wrapper
      .findAll('v-btn')
      .find(btn => btn.text() === '=')

    await button5.trigger('click')
    await buttonPlus.trigger('click')
    await buttonEquals.trigger('click')

    expect(display.props('modelValue')).toBe('Error')
  })

  it('handles keyboard input', async () => {
    const display = wrapper.find('v-text-field')

    // Simulate keyboard input
    await wrapper.trigger('keydown', { key: '5' })
    await wrapper.trigger('keydown', { key: '+' })
    await wrapper.trigger('keydown', { key: '3' })
    await wrapper.trigger('keydown', { key: '=' })

    expect(display.props('modelValue')).toBe('8')
  })

  it('clears with Escape key', async () => {
    const display = wrapper.find('v-text-field')

    // Enter some numbers
    await wrapper.trigger('keydown', { key: '5' })
    expect(display.props('modelValue')).toBe('5')

    // Press Escape
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(display.props('modelValue')).toBe('')
  })
})
