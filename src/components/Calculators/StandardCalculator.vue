<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const display = ref('')
const history = ref([])
const showHistory = ref(false)

const buttons = [
  { label: '7' },
  { label: '8' },
  { label: '9' },
  { label: '/' },
  { label: '4' },
  { label: '5' },
  { label: '6' },
  { label: '*' },
  { label: '1' },
  { label: '2' },
  { label: '3' },
  { label: '-' },
  { label: '0' },
  { label: '.' },
  { label: '=' },
  { label: '+' },
]

const isOperator = val => ['/', '*', '-', '+', '='].includes(val)
const isNumber = val => /^[0-9.]$/.test(val)

// Safe mathematical expression evaluator using a whitelist approach
const safeEval = expression => {
  try {
    // Remove any characters that aren't numbers, operators, or decimal points
    const cleanExpression = expression.replace(/[^0-9+\-*/.()]/g, '')

    // Basic validation - ensure it's a valid mathematical expression
    if (!/^[0-9+\-*/.()\s]+$/.test(cleanExpression)) {
      throw new Error('Invalid expression')
    }

    // Simple math parser instead of Function constructor
    // This is a safer approach for basic arithmetic
    const result = evaluateExpression(cleanExpression)

    // Check if result is a valid number
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result')
    }

    return result
  } catch {
    throw new Error('Invalid expression')
  }
}

// Simple arithmetic expression evaluator
const evaluateExpression = expression => {
  // Replace operators and evaluate step by step
  const tokens = expression.match(/[0-9.]+|[+\-*/]/g) || []
  
  if (tokens.length === 0) return 0
  if (tokens.length === 1) return parseFloat(tokens[0])
  
  // Simple left-to-right evaluation (not following operator precedence for simplicity)
  let result = parseFloat(tokens[0])
  
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i]
    const operand = parseFloat(tokens[i + 1])
    
    switch (operator) {
      case '+':
        result += operand
        break
      case '-':
        result -= operand
        break
      case '*':
        result *= operand
        break
      case '/':
        if (operand === 0) throw new Error('Division by zero')
        result /= operand
        break
      default:
        throw new Error('Unknown operator')
    }
  }
  
  return result
}

const handleClick = label => {
  if (display.value === 'Error') {
    display.value = ''
  }
  
  if (label === '=') {
    try {
      const result = safeEval(display.value)
      const calculation = `${display.value} = ${result}`
      history.value.unshift(calculation)
      display.value = result.toString()
    } catch {
      display.value = 'Error'
    }
  } else {
    display.value += label
  }
}

const clear = () => {
  display.value = ''
}

const backspace = () => {
  if (display.value === 'Error') {
    display.value = ''
  } else {
    display.value = display.value.slice(0, -1)
  }
}

const clearHistory = () => {
  history.value = []
  showHistory.value = false
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const loadFromHistory = historyItem => {
  const parts = historyItem.split(' = ')
  if (parts.length === 2) {
    display.value = parts[1]
  }
}

const getButtonVariant = label => {
  if (label === '=') return 'elevated'
  if (isOperator(label)) return 'tonal'
  return 'outlined'
}

const getButtonColor = label => {
  if (label === '=') return 'primary'
  if (isOperator(label)) return 'secondary'
  if (isNumber(label)) return 'surface-variant'
  return 'surface-variant'
}

const handleKeyPress = e => {
  const key = e.key
  if (/^[0-9+\-*/.=]$/.test(key)) {
    if (key === '=') {
      handleClick('=')
    } else {
      display.value += key
    }
  } else if (key === 'Enter') {
    handleClick('=')
  } else if (key === 'Escape' || key === 'c') {
    clear()
  } else if (key === 'Backspace') {
    backspace()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <v-container class="calculator-container">
    <v-card 
      class="calculator-card elevation-0"
      flat
    >
      <!-- Header -->
      <v-card-title class="calculator-header">
        <v-icon 
          icon="mdi-calculator-variant" 
          class="mr-2 text-primary"
          size="large"
        />
        Standard Calculator
      </v-card-title>

      <!-- Display Section -->
      <v-card-text class="pa-4">
        <!-- History Panel -->
        <v-expand-transition>
          <div 
            v-if="history.length && showHistory"
            class="history-panel mb-4"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-subtitle-2 text-medium-emphasis">History</span>
              <v-btn
                icon="mdi-delete-sweep"
                variant="text"
                size="small"
                @click="clearHistory"
              />
            </div>
            <div class="history-list">
              <div
                v-for="(item, idx) in history.slice(0, 5)"
                :key="idx"
                class="history-item text-caption"
                @click="loadFromHistory(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </v-expand-transition>

        <!-- Main Display -->
        <div class="display-container mb-4">
          <v-text-field
            v-model="display"
            readonly
            variant="solo"
            hide-details
            class="display-field"
            :class="{ 'display-error': display === 'Error' }"
            single-line
          >
            <template #prepend-inner>
              <v-btn
                v-if="history.length"
                icon="mdi-history"
                variant="text"
                size="small"
                @click="toggleHistory"
              />
            </template>
          </v-text-field>
          <div class="display-overlay">
            <span 
              v-if="!display" 
              class="placeholder-text"
            >
              Enter calculation
            </span>
          </div>
        </div>

        <!-- Button Grid -->
        <div class="button-grid">
          <!-- Memory and Clear Row -->
          <div class="button-row mb-2">
            <v-btn
              variant="outlined"
              color="error"
              size="large"
              class="flex-grow-1 mr-2"
              @click="clear"
            >
              <v-icon 
                icon="mdi-backspace" 
                class="mr-1" 
              />
              Clear
            </v-btn>
            <v-btn
              variant="outlined"
              color="warning"
              size="large"
              class="flex-grow-1"
              @click="backspace"
            >
              <v-icon icon="mdi-backspace-outline" />
            </v-btn>
          </div>

          <!-- Main Calculator Grid -->
          <v-row dense>
            <v-col
              v-for="button in buttons"
              :key="button.label"
              cols="3"
            >
              <v-btn
                block
                size="x-large"
                :variant="getButtonVariant(button.label)"
                :color="getButtonColor(button.label)"
                class="calculator-btn"
                @click="handleClick(button.label)"
              >
                <span class="button-text">{{ button.label }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Keyboard Shortcuts Info -->
        <div class="keyboard-info mt-4">
          <v-chip
            size="small"
            variant="tonal"
            class="mr-1 mb-1"
          >
            <v-icon 
              icon="mdi-keyboard" 
              size="small" 
              class="mr-1" 
            />
            Keyboard Supported
          </v-chip>
          <v-tooltip 
            text="Use your keyboard for calculations. Press 'c' or Escape to clear, Enter for equals"
            location="top"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-information" 
                size="small" 
                class="text-medium-emphasis"
                v-bind="props"
              />
            </template>
          </v-tooltip>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.calculator-container {
  max-width: 450px;
  margin: 0 auto;
  padding: 16px;
  --input-text-color: rgb(var(--v-theme-on-surface));
  --input-bg-color: rgb(var(--v-theme-surface-container-high));
}

.calculator-card {
  border-radius: 16px !important;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.calculator-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white !important;
  border-radius: 16px 16px 0 0 !important;
  padding: 20px 24px;
  font-size: 1.25rem;
  font-weight: 600;
}

.history-panel {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.history-list {
  max-height: 120px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 12px;
  margin: 2px 0;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.history-item:hover {
  background: rgb(var(--v-theme-primary-container));
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-1px);
}

.display-container {
  position: relative;
}

.display-field {
  font-size: 1.5rem !important;
  font-weight: 500;
  text-align: right;
}

.display-field :deep(.v-input__control) {
  min-height: 64px !important;
}

.display-field :deep(.v-field__input) {
  font-size: 1.5rem !important;
  font-weight: 500;
  text-align: right;
  padding: 16px !important;
  background: var(--input-bg-color);
  border-radius: 12px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  color: var(--input-text-color) !important;
}

.display-field :deep(.v-field__field) {
  color: var(--input-text-color) !important;
}

.display-field :deep(input) {
  color: var(--input-text-color) !important;
  caret-color: rgb(var(--v-theme-primary)) !important;
  -webkit-text-fill-color: var(--input-text-color) !important;
}

/* Ensure text is visible in all states */
.display-field :deep(.v-field--variant-solo .v-field__field) {
  color: var(--input-text-color) !important;
}

.display-field :deep(.v-field--variant-solo .v-field__input) {
  color: var(--input-text-color) !important;
}

/* Additional text visibility fixes */
.display-field :deep(.v-field .v-field__field input) {
  color: var(--input-text-color) !important;
  -webkit-text-fill-color: var(--input-text-color) !important;
}

.display-field :deep(.v-field .v-field__field .v-field__input) {
  color: var(--input-text-color) !important;
}

.display-error :deep(.v-field__input) {
  background: rgb(var(--v-theme-error-container)) !important;
  color: rgb(var(--v-theme-on-error-container)) !important;
}

.display-overlay {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.placeholder-text {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 1rem;
  opacity: 0.7;
}

.button-grid {
  margin-top: 16px;
}

.button-row {
  display: flex;
  gap: 8px;
}

.calculator-btn {
  height: 64px !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  transition: all 0.2s ease;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.calculator-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.calculator-btn:active {
  transform: translateY(0);
}

.button-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.keyboard-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .calculator-container {
    padding: 8px;
  }
  
  .calculator-btn {
    height: 56px !important;
    font-size: 1.1rem !important;
  }
  
  .display-field :deep(.v-field__input) {
    font-size: 1.25rem !important;
    padding: 12px !important;
  }
  
  .calculator-header {
    padding: 16px;
    font-size: 1.1rem;
  }
}

/* Light theme text visibility */
.v-theme--light .calculator-container {
  --input-text-color: rgb(var(--v-theme-on-surface));
  --input-bg-color: rgb(var(--v-theme-surface-container));
}

.v-theme--light .display-field :deep(.v-field__input) {
  background: var(--input-bg-color) !important;
  color: var(--input-text-color) !important;
}

.v-theme--light .display-field :deep(.v-field__field) {
  color: var(--input-text-color) !important;
}

.v-theme--light .display-field :deep(input) {
  color: var(--input-text-color) !important;
}

/* Dark theme adjustments */
.v-theme--dark .calculator-container {
  --input-text-color: rgb(var(--v-theme-on-surface));
  --input-bg-color: rgb(var(--v-theme-surface-container-high));
}

.v-theme--dark .calculator-card {
  background: rgb(var(--v-theme-surface));
  border-color: rgb(var(--v-theme-outline));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .calculator-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: rgb(var(--v-theme-on-primary)) !important;
}

.v-theme--dark .history-panel {
  background: rgb(var(--v-theme-surface-container-high));
  border-color: rgb(var(--v-theme-outline));
}

.v-theme--dark .history-item {
  background: rgb(var(--v-theme-surface-container));
  color: rgb(var(--v-theme-on-surface));
}

.v-theme--dark .history-item:hover {
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
  border-color: rgb(var(--v-theme-primary));
}

.v-theme--dark .display-field :deep(.v-field__input) {
  background: rgb(var(--v-theme-surface-container-high)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgb(var(--v-theme-outline));
}

.v-theme--dark .display-field :deep(.v-field__field) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--dark .display-field :deep(input) {
  color: rgb(var(--v-theme-on-surface)) !important;
  caret-color: rgb(var(--v-theme-primary)) !important;
}

.v-theme--dark .display-error :deep(.v-field__input) {
  background: rgb(var(--v-theme-error-container)) !important;
  color: rgb(var(--v-theme-on-error-container)) !important;
}

.v-theme--dark .placeholder-text {
  color: rgb(var(--v-theme-on-surface-variant));
}

.v-theme--dark .calculator-btn {
  border-color: rgb(var(--v-theme-outline));
}

.v-theme--dark .calculator-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.v-theme--dark .keyboard-info {
  border-color: rgb(var(--v-theme-outline));
}
</style>
