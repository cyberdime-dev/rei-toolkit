<template>
  <div class="sync-status-indicator">
    <!-- Sync Status Badge -->
    <v-tooltip
      :text="tooltipText"
      location="bottom"
    >
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          :color="statusColor"
          :variant="chipVariant"
          size="small"
          class="sync-chip"
          @click="handleChipClick"
        >
          <v-icon
            :icon="statusIcon"
            size="16"
            class="me-1"
          />
          {{ statusText }}
          
          <!-- Loading animation for syncing state -->
          <v-progress-circular
            v-if="syncStatus.status === 'syncing'"
            indeterminate
            size="12"
            width="2"
            class="ms-1"
          />
        </v-chip>
      </template>
    </v-tooltip>
    
    <!-- Conflict Resolution Dialog -->
    <v-dialog
      v-model="conflictDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title class="text-h6">
          <v-icon
            icon="mdi-alert"
            color="warning"
            class="me-2"
          />
          Sync Conflict Detected
        </v-card-title>
        
        <v-card-text>
          <p class="mb-4">
            Your data has been modified on multiple devices. Please choose how to resolve this conflict:
          </p>
          
          <v-radio-group v-model="conflictResolution">
            <v-radio
              value="keep_local"
              label="Keep local changes (overwrite cloud)"
            />
            <v-radio
              value="keep_cloud"
              label="Keep cloud changes (overwrite local)"
            />
            <v-radio
              value="merge"
              label="Merge changes (recommended)"
            />
          </v-radio-group>
          
          <v-alert
            type="info"
            variant="tonal"
            class="mt-4"
          >
            <strong>Tip:</strong> The merge option will combine changes from both devices when possible.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="conflictDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="resolvingConflict"
            @click="resolveConflict"
          >
            Resolve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Sync Settings Dialog -->
    <v-dialog
      v-model="settingsDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-h6">
          Cloud Sync Settings
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">
              Sync Status
            </h4>
            <v-list-item
              :prepend-icon="statusIcon"
              :title="statusText"
              :subtitle="lastSyncText"
            />
          </div>
          
          <v-divider class="my-4" />
          
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">
              Quick Actions
            </h4>
            
            <v-btn
              variant="outlined"
              block
              class="mb-2"
              :disabled="!canSync"
              :loading="forcingSyncSync"
              @click="forceSync"
            >
              <v-icon
                icon="mdi-sync"
                class="me-2"
              />
              Force Sync Now
            </v-btn>
            
            <v-btn
              v-if="!isPremium"
              color="primary"
              variant="elevated"
              block
              @click="() => $router.push('/pricing')"
            >
              <v-icon
                icon="mdi-crown"
                class="me-2"
              />
              Upgrade for Cloud Sync
            </v-btn>
          </div>
          
          <v-divider class="my-4" />
          
          <div class="text-caption text-medium-emphasis">
            <p class="mb-2">
              <strong>Cloud Sync Benefits:</strong>
            </p>
            <ul class="ps-4">
              <li>Access your deals from any device</li>
              <li>Real-time collaboration with team members</li>
              <li>Automatic backup and recovery</li>
              <li>Conflict resolution for simultaneous edits</li>
            </ul>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="settingsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  showText: {
    type: Boolean,
    default: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

// Reactive data
const syncStatus = ref({
  status: 'idle',
  lastSync: null,
  isOnline: true,
  isPremium: false,
  conflictCount: 0,
})

const conflictDialog = ref(false)
const settingsDialog = ref(false)
const conflictResolution = ref('merge')
const resolvingConflict = ref(false)
const forcingSyncSync = ref(false)

// Computed properties
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
      return syncStatus.value.isPremium ? 'mdi-cloud' : 'mdi-cloud-outline'
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
      return syncStatus.value.isPremium ? 'primary' : 'default'
  }
})

const chipVariant = computed(() => {
  return syncStatus.value.status === 'synced' ? 'tonal' : 'outlined'
})

const statusText = computed(() => {
  if (!props.showText && props.compact) return ''
  
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'Syncing...'
    case 'synced':
      return 'Synced'
    case 'error':
      return 'Sync Error'
    case 'offline':
      return 'Offline'
    case 'conflict':
      return `${syncStatus.value.conflictCount} Conflicts`
    default:
      return syncStatus.value.isPremium ? 'Cloud Ready' : 'Local Only'
  }
})

const tooltipText = computed(() => {
  switch (syncStatus.value.status) {
    case 'syncing':
      return 'Synchronizing your data across devices...'
    case 'synced':
      return `Last synced: ${lastSyncText.value}`
    case 'error':
      return 'Sync failed. Click to retry or view settings.'
    case 'offline':
      return 'You\'re offline. Data will sync when connection is restored.'
    case 'conflict':
      return `${syncStatus.value.conflictCount} sync conflicts need resolution. Click to resolve.`
    default:
      return syncStatus.value.isPremium 
        ? 'Cloud sync is available. Click for settings.' 
        : 'Upgrade to Pro for cloud sync across devices.'
  }
})

const lastSyncText = computed(() => {
  if (!syncStatus.value.lastSync) return 'Never'
  
  const now = new Date()
  const lastSync = new Date(syncStatus.value.lastSync)
  const diff = now - lastSync
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
  return lastSync.toLocaleDateString()
})

const isPremium = computed(() => syncStatus.value.isPremium)
const canSync = computed(() => isPremium.value && syncStatus.value.isOnline && syncStatus.value.status !== 'syncing')

// Methods
const handleChipClick = () => {
  if (syncStatus.value.status === 'conflict') {
    conflictDialog.value = true
  } else if (syncStatus.value.status === 'error' && canSync.value) {
    forceSync()
  } else {
    settingsDialog.value = true
  }
}

const forceSync = async () => {
  try {
    forcingSyncSync.value = true
    
    // Import cloudSyncService dynamically to avoid circular dependency
    const { cloudSyncService } = await import('@/services/cloudSyncService.js')
    await cloudSyncService.forceSync()
    
  } catch (error) {
    console.error('Force sync failed:', error)
    // Show error message to user
  } finally {
    forcingSyncSync.value = false
  }
}

const resolveConflict = async () => {
  try {
    resolvingConflict.value = true
    
    // TODO: Implement conflict resolution logic
    console.log('Resolving conflict with strategy:', conflictResolution.value)
    
    // For now, just close the dialog
    conflictDialog.value = false
    
  } catch (error) {
    console.error('Conflict resolution failed:', error)
  } finally {
    resolvingConflict.value = false
  }
}

const updateSyncStatus = (status) => {
  syncStatus.value = { ...syncStatus.value, ...status }
}

// Lifecycle
let unsubscribeSyncStatus = null

onMounted(async () => {
  try {
    // Import cloudSyncService dynamically to avoid circular dependency
    const { cloudSyncService } = await import('@/services/cloudSyncService.js')
    
    // Get initial status
    updateSyncStatus(cloudSyncService.getSyncStatus())
    
    // Subscribe to status changes
    unsubscribeSyncStatus = cloudSyncService.onSyncStatusChange(updateSyncStatus)
    
  } catch (error) {
    console.error('Failed to setup sync status monitoring:', error)
  }
})

onUnmounted(() => {
  if (unsubscribeSyncStatus) {
    unsubscribeSyncStatus()
  }
})
</script>

<style scoped>
.sync-status-indicator {
  display: inline-block;
}

.sync-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.sync-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Animation for syncing state */
.sync-chip .v-progress-circular {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
