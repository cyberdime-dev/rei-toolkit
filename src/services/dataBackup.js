/**
 * Data Backup and Migration Manager for REI Toolkit
 * 
 * Provides comprehensive data backup and migration functionality:
 * - Automated data backups
 * - Data export/import capabilities
 * - Migration utilities for schema changes
 * - Data integrity validation
 */

/* global setTimeout, setInterval, Blob, FileReader */

import { firebaseService } from './firebaseService.js'
import { storageService } from './storageService.js'
import { offlineSupportManager } from './offlineSupport.js'

/**
 * Backup configuration
 */
const BACKUP_CONFIG = {
  // Backup frequency
  AUTO_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  
  // Storage keys
  BACKUP_METADATA_KEY: 'backup_metadata',
  LAST_BACKUP_KEY: 'last_backup_timestamp',
  
  // Backup retention
  MAX_LOCAL_BACKUPS: 5,
  BACKUP_RETENTION_DAYS: 30,
  
  // Export formats
  FORMATS: {
    JSON: 'json',
    CSV: 'csv',
  },
  
  // Collections to backup
  COLLECTIONS: ['deals', 'calculations', 'user_preferences'],
  
  // Version info
  CURRENT_SCHEMA_VERSION: '1.0.0',
}

/**
 * Data Backup Manager
 */
export class DataBackupManager {
  constructor() {
    this.backupInProgress = false
    this.lastBackupTime = this.getLastBackupTime()
    
    this.setupAutoBackup()
  }

  /**
   * Setup automatic backup
   */
  setupAutoBackup() {
    const timeSinceLastBackup = Date.now() - (this.lastBackupTime || 0)
    
    if (timeSinceLastBackup >= BACKUP_CONFIG.AUTO_BACKUP_INTERVAL) {
      // Backup immediately if it's been too long
      setTimeout(() => this.performAutoBackup(), 5000)
    }
    
    // Schedule regular backups
    setInterval(() => {
      this.performAutoBackup()
    }, BACKUP_CONFIG.AUTO_BACKUP_INTERVAL)
  }

  /**
   * Perform automatic backup
   */
  async performAutoBackup() {
    if (this.backupInProgress || !firebaseService.isAuthenticated()) {
      return
    }

    console.log('Performing automatic backup...')
    
    try {
      const result = await this.createBackup({
        type: 'automatic',
        includeLocal: true,
      })
      
      if (result.success) {
        console.log('Automatic backup completed successfully')
        this.cleanOldBackups()
      }
    } catch (error) {
      console.error('Automatic backup failed:', error)
    }
  }

  /**
   * Create a complete data backup
   */
  async createBackup(options = {}) {
    if (this.backupInProgress) {
      return { success: false, error: 'Backup already in progress' }
    }

    this.backupInProgress = true
    const backupId = this.generateBackupId()
    const timestamp = new Date().toISOString()

    try {
      console.log(`Creating backup: ${backupId}`)

      const backupData = {
        id: backupId,
        timestamp,
        schemaVersion: BACKUP_CONFIG.CURRENT_SCHEMA_VERSION,
        type: options.type || 'manual',
        collections: {},
        metadata: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: options.includeLocal ? 'combined' : 'firebase',
        },
      }

      // Backup each collection
      for (const collection of BACKUP_CONFIG.COLLECTIONS) {
        try {
          const data = await this.backupCollection(collection, options)
          backupData.collections[collection] = data
          console.log(`Backed up ${collection}: ${data.length} items`)
        } catch (error) {
          console.error(`Failed to backup ${collection}:`, error)
          backupData.collections[collection] = { error: error.message }
        }
      }

      // Include offline queue if requested
      if (options.includeLocal) {
        backupData.offlineQueue = offlineSupportManager.offlineQueue || []
      }

      // Save backup metadata
      await this.saveBackup(backupData)
      
      // Update last backup time
      this.lastBackupTime = Date.now()
      storageService.setItem(BACKUP_CONFIG.LAST_BACKUP_KEY, this.lastBackupTime)

      return {
        success: true,
        backupId,
        timestamp,
        size: this.calculateBackupSize(backupData),
        collections: Object.keys(backupData.collections),
      }

    } catch (error) {
      console.error('Backup creation failed:', error)
      return { success: false, error: error.message }
    } finally {
      this.backupInProgress = false
    }
  }

  /**
   * Backup a specific collection
   */
  async backupCollection(collection, options = {}) {
    let data = []

    // Get data from Firebase if online
    if (firebaseService.isAuthenticated() && navigator.onLine) {
      try {
        const result = await this.getFirebaseCollectionData(collection)
        if (result.success) {
          data = result.data
        }
      } catch (error) {
        console.warn(`Failed to backup ${collection} from Firebase:`, error)
      }
    }

    // Include local data if requested or if Firebase failed
    if (options.includeLocal || data.length === 0) {
      const localData = this.getLocalCollectionData(collection)
      
      if (data.length === 0) {
        data = localData
      } else {
        // Merge Firebase and local data, preferring Firebase
        data = this.mergeCollectionData(data, localData)
      }
    }

    return data
  }

  /**
   * Get collection data from Firebase
   */
  async getFirebaseCollectionData(collection) {
    switch (collection) {
      case 'deals':
        return await firebaseService.getDeals({ limit: 1000 })
      case 'calculations':
        return await firebaseService.getCalculations({ limit: 1000 })
      case 'user_preferences':
        return await firebaseService.getUserPreferences()
      default:
        return { success: false, error: `Unknown collection: ${collection}` }
    }
  }

  /**
   * Get collection data from local storage
   */
  getLocalCollectionData(collection) {
    const key = `offline_data_${collection}`
    return storageService.getItem(key, { defaultValue: [] })
  }

  /**
   * Merge Firebase and local data
   */
  mergeCollectionData(firebaseData, localData) {
    const merged = [...firebaseData]
    const firebaseIds = new Set(firebaseData.map(item => item.id))

    // Add local items that aren't in Firebase (offline-only items)
    for (const localItem of localData) {
      if (!firebaseIds.has(localItem.id) && localItem._offline) {
        merged.push({
          ...localItem,
          _backupSource: 'local',
        })
      }
    }

    return merged
  }

  /**
   * Save backup to local storage
   */
  async saveBackup(backupData) {
    // Store backup data
    const backupKey = `backup_${backupData.id}`
    storageService.setItem(backupKey, backupData)

    // Update backup metadata
    const metadata = this.getBackupMetadata()
    metadata.backups.push({
      id: backupData.id,
      timestamp: backupData.timestamp,
      type: backupData.type,
      size: this.calculateBackupSize(backupData),
      collections: Object.keys(backupData.collections),
    })

    // Keep only recent backups in metadata
    metadata.backups = metadata.backups
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, BACKUP_CONFIG.MAX_LOCAL_BACKUPS)

    storageService.setItem(BACKUP_CONFIG.BACKUP_METADATA_KEY, metadata)
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    try {
      console.log(`Restoring from backup: ${backupId}`)

      const backup = this.getBackup(backupId)
      if (!backup) {
        return { success: false, error: 'Backup not found' }
      }

      const restoredCollections = []

      // Restore each collection
      for (const [collection, data] of Object.entries(backup.collections)) {
        if (data.error) {
          console.warn(`Skipping ${collection} due to backup error:`, data.error)
          continue
        }

        try {
          await this.restoreCollection(collection, data, options)
          restoredCollections.push(collection)
        } catch (error) {
          console.error(`Failed to restore ${collection}:`, error)
        }
      }

      // Restore offline queue if present
      if (backup.offlineQueue && options.restoreOfflineQueue) {
        offlineSupportManager.offlineQueue = backup.offlineQueue
        offlineSupportManager.saveOfflineQueue()
      }

      return {
        success: true,
        backupId,
        restoredCollections,
        timestamp: backup.timestamp,
      }

    } catch (error) {
      console.error('Restore failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Restore a specific collection
   */
  async restoreCollection(collection, data, options = {}) {
    if (options.restoreToFirebase && firebaseService.isAuthenticated()) {
      // Restore to Firebase
      await this.restoreToFirebase(collection, data, options)
    }

    if (options.restoreToLocal !== false) {
      // Always restore to local storage
      const key = `offline_data_${collection}`
      storageService.setItem(key, data)
    }
  }

  /**
   * Restore collection to Firebase
   */
  async restoreToFirebase(collection, data, options = {}) {
    const batchSize = 10
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      for (const item of batch) {
        try {
          if (options.overwrite || !await this.itemExistsInFirebase(collection, item.id)) {
            await this.createItemInFirebase(collection, item)
            successCount++
          }
        } catch (error) {
          console.error(`Failed to restore item ${item.id}:`, error)
          errorCount++
        }
      }
    }

    console.log(`Restored ${collection} to Firebase: ${successCount} success, ${errorCount} errors`)
  }

  /**
   * Check if item exists in Firebase
   */
  async itemExistsInFirebase(collection, itemId) {
    try {
      switch (collection) {
        case 'deals': {
          const deal = await firebaseService.getDeal(itemId)
          return deal.success
        }
        case 'calculations':
          // Calculations don't have individual get methods
          return false
        default:
          return false
      }
    } catch {
      return false
    }
  }

  /**
   * Create item in Firebase
   */
  async createItemInFirebase(collection, item) {
    // Remove backup-specific fields
    const cleanItem = { ...item }
    delete cleanItem._offline
    delete cleanItem._operationId
    delete cleanItem._backupSource

    switch (collection) {
      case 'deals':
        return await firebaseService.createDeal(cleanItem)
      case 'calculations':
        return await firebaseService.saveCalculation(cleanItem)
      default:
        throw new Error(`Unsupported collection for Firebase restore: ${collection}`)
    }
  }

  /**
   * Export data to various formats
   */
  async exportData(options = {}) {
    const format = options.format || BACKUP_CONFIG.FORMATS.JSON
    const collections = options.collections || BACKUP_CONFIG.COLLECTIONS

    const exportData = {
      timestamp: new Date().toISOString(),
      schemaVersion: BACKUP_CONFIG.CURRENT_SCHEMA_VERSION,
      format,
      collections: {},
    }

    // Export each collection
    for (const collection of collections) {
      const data = await this.backupCollection(collection, options)
      exportData.collections[collection] = data
    }

    switch (format) {
      case BACKUP_CONFIG.FORMATS.JSON:
        return this.exportAsJSON(exportData)
      case BACKUP_CONFIG.FORMATS.CSV:
        return this.exportAsCSV(exportData)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Export as JSON
   */
  exportAsJSON(data) {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const filename = `rei-toolkit-export-${new Date().toISOString().split('T')[0]}.json`
    
    return {
      blob,
      filename,
      size: blob.size,
    }
  }

  /**
   * Export as CSV (deals only for now)
   */
  exportAsCSV(data) {
    const deals = data.collections.deals || []
    
    if (deals.length === 0) {
      throw new Error('No deals to export')
    }

    // Generate CSV headers
    const headers = Object.keys(deals[0]).filter(key => !key.startsWith('_'))
    
    // Generate CSV rows
    const rows = deals.map(deal => {
      return headers.map(header => {
        const value = deal[header]
        if (typeof value === 'object') {
          return JSON.stringify(value)
        }
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    })

    const csvContent = [
      headers.join(','),
      ...rows,
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const filename = `rei-toolkit-deals-${new Date().toISOString().split('T')[0]}.csv`
    
    return {
      blob,
      filename,
      size: blob.size,
    }
  }

  /**
   * Import data from file
   */
  async importData(file, options = {}) {
    try {
      const content = await this.readFile(file)
      let importData

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        importData = JSON.parse(content)
      } else {
        throw new Error('Unsupported file format. Please use JSON.')
      }

      // Validate import data
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import data format')
      }

      const importResults = {}

      // Import each collection
      for (const [collection, data] of Object.entries(importData.collections)) {
        try {
          const result = await this.importCollection(collection, data, options)
          importResults[collection] = result
        } catch (error) {
          importResults[collection] = { success: false, error: error.message }
        }
      }

      return {
        success: true,
        importResults,
        timestamp: importData.timestamp,
        schemaVersion: importData.schemaVersion,
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Import a specific collection
   */
  async importCollection(collection, data, options = {}) {
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const item of data) {
      try {
        // Check for duplicates if requested
        if (options.skipDuplicates && await this.isDuplicate(collection, item)) {
          skippedCount++
          continue
        }

        // Import to local storage
        const localData = this.getLocalCollectionData(collection)
        const existingIndex = localData.findIndex(existing => existing.id === item.id)
        
        if (existingIndex !== -1) {
          if (options.overwrite) {
            localData[existingIndex] = item
          } else {
            skippedCount++
            continue
          }
        } else {
          localData.push(item)
        }

        this.saveLocalCollectionData(collection, localData)

        // Import to Firebase if requested and online
        if (options.importToFirebase && firebaseService.isAuthenticated() && navigator.onLine) {
          await this.createItemInFirebase(collection, item)
        }

        successCount++

      } catch (error) {
        console.error(`Failed to import item:`, error)
        errorCount++
      }
    }

    return { successCount, errorCount, skippedCount }
  }

  /**
   * Utility methods
   */
  getBackup(backupId) {
    const backupKey = `backup_${backupId}`
    return storageService.getItem(backupKey)
  }

  getBackupMetadata() {
    return storageService.getItem(BACKUP_CONFIG.BACKUP_METADATA_KEY, {
      defaultValue: { backups: [] },
    })
  }

  getLastBackupTime() {
    return storageService.getItem(BACKUP_CONFIG.LAST_BACKUP_KEY, { defaultValue: 0 })
  }

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  calculateBackupSize(backupData) {
    return JSON.stringify(backupData).length
  }

  cleanOldBackups() {
    const metadata = this.getBackupMetadata()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.BACKUP_RETENTION_DAYS)

    const validBackups = metadata.backups.filter(backup => {
      const backupDate = new Date(backup.timestamp)
      if (backupDate < cutoffDate) {
        // Remove old backup data
        storageService.removeItem(`backup_${backup.id}`)
        return false
      }
      return true
    })

    metadata.backups = validBackups
    storageService.setItem(BACKUP_CONFIG.BACKUP_METADATA_KEY, metadata)
  }

  validateImportData(data) {
    return data && 
           data.timestamp && 
           data.schemaVersion && 
           data.collections && 
           typeof data.collections === 'object'
  }

  async isDuplicate(collection, item) {
    const localData = this.getLocalCollectionData(collection)
    return localData.some(existing => existing.id === item.id)
  }

  saveLocalCollectionData(collection, data) {
    const key = `offline_data_${collection}`
    storageService.setItem(key, data)
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Get backup status and statistics
   */
  getBackupStatus() {
    const metadata = this.getBackupMetadata()
    const timeSinceLastBackup = this.lastBackupTime ? Date.now() - this.lastBackupTime : null

    return {
      backupInProgress: this.backupInProgress,
      lastBackupTime: this.lastBackupTime,
      timeSinceLastBackup,
      totalBackups: metadata.backups.length,
      backups: metadata.backups,
      autoBackupEnabled: true,
      nextAutoBackup: this.lastBackupTime ? 
        this.lastBackupTime + BACKUP_CONFIG.AUTO_BACKUP_INTERVAL : 
        Date.now() + BACKUP_CONFIG.AUTO_BACKUP_INTERVAL,
    }
  }

  /**
   * Delete a specific backup
   */
  deleteBackup(backupId) {
    // Remove backup data
    storageService.removeItem(`backup_${backupId}`)

    // Update metadata
    const metadata = this.getBackupMetadata()
    metadata.backups = metadata.backups.filter(backup => backup.id !== backupId)
    storageService.setItem(BACKUP_CONFIG.BACKUP_METADATA_KEY, metadata)

    return { success: true }
  }

  /**
   * Clear all backup data
   */
  clearAllBackups() {
    const metadata = this.getBackupMetadata()
    
    // Remove all backup files
    for (const backup of metadata.backups) {
      storageService.removeItem(`backup_${backup.id}`)
    }

    // Clear metadata
    storageService.removeItem(BACKUP_CONFIG.BACKUP_METADATA_KEY)
    storageService.removeItem(BACKUP_CONFIG.LAST_BACKUP_KEY)

    this.lastBackupTime = null

    return { success: true }
  }
}

// Create and export singleton instance
export const dataBackupManager = new DataBackupManager()

// Export configuration
export { BACKUP_CONFIG }

// Default export
export default dataBackupManager
