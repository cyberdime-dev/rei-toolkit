/**
 * Storage Error Recovery Utilities for REI Toolkit
 * 
 * Provides comprehensive error handling and recovery mechanisms for localStorage failures
 * Includes user feedback, fallback strategies, and data recovery options
 */

/* global Notification, alert, Blob, URL, setTimeout */

import { storageService } from '../services/storageService.js'

/**
 * Error recovery configuration
 */
const RECOVERY_CONFIG = {
  // Maximum retry attempts for failed operations
  MAX_RETRY_ATTEMPTS: 3,
  // Delay between retry attempts (ms)
  RETRY_DELAY: 1000,
  // Maximum time to wait for recovery (ms)
  RECOVERY_TIMEOUT: 30000,
  // Recovery status storage key
  RECOVERY_STATUS_KEY: 'storage_recovery_status',
  // Fallback storage key prefix
  FALLBACK_PREFIX: 'fallback_',
  // Error log retention days
  ERROR_LOG_RETENTION_DAYS: 7,
}

/**
 * Storage error types
 */
export const STORAGE_ERROR_TYPES = {
  QUOTA_EXCEEDED: 'quota_exceeded',
  NOT_AVAILABLE: 'not_available',
  SECURITY_ERROR: 'security_error',
  CORRUPTION: 'data_corruption',
  TIMEOUT: 'operation_timeout',
  UNKNOWN: 'unknown_error',
}

/**
 * Recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  CLEAR_OLD_DATA: 'clear_old_data',
  COMPRESS_DATA: 'compress_data',
  FALLBACK_STORAGE: 'fallback_storage',
  USER_INTERVENTION: 'user_intervention',
  GRACEFUL_DEGRADATION: 'graceful_degradation',
}

/**
 * Storage Error Recovery Manager
 */
export class StorageErrorRecoveryManager {
  constructor() {
    this.recoveryCallbacks = new Map()
    this.errorLog = []
    this.isRecovering = false
    this.fallbackStorage = new Map()
  }

  /**
   * Handle storage error with automatic recovery
   */
  async handleStorageError(error, operation, data = null, options = {}) {
    const errorInfo = this.analyzeError(error, operation, data)
    this.logError(errorInfo)

    // Show user notification if requested
    if (options.showUserFeedback !== false) {
      this.showErrorNotification(errorInfo)
    }

    // Attempt automatic recovery
    const recoveryResult = await this.attemptRecovery(errorInfo, options)

    // Notify callbacks
    this.notifyCallbacks('error', { errorInfo, recoveryResult })

    return recoveryResult
  }

  /**
   * Analyze error to determine type and severity
   */
  analyzeError(error, operation, data) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      operation,
      data: data ? { type: typeof data, size: JSON.stringify(data).length } : null,
      originalError: error.message,
      stack: error.stack,
      type: STORAGE_ERROR_TYPES.UNKNOWN,
      severity: 'medium',
      recoverable: true,
      suggestedStrategy: RECOVERY_STRATEGIES.RETRY,
    }

    // Analyze error type
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      errorInfo.type = STORAGE_ERROR_TYPES.QUOTA_EXCEEDED
      errorInfo.severity = 'high'
      errorInfo.suggestedStrategy = RECOVERY_STRATEGIES.CLEAR_OLD_DATA
    } else if (error.message.includes('not available') || error.message.includes('disabled')) {
      errorInfo.type = STORAGE_ERROR_TYPES.NOT_AVAILABLE
      errorInfo.severity = 'critical'
      errorInfo.suggestedStrategy = RECOVERY_STRATEGIES.FALLBACK_STORAGE
    } else if (error.name === 'SecurityError') {
      errorInfo.type = STORAGE_ERROR_TYPES.SECURITY_ERROR
      errorInfo.severity = 'critical'
      errorInfo.recoverable = false
      errorInfo.suggestedStrategy = RECOVERY_STRATEGIES.USER_INTERVENTION
    } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
      errorInfo.type = STORAGE_ERROR_TYPES.CORRUPTION
      errorInfo.severity = 'high'
      errorInfo.suggestedStrategy = RECOVERY_STRATEGIES.CLEAR_OLD_DATA
    } else if (error.message.includes('timeout')) {
      errorInfo.type = STORAGE_ERROR_TYPES.TIMEOUT
      errorInfo.severity = 'medium'
      errorInfo.suggestedStrategy = RECOVERY_STRATEGIES.RETRY
    }

    return errorInfo
  }

  /**
   * Log error for analysis and debugging
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo)

    // Keep only recent errors
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RECOVERY_CONFIG.ERROR_LOG_RETENTION_DAYS)
    
    this.errorLog = this.errorLog.filter(log => 
      new Date(log.timestamp) > cutoffDate,
    )

    // Store error log
    try {
      localStorage.setItem(
        `${RECOVERY_CONFIG.RECOVERY_STATUS_KEY}_errors`, 
        JSON.stringify(this.errorLog),
      )
    } catch (error) {
      console.warn('Could not store error log:', error)
    }
  }

  /**
   * Show user-friendly error notification
   */
  showErrorNotification(errorInfo) {
    const message = this.getErrorMessage(errorInfo)
    const actions = this.getErrorActions(errorInfo)

    // Use browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Storage Error', {
        body: message,
        icon: '/favicon.ico',
        tag: 'storage-error',
      })
    }

    // Also show in-app notification (this would typically integrate with your UI framework)
    this.showInAppNotification({
      type: 'error',
      title: 'Storage Error',
      message,
      actions,
      persistent: errorInfo.severity === 'critical',
    })
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorInfo) {
    switch (errorInfo.type) {
      case STORAGE_ERROR_TYPES.QUOTA_EXCEEDED:
        return 'Storage space is full. We\'ll help you free up space to continue saving your data.'
      case STORAGE_ERROR_TYPES.NOT_AVAILABLE:
        return 'Local storage is not available. Your data will be temporarily stored in memory.'
      case STORAGE_ERROR_TYPES.SECURITY_ERROR:
        return 'Storage access is blocked by security settings. Please check your browser configuration.'
      case STORAGE_ERROR_TYPES.CORRUPTION:
        return 'Some stored data appears corrupted. We\'ll attempt to recover what we can.'
      case STORAGE_ERROR_TYPES.TIMEOUT:
        return 'Storage operation timed out. We\'ll retry automatically.'
      default:
        return 'A storage error occurred. We\'re working to resolve it automatically.'
    }
  }

  /**
   * Get available user actions for error
   */
  getErrorActions(errorInfo) {
    const actions = []

    switch (errorInfo.type) {
      case STORAGE_ERROR_TYPES.QUOTA_EXCEEDED:
        actions.push(
          { label: 'Clear Old Data', action: 'clearOldData' },
          { label: 'Export Data', action: 'exportData' },
        )
        break
      case STORAGE_ERROR_TYPES.NOT_AVAILABLE:
        actions.push(
          { label: 'Retry', action: 'retry' },
          { label: 'Use Memory Storage', action: 'useMemoryStorage' },
        )
        break
      case STORAGE_ERROR_TYPES.CORRUPTION:
        actions.push(
          { label: 'Restore Backup', action: 'restoreBackup' },
          { label: 'Reset Storage', action: 'resetStorage' },
        )
        break
      default:
        actions.push({ label: 'Retry', action: 'retry' })
    }

    return actions
  }

  /**
   * Attempt automatic recovery
   */
  async attemptRecovery(errorInfo, options = {}) {
    if (this.isRecovering) {
      return { success: false, reason: 'Recovery already in progress' }
    }

    this.isRecovering = true

    try {
      let strategy = options.strategy || errorInfo.suggestedStrategy
      let attempts = 0
      let lastError = null

      while (attempts < RECOVERY_CONFIG.MAX_RETRY_ATTEMPTS) {
        attempts++

        try {
          const result = await this.executeRecoveryStrategy(strategy, errorInfo, options)
          
          if (result.success) {
            this.isRecovering = false
            return {
              success: true,
              strategy,
              attempts,
              result,
            }
          }

          lastError = result.error
          
          // Try next strategy if current one fails
          strategy = this.getNextStrategy(strategy, errorInfo)
          
          if (!strategy) break

        } catch (error) {
          lastError = error
          console.warn(`Recovery attempt ${attempts} failed:`, error)
        }

        // Wait before retry
        if (attempts < RECOVERY_CONFIG.MAX_RETRY_ATTEMPTS) {
          await this.delay(RECOVERY_CONFIG.RETRY_DELAY * attempts)
        }
      }

      this.isRecovering = false
      return {
        success: false,
        strategy,
        attempts,
        error: lastError,
      }

    } catch (error) {
      this.isRecovering = false
      console.error('Recovery process failed:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Execute specific recovery strategy
   */
  async executeRecoveryStrategy(strategy, errorInfo, options = {}) {
    switch (strategy) {
      case RECOVERY_STRATEGIES.RETRY:
        return await this.retryOperation(errorInfo, options)

      case RECOVERY_STRATEGIES.CLEAR_OLD_DATA:
        return await this.clearOldData(errorInfo, options)

      case RECOVERY_STRATEGIES.COMPRESS_DATA:
        return await this.compressData(errorInfo, options)

      case RECOVERY_STRATEGIES.FALLBACK_STORAGE:
        return await this.useFallbackStorage(errorInfo, options)

      case RECOVERY_STRATEGIES.USER_INTERVENTION:
        return await this.requestUserIntervention(errorInfo, options)

      case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
        return await this.gracefulDegradation(errorInfo, options)

      default:
        throw new Error(`Unknown recovery strategy: ${strategy}`)
    }
  }

  /**
   * Retry the original operation
   */
  async retryOperation() {
    try {
      // Wait a bit before retry
      await this.delay(500)

      // The actual retry would be handled by the calling code
      // This just validates that storage is now available
      const testKey = 'recovery_test_' + Date.now()
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)

      return { success: true, message: 'Storage access restored' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Clear old data to free up space
   */
  async clearOldData() {
    try {
      const oldDataCleared = await storageService.clearOldData({
        maxAge: 30, // days
        preserveImportant: true,
      })

      if (oldDataCleared.itemsCleared > 0) {
        return {
          success: true,
          message: `Cleared ${oldDataCleared.itemsCleared} old items, freed ${oldDataCleared.bytesFreed} bytes`,
          details: oldDataCleared,
        }
      } else {
        return { success: false, error: 'No old data found to clear' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Compress existing data to save space
   */
  async compressData() {
    try {
      // This would integrate with the compression utilities
      const compressionResult = await storageService.compressAllData()
      
      if (compressionResult.bytesFreed > 0) {
        return {
          success: true,
          message: `Compressed data, freed ${compressionResult.bytesFreed} bytes`,
          details: compressionResult,
        }
      } else {
        return { success: false, error: 'No compression benefits achieved' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Use fallback storage mechanism
   */
  async useFallbackStorage() {
    try {
      // Switch to in-memory storage as fallback
      this.enableFallbackStorage()
      
      return {
        success: true,
        message: 'Switched to fallback storage mode',
        temporary: true,
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Request user intervention
   */
  async requestUserIntervention(errorInfo) {
    return new Promise((resolve) => {
      this.showUserInterventionDialog(errorInfo, (result) => {
        resolve({
          success: result.success,
          message: result.message,
          userAction: result.action,
        })
      })
    })
  }

  /**
   * Graceful degradation - continue without full storage
   */
  async gracefulDegradation() {
    try {
      // Enable read-only mode or limited functionality
      this.enableGracefulDegradation()
      
      return {
        success: true,
        message: 'Operating in degraded mode - some features may be limited',
        degraded: true,
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get next recovery strategy to try
   */
  getNextStrategy(currentStrategy, errorInfo) {
    const strategyChains = {
      [STORAGE_ERROR_TYPES.QUOTA_EXCEEDED]: [
        RECOVERY_STRATEGIES.CLEAR_OLD_DATA,
        RECOVERY_STRATEGIES.COMPRESS_DATA,
        RECOVERY_STRATEGIES.USER_INTERVENTION,
      ],
      [STORAGE_ERROR_TYPES.NOT_AVAILABLE]: [
        RECOVERY_STRATEGIES.RETRY,
        RECOVERY_STRATEGIES.FALLBACK_STORAGE,
        RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
      ],
      [STORAGE_ERROR_TYPES.CORRUPTION]: [
        RECOVERY_STRATEGIES.CLEAR_OLD_DATA,
        RECOVERY_STRATEGIES.USER_INTERVENTION,
        RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
      ],
    }

    const chain = strategyChains[errorInfo.type] || [
      RECOVERY_STRATEGIES.RETRY,
      RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
    ]

    const currentIndex = chain.indexOf(currentStrategy)
    return currentIndex >= 0 && currentIndex < chain.length - 1 
      ? chain[currentIndex + 1] 
      : null
  }

  /**
   * Enable fallback storage
   */
  enableFallbackStorage() {
    // This would integrate with your storage service to use Map as fallback
    console.info('Fallback storage enabled - data will not persist across sessions')
  }

  /**
   * Enable graceful degradation mode
   */
  enableGracefulDegradation() {
    // This would set application state to indicate limited functionality
    console.info('Graceful degradation enabled - some features may be limited')
  }

  /**
   * Show user intervention dialog
   */
  showUserInterventionDialog(errorInfo, callback) {
    // This would show a proper dialog in your UI framework
    const message = `
Storage Error: ${this.getErrorMessage(errorInfo)}

Please choose an action:
1. Clear all local data and start fresh
2. Export data for manual backup
3. Continue with limited functionality
4. Cancel and try again later
    `.trim()

    const choice = window.prompt(message + '\n\nEnter 1, 2, 3, or 4:')
    
    switch (choice) {
      case '1':
        storageService.clearAllData()
        callback({ success: true, action: 'clear', message: 'All data cleared' })
        break
      case '2': {
        const data = storageService.exportAllData()
        this.downloadData(data, 'rei-toolkit-backup.json')
        callback({ success: true, action: 'export', message: 'Data exported' })
        break
      }
      case '3':
        this.enableGracefulDegradation()
        callback({ success: true, action: 'degrade', message: 'Limited mode enabled' })
        break
      default:
        callback({ success: false, action: 'cancel', message: 'User cancelled' })
    }
  }

  /**
   * Show in-app notification
   */
  showInAppNotification(notification) {
    // This would integrate with your notification system
    console.warn('Storage notification:', notification)
    
    // For now, just use browser alert for critical errors
    if (notification.persistent) {
      alert(notification.title + '\n\n' + notification.message)
    }
  }

  /**
   * Download data as JSON file
   */
  downloadData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Register callback for recovery events
   */
  onRecoveryEvent(callback) {
    const id = Date.now().toString()
    this.recoveryCallbacks.set(id, callback)
    return () => this.recoveryCallbacks.delete(id)
  }

  /**
   * Notify registered callbacks
   */
  notifyCallbacks(event, data) {
    this.recoveryCallbacks.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.warn('Recovery callback error:', error)
      }
    })
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    const recentErrors = this.errorLog.filter(log => {
      const logDate = new Date(log.timestamp)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate > dayAgo
    })

    const errorCounts = {}
    recentErrors.forEach(error => {
      errorCounts[error.type] = (errorCounts[error.type] || 0) + 1
    })

    return {
      totalErrors: this.errorLog.length,
      recentErrors: recentErrors.length,
      errorsByType: errorCounts,
      isCurrentlyRecovering: this.isRecovering,
      lastError: this.errorLog[this.errorLog.length - 1] || null,
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Export utilities for direct use
 */
export const recoveryUtils = {
  /**
   * Handle error with recovery
   */
  handleError: (error, operation, data, options) => {
    const manager = new StorageErrorRecoveryManager()
    return manager.handleStorageError(error, operation, data, options)
  },

  /**
   * Get recovery stats
   */
  getStats: () => {
    const manager = new StorageErrorRecoveryManager()
    return manager.getRecoveryStats()
  },

  /**
   * Test storage availability
   */
  testStorage: () => {
    try {
      const testKey = 'storage_test_' + Date.now()
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return { available: true }
    } catch (error) {
      return { available: false, error: error.message }
    }
  },
}

// Default export
export default StorageErrorRecoveryManager
