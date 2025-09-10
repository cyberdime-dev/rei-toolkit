<script setup>
import { ref } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDarkTheme = ref(theme.global.name.value === 'dark')

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  theme.global.name.value = isDarkTheme.value ? 'dark' : 'light'
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
}
</script>

<template>
  <v-switch
    v-model="isDarkTheme"
    label="Dark Mode"
    @change="toggleTheme"
    hide-details
    inset
  />
</template>
