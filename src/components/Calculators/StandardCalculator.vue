<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const display = ref('')

const buttons = [
  { label: '7' }, { label: '8' }, { label: '9' }, { label: '/' },
  { label: '4' }, { label: '5' }, { label: '6' }, { label: '*' },
  { label: '1' }, { label: '2' }, { label: '3' }, { label: '-' },
  { label: '0' }, { label: '.' }, { label: '=' }, { label: '+' }
]

const isOperator = (val) => ['/', '*', '-', '+', '='].includes(val)

const handleClick = (label) => {
  if (label === '=') {
    try {
      display.value = eval(display.value).toString()
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

const handleKeyPress = (e) => {
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
  <v-card class="pa-4 max-w-md mx-auto">
    <v-text-field v-model="display" readonly hide-details class="mb-4" />
    <v-row dense>
      <v-col v-for="button in buttons" :key="button.label" cols="3">
        <v-btn
          block
          :color="isOperator(button.label) ? 'deep-purple' : 'grey lighten-2'"
          @click="handleClick(button.label)"
        >
          {{ button.label }}
        </v-btn>
      </v-col>
    </v-row>

    <v-btn block color="red lighten-1" class="mt-2" @click="clear">Clear</v-btn>
  </v-card>
</template>

