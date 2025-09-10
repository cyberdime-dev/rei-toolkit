<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const display = ref('')
const history = ref([])

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

// Safe mathematical expression evaluator
const safeEval = expression => {
  try {
    // Remove any characters that aren't numbers, operators, or decimal points
    const cleanExpression = expression.replace(/[^0-9+\-*/.()]/g, '')

    // Basic validation - ensure it's a valid mathematical expression
    if (!/^[0-9+\-*/.()\s]+$/.test(cleanExpression)) {
      throw new Error('Invalid expression')
    }

    // Use Function constructor instead of eval for safer evaluation
    // This is still not 100% safe but better than eval for mathematical expressions
    const result = new Function('return ' + cleanExpression)()

    // Check if result is a valid number
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result')
    }

    return result
  } catch {
    throw new Error('Invalid expression')
  }
}

const handleClick = label => {
  if (label === '=') {
    try {
      const result = safeEval(display.value)
      history.value.unshift(`${display.value} = ${result}`)
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
    display.value = display.value.slice(0, -1)
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
  <v-card class="pa-4 max-w-md mx-auto mobile-card">
    <div
      v-if="history.length"
      class="mb-2"
    >
      <v-list density="compact">
        <v-list-item
          v-for="(item, idx) in history.slice(0, 5)"
          :key="idx"
        >
          <v-list-item-title class="text-caption">
            {{ item }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider class="mb-2" />
    </div>
    <v-text-field
      v-model="display"
      readonly
      hide-details
      class="mb-4"
      bg-color="light-blue-lighten-4"
    />
    <v-row dense>
      <v-col
        v-for="button in buttons"
        :key="button.label"
        cols="3"
      >
        <v-btn
          block
          :color="
            isOperator(button.label)
              ? 'blue-grey-darken-1'
              : 'blue-grey-lighten-3'
          "
          @click="handleClick(button.label)"
        >
          {{ button.label }}
        </v-btn>
      </v-col>
    </v-row>

    <v-btn
      block
      color="deep-orange lighten-1"
      class="mt-2"
      @click="clear"
    >
      Clear
    </v-btn>
  </v-card>
</template>
