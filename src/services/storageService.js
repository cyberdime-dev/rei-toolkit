/**
 * Unified Storage Service for REI Toolkit
 * 
 * Provides a centralized interface for data persistence with:
 * - Error handling and graceful fallbacks
 * - Data validation and schema enforcement
 * - Storage quota monitoring and management
 * - Cloud sync integration for premium users
 * - Consistent API across the application
 */

/* global Blob */

// Storage configuration
const STORAGE_CONFIG = {
  // Maximum storage size per key (in bytes)
  MAX_ITEM_SIZE: 1024 * 1024, // 1MB per item
  // Warning threshold for total storage usage
  QUOTA_WARNING_THRESHOLD: 0.8, // 80% of available quota
  // Prefix for all storage keys to avoid conflicts
  KEY_PREFIX: 'rei_toolkit_',
  // Cache expiration for news and other cached data
  DEFAULT_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
}

// Storage key registry for centralized key management
export const STORAGE_KEYS = {
  // UI Preferences
  DRAWER_STATE: 'drawer',
  THEME_PREFERENCE: 'theme',
  
  // Application Data
  USER_SETTINGS: 'settings',
  DEALS_DATA: 'deals',
  NEWS_CACHE: 'news_cache',
  
  // Calculator History (dynamic keys)
  CALCULATOR_HISTORY: 'calc_history',
  
  // Temporary Data
  CALCULATOR_TRANSFER: 'calc_transfer',
}

// Data validation schemas
const VALIDATION_SCHEMAS = {
  [STORAGE_KEYS.DRAWER_STATE]: {
    type: 'boolean',
    default: true,
  },
  [STORAGE_KEYS.THEME_PREFERENCE]: {
    type: 'string',
    enum: ['light', 'dark'],
    default: 'light',
  },
  [STORAGE_KEYS.USER_SETTINGS]: {
    type: 'object',
    properties: {
      darkMode: { type: 'boolean', default: false },
      autoSave: { type: 'boolean', default: true },
      notifications: { type: 'boolean', default: true },
    },
    default: {
      darkMode: false,
      autoSave: true,
      notifications: true,
    },
  },
  [STORAGE_KEYS.DEALS_DATA]: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'title', 'dateCreated'],
    },
    default: [],
  },
  [STORAGE_KEYS.NEWS_CACHE]: {
    type: 'object',
    properties: {
      timestamp: { type: 'number' },
      articles: { type: 'array' },
    },
    required: ['timestamp', 'articles'],
    default: null,
  },
}

/**
 * Storage Service Class
 * Provides unified interface for all data persistence operations
 */
class StorageService {
  constructor() {
    this.isAvailable = false
    this.fallbackStorage = new Map()
    this.eventListeners = []
    this.cloudSyncService = null // Will be injected to avoid circular dependency
    
    this.init()
  }
  
  /**
   * Set cloud sync service reference (called after service initialization)
   */
  setCloudSyncService(cloudSyncService) {
    this.cloudSyncService = cloudSyncService
  }
  
  /**
   * Check if cloud sync should be used for this data type
   */
  shouldUseCloudSync(key) {
    if (!this.cloudSyncService) return false
    
    // Only sync specific data types for premium users
    const cloudSyncKeys = [
      STORAGE_KEYS.DEALS_DATA,
      STORAGE_KEYS.USER_SETTINGS,
      STORAGE_KEYS.CALCULATOR_HISTORY,
    ]
    
    return cloudSyncKeys.includes(key) && this.cloudSyncService.isCloudSyncAvailable()
  }

  /**
   * Check if localStorage is available and functional
   */
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.warn('localStorage not available, using fallback:', error.message)
      return false
    }
  }

  /**
   * Initialize storage monitoring and cleanup
   */
  initializeStorageMonitoring() {
    // Monitor storage quota if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      this.checkStorageQuota()
    }

    // Clean up expired cached data on initialization
    this.cleanupExpiredData()
  }

  /**
   * Check storage quota and warn if approaching limits
   */
  async checkStorageQuota() {
    try {
      const estimate = await navigator.storage.estimate()
      const usagePercent = estimate.usage / estimate.quota
      
      if (usagePercent > STORAGE_CONFIG.QUOTA_WARNING_THRESHOLD) {
        console.warn(`Storage quota warning: ${(usagePercent * 100).toFixed(1)}% used`)
        this.notifyQuotaWarning(usagePercent)
      }
      
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usagePercent,
      }
    } catch (error) {
      console.warn('Storage quota check failed:', error)
      return null
    }
  }

  /**
   * Clean up expired cached data
   */
  cleanupExpiredData() {
    try {
      // Clean up news cache if expired
      const newsCache = this.getItem(STORAGE_KEYS.NEWS_CACHE, { skipValidation: true })
      if (newsCache && this.isCacheExpired(newsCache.timestamp)) {
        this.removeItem(STORAGE_KEYS.NEWS_CACHE)
      }

      // Clean up old calculator history (keep last 100 entries per calculator)
      this.cleanupCalculatorHistory()
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  /**
   * Clean up calculator history to prevent unlimited growth
   */
  cleanupCalculatorHistory() {
    const MAX_HISTORY_ENTRIES = 100

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('Calculations')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (Array.isArray(data) && data.length > MAX_HISTORY_ENTRIES) {
            // Keep only the most recent entries
            const trimmed = data
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, MAX_HISTORY_ENTRIES)
            localStorage.setItem(key, JSON.stringify(trimmed))
          }
        } catch (error) {
          console.warn(`Failed to cleanup calculator history for ${key}:`, error)
        }
      }
    }
  }

  /**
   * Check if cached data is expired
   */
  isCacheExpired(timestamp, maxAge = STORAGE_CONFIG.DEFAULT_CACHE_DURATION) {
    return Date.now() - timestamp > maxAge
  }

  /**
   * Validate data against schema
   */
  validateData(key, data) {
    const schema = VALIDATION_SCHEMAS[key]
    if (!schema) return { isValid: true, data }

    try {
      // Basic type validation
      if (schema.type === 'boolean' && typeof data !== 'boolean') {
        // Handle string boolean conversion for backward compatibility
        if (typeof data === 'string') {
          data = data === 'true'
        } else {
          throw new Error(`Expected boolean, got ${typeof data}`)
        }
      }

      if (schema.type === 'string' && typeof data !== 'string') {
        throw new Error(`Expected string, got ${typeof data}`)
      }

      if (schema.type === 'object' && (typeof data !== 'object' || data === null)) {
        throw new Error(`Expected object, got ${typeof data}`)
      }

      if (schema.type === 'array' && !Array.isArray(data)) {
        throw new Error(`Expected array, got ${typeof data}`)
      }

      // Enum validation
      if (schema.enum && !schema.enum.includes(data)) {
        throw new Error(`Value must be one of: ${schema.enum.join(', ')}`)
      }

      return { isValid: true, data }
    } catch (error) {
      console.warn(`Data validation failed for ${key}:`, error.message)
      return { 
        isValid: false, 
        error: error.message,
        data: schema.default,
      }
    }
  }

  /**
   * Get storage key with prefix
   */
  getStorageKey(key) {
    return `${STORAGE_CONFIG.KEY_PREFIX}${key}`
  }

  /**
   * Set item in storage with validation and error handling
   */
  setItem(key, value, options = {}) {
    const { 
      skipValidation = false,
      expiration = null,
    } = options

    try {
      // Validate data if not skipped
      let validatedData = value
      if (!skipValidation) {
        const validation = this.validateData(key, value)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.error}`)
        }
        validatedData = validation.data
      }

      // Prepare data for storage
      let dataToStore = validatedData
      if (expiration) {
        dataToStore = {
          data: validatedData,
          expiration: Date.now() + expiration,
        }
      }

      const serialized = JSON.stringify(dataToStore)
      
      // Check size limits
      if (serialized.length > STORAGE_CONFIG.MAX_ITEM_SIZE) {
        throw new Error(`Data too large: ${serialized.length} bytes exceeds limit`)
      }

      const storageKey = this.getStorageKey(key)

      if (this.isAvailable) {
        localStorage.setItem(storageKey, serialized)
      } else {
        // Use fallback storage
        this.fallbackData.set(storageKey, serialized)
      }

      return { success: true }
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
      return { 
        success: false, 
        error: error.message,
        usedFallback: !this.isAvailable, 
      }
    }
  }

  /**
   * Get item from storage with validation and fallback
   */
  getItem(key, options = {}) {
    const { 
      skipValidation = false,
      defaultValue = null, 
    } = options

    try {
      const storageKey = this.getStorageKey(key)
      let rawData

      if (this.isAvailable) {
        rawData = localStorage.getItem(storageKey)
      } else {
        rawData = this.fallbackData.get(storageKey)
      }

      if (rawData === null || rawData === undefined) {
        // Return schema default or provided default
        const schema = VALIDATION_SCHEMAS[key]
        return defaultValue !== null ? defaultValue : (schema?.default || null)
      }

      const parsed = JSON.parse(rawData)
      
      // Handle expiration
      if (parsed && typeof parsed === 'object' && parsed.expiration) {
        if (Date.now() > parsed.expiration) {
          this.removeItem(key)
          const schema = VALIDATION_SCHEMAS[key]
          return defaultValue !== null ? defaultValue : (schema?.default || null)
        }
        return parsed.data
      }

      // Validate data if not skipped
      if (!skipValidation) {
        const validation = this.validateData(key, parsed)
        if (!validation.isValid) {
          console.warn(`Retrieved invalid data for ${key}, using default`)
          return validation.data // Returns schema default
        }
        return validation.data
      }

      return parsed
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error)
      const schema = VALIDATION_SCHEMAS[key]
      return defaultValue !== null ? defaultValue : (schema?.default || null)
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key) {
    try {
      const storageKey = this.getStorageKey(key)
      
      if (this.isAvailable) {
        localStorage.removeItem(storageKey)
      } else {
        this.fallbackData.delete(storageKey)
      }
      
      return { success: true }
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Clear all application data
   */
  clear() {
    try {
      if (this.isAvailable) {
        // Remove only our prefixed keys
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(STORAGE_CONFIG.KEY_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } else {
        this.fallbackData.clear()
      }
      
      return { success: true }
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get storage usage statistics
   */
  getUsageStats() {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      itemBreakdown: {},
      isUsingFallback: !this.isAvailable,
    }

    try {
      if (this.isAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(STORAGE_CONFIG.KEY_PREFIX)) {
            const value = localStorage.getItem(key)
            const size = new Blob([value]).size
            stats.totalItems++
            stats.totalSize += size
            stats.itemBreakdown[key] = size
          }
        }
      } else {
        for (const [key, value] of this.fallbackData.entries()) {
          const size = new Blob([value]).size
          stats.totalItems++
          stats.totalSize += size
          stats.itemBreakdown[key] = size
        }
      }
    } catch (error) {
      console.error('Failed to calculate usage stats:', error)
    }

    return stats
  }

  /**
   * Export all data for backup/migration
   */
  exportData() {
    const exportData = {}
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        const data = this.getItem(key, { skipValidation: true })
        if (data !== null) {
          exportData[key] = data
        }
      })

      // Also export calculator history
      if (this.isAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)
          if (storageKey && storageKey.includes('Calculations')) {
            const key = storageKey.replace(STORAGE_CONFIG.KEY_PREFIX, '')
            const data = this.getItem(key, { skipValidation: true })
            if (data !== null) {
              exportData[key] = data
            }
          }
        }
      }

      return {
        success: true,
        data: exportData,
        timestamp: Date.now(),
        version: '1.0',
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Import data from backup
   */
  importData(importData, options = {}) {
    const { overwrite = false, validate = true } = options
    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
    }

    try {
      Object.entries(importData.data || importData).forEach(([key, value]) => {
        try {
          // Skip if key exists and overwrite is false
          if (!overwrite && this.getItem(key, { skipValidation: true }) !== null) {
            results.skipped++
            return
          }

          const result = this.setItem(key, value, { skipValidation: !validate })
          if (result.success) {
            results.imported++
          } else {
            results.errors.push(`${key}: ${result.error}`)
          }
        } catch (error) {
          results.errors.push(`${key}: ${error.message}`)
        }
      })

      if (results.errors.length > 0) {
        results.success = false
      }

      return results
    } catch (error) {
      console.error('Failed to import data:', error)
      return { 
        success: false, 
        error: error.message,
        imported: 0,
        skipped: 0,
        errors: [],
      }
    }
  }

  /**
   * Notify about quota warning (can be extended for UI notifications)
   */
  notifyQuotaWarning(usagePercent) {
    // This can be extended to show UI notifications
    console.warn(`Storage usage is at ${(usagePercent * 100).toFixed(1)}%`)
    
    // Trigger cleanup
    this.cleanupExpiredData()
  }

  /**
   * Add event listener for storage changes
   */
  addEventListener(callback) {
    this.storageEventListeners.add(callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.storageEventListeners.delete(callback)
  }

  /**
   * Notify listeners of storage changes
   */
  notifyListeners(key, oldValue, newValue) {
    this.storageEventListeners.forEach(callback => {
      try {
        callback({ key, oldValue, newValue })
      } catch (error) {
        console.error('Storage event listener error:', error)
      }
    })
  }
}

// Create singleton instance
const storageService = new StorageService()

// Convenience methods for common operations
export const storage = {
  // Core methods
  get: (key, options) => storageService.getItem(key, options),
  set: (key, value, options) => storageService.setItem(key, value, options),
  remove: (key) => storageService.removeItem(key),
  clear: () => storageService.clear(),

  // Utility methods
  getUsageStats: () => storageService.getUsageStats(),
  exportData: () => storageService.exportData(),
  importData: (data, options) => storageService.importData(data, options),
  checkQuota: () => storageService.checkStorageQuota(),

  // Event handling
  addEventListener: (callback) => storageService.addEventListener(callback),
  removeEventListener: (callback) => storageService.removeEventListener(callback),

  // Backward compatibility helpers
  getTheme: () => storageService.getItem(STORAGE_KEYS.THEME_PREFERENCE),
  setTheme: (theme) => storageService.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme),
  
  getDrawerState: () => storageService.getItem(STORAGE_KEYS.DRAWER_STATE),
  setDrawerState: (state) => storageService.setItem(STORAGE_KEYS.DRAWER_STATE, state),
  
  getSettings: () => storageService.getItem(STORAGE_KEYS.USER_SETTINGS),
  setSettings: (settings) => storageService.setItem(STORAGE_KEYS.USER_SETTINGS, settings),
  
  getDeals: () => storageService.getItem(STORAGE_KEYS.DEALS_DATA),
  setDeals: (deals) => storageService.setItem(STORAGE_KEYS.DEALS_DATA, deals),
  
  getNewsCache: () => storageService.getItem(STORAGE_KEYS.NEWS_CACHE),
  setNewsCache: (cache) => storageService.setItem(STORAGE_KEYS.NEWS_CACHE, cache, { 
    expiration: STORAGE_CONFIG.DEFAULT_CACHE_DURATION, 
  }),
}

export default storageService
