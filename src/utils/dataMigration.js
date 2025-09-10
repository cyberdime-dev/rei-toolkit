/**
 * Data Migration Utilities for REI Toolkit
 * 
 * Handles migration of localStorage data to Firebase when users sign up
 * Provides tools for data export, import, and seamless transition
 */

import { storageService } from '../services/storageService.js'

/**
 * Migration configuration
 */
const MIGRATION_CONFIG = {
  // Current version for migration tracking
  MIGRATION_VERSION: '1.0.0',
  // Maximum age of data to migrate (in days)
  MAX_DATA_AGE_DAYS: 365,
  // Batch size for large data migrations
  BATCH_SIZE: 50,
  // Migration status key
  MIGRATION_STATUS_KEY: 'migration_status',
}

/**
 * Migration status constants
 */
export const MIGRATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
}

/**
 * Data Migration Manager
 */
export class DataMigrationManager {
  constructor(firebaseService = null) {
    this.firebaseService = firebaseService
    this.migrationCallbacks = new Map()
  }

  /**
   * Check if user has data that can be migrated
   */
  hasDataToMigrate() {
    try {
      const exportData = storageService.exportAllData()
      
      // Check if there's any meaningful data to migrate
      const hasDeals = exportData.deals && exportData.deals.length > 0
      const hasCalculations = exportData.calculations && exportData.calculations.length > 0
      const hasSettings = exportData.settings && Object.keys(exportData.settings).length > 0
      const hasPreferences = exportData.preferences && Object.keys(exportData.preferences).length > 0
      
      return hasDeals || hasCalculations || hasSettings || hasPreferences
    } catch (error) {
      console.warn('Error checking migration data:', error)
      return false
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    return storageService.getItem(MIGRATION_CONFIG.MIGRATION_STATUS_KEY, {
      defaultValue: {
        status: MIGRATION_STATUS.PENDING,
        version: null,
        timestamp: null,
        error: null,
        dataSize: 0,
        itemsCount: 0,
      },
    })
  }

  /**
   * Set migration status
   */
  setMigrationStatus(status, metadata = {}) {
    const currentStatus = this.getMigrationStatus()
    const updatedStatus = {
      ...currentStatus,
      status,
      timestamp: new Date().toISOString(),
      version: MIGRATION_CONFIG.MIGRATION_VERSION,
      ...metadata,
    }
    
    storageService.setItem(MIGRATION_CONFIG.MIGRATION_STATUS_KEY, updatedStatus)
    return updatedStatus
  }

  /**
   * Prepare data for migration
   */
  prepareDataForMigration() {
    try {
      const exportData = storageService.exportAllData()
      const now = new Date()
      const maxAge = new Date(now.getTime() - (MIGRATION_CONFIG.MAX_DATA_AGE_DAYS * 24 * 60 * 60 * 1000))

      // Filter out old data
      const filteredData = {
        ...exportData,
        deals: exportData.deals?.filter(deal => {
          const dealDate = new Date(deal.createdAt || deal.updatedAt || 0)
          return dealDate > maxAge
        }) || [],
        calculations: exportData.calculations?.filter(calc => {
          const calcDate = new Date(calc.timestamp || 0)
          return calcDate > maxAge
        }) || [],
      }

      // Add migration metadata
      filteredData.migrationMeta = {
        version: MIGRATION_CONFIG.MIGRATION_VERSION,
        exportedAt: now.toISOString(),
        originalDataSize: JSON.stringify(exportData).length,
        filteredDataSize: JSON.stringify(filteredData).length,
        itemsCounts: {
          deals: filteredData.deals.length,
          calculations: filteredData.calculations.length,
          settingsKeys: Object.keys(filteredData.settings || {}).length,
          preferencesKeys: Object.keys(filteredData.preferences || {}).length,
        },
      }

      return filteredData
    } catch (error) {
      console.error('Error preparing migration data:', error)
      throw new Error(`Failed to prepare migration data: ${error.message}`)
    }
  }

  /**
   * Estimate migration time and data size
   */
  estimateMigration() {
    try {
      const data = this.prepareDataForMigration()
      const dataSize = JSON.stringify(data).length
      const itemsCount = (
        (data.deals?.length || 0) +
        (data.calculations?.length || 0) +
        Object.keys(data.settings || {}).length +
        Object.keys(data.preferences || {}).length
      )

      // Rough estimation: 100ms per item + 1ms per KB
      const estimatedTimeMs = (itemsCount * 100) + (dataSize / 1024)
      
      return {
        dataSize,
        itemsCount,
        estimatedTimeMs,
        estimatedTimeSeconds: Math.ceil(estimatedTimeMs / 1000),
        dataSizeFormatted: this.formatBytes(dataSize),
      }
    } catch (error) {
      console.error('Error estimating migration:', error)
      return {
        dataSize: 0,
        itemsCount: 0,
        estimatedTimeMs: 0,
        estimatedTimeSeconds: 0,
        dataSizeFormatted: '0 B',
      }
    }
  }

  /**
   * Perform the actual migration to Firebase
   */
  async migrateToFirebase(userId, options = {}) {
    if (!this.firebaseService) {
      throw new Error('Firebase service not configured')
    }

    const {
      onProgress = () => {},
      onBatchComplete = () => {},
      skipConfirmation = false,
    } = options

    try {
      // Set migration status to in progress
      this.setMigrationStatus(MIGRATION_STATUS.IN_PROGRESS, {
        userId,
        startedAt: new Date().toISOString(),
      })

      // Prepare data
      onProgress({ step: 'preparing', progress: 0 })
      const migrationData = this.prepareDataForMigration()
      const estimation = this.estimateMigration()

      // Confirm migration if required
      if (!skipConfirmation) {
        const confirmed = await this.confirmMigration(estimation)
        if (!confirmed) {
          this.setMigrationStatus(MIGRATION_STATUS.SKIPPED)
          return { status: 'skipped', reason: 'User cancelled' }
        }
      }

      let totalProgress = 0
      const totalItems = estimation.itemsCount

      // Migrate deals
      if (migrationData.deals?.length > 0) {
        onProgress({ step: 'deals', progress: totalProgress / totalItems })
        await this.migrateBatch('deals', migrationData.deals, userId, onBatchComplete)
        totalProgress += migrationData.deals.length
      }

      // Migrate calculations
      if (migrationData.calculations?.length > 0) {
        onProgress({ step: 'calculations', progress: totalProgress / totalItems })
        await this.migrateBatch('calculations', migrationData.calculations, userId, onBatchComplete)
        totalProgress += migrationData.calculations.length
      }

      // Migrate settings
      if (migrationData.settings && Object.keys(migrationData.settings).length > 0) {
        onProgress({ step: 'settings', progress: totalProgress / totalItems })
        await this.firebaseService.setUserSettings(userId, migrationData.settings)
        totalProgress += Object.keys(migrationData.settings).length
      }

      // Migrate preferences
      if (migrationData.preferences && Object.keys(migrationData.preferences).length > 0) {
        onProgress({ step: 'preferences', progress: totalProgress / totalItems })
        await this.firebaseService.setUserPreferences(userId, migrationData.preferences)
        totalProgress += Object.keys(migrationData.preferences).length
      }

      // Mark migration as completed
      const completedStatus = this.setMigrationStatus(MIGRATION_STATUS.COMPLETED, {
        userId,
        completedAt: new Date().toISOString(),
        migratedItems: totalProgress,
        dataSize: estimation.dataSize,
      })

      onProgress({ step: 'completed', progress: 1 })

      return {
        status: 'completed',
        migrationStatus: completedStatus,
        migratedItems: totalProgress,
        dataSize: estimation.dataSize,
      }

    } catch (error) {
      console.error('Migration failed:', error)
      
      // Mark migration as failed
      this.setMigrationStatus(MIGRATION_STATUS.FAILED, {
        userId,
        failedAt: new Date().toISOString(),
        error: error.message,
      })

      throw error
    }
  }

  /**
   * Migrate a batch of data
   */
  async migrateBatch(dataType, items, userId, onBatchComplete) {
    const batches = this.createBatches(items, MIGRATION_CONFIG.BATCH_SIZE)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      // Use appropriate Firebase method based on data type
      switch (dataType) {
        case 'deals':
          await this.firebaseService.batchCreateDeals(userId, batch)
          break
        case 'calculations':
          await this.firebaseService.batchCreateCalculations(userId, batch)
          break
        default:
          console.warn(`Unknown data type for batch migration: ${dataType}`)
      }
      
      onBatchComplete({
        dataType,
        batchIndex: i,
        totalBatches: batches.length,
        itemsInBatch: batch.length,
      })
    }
  }

  /**
   * Create batches from array
   */
  createBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Confirm migration with user
   */
  async confirmMigration(estimation) {
    const message = `
Migration Summary:
- Data size: ${estimation.dataSizeFormatted}
- Items to migrate: ${estimation.itemsCount}
- Estimated time: ${estimation.estimatedTimeSeconds} seconds

This will copy your local data to the cloud and may take a few moments.
Your local data will remain unchanged.

Do you want to proceed with the migration?
    `.trim()

    return window.confirm(message)
  }

  /**
   * Create a backup before migration
   */
  createBackup() {
    try {
      const backupData = storageService.exportAllData()
      const backupKey = `backup_${new Date().toISOString().split('T')[0]}`
      
      // Store backup data
      storageService.setItem(backupKey, {
        createdAt: new Date().toISOString(),
        version: MIGRATION_CONFIG.MIGRATION_VERSION,
        data: backupData,
      })

      return backupKey
    } catch (error) {
      console.error('Error creating backup:', error)
      throw new Error(`Failed to create backup: ${error.message}`)
    }
  }

  /**
   * Clean up local data after successful migration
   */
  async cleanupAfterMigration(keepBackup = true) {
    try {
      const migrationStatus = this.getMigrationStatus()
      
      if (migrationStatus.status !== MIGRATION_STATUS.COMPLETED) {
        throw new Error('Cannot cleanup: migration not completed')
      }

      // Create backup if requested
      let backupKey = null
      if (keepBackup) {
        backupKey = this.createBackup()
      }

      // Clear all data except migration status and backup
      const keysToKeep = [
        MIGRATION_CONFIG.MIGRATION_STATUS_KEY,
        ...(backupKey ? [backupKey] : []),
      ]

      storageService.clearAllData({ except: keysToKeep })

      return {
        status: 'cleaned',
        backupKey,
        timestamp: new Date().toISOString(),
      }

    } catch (error) {
      console.error('Error during cleanup:', error)
      throw error
    }
  }

  /**
   * Register migration progress callback
   */
  onMigrationProgress(callback) {
    const id = Date.now().toString()
    this.migrationCallbacks.set(id, callback)
    return () => this.migrationCallbacks.delete(id)
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}

/**
 * Export utilities for direct use
 */
export const migrationUtils = {
  /**
   * Quick check if migration is needed
   */
  isMigrationNeeded() {
    const manager = new DataMigrationManager()
    const status = manager.getMigrationStatus()
    return status.status === MIGRATION_STATUS.PENDING && manager.hasDataToMigrate()
  },

  /**
   * Get migration summary for UI display
   */
  getMigrationSummary() {
    const manager = new DataMigrationManager()
    return {
      hasData: manager.hasDataToMigrate(),
      status: manager.getMigrationStatus(),
      estimation: manager.estimateMigration(),
    }
  },

  /**
   * Export data for manual migration
   */
  exportForManualMigration() {
    const manager = new DataMigrationManager()
    return manager.prepareDataForMigration()
  },
}

// Default export
export default DataMigrationManager
