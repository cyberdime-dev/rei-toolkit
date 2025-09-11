<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- Header -->
        <v-row class="align-center mb-4">
          <v-col>
            <h1 class="text-h4 font-weight-bold">
              Preferences
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Customize your REI Toolkit experience
            </p>
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="primary"
              prepend-icon="mdi-backup-restore"
              variant="outlined"
              @click="resetToDefaults"
            >
              Reset to Defaults
            </v-btn>
          </v-col>
        </v-row>

        <v-row>
          <!-- Settings Sections -->
          <v-col
            cols="12"
            lg="8"
          >
            <!-- Appearance Settings -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon
                  icon="mdi-palette"
                  class="me-2"
                />
                Appearance
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Dark Mode</v-list-item-title>
                    <v-list-item-subtitle>
                      Switch between light and dark themes
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.darkMode"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Navigation Drawer</v-list-item-title>
                    <v-list-item-subtitle>
                      Keep navigation drawer open by default on desktop
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.drawerPersistent"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Drawer Width</v-list-item-title>
                    <v-list-item-subtitle>
                      Adjust navigation drawer width (250-400px)
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex align-center">
                        <span class="text-caption me-2">{{ settings.drawerWidth }}px</span>
                        <v-slider
                          v-model="settings.drawerWidth"
                          :min="250"
                          :max="400"
                          :step="10"
                          style="width: 120px;"
                          hide-details
                        />
                      </div>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Compact Mode</v-list-item-title>
                    <v-list-item-subtitle>
                      Use smaller padding and spacing for more content
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.compactMode"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Calculator Settings -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon
                  icon="mdi-calculator"
                  class="me-2"
                />
                Calculator Preferences
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Default Calculator</v-list-item-title>
                    <v-list-item-subtitle>
                      Calculator to open when visiting the app
                    </v-list-item-subtitle>
                    <template #append>
                      <v-select
                        v-model="settings.defaultCalculator"
                        :items="calculatorOptions"
                        variant="outlined"
                        density="compact"
                        style="width: 200px;"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Currency Format</v-list-item-title>
                    <v-list-item-subtitle>
                      Display format for currency values
                    </v-list-item-subtitle>
                    <template #append>
                      <v-select
                        v-model="settings.currency"
                        :items="currencyOptions"
                        variant="outlined"
                        density="compact"
                        style="width: 150px;"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Auto-Save Calculations</v-list-item-title>
                    <v-list-item-subtitle>
                      Automatically save calculation results for quick access
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.autoSave"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Show Advanced Metrics</v-list-item-title>
                    <v-list-item-subtitle>
                      Display additional metrics like IRR, NPV, etc.
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.showAdvancedMetrics"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Decimal Precision</v-list-item-title>
                    <v-list-item-subtitle>
                      Number of decimal places for calculations (0-4)
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex align-center">
                        <span class="text-caption me-2">{{ settings.decimalPrecision }}</span>
                        <v-slider
                          v-model="settings.decimalPrecision"
                          :min="0"
                          :max="4"
                          :step="1"
                          style="width: 100px;"
                          hide-details
                        />
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Data & Privacy -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon
                  icon="mdi-database"
                  class="me-2"
                />
                Data & Privacy
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Save Data Locally</v-list-item-title>
                    <v-list-item-subtitle>
                      Store deals and calculations in browser storage
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.saveDataLocally"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Analytics</v-list-item-title>
                    <v-list-item-subtitle>
                      Help improve the app by sharing anonymous usage data
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.analytics"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Export Data</v-list-item-title>
                    <v-list-item-subtitle>
                      Download all your data as JSON backup
                    </v-list-item-subtitle>
                    <template #append>
                      <v-btn
                        variant="outlined"
                        size="small"
                        prepend-icon="mdi-download"
                        @click="exportData"
                      >
                        Export
                      </v-btn>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Clear All Data</v-list-item-title>
                    <v-list-item-subtitle>
                      Remove all stored deals, calculations, and preferences
                    </v-list-item-subtitle>
                    <template #append>
                      <v-btn
                        color="error"
                        variant="outlined"
                        size="small"
                        prepend-icon="mdi-delete-sweep"
                        @click="confirmClearData"
                      >
                        Clear Data
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Cloud Sync Settings -->
            <SyncSettings class="mb-4" />

            <!-- Notifications -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon
                  icon="mdi-bell"
                  class="me-2"
                />
                Notifications
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>News Updates</v-list-item-title>
                    <v-list-item-subtitle>
                      Show notifications for new market updates
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.newsNotifications"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Calculation Reminders</v-list-item-title>
                    <v-list-item-subtitle>
                      Remind to review saved calculations periodically
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.calculationReminders"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Feature Updates</v-list-item-title>
                    <v-list-item-subtitle>
                      Notify about new features and improvements
                    </v-list-item-subtitle>
                    <template #append>
                      <v-switch
                        v-model="settings.featureUpdates"
                        color="primary"
                        hide-details
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Settings Summary Sidebar -->
          <v-col
            cols="12"
            lg="4"
          >
            <v-card sticky>
              <v-card-title>Current Settings</v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Theme</v-list-item-title>
                    <v-list-item-subtitle>{{ settings.darkMode ? 'Dark' : 'Light' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Default Calculator</v-list-item-title>
                    <v-list-item-subtitle>{{ getCalculatorTitle(settings.defaultCalculator) }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Currency</v-list-item-title>
                    <v-list-item-subtitle>{{ settings.currency }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Drawer Width</v-list-item-title>
                    <v-list-item-subtitle>{{ settings.drawerWidth }}px</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-divider class="my-3" />

                <div class="text-caption text-medium-emphasis">
                  <p class="mb-2">
                    <strong>Storage Usage:</strong>
                  </p>
                  <p class="mb-1">
                    Deals: {{ storageStats.deals }} items
                  </p>
                  <p class="mb-1">
                    News Cache: {{ storageStats.newsCache }} articles
                  </p>
                  <p class="mb-1">
                    Total: ~{{ storageStats.totalSize }}KB
                  </p>
                </div>

                <v-divider class="my-3" />

                <div class="text-caption text-medium-emphasis">
                  <p>
                    <strong>Last Updated:</strong><br />
                    {{ lastSavedTime }}
                  </p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Confirmation Dialogs -->
    <v-dialog
      v-model="showResetDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Reset Settings</v-card-title>
        <v-card-text>
          Are you sure you want to reset all settings to their default values? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="showResetDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            @click="performReset"
          >
            Reset
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showClearDataDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Clear All Data</v-card-title>
        <v-card-text>
          <v-alert
            type="warning"
            class="mb-3"
          >
            This will permanently delete all your deals, calculations, and preferences. This action cannot be undone.
          </v-alert>
          <p>Are you sure you want to continue?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="showClearDataDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="performClearData"
          >
            Clear All Data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Messages -->
    <v-snackbar
      v-model="showSuccessMessage"
      :timeout="3000"
      color="success"
    >
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar
      v-model="showErrorMessage"
      :timeout="5000"
      color="error"
    >
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import dealManager from '@/utils/dealManager.js'
import newsManager from '@/utils/newsManager.js'
import SyncSettings from './SyncSettings.vue'

const theme = useTheme()

// Reactive state
const settings = ref({
  // Appearance
  darkMode: false,
  drawerPersistent: true,
  drawerWidth: 300,
  compactMode: false,
  
  // Calculator
  defaultCalculator: 'standard',
  currency: 'USD',
  autoSave: true,
  showAdvancedMetrics: false,
  decimalPrecision: 2,
  
  // Data & Privacy
  saveDataLocally: true,
  analytics: false,
  
  // Notifications
  newsNotifications: true,
  calculationReminders: false,
  featureUpdates: true,
})

const showResetDialog = ref(false)
const showClearDataDialog = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')
const showErrorMessage = ref(false)
const errorMessage = ref('')
const lastSavedTime = ref('')

// Options
const calculatorOptions = [
  { title: 'Standard Calculator', value: 'standard' },
  { title: 'Mortgage Calculator', value: 'mortgage' },
  { title: 'Fix & Flip Calculator', value: 'fix-flip' },
  { title: 'Buy & Hold Calculator', value: 'buy-hold' },
  { title: 'BRRR Calculator', value: 'brrr' },
  { title: 'Wholesale Calculator', value: 'wholesale' },
  { title: 'NOI Calculator', value: 'noi' },
  { title: 'Cash-on-Cash Calculator', value: 'cash-on-cash' },
  { title: 'Cashflow Calculator', value: 'cashflow' },
  { title: 'Cap Rate Calculator', value: 'cap-rate' },
]

const currencyOptions = [
  { title: 'US Dollar ($)', value: 'USD' },
  { title: 'Euro (€)', value: 'EUR' },
  { title: 'British Pound (£)', value: 'GBP' },
  { title: 'Canadian Dollar (C$)', value: 'CAD' },
  { title: 'Australian Dollar (A$)', value: 'AUD' },
]

// Computed properties
const storageStats = computed(() => {
  try {
    const deals = dealManager.getAllDeals().length
    const newsCache = newsManager.getAllArticles().length
    
    // Rough estimate of localStorage usage
    let totalSize = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length
      }
    }
    
    return {
      deals,
      newsCache,
      totalSize: Math.round(totalSize / 1024), // Convert to KB
    }
  } catch {
    return { deals: 0, newsCache: 0, totalSize: 0 }
  }
})

// Watchers for auto-save
watch(settings, (newSettings) => {
  saveSettings(newSettings)
}, { deep: true })

watch(() => settings.value.darkMode, (isDark) => {
  try {
    if (theme.global) {
      theme.global.name.value = isDark ? 'dark' : 'light'
    }
  } catch (error) {
    console.warn('Theme change failed:', error)
  }
})

// Methods
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('rei_toolkit_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
      updateLastSavedTime()
    }
    
    // Apply theme
    if (theme.global) {
      theme.global.name.value = settings.value.darkMode ? 'dark' : 'light'
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    showError('Failed to load settings')
  }
}

const saveSettings = (settingsToSave) => {
  try {
    localStorage.setItem('rei_toolkit_settings', JSON.stringify(settingsToSave))
    updateLastSavedTime()
  } catch (error) {
    console.error('Error saving settings:', error)
    showError('Failed to save settings')
  }
}

const updateLastSavedTime = () => {
  lastSavedTime.value = new Date().toLocaleString()
}

const resetToDefaults = () => {
  showResetDialog.value = true
}

const performReset = () => {
  const defaults = {
    darkMode: false,
    drawerPersistent: true,
    drawerWidth: 300,
    compactMode: false,
    defaultCalculator: 'standard',
    currency: 'USD',
    autoSave: true,
    showAdvancedMetrics: false,
    decimalPrecision: 2,
    saveDataLocally: true,
    analytics: false,
    newsNotifications: true,
    calculationReminders: false,
    featureUpdates: true,
  }
  
  settings.value = { ...defaults }
  showResetDialog.value = false
  showSuccess('Settings reset to defaults')
}

const exportData = () => {
  try {
    const exportData = {
      settings: settings.value,
      deals: dealManager.getAllDeals(),
      timestamp: new Date().toISOString(),
      version: '1.0',
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new window.Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `rei-toolkit-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    showSuccess('Data exported successfully')
  } catch (error) {
    console.error('Error exporting data:', error)
    showError('Failed to export data')
  }
}

const confirmClearData = () => {
  showClearDataDialog.value = true
}

const performClearData = () => {
  try {
    // Clear all localStorage data
    const keysToRemove = []
    for (const key in localStorage) {
      if (key.startsWith('rei_toolkit_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Reset settings to defaults
    performReset()
    
    showClearDataDialog.value = false
    showSuccess('All data cleared successfully')
    
    // Reload page to reset state
    window.setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    console.error('Error clearing data:', error)
    showError('Failed to clear data')
  }
}

const getCalculatorTitle = (value) => {
  const option = calculatorOptions.find(opt => opt.value === value)
  return option ? option.title : value
}

const showSuccess = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
}

const showError = (message) => {
  errorMessage.value = message
  showErrorMessage.value = true
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.v-card {
  transition: none;
}

.sticky {
  position: sticky;
  top: 24px;
}
</style>
