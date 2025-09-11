/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const savedTheme = localStorage.getItem('theme')
const isDark = savedTheme ? savedTheme === 'dark' : prefersDark

const vuetify = createVuetify({
  theme: {
    defaultTheme: isDark ? 'dark' : 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F7F9FB',
          surface: '#FFFFFF',
          primary: '#1E88E5',
          secondary: '#546E7A',
          success: '#43A047',
          warning: '#FB8C00',
          error: '#E53935',
          info: '#2196F3',
          'on-primary': '#FFFFFF',
          'on-surface': '#1A1A1A',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          primary: '#64B5F6',
          secondary: '#80CBC4',
          success: '#81C784',
          warning: '#FFB74D',
          error: '#EF5350',
          info: '#4FC3F7',
          'on-primary': '#000000',
          'on-surface': '#E0E0E0',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  components,
  directives,
})

export default vuetify
