<script setup>
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

function getThemeName() {
  // Prefer explicit name ref when available
  if (theme && theme.global) {
    if (theme.global.name && 'value' in theme.global.name) return theme.global.name.value
    if (theme.global.current && typeof theme.global.current.value === 'string') return theme.global.current.value
  }
  // As a last resort, try top-level shape
  if (typeof theme.change === 'function' && theme.global && theme.global.current && typeof theme.global.current.value === 'object') {
    // some shapes expose current.value as object with .dark boolean
    return theme.global.current.value.dark ? 'dark' : 'light'
  }
  return 'light'
}

const isDarkTheme = ref(getThemeName() === 'dark')

watch(isDarkTheme, (val) => {
  const name = val ? 'dark' : 'light'
  // Preferred API: theme.change(name)
  if (typeof theme.change === 'function') {
    try {
      theme.change(name)
      localStorage.setItem('theme', name)
      return
    } catch {
      // if change fails, fall through to fallbacks
    }
  }

  // Fallbacks (only used if theme.change is not available or failed):
  try {
    if (theme.global && theme.global.name && 'value' in theme.global.name) {
      theme.global.name.value = name
    } else if (theme.global && theme.global.current) {
      // current.value may be string or object depending on Vuetify version
      if (typeof theme.global.current.value === 'string') theme.global.current.value = name
      else if (typeof theme.global.current.value === 'object') theme.global.current.value = { ...theme.global.current.value, dark: val }
    }
  } catch {
    // intentionally noop
  }

  localStorage.setItem('theme', name)
})
</script>

<template>
  <v-switch
    v-model="isDarkTheme"
    label="Dark Mode"
    hide-details
    inset
  />
</template>
