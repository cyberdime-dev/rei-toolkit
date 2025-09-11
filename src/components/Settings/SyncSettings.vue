<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon
        icon="mdi-cloud-sync"
        class="me-2"
      />
      Cloud Sync Settings
    </v-card-title>
    
    <v-card-text>
      <!-- Premium Status -->
      <div class="mb-6">
        <v-alert
          v-if="!isPremium"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <div class="d-flex align-center">
            <div class="flex-grow-1">
              <div class="font-weight-medium">
                Upgrade to unlock Cloud Sync
              </div>
              <div class="text-caption">
                Sync your deals and settings across all devices
              </div>
            </div>
            <v-btn
              color="primary"
              variant="elevated"
              @click="$router.push('/pricing')"
            >
              Upgrade
            </v-btn>
          </div>
        </v-alert>
        
        <v-alert
          v-else
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-medium">
            Cloud Sync Active
          </div>
          <div class="text-caption">
            Your data is automatically synced across devices
          </div>
        </v-alert>
      </div>
      
      <!-- Sync Status -->
      <div class="mb-6">
        <h4 class="text-subtitle-1 mb-3">
          Current Status
        </h4>
        
        <v-list-item
          :prepend-icon="statusIcon"
          :title="statusTitle"
          :subtitle="statusSubtitle"
          class="px-0"
        >
          <template #append>
            <v-chip
              :color="statusColor"
              size="small"
              variant="tonal"
            >
              {{ syncStatus.status }}
            </v-chip>
          </template>
        </v-list-item>
        
        <div
          v-if="syncStatus.lastSync"
          class="text-caption text-medium-emphasis mt-2"
        >
          Last sync: {{ formatLastSync(syncStatus.lastSync) }}
        </div>
      </div>
      
      <!-- Sync Controls -->
      <div
        v-if="isPremium"
        class="mb-6"
      >
        <h4 class="text-subtitle-1 mb-3">
          Sync Actions
        </h4>
        
        <div class="d-flex flex-column gap-3">
          <v-btn
            variant="outlined"
            :disabled="!canSync"
            :loading="syncing"
            @click="performSync"
          >
            <v-icon
              icon="mdi-sync"
              class="me-2"
            />
            Sync Now
          </v-btn>
          
          <v-btn
            v-if="syncStatus.conflictCount > 0"
            color="warning"
            variant="outlined"
            @click="showConflictResolution"
          >
            <v-icon
              icon="mdi-alert"
              class="me-2"
            />
            Resolve {{ syncStatus.conflictCount }} Conflicts
          </v-btn>
        </div>
      </div>
      
      <!-- Sync Preferences -->
      <div
        v-if="isPremium"
        class="mb-6"
      >
        <h4 class="text-subtitle-1 mb-3">
          Sync Preferences
        </h4>
        
        <v-switch
          v-model="syncSettings.autoSync"
          label="Automatic sync"
          :disabled="!isPremium"
          density="compact"
          hide-details
          @update:model-value="updateSyncSettings"
        />
        
        <v-switch
          v-model="syncSettings.syncOnStartup"
          label="Sync when app starts"
          :disabled="!isPremium"
          density="compact"
          hide-details
          class="mt-2"
          @update:model-value="updateSyncSettings"
        />
        
        <v-switch
          v-model="syncSettings.conflictNotifications"
          label="Notify about sync conflicts"
          :disabled="!isPremium"
          density="compact"
          hide-details
          class="mt-2"
          @update:model-value="updateSyncSettings"
        />
      </div>
      
      <!-- Data Usage Info -->
      <div class="mb-6">
        <h4 class="text-subtitle-1 mb-3">
          Storage Usage
        </h4>
        
        <v-list class="bg-transparent">
          <v-list-item
            title="Local Storage"
            :subtitle="`${localStorageUsage} used`"
            prepend-icon="mdi-harddisk"
          />
          <v-list-item
            v-if="isPremium"
            title="Cloud Storage"
            :subtitle="`${cloudStorageUsage} used`"
            prepend-icon="mdi-cloud"
          />
          <v-list-item
            title="Deals"
            :subtitle="`${dealsCount} deals stored`"
            prepend-icon="mdi-home"
          />
        </v-list>
      </div>
      
      <!-- Advanced Options -->
      <v-expansion-panels
        v-if="isPremium"
        variant="accordion"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon
              icon="mdi-cog"
              class="me-2"
            />
            Advanced Options
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="py-3">
              <v-btn
                variant="outlined"
                color="warning"
                block
                class="mb-3"
                @click="clearLocalData"
              >
                <v-icon
                  icon="mdi-delete-sweep"
                  class="me-2"
                />
                Clear Local Data
              </v-btn>
              
              <v-btn
                variant="outlined"
                color="error"
                block
                @click="resetCloudData"
              >
                <v-icon
                  icon="mdi-cloud-refresh"
                  class="me-2"
                />
                Reset Cloud Data
              </v-btn>
              
              <v-alert
                type="warning"
                variant="tonal"
                class="mt-3"
              >
                <div class="text-caption">
                  <strong>Warning:</strong> These actions are permanent and cannot be undone.
                  Make sure you have backups before proceeding.
                </div>
              </v-alert>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive data
const syncStatus = ref({
  status: 'idle',
  lastSync: null,
  isOnline: true,
  isPremium: false,
  conflictCount: 0,
})

const syncSettings = ref({
  autoSync: true,
  syncOnStartup: true,
  conflictNotifications: true,
})

const syncing = ref(false)
const localStorageUsage = ref('0 KB')
const cloudStorageUsage = ref('0 KB')
const dealsCount = ref(0)

// Computed properties
const isPremium = computed(() => syncStatus.value.isPremium)

const canSync = computed(() => {
  return isPremium.value && 
         syncStatus.value.isOnline && 
         syncStatus.value.status !== 'syncing'
})

const statusIcon = computed(() => {
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'mdi-sync'
    case 'synced':
      return 'mdi-cloud-check'
    case 'error':
      return 'mdi-cloud-alert'
    case 'offline':
      return 'mdi-cloud-off'
    case 'conflict':
      return 'mdi-alert'
    default:
      return 'mdi-cloud'
  }
})

const statusColor = computed(() => {
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'info'
    case 'synced':
      return 'success'
    case 'error':
      return 'error'
    case 'offline':
      return 'warning'
    case 'conflict':
      return 'warning'
    default:
      return 'default'
  }
})

const statusTitle = computed(() => {
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'Synchronizing...'
    case 'synced':
      return 'Up to date'
    case 'error':
      return 'Sync failed'
    case 'offline':
      return 'Offline'
    case 'conflict':
      return 'Conflicts detected'
    default:
      return isPremium.value ? 'Ready to sync' : 'Not available'
  }
})

const statusSubtitle = computed(() => {
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'Your data is being synchronized'
    case 'synced':
      return 'All your data is synchronized'
    case 'error':
      return 'Unable to sync data'
    case 'offline':
      return 'No internet connection'
    case 'conflict':
      return `${syncStatus.value.conflictCount} conflicts need resolution`
    default:
      return isPremium.value ? 'Cloud sync is available' : 'Upgrade to enable cloud sync'
  }
})

// Methods
const performSync = async () => {
  try {
    syncing.value = true
    
    // Import cloudSyncService dynamically
    const { cloudSyncService } = await import('@/services/cloudSyncService.js')
    await cloudSyncService.forceSync()
    
  } catch (error) {
    console.error('Sync failed:', error)
  } finally {
    syncing.value = false
  }
}

const updateSyncSettings = () => {
  // Save sync settings to local storage
  localStorage.setItem('sync_settings', JSON.stringify(syncSettings.value))
}

const showConflictResolution = () => {
  // Emit event or navigate to conflict resolution
  console.log('Show conflict resolution dialog')
}

const clearLocalData = async () => {
  if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
    try {
      // Clear local storage
      const { storageService } = await import('@/services/storageService.js')
      storageService.clear()
      
      // Refresh storage usage
      await loadStorageUsage()
      
    } catch (error) {
      console.error('Failed to clear local data:', error)
    }
  }
}

const resetCloudData = async () => {
  if (window.confirm('Are you sure you want to reset all cloud data? This action cannot be undone.')) {
    try {
      // TODO: Implement cloud data reset
      console.log('Reset cloud data')
      
    } catch (error) {
      console.error('Failed to reset cloud data:', error)
    }
  }
}

const formatLastSync = (timestamp) => {
  if (!timestamp) return 'Never'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
  return date.toLocaleDateString()
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const loadStorageUsage = async () => {
  try {
    // Get local storage usage
    let localUsage = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        localUsage += localStorage[key].length
      }
    }
    localStorageUsage.value = formatBytes(localUsage)
    
    // Get deals count
    const { storageService } = await import('@/services/storageService.js')
    const deals = storageService.getItem('deals') || []
    dealsCount.value = deals.length
    
    // Cloud storage would need API call
    cloudStorageUsage.value = '0 KB' // Placeholder
    
  } catch (error) {
    console.error('Failed to load storage usage:', error)
  }
}

const loadSyncSettings = () => {
  try {
    const saved = localStorage.getItem('sync_settings')
    if (saved) {
      syncSettings.value = { ...syncSettings.value, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error('Failed to load sync settings:', error)
  }
}

const updateSyncStatus = (status) => {
  syncStatus.value = { ...syncStatus.value, ...status }
}

// Lifecycle
onMounted(async () => {
  try {
    // Load sync settings
    loadSyncSettings()
    
    // Load storage usage
    await loadStorageUsage()
    
    // Get initial sync status
    const { cloudSyncService } = await import('@/services/cloudSyncService.js')
    updateSyncStatus(cloudSyncService.getSyncStatus())
    
    // Subscribe to status changes
    cloudSyncService.onSyncStatusChange(updateSyncStatus)
    
  } catch (error) {
    console.error('Failed to initialize sync settings:', error)
  }
})
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>
