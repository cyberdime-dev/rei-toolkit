/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */
/**
 * Cloud Sync Service for REI Toolkit
 * 
 * Provides multi-device data synchronization for premium users:
 * - Real-time data synchronization
 * - Conflict resolution strategies
 * - Offline-first architecture
 * - Premium feature gating
 * - Sync status indicators
 * - Data migration from local storage
 */

/* global CustomEvent, setInterval, clearInterval, setTimeout */

import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { firestore } from './firebase.js'
import { authService } from './authService.js'
import storageService from './storageService.js'

/**
 * Cloud Sync Configuration
 */
const SYNC_CONFIG = {
  // Sync intervals
  SYNC_INTERVAL: 30000, // 30 seconds for active sync
  RETRY_INTERVAL: 5000, // 5 seconds for retry attempts
  MAX_RETRIES: 3,
  
  // Conflict resolution strategies
  CONFLICT_RESOLUTION: {
    LAST_WRITE_WINS: 'last_write_wins',
    MERGE: 'merge',
    USER_CHOICE: 'user_choice',
  },
  
  // Sync priorities
  SYNC_PRIORITY: {
    CRITICAL: 1, // User settings, subscription data
    HIGH: 2,     // Active deals, recent calculations
    NORMAL: 3,   // Calculator history, preferences
    LOW: 4,      // Cache data, temporary data
  },
  
  // Collections for cloud storage
  COLLECTIONS: {
    USER_DATA: 'user_data',
    DEALS: 'deals',
    CALCULATIONS: 'calculations',
    PREFERENCES: 'preferences',
    SYNC_METADATA: 'sync_metadata',
  },
  
  // Sync status types
  SYNC_STATUS: {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    ERROR: 'error',
    OFFLINE: 'offline',
    CONFLICT: 'conflict',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    'not_premium': 'Cloud sync is only available for Pro and Team subscribers.',
    'offline': 'Cloud sync is not available while offline.',
    'auth_required': 'You must be signed in to use cloud sync.',
    'sync_failed': 'Failed to sync data. Please try again.',
    'conflict_detected': 'Data conflict detected. Please resolve manually.',
  },
}

/**
 * Cloud Sync Service Class
 */
export class CloudSyncService {
  constructor() {
    this.isInitialized = false
    this.syncStatus = SYNC_CONFIG.SYNC_STATUS.IDLE
    this.syncListeners = new Map()
    this.realtimeListeners = new Map()
    this.syncQueue = []
    this.conflictQueue = []
    this.lastSyncTimestamp = null
    this.retryCount = 0
    this.isOnline = navigator.onLine
    this.isPremiumUser = false
    
    // Bind methods
    this.handleOnlineStatus = this.handleOnlineStatus.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    
    // Initialize service
    this.init()
  }
  
  /**
   * Initialize Cloud Sync Service
   */
  async init() {
    try {
      console.log('Initializing Cloud Sync Service...')
      
      // Check if user is premium
      await this.checkPremiumStatus()
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Setup auth state monitoring
      this.setupAuthStateMonitoring()
      
      // Initialize sync if premium
      if (this.isPremiumUser) {
        await this.initializeSync()
      }
      
      this.isInitialized = true
      console.log('Cloud Sync Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Cloud Sync Service:', error)
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.ERROR
    }
  }
  
  /**
   * Check if user has premium subscription for cloud sync
   */
  async checkPremiumStatus() {
    try {
      if (!authService.isAuthenticated()) {
        this.isPremiumUser = false
        return false
      }
      
      const subscription = await authService.getSubscription()
      this.isPremiumUser = subscription && ['pro', 'team'].includes(subscription.plan) && subscription.status === 'active'
      
      console.log('Premium status checked:', this.isPremiumUser)
      return this.isPremiumUser
      
    } catch (error) {
      console.error('Error checking premium status:', error)
      this.isPremiumUser = false
      return false
    }
  }
  
  /**
   * Setup event listeners for network and visibility changes
   */
  setupEventListeners() {
    // Network status monitoring
    window.addEventListener('online', this.handleOnlineStatus)
    window.addEventListener('offline', this.handleOnlineStatus)
    
    // Page visibility monitoring (for sync optimization)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }
  
  /**
   * Setup authentication state monitoring
   */
  setupAuthStateMonitoring() {
    authService.onAuthStateChange(async (user) => {
      if (user) {
        await this.checkPremiumStatus()
        if (this.isPremiumUser) {
          await this.initializeSync()
        } else {
          this.cleanup()
        }
      } else {
        this.cleanup()
      }
    })
  }
  
  /**
   * Initialize synchronization for premium users
   */
  async initializeSync() {
    try {
      if (!this.isPremiumUser) {
        throw new Error(SYNC_CONFIG.ERROR_MESSAGES.not_premium)
      }
      
      console.log('Initializing cloud sync for premium user...')
      
      // Migrate local data to cloud if needed
      await this.migrateLocalDataToCloud()
      
      // Setup real-time listeners
      await this.setupRealtimeListeners()
      
      // Perform initial sync
      await this.performFullSync()
      
      // Start periodic sync
      this.startPeriodicSync()
      
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.SYNCED
      this.notifySyncStatusChange()
      
    } catch (error) {
      console.error('Failed to initialize sync:', error)
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.ERROR
      this.notifySyncStatusChange()
    }
  }
  
  /**
   * Migrate existing local data to cloud storage
   */
  async migrateLocalDataToCloud() {
    try {
      console.log('Migrating local data to cloud...')
      
      const userId = authService.getCurrentUser()?.uid
      if (!userId) return
      
      // Get all local data
      const localData = {
        deals: storageService.getItem('deals') || [],
        settings: storageService.getItem('settings') || {},
        preferences: storageService.getItem('drawer') || true,
        calculatorHistory: storageService.getItem('calc_history') || {},
      }
      
      // Check if cloud data already exists
      const cloudDataRef = doc(firestore, SYNC_CONFIG.COLLECTIONS.USER_DATA, userId)
      const cloudDataSnap = await getDoc(cloudDataRef)
      
      if (!cloudDataSnap.exists()) {
        // No cloud data exists, migrate local data
        await setDoc(cloudDataRef, {
          ...localData,
          migratedAt: serverTimestamp(),
          lastSyncTimestamp: serverTimestamp(),
          version: 1,
        })
        
        console.log('Local data migrated to cloud successfully')
      } else {
        // Cloud data exists, check if merge is needed
        const cloudData = cloudDataSnap.data()
        await this.handleDataMerge(localData, cloudData)
      }
      
    } catch (error) {
      console.error('Error migrating local data:', error)
      throw error
    }
  }
  
  /**
   * Setup real-time listeners for data changes
   */
  async setupRealtimeListeners() {
    try {
      const userId = authService.getCurrentUser()?.uid
      if (!userId) return
      
      // Listen to user data changes
      const userDataRef = doc(firestore, SYNC_CONFIG.COLLECTIONS.USER_DATA, userId)
      const unsubscribeUserData = onSnapshot(userDataRef, (doc) => {
        this.handleRealtimeDataUpdate('user_data', doc.data())
      })
      
      // Listen to deals changes
      const dealsQuery = query(
        collection(firestore, SYNC_CONFIG.COLLECTIONS.DEALS),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
      )
      const unsubscribeDeals = onSnapshot(dealsQuery, (snapshot) => {
        const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        this.handleRealtimeDataUpdate('deals', deals)
      })
      
      // Store unsubscribe functions
      this.realtimeListeners.set('user_data', unsubscribeUserData)
      this.realtimeListeners.set('deals', unsubscribeDeals)
      
      console.log('Real-time listeners setup complete')
      
    } catch (error) {
      console.error('Error setting up real-time listeners:', error)
      throw error
    }
  }
  
  /**
   * Handle real-time data updates from Firestore
   */
  handleRealtimeDataUpdate(dataType, data) {
    try {
      if (!data) return
      
      console.log(`Real-time update received for ${dataType}`)
      
      // Check for conflicts
      const localData = this.getLocalData(dataType)
      if (this.hasDataConflict(localData, data)) {
        this.handleConflict(dataType, localData, data)
        return
      }
      
      // Apply remote changes to local storage
      this.applyRemoteChanges(dataType, data)
      
      // Notify listeners
      this.notifyDataChange(dataType, data)
      
    } catch (error) {
      console.error('Error handling real-time update:', error)
    }
  }
  
  /**
   * Perform full synchronization
   */
  async performFullSync() {
    try {
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.SYNCING
      this.notifySyncStatusChange()
      
      console.log('Performing full sync...')
      
      const userId = authService.getCurrentUser()?.uid
      if (!userId) {
        throw new Error(SYNC_CONFIG.ERROR_MESSAGES.auth_required)
      }
      
      // Sync user data
      await this.syncUserData()
      
      // Sync deals
      await this.syncDeals()
      
      // Sync preferences
      await this.syncPreferences()
      
      // Update last sync timestamp
      this.lastSyncTimestamp = new Date()
      
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.SYNCED
      this.retryCount = 0
      
      console.log('Full sync completed successfully')
      
    } catch (error) {
      console.error('Full sync failed:', error)
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.ERROR
      this.handleSyncError(error)
    } finally {
      this.notifySyncStatusChange()
    }
  }
  
  /**
   * Sync user data to cloud
   */
  async syncUserData() {
    try {
      const userId = authService.getCurrentUser()?.uid
      const localSettings = storageService.getItem('settings') || {}
      const localCalcHistory = storageService.getItem('calc_history') || {}
      
      const userDataRef = doc(firestore, SYNC_CONFIG.COLLECTIONS.USER_DATA, userId)
      
      // Get cloud data
      const cloudSnap = await getDoc(userDataRef)
      const cloudData = cloudSnap.exists() ? cloudSnap.data() : {}
      
      // Merge local and cloud data
      const mergedData = {
        settings: { ...cloudData.settings, ...localSettings },
        calculatorHistory: { ...cloudData.calculatorHistory, ...localCalcHistory },
        lastSyncTimestamp: serverTimestamp(),
        version: (cloudData.version || 0) + 1,
      }
      
      // Update cloud
      await setDoc(userDataRef, mergedData, { merge: true })
      
      // Update local storage
      storageService.setItem('settings', mergedData.settings)
      storageService.setItem('calc_history', mergedData.calculatorHistory)
      
    } catch (error) {
      console.error('Error syncing user data:', error)
      throw error
    }
  }
  
  /**
   * Sync deals to cloud
   */
  async syncDeals() {
    try {
      const userId = authService.getCurrentUser()?.uid
      const localDeals = storageService.getItem('deals') || []
      
      // Get cloud deals
      const dealsQuery = query(
        collection(firestore, SYNC_CONFIG.COLLECTIONS.DEALS),
        where('userId', '==', userId),
      )
      const cloudDealsSnap = await getDocs(dealsQuery)
      const cloudDeals = cloudDealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Merge deals (local changes take precedence for simplicity)
      const batch = writeBatch(firestore)
      
      for (const localDeal of localDeals) {
        const dealRef = doc(firestore, SYNC_CONFIG.COLLECTIONS.DEALS, localDeal.id || '')
        batch.set(dealRef, {
          ...localDeal,
          userId,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      
      await batch.commit()
      
      // Update local deals with any new cloud deals
      const allDeals = [...localDeals]
      for (const cloudDeal of cloudDeals) {
        if (!localDeals.find(d => d.id === cloudDeal.id)) {
          allDeals.push(cloudDeal)
        }
      }
      
      storageService.setItem('deals', allDeals)
      
    } catch (error) {
      console.error('Error syncing deals:', error)
      throw error
    }
  }
  
  /**
   * Sync preferences to cloud
   */
  async syncPreferences() {
    try {
      const userId = authService.getCurrentUser()?.uid
      const localPreferences = {
        drawer: storageService.getItem('drawer'),
        theme: storageService.getItem('theme'),
      }
      
      const prefsRef = doc(firestore, SYNC_CONFIG.COLLECTIONS.PREFERENCES, userId)
      
      // Get cloud preferences
      const cloudSnap = await getDoc(prefsRef)
      const cloudPrefs = cloudSnap.exists() ? cloudSnap.data() : {}
      
      // Merge preferences (local takes precedence for UI preferences)
      const mergedPrefs = {
        ...cloudPrefs,
        ...localPreferences,
        updatedAt: serverTimestamp(),
      }
      
      // Update cloud
      await setDoc(prefsRef, mergedPrefs, { merge: true })
      
      // Update local
      Object.entries(mergedPrefs).forEach(([key, value]) => {
        if (key !== 'updatedAt') {
          storageService.setItem(key, value)
        }
      })
      
    } catch (error) {
      console.error('Error syncing preferences:', error)
      throw error
    }
  }
  
  /**
   * Start periodic synchronization
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(async () => {
      if (this.isPremiumUser && this.isOnline && this.syncStatus !== SYNC_CONFIG.SYNC_STATUS.SYNCING) {
        await this.performFullSync()
      }
    }, SYNC_CONFIG.SYNC_INTERVAL)
  }
  
  /**
   * Handle data conflicts
   */
  async handleDataMerge(localData, cloudData) {
    try {
      console.log('Handling data merge...')
      
      // Simple last-write-wins strategy for now
      // In production, you might want more sophisticated conflict resolution
      
      const mergedData = {
        deals: this.mergeArrayData(localData.deals || [], cloudData.deals || []),
        settings: { ...cloudData.settings, ...localData.settings },
        preferences: { ...cloudData.preferences, ...localData.preferences },
        calculatorHistory: { ...cloudData.calculatorHistory, ...localData.calculatorHistory },
      }
      
      // Update local storage
      Object.entries(mergedData).forEach(([key, value]) => {
        storageService.setItem(key, value)
      })
      
      return mergedData
      
    } catch (error) {
      console.error('Error handling data merge:', error)
      throw error
    }
  }
  
  /**
   * Merge array data (for deals, calculations, etc.)
   */
  mergeArrayData(localArray, cloudArray) {
    const merged = [...localArray]
    
    for (const cloudItem of cloudArray) {
      const existingIndex = merged.findIndex(item => item.id === cloudItem.id)
      if (existingIndex >= 0) {
        // Update existing item if cloud version is newer
        const localItem = merged[existingIndex]
        if (!localItem.updatedAt || new Date(cloudItem.updatedAt?.toDate()) > new Date(localItem.updatedAt)) {
          merged[existingIndex] = cloudItem
        }
      } else {
        // Add new item from cloud
        merged.push(cloudItem)
      }
    }
    
    return merged
  }
  
  /**
   * Handle network status changes
   */
  handleOnlineStatus() {
    this.isOnline = navigator.onLine
    
    if (this.isOnline) {
      console.log('Back online - resuming sync')
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.IDLE
      if (this.isPremiumUser) {
        this.performFullSync()
      }
    } else {
      console.log('Gone offline - pausing sync')
      this.syncStatus = SYNC_CONFIG.SYNC_STATUS.OFFLINE
    }
    
    this.notifySyncStatusChange()
  }
  
  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (!document.hidden && this.isPremiumUser && this.isOnline) {
      // Page became visible, perform sync
      this.performFullSync()
    }
  }
  
  /**
   * Handle sync errors with retry logic
   */
  handleSyncError() {
    this.retryCount++
    
    if (this.retryCount <= SYNC_CONFIG.MAX_RETRIES) {
      console.log(`Sync failed, retrying in ${SYNC_CONFIG.RETRY_INTERVAL}ms (attempt ${this.retryCount})`)
      setTimeout(() => {
        this.performFullSync()
      }, SYNC_CONFIG.RETRY_INTERVAL)
    } else {
      console.error('Max sync retries exceeded')
      this.retryCount = 0
    }
  }
  
  /**
   * Public API Methods
   */
  
  /**
   * Check if cloud sync is available
   */
  isCloudSyncAvailable() {
    return this.isPremiumUser && authService.isAuthenticated()
  }
  
  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      status: this.syncStatus,
      lastSync: this.lastSyncTimestamp,
      isOnline: this.isOnline,
      isPremium: this.isPremiumUser,
      conflictCount: this.conflictQueue.length,
    }
  }
  
  /**
   * Force manual sync
   */
  async forceSync() {
    if (!this.isCloudSyncAvailable()) {
      throw new Error(SYNC_CONFIG.ERROR_MESSAGES.not_premium)
    }
    
    await this.performFullSync()
  }
  
  /**
   * Register sync status listener
   */
  onSyncStatusChange(callback) {
    const id = Math.random().toString(36)
    this.syncListeners.set(id, callback)
    return () => this.syncListeners.delete(id)
  }
  
  /**
   * Notify sync status change
   */
  notifySyncStatusChange() {
    const status = this.getSyncStatus()
    this.syncListeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in sync status callback:', error)
      }
    })
  }
  
  /**
   * Cleanup listeners and intervals
   */
  cleanup() {
    // Clear intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    // Unsubscribe from real-time listeners
    this.realtimeListeners.forEach(unsubscribe => unsubscribe())
    this.realtimeListeners.clear()
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnlineStatus)
    window.removeEventListener('offline', this.handleOnlineStatus)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    
    // Reset state
    this.syncStatus = SYNC_CONFIG.SYNC_STATUS.IDLE
    this.isPremiumUser = false
    this.isInitialized = false
    
    console.log('Cloud sync service cleaned up')
  }
  
  /**
   * Helper methods for conflict resolution (to be implemented)
   */
  hasDataConflict() {
    // Simplified conflict detection - implement actual logic as needed
    return false
  }
  
  handleConflict(dataType, localData, remoteData) {
    console.log(`Conflict detected for ${dataType}`)
    this.conflictQueue.push({ dataType, localData, remoteData, timestamp: new Date() })
    this.syncStatus = SYNC_CONFIG.SYNC_STATUS.CONFLICT
    this.notifySyncStatusChange()
  }
  
  getLocalData(dataType) {
    switch (dataType) {
      case 'deals':
        return storageService.getItem('deals') || []
      case 'settings':
        return storageService.getItem('settings') || {}
      default:
        return null
    }
  }
  
  applyRemoteChanges(dataType, data) {
    switch (dataType) {
      case 'user_data':
        if (data.settings) storageService.setItem('settings', data.settings)
        if (data.calculatorHistory) storageService.setItem('calc_history', data.calculatorHistory)
        break
      case 'deals':
        storageService.setItem('deals', data)
        break
    }
  }
  
  notifyDataChange(dataType, data) {
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('cloudSyncDataUpdate', {
      detail: { dataType, data },
    }))
  }
}

// Create and export singleton instance
export const cloudSyncService = new CloudSyncService()

// Export configuration for testing
export { SYNC_CONFIG }
