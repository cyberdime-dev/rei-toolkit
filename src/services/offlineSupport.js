/**
 * Offline Support Manager for REI Toolkit
 * 
 * Provides comprehensive offline functionality including:
 * - Data persistence and synchronization
 * - Offline-first architecture
 * - Background sync when connection is restored
 */

/* global setInterval, CustomEvent */

import { firebaseService } from './firebaseService.js'
import { storageService } from './storageService.js'

/**
 * Offline configuration
 */
const OFFLINE_CONFIG = {
  // Storage keys
  OFFLINE_QUEUE_KEY: 'offline_queue',
  OFFLINE_DATA_KEY: 'offline_data',
  LAST_SYNC_KEY: 'last_sync_timestamp',
  
  // Sync settings
  MAX_QUEUE_SIZE: 1000,
  SYNC_RETRY_INTERVAL: 30000, // 30 seconds
  DATA_RETENTION_DAYS: 30,
  
  // Operation types
  OPERATIONS: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    BATCH: 'batch',
  },
  
  // Sync priorities
  PRIORITY: {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  },
}

/**
 * Offline Support Manager
 */
export class OfflineSupportManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.offlineQueue = []
    this.lastSyncTime = null
    this.syncInProgress = false
    
    this.loadOfflineQueue()
    this.setupEventListeners()
    this.setupPeriodicSync()
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('Back online - starting background sync')
      this.isOnline = true
      this.performBackgroundSync()
    })

    window.addEventListener('offline', () => {
      console.log('Gone offline - queuing operations')
      this.isOnline = false
    })

    // Listen for beforeunload to save offline queue
    window.addEventListener('beforeunload', () => {
      this.saveOfflineQueue()
    })
  }

  /**
   * Setup periodic sync attempts
   */
  setupPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.hasQueuedOperations()) {
        this.performBackgroundSync()
      }
    }, OFFLINE_CONFIG.SYNC_RETRY_INTERVAL)
  }

  /**
   * Add operation to offline queue
   */
  queueOperation(operation) {
    const queueItem = {
      id: this.generateOperationId(),
      timestamp: new Date().toISOString(),
      priority: operation.priority || OFFLINE_CONFIG.PRIORITY.MEDIUM,
      retryCount: 0,
      maxRetries: 3,
      ...operation,
    }

    this.offlineQueue.push(queueItem)
    this.sortQueueByPriority()
    this.saveOfflineQueue()

    console.log(`Queued offline operation: ${operation.type}`, queueItem)

    // If we're online, try to sync immediately
    if (this.isOnline) {
      this.performBackgroundSync()
    }

    return queueItem.id
  }

  /**
   * Create a deal with offline support
   */
  async createDealOffline(dealData) {
    const operationId = this.queueOperation({
      type: OFFLINE_CONFIG.OPERATIONS.CREATE,
      collection: 'deals',
      data: dealData,
      priority: OFFLINE_CONFIG.PRIORITY.HIGH,
    })

    // Store locally immediately for immediate UI feedback
    const localDeals = this.getLocalData('deals')
    const tempId = `temp_${Date.now()}`
    const localDeal = {
      id: tempId,
      ...dealData,
      _offline: true,
      _operationId: operationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    localDeals.push(localDeal)
    this.saveLocalData('deals', localDeals)

    return { success: true, id: tempId, data: localDeal, offline: true }
  }

  /**
   * Update a deal with offline support
   */
  async updateDealOffline(dealId, updates) {
    const operationId = this.queueOperation({
      type: OFFLINE_CONFIG.OPERATIONS.UPDATE,
      collection: 'deals',
      id: dealId,
      data: updates,
      priority: OFFLINE_CONFIG.PRIORITY.HIGH,
    })

    // Update locally immediately
    const localDeals = this.getLocalData('deals')
    const dealIndex = localDeals.findIndex(deal => deal.id === dealId)
    
    if (dealIndex !== -1) {
      localDeals[dealIndex] = {
        ...localDeals[dealIndex],
        ...updates,
        _offline: true,
        _operationId: operationId,
        updatedAt: new Date().toISOString(),
      }
      
      this.saveLocalData('deals', localDeals)
      return { success: true, offline: true }
    }

    return { success: false, error: 'Deal not found locally' }
  }

  /**
   * Delete a deal with offline support
   */
  async deleteDealOffline(dealId) {
    const operationId = this.queueOperation({
      type: OFFLINE_CONFIG.OPERATIONS.DELETE,
      collection: 'deals',
      id: dealId,
      priority: OFFLINE_CONFIG.PRIORITY.HIGH,
    })

    // Remove from local data immediately
    const localDeals = this.getLocalData('deals')
    const filteredDeals = localDeals.filter(deal => deal.id !== dealId)
    this.saveLocalData('deals', filteredDeals)

    return { success: true, offline: true, operationId }
  }

  /**
   * Save calculation with offline support
   */
  async saveCalculationOffline(calculationData) {
    const operationId = this.queueOperation({
      type: OFFLINE_CONFIG.OPERATIONS.CREATE,
      collection: 'calculations',
      data: calculationData,
      priority: OFFLINE_CONFIG.PRIORITY.MEDIUM,
    })

    // Store locally immediately
    const localCalculations = this.getLocalData('calculations')
    const tempId = `temp_${Date.now()}`
    const localCalculation = {
      id: tempId,
      ...calculationData,
      _offline: true,
      _operationId: operationId,
      timestamp: new Date().toISOString(),
    }

    localCalculations.push(localCalculation)
    this.saveLocalData('calculations', localCalculations)

    return { success: true, id: tempId, data: localCalculation, offline: true }
  }

  /**
   * Get deals with offline support
   */
  async getDealsOffline(options = {}) {
    if (this.isOnline && firebaseService.isAuthenticated()) {
      // Try to get from Firebase first
      try {
        const result = await firebaseService.getDeals(options)
        if (result.success) {
          // Update local cache
          this.saveLocalData('deals', result.data)
          return result
        }
      } catch (error) {
        console.warn('Failed to fetch from Firebase, using local data:', error)
      }
    }

    // Fallback to local data
    const localDeals = this.getLocalData('deals')
    const filteredDeals = this.applyFilters(localDeals, options)
    
    return {
      success: true,
      data: filteredDeals,
      offline: true,
      source: 'local',
    }
  }

  /**
   * Get calculations with offline support
   */
  async getCalculationsOffline(options = {}) {
    if (this.isOnline && firebaseService.isAuthenticated()) {
      try {
        const result = await firebaseService.getCalculations(options)
        if (result.success) {
          this.saveLocalData('calculations', result.data)
          return result
        }
      } catch (error) {
        console.warn('Failed to fetch calculations from Firebase:', error)
      }
    }

    const localCalculations = this.getLocalData('calculations')
    const filteredCalculations = this.applyFilters(localCalculations, options)
    
    return {
      success: true,
      data: filteredCalculations,
      offline: true,
      source: 'local',
    }
  }

  /**
   * Perform background synchronization
   */
  async performBackgroundSync() {
    if (this.syncInProgress || !this.isOnline || !firebaseService.isAuthenticated()) {
      return
    }

    this.syncInProgress = true
    console.log('Starting background sync...')

    try {
      let successCount = 0
      let errorCount = 0
      const operations = [...this.offlineQueue] // Create a copy

      for (const operation of operations) {
        try {
          const result = await this.executeSyncOperation(operation)
          
          if (result.success) {
            this.removeFromQueue(operation.id)
            await this.updateLocalDataAfterSync(operation, result)
            successCount++
          } else {
            this.handleSyncFailure(operation, result.error)
            errorCount++
          }
        } catch (error) {
          console.error('Sync operation failed:', error)
          this.handleSyncFailure(operation, error.message)
          errorCount++
        }
      }

      this.lastSyncTime = new Date().toISOString()
      storageService.setItem(OFFLINE_CONFIG.LAST_SYNC_KEY, this.lastSyncTime)

      console.log(`Background sync completed: ${successCount} success, ${errorCount} errors`)

      // Notify listeners
      this.notifySyncComplete({ successCount, errorCount })

    } catch (error) {
      console.error('Background sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Execute a single sync operation
   */
  async executeSyncOperation(operation) {
    switch (operation.collection) {
      case 'deals':
        return await this.syncDealOperation(operation)
      case 'calculations':
        return await this.syncCalculationOperation(operation)
      default:
        throw new Error(`Unsupported collection: ${operation.collection}`)
    }
  }

  /**
   * Sync deal operation to Firebase
   */
  async syncDealOperation(operation) {
    switch (operation.type) {
      case OFFLINE_CONFIG.OPERATIONS.CREATE:
        return await firebaseService.createDeal(operation.data)
      case OFFLINE_CONFIG.OPERATIONS.UPDATE:
        return await firebaseService.updateDeal(operation.id, operation.data)
      case OFFLINE_CONFIG.OPERATIONS.DELETE:
        return await firebaseService.deleteDeal(operation.id)
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`)
    }
  }

  /**
   * Sync calculation operation to Firebase
   */
  async syncCalculationOperation(operation) {
    switch (operation.type) {
      case OFFLINE_CONFIG.OPERATIONS.CREATE:
        return await firebaseService.saveCalculation(operation.data)
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`)
    }
  }

  /**
   * Update local data after successful sync
   */
  async updateLocalDataAfterSync(operation, result) {
    if (operation.type === OFFLINE_CONFIG.OPERATIONS.CREATE && result.id) {
      // Update temp ID with real Firebase ID
      if (operation.collection === 'deals') {
        const localDeals = this.getLocalData('deals')
        const dealIndex = localDeals.findIndex(deal => deal._operationId === operation.id)
        
        if (dealIndex !== -1) {
          localDeals[dealIndex] = {
            ...localDeals[dealIndex],
            id: result.id,
            _offline: false,
            _operationId: undefined,
          }
          this.saveLocalData('deals', localDeals)
        }
      } else if (operation.collection === 'calculations') {
        const localCalculations = this.getLocalData('calculations')
        const calcIndex = localCalculations.findIndex(calc => calc._operationId === operation.id)
        
        if (calcIndex !== -1) {
          localCalculations[calcIndex] = {
            ...localCalculations[calcIndex],
            id: result.id,
            _offline: false,
            _operationId: undefined,
          }
          this.saveLocalData('calculations', localCalculations)
        }
      }
    }
  }

  /**
   * Handle sync operation failure
   */
  handleSyncFailure(operation, error) {
    operation.retryCount++
    operation.lastError = error
    operation.lastRetry = new Date().toISOString()

    if (operation.retryCount >= operation.maxRetries) {
      console.error(`Operation ${operation.id} failed permanently:`, error)
      this.moveToFailedQueue(operation)
      this.removeFromQueue(operation.id)
    } else {
      console.warn(`Operation ${operation.id} failed, will retry (${operation.retryCount}/${operation.maxRetries}):`, error)
    }
  }

  /**
   * Move operation to failed queue for manual review
   */
  moveToFailedQueue(operation) {
    const failedQueue = storageService.getItem('failed_offline_operations', { defaultValue: [] })
    failedQueue.push(operation)
    storageService.setItem('failed_offline_operations', failedQueue)
  }

  /**
   * Local data management
   */
  getLocalData(collection) {
    const key = `${OFFLINE_CONFIG.OFFLINE_DATA_KEY}_${collection}`
    return storageService.getItem(key, { defaultValue: [] })
  }

  saveLocalData(collection, data) {
    const key = `${OFFLINE_CONFIG.OFFLINE_DATA_KEY}_${collection}`
    storageService.setItem(key, data)
  }

  /**
   * Offline queue management
   */
  loadOfflineQueue() {
    this.offlineQueue = storageService.getItem(OFFLINE_CONFIG.OFFLINE_QUEUE_KEY, { defaultValue: [] })
    this.cleanOldOperations()
  }

  saveOfflineQueue() {
    storageService.setItem(OFFLINE_CONFIG.OFFLINE_QUEUE_KEY, this.offlineQueue)
  }

  removeFromQueue(operationId) {
    this.offlineQueue = this.offlineQueue.filter(op => op.id !== operationId)
    this.saveOfflineQueue()
  }

  cleanOldOperations() {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - OFFLINE_CONFIG.DATA_RETENTION_DAYS)

    this.offlineQueue = this.offlineQueue.filter(operation => {
      const operationDate = new Date(operation.timestamp)
      return operationDate > cutoffDate
    })

    this.saveOfflineQueue()
  }

  sortQueueByPriority() {
    this.offlineQueue.sort((a, b) => a.priority - b.priority)
  }

  hasQueuedOperations() {
    return this.offlineQueue.length > 0
  }

  /**
   * Utility methods
   */
  generateOperationId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  applyFilters(data, options) {
    let filtered = [...data]

    if (options.propertyType) {
      filtered = filtered.filter(item => item.propertyType === options.propertyType)
    }

    if (options.status) {
      filtered = filtered.filter(item => item.status === options.status)
    }

    if (options.type) {
      filtered = filtered.filter(item => item.type === options.type)
    }

    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }

  notifySyncComplete(result) {
    // This would integrate with your notification system
    console.log('Sync completed:', result)
    
    // You could emit custom events here for UI components to listen to
    const event = new CustomEvent('offlineSyncComplete', { detail: result })
    window.dispatchEvent(event)
  }

  /**
   * Get offline status and statistics
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      queuedOperations: this.offlineQueue.length,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      hasLocalData: {
        deals: this.getLocalData('deals').length > 0,
        calculations: this.getLocalData('calculations').length > 0,
      },
    }
  }

  /**
   * Force sync all queued operations
   */
  async forceSyncAll() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    return await this.performBackgroundSync()
  }

  /**
   * Clear all offline data (for testing/debugging)
   */
  clearOfflineData() {
    this.offlineQueue = []
    this.saveOfflineQueue()
    
    storageService.removeItem(`${OFFLINE_CONFIG.OFFLINE_DATA_KEY}_deals`)
    storageService.removeItem(`${OFFLINE_CONFIG.OFFLINE_DATA_KEY}_calculations`)
    storageService.removeItem('failed_offline_operations')
    storageService.removeItem(OFFLINE_CONFIG.LAST_SYNC_KEY)
    
    console.log('All offline data cleared')
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.saveOfflineQueue()
    // Remove event listeners if needed
  }
}

// Create and export singleton instance
export const offlineSupportManager = new OfflineSupportManager()

// Export configuration for external use
export { OFFLINE_CONFIG }

// Default export
export default offlineSupportManager
