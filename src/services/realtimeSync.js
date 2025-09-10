/**
 * Real-time Sync Manager for REI Toolkit
 * 
 * Provides real-time synchronization capabilities for Firebase data
 * Manages live updates, conflict resolution, and sync state
 */

/* global setInterval, clearInterval, setTimeout */

import { firebaseService } from './firebaseService.js'
import { storageService } from './storageService.js'

/**
 * Sync configuration
 */
const SYNC_CONFIG = {
  // Sync intervals and timeouts
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RETRY_INTERVAL: 5000, // 5 seconds
  MAX_RETRY_ATTEMPTS: 3,
  
  // Conflict resolution strategies
  CONFLICT_RESOLUTION: {
    SERVER_WINS: 'server_wins',
    CLIENT_WINS: 'client_wins',
    MERGE: 'merge',
    USER_CHOICE: 'user_choice',
  },
  
  // Sync status
  STATUS: {
    OFFLINE: 'offline',
    CONNECTING: 'connecting',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    ERROR: 'error',
  },
}

/**
 * Real-time Sync Manager
 */
export class RealtimeSyncManager {
  constructor() {
    this.syncStatus = SYNC_CONFIG.STATUS.OFFLINE
    this.isOnline = navigator.onLine
    this.listeners = new Map()
    this.pendingChanges = new Map()
    this.conflictQueue = []
    this.lastSyncTime = null
    this.retryCount = 0
    
    // Bind methods
    this.handleOnline = this.handleOnline.bind(this)
    this.handleOffline = this.handleOffline.bind(this)
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this)
    
    this.setupEventListeners()
    this.setupAuthListener()
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Network status listeners
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    // Page visibility listener for sync optimization
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.forcSync()
      }
    })
  }

  /**
   * Setup authentication state listener
   */
  setupAuthListener() {
    firebaseService.onAuthStateChange(this.handleAuthStateChange)
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Connection restored')
    this.isOnline = true
    this.setSyncStatus(SYNC_CONFIG.STATUS.CONNECTING)
    this.startSync()
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Connection lost')
    this.isOnline = false
    this.setSyncStatus(SYNC_CONFIG.STATUS.OFFLINE)
    this.stopSync()
  }

  /**
   * Handle authentication state change
   */
  handleAuthStateChange(user) {
    if (user && this.isOnline) {
      this.startSync()
    } else {
      this.stopSync()
    }
  }

  /**
   * Start real-time synchronization
   */
  async startSync() {
    if (!firebaseService.isAuthenticated()) {
      console.warn('Cannot start sync: user not authenticated')
      return
    }

    if (!this.isOnline) {
      console.warn('Cannot start sync: offline')
      return
    }

    try {
      this.setSyncStatus(SYNC_CONFIG.STATUS.SYNCING)
      
      // Sync pending local changes first
      await this.syncPendingChanges()
      
      // Start real-time listeners
      this.startRealtimeListeners()
      
      // Setup periodic sync for reliability
      this.setupPeriodicSync()
      
      this.setSyncStatus(SYNC_CONFIG.STATUS.SYNCED)
      this.lastSyncTime = new Date()
      this.retryCount = 0
      
      console.log('Real-time sync started')
    } catch (error) {
      console.error('Failed to start sync:', error)
      this.setSyncStatus(SYNC_CONFIG.STATUS.ERROR)
      this.scheduleRetry()
    }
  }

  /**
   * Stop real-time synchronization
   */
  stopSync() {
    this.stopRealtimeListeners()
    this.clearPeriodicSync()
    
    if (this.syncStatus !== SYNC_CONFIG.STATUS.OFFLINE) {
      this.setSyncStatus(SYNC_CONFIG.STATUS.OFFLINE)
    }
    
    console.log('Real-time sync stopped')
  }

  /**
   * Force immediate synchronization
   */
  async forcSync() {
    if (!firebaseService.isAuthenticated() || !this.isOnline) {
      return
    }

    try {
      this.setSyncStatus(SYNC_CONFIG.STATUS.SYNCING)
      await this.syncPendingChanges()
      this.setSyncStatus(SYNC_CONFIG.STATUS.SYNCED)
      this.lastSyncTime = new Date()
    } catch (error) {
      console.error('Force sync failed:', error)
      this.setSyncStatus(SYNC_CONFIG.STATUS.ERROR)
    }
  }

  /**
   * Start real-time listeners for all collections
   */
  startRealtimeListeners() {
    // Listen to deals changes
    const dealsUnsubscribe = firebaseService.listenToDeals((result) => {
      if (result.success) {
        this.handleRealtimeUpdate('deals', result.data)
      } else {
        console.error('Deals listener error:', result.error)
      }
    })
    
    this.listeners.set('deals', dealsUnsubscribe)
    
    // Listen to calculations changes (if needed)
    // Can be extended for other collections
  }

  /**
   * Stop all real-time listeners
   */
  stopRealtimeListeners() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.listeners.clear()
  }

  /**
   * Handle real-time updates from Firebase
   */
  async handleRealtimeUpdate(collection, data) {
    try {
      // Update local storage with server data
      const localKey = `firebase_${collection}`
      const currentLocalData = storageService.getItem(localKey, { defaultValue: [] })
      
      // Check for conflicts
      const conflicts = this.detectConflicts(collection, currentLocalData, data)
      
      if (conflicts.length > 0) {
        await this.handleConflicts(collection, conflicts)
      } else {
        // No conflicts, update local data
        storageService.setItem(localKey, data)
        this.notifyListeners('data_updated', { collection, data })
      }
      
    } catch (error) {
      console.error('Error handling real-time update:', error)
    }
  }

  /**
   * Sync pending local changes to Firebase
   */
  async syncPendingChanges() {
    const pendingDeals = this.getPendingChanges('deals')
    const pendingCalculations = this.getPendingChanges('calculations')
    
    // Sync deals
    for (const dealChange of pendingDeals) {
      try {
        await this.syncDealChange(dealChange)
        this.removePendingChange('deals', dealChange.id)
      } catch (error) {
        console.error('Failed to sync deal:', error)
        // Keep in pending queue for retry
      }
    }
    
    // Sync calculations
    for (const calcChange of pendingCalculations) {
      try {
        await this.syncCalculationChange(calcChange)
        this.removePendingChange('calculations', calcChange.id)
      } catch (error) {
        console.error('Failed to sync calculation:', error)
        // Keep in pending queue for retry
      }
    }
  }

  /**
   * Sync a single deal change
   */
  async syncDealChange(dealChange) {
    switch (dealChange.operation) {
      case 'create':
        return await firebaseService.createDeal(dealChange.data)
      case 'update':
        return await firebaseService.updateDeal(dealChange.id, dealChange.data)
      case 'delete':
        return await firebaseService.deleteDeal(dealChange.id)
      default:
        throw new Error(`Unknown operation: ${dealChange.operation}`)
    }
  }

  /**
   * Sync a single calculation change
   */
  async syncCalculationChange(calcChange) {
    switch (calcChange.operation) {
      case 'create':
        return await firebaseService.saveCalculation(calcChange.data)
      // Add update/delete operations as needed
      default:
        throw new Error(`Unknown operation: ${calcChange.operation}`)
    }
  }

  /**
   * Detect conflicts between local and server data
   */
  detectConflicts(collection, localData, serverData) {
    const conflicts = []
    
    // Create maps for easier lookup
    const localMap = new Map(localData.map(item => [item.id, item]))
    const serverMap = new Map(serverData.map(item => [item.id, item]))
    
    // Check for conflicts
    for (const [id, serverItem] of serverMap) {
      const localItem = localMap.get(id)
      
      if (localItem && this.hasConflict(localItem, serverItem)) {
        conflicts.push({
          id,
          collection,
          local: localItem,
          server: serverItem,
          conflictType: this.getConflictType(localItem, serverItem),
        })
      }
    }
    
    return conflicts
  }

  /**
   * Check if two items have a conflict
   */
  hasConflict(localItem, serverItem) {
    // Compare update timestamps
    const localUpdated = new Date(localItem.updatedAt || localItem.timestamp || 0)
    const serverUpdated = new Date(serverItem.updatedAt || serverItem.timestamp || 0)
    
    // If both were updated recently and have different content, it's a conflict
    const timeDiff = Math.abs(localUpdated.getTime() - serverUpdated.getTime())
    const hasContentDiff = JSON.stringify(localItem) !== JSON.stringify(serverItem)
    
    return timeDiff < 10000 && hasContentDiff // 10 second window
  }

  /**
   * Get conflict type
   */
  getConflictType(localItem, serverItem) {
    const localTime = new Date(localItem.updatedAt || localItem.timestamp || 0)
    const serverTime = new Date(serverItem.updatedAt || serverItem.timestamp || 0)
    
    if (localTime > serverTime) {
      return 'local_newer'
    } else if (serverTime > localTime) {
      return 'server_newer'
    } else {
      return 'simultaneous'
    }
  }

  /**
   * Handle conflicts using configured strategy
   */
  async handleConflicts(collection, conflicts) {
    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveConflict(conflict)
        await this.applyConflictResolution(conflict, resolution)
      } catch (error) {
        console.error('Failed to resolve conflict:', error)
        this.conflictQueue.push(conflict)
      }
    }
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflict) {
    // For now, use server wins strategy
    // In the future, this could be configurable or show UI to user
    const strategy = SYNC_CONFIG.CONFLICT_RESOLUTION.SERVER_WINS
    
    switch (strategy) {
      case SYNC_CONFIG.CONFLICT_RESOLUTION.SERVER_WINS:
        return { strategy, data: conflict.server }
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.CLIENT_WINS:
        return { strategy, data: conflict.local }
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.MERGE:
        return { strategy, data: this.mergeConflictData(conflict.local, conflict.server) }
        
      case SYNC_CONFIG.CONFLICT_RESOLUTION.USER_CHOICE:
        return await this.askUserToResolveConflict(conflict)
        
      default:
        return { strategy: 'server_wins', data: conflict.server }
    }
  }

  /**
   * Apply conflict resolution
   */
  async applyConflictResolution(conflict, resolution) {
    // Update local data
    const localKey = `firebase_${conflict.collection}`
    const localData = storageService.getItem(localKey, { defaultValue: [] })
    
    const updatedData = localData.map(item => 
      item.id === conflict.id ? resolution.data : item,
    )
    
    storageService.setItem(localKey, updatedData)
    
    // If client wins, update server
    if (resolution.strategy === SYNC_CONFIG.CONFLICT_RESOLUTION.CLIENT_WINS) {
      if (conflict.collection === 'deals') {
        await firebaseService.updateDeal(conflict.id, resolution.data)
      }
      // Add other collections as needed
    }
    
    this.notifyListeners('conflict_resolved', { conflict, resolution })
  }

  /**
   * Merge conflict data (simple strategy)
   */
  mergeConflictData(localData, serverData) {
    // Simple merge: take server data but preserve local notes if newer
    const merged = { ...serverData }
    
    if (localData.notes && (!serverData.notes || localData.notes.length > serverData.notes.length)) {
      merged.notes = localData.notes
    }
    
    return merged
  }

  /**
   * Ask user to resolve conflict (placeholder for UI integration)
   */
  async askUserToResolveConflict(conflict) {
    // This would show a UI dialog in a real implementation
    console.warn('User conflict resolution not implemented, using server wins')
    return { strategy: 'server_wins', data: conflict.server }
  }

  /**
   * Manage pending changes
   */
  addPendingChange(collection, change) {
    const key = `${collection}_${change.id}`
    this.pendingChanges.set(key, change)
    
    // Persist to local storage for reliability
    const pendingKey = `pending_${collection}`
    const pending = storageService.getItem(pendingKey, { defaultValue: [] })
    pending.push(change)
    storageService.setItem(pendingKey, pending)
  }

  removePendingChange(collection, changeId) {
    const key = `${collection}_${changeId}`
    this.pendingChanges.delete(key)
    
    // Remove from local storage
    const pendingKey = `pending_${collection}`
    const pending = storageService.getItem(pendingKey, { defaultValue: [] })
    const filtered = pending.filter(change => change.id !== changeId)
    storageService.setItem(pendingKey, filtered)
  }

  getPendingChanges(collection) {
    const pendingKey = `pending_${collection}`
    return storageService.getItem(pendingKey, { defaultValue: [] })
  }

  /**
   * Setup periodic sync for reliability
   */
  setupPeriodicSync() {
    this.periodicSyncInterval = setInterval(() => {
      if (this.isOnline && firebaseService.isAuthenticated()) {
        this.forcSync()
      }
    }, SYNC_CONFIG.HEARTBEAT_INTERVAL)
  }

  /**
   * Clear periodic sync
   */
  clearPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval)
      this.periodicSyncInterval = null
    }
  }

  /**
   * Schedule retry on failure
   */
  scheduleRetry() {
    if (this.retryCount >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached')
      return
    }

    this.retryCount++
    
    setTimeout(() => {
      if (this.isOnline && firebaseService.isAuthenticated()) {
        this.startSync()
      }
    }, SYNC_CONFIG.RETRY_INTERVAL * this.retryCount)
  }

  /**
   * Set sync status and notify listeners
   */
  setSyncStatus(status) {
    const oldStatus = this.syncStatus
    this.syncStatus = status
    
    if (oldStatus !== status) {
      this.notifyListeners('status_changed', { oldStatus, newStatus: status })
    }
  }

  /**
   * Register event listener
   */
  addEventListener(event, callback) {
    const listeners = this.listeners.get(event) || []
    listeners.push(callback)
    this.listeners.set(event, listeners)
    
    return () => {
      const updatedListeners = this.listeners.get(event) || []
      const index = updatedListeners.indexOf(callback)
      if (index > -1) {
        updatedListeners.splice(index, 1)
        this.listeners.set(event, updatedListeners)
      }
    }
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Listener callback error:', error)
      }
    })
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      status: this.syncStatus,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.pendingChanges.size,
      conflicts: this.conflictQueue.length,
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopSync()
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    // Clear all listeners
    this.listeners.clear()
    this.pendingChanges.clear()
    this.conflictQueue = []
  }
}

// Create and export singleton instance
export const realtimeSyncManager = new RealtimeSyncManager()

// Export configuration for external use
export { SYNC_CONFIG }

// Default export
export default realtimeSyncManager
