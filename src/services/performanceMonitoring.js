/**
 * Performance Monitoring Manager for REI Toolkit
 * 
 * Provides comprehensive performance monitoring and analytics:
 * - Firebase Performance Monitoring integration
 * - Custom performance metrics
 * - Error tracking and reporting
 * - User analytics and behavior tracking
 */

/* global performance, PerformanceObserver, setInterval */

import { firebaseService } from './firebaseService.js'
import { storageService } from './storageService.js'

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
  // Sampling rates (0-1)
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10% of sessions
  ERROR_SAMPLE_RATE: 1.0, // 100% of errors
  
  // Metrics collection
  COLLECT_WEB_VITALS: true,
  COLLECT_CUSTOM_METRICS: true,
  COLLECT_USER_TIMING: true,
  
  // Storage keys
  METRICS_QUEUE_KEY: 'performance_metrics_queue',
  ERROR_QUEUE_KEY: 'error_queue',
  SESSION_DATA_KEY: 'session_data',
  
  // Batch settings
  MAX_QUEUE_SIZE: 100,
  BATCH_SEND_INTERVAL: 30000, // 30 seconds
  
  // Metric types
  METRIC_TYPES: {
    PAGE_LOAD: 'page_load',
    COMPONENT_RENDER: 'component_render',
    API_CALL: 'api_call',
    CALCULATION: 'calculation',
    DATABASE_OPERATION: 'database_operation',
    USER_INTERACTION: 'user_interaction',
    ERROR: 'error',
    WEB_VITAL: 'web_vital',
  },
  
  // Error categories
  ERROR_CATEGORIES: {
    JAVASCRIPT: 'javascript',
    NETWORK: 'network',
    FIREBASE: 'firebase',
    VALIDATION: 'validation',
    USER: 'user',
  },
}

/**
 * Performance Monitoring Manager
 */
export class PerformanceMonitoringManager {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.metricsQueue = []
    this.errorQueue = []
    this.isInitialized = false
    
    this.init()
  }

  /**
   * Initialize performance monitoring
   */
  async init() {
    if (this.isInitialized) return

    console.log('Initializing performance monitoring...')

    // Load queued metrics
    this.loadQueues()

    // Setup error handling
    this.setupErrorHandling()

    // Setup Web Vitals collection
    if (PERFORMANCE_CONFIG.COLLECT_WEB_VITALS) {
      this.setupWebVitals()
    }

    // Setup batch sending
    this.setupBatchSending()

    // Setup session tracking
    this.startSession()

    // Setup performance observer
    if (PERFORMANCE_CONFIG.COLLECT_USER_TIMING) {
      this.setupPerformanceObserver()
    }

    this.isInitialized = true
    console.log('Performance monitoring initialized')
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        category: PERFORMANCE_CONFIG.ERROR_CATEGORIES.JAVASCRIPT,
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason,
        category: PERFORMANCE_CONFIG.ERROR_CATEGORIES.JAVASCRIPT,
        type: 'unhandled_promise_rejection',
      })
    })

    // Vue error handler (if available)
    if (window.Vue && window.Vue.config) {
      window.Vue.config.errorHandler = (err, vm, info) => {
        this.trackError({
          message: err.message,
          error: err,
          component: vm?.$options.name || 'Unknown',
          info,
          category: PERFORMANCE_CONFIG.ERROR_CATEGORIES.JAVASCRIPT,
          type: 'vue_error',
        })
      }
    }
  }

  /**
   * Setup Web Vitals collection
   */
  setupWebVitals() {
    // Largest Contentful Paint
    this.observeWebVital('largest-contentful-paint', (entry) => {
      this.trackMetric({
        name: 'LCP',
        value: entry.startTime,
        type: PERFORMANCE_CONFIG.METRIC_TYPES.WEB_VITAL,
        details: {
          element: entry.element?.tagName,
          url: entry.url,
        },
      })
    })

    // First Input Delay
    this.observeWebVital('first-input', (entry) => {
      this.trackMetric({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        type: PERFORMANCE_CONFIG.METRIC_TYPES.WEB_VITAL,
        details: {
          eventType: entry.name,
          target: entry.target?.tagName,
        },
      })
    })

    // Cumulative Layout Shift
    let clsValue = 0
    this.observeWebVital('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
        this.trackMetric({
          name: 'CLS',
          value: clsValue,
          type: PERFORMANCE_CONFIG.METRIC_TYPES.WEB_VITAL,
          details: {
            sources: entry.sources?.map(source => ({
              element: source.node?.tagName,
            })),
          },
        })
      }
    })
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigationTiming(entry)
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackResourceTiming(entry)
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

      // Observe user timing
      const userObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackUserTiming(entry)
        }
      })
      userObserver.observe({ entryTypes: ['measure', 'mark'] })
    }
  }

  /**
   * Observe specific web vital
   */
  observeWebVital(type, callback) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            callback(entry)
          }
        })
        observer.observe({ entryTypes: [type] })
      } catch (error) {
        console.warn(`Could not observe ${type}:`, error)
      }
    }
  }

  /**
   * Track custom metric
   */
  trackMetric(metric) {
    const enhancedMetric = {
      ...metric,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }

    this.metricsQueue.push(enhancedMetric)
    this.trimQueue('metrics')

    console.log('Performance metric tracked:', enhancedMetric)
  }

  /**
   * Track error
   */
  trackError(error) {
    const enhancedError = {
      ...error,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: error.error?.stack,
      userId: firebaseService.getCurrentUser()?.uid,
    }

    this.errorQueue.push(enhancedError)
    this.trimQueue('errors')

    console.error('Error tracked:', enhancedError)

    // Send errors immediately if critical
    if (this.isCriticalError(error)) {
      this.sendErrorsImmediately()
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(pageName, loadTime) {
    this.trackMetric({
      name: 'page_load_time',
      value: loadTime,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.PAGE_LOAD,
      details: {
        page: pageName,
        navigation: performance.getEntriesByType('navigation')[0],
      },
    })
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderTime) {
    this.trackMetric({
      name: 'component_render_time',
      value: renderTime,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.COMPONENT_RENDER,
      details: {
        component: componentName,
      },
    })
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint, duration, status, error = null) {
    this.trackMetric({
      name: 'api_call_duration',
      value: duration,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.API_CALL,
      details: {
        endpoint,
        status,
        error: error?.message,
        success: !error && status >= 200 && status < 300,
      },
    })

    if (error) {
      this.trackError({
        message: `API call failed: ${endpoint}`,
        error,
        category: PERFORMANCE_CONFIG.ERROR_CATEGORIES.NETWORK,
        details: { endpoint, status },
      })
    }
  }

  /**
   * Track calculation performance
   */
  trackCalculation(calculatorType, duration, inputSize) {
    this.trackMetric({
      name: 'calculation_duration',
      value: duration,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.CALCULATION,
      details: {
        calculatorType,
        inputSize,
      },
    })
  }

  /**
   * Track database operation performance
   */
  trackDatabaseOperation(operation, collection, duration, success, error = null) {
    this.trackMetric({
      name: 'database_operation_duration',
      value: duration,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.DATABASE_OPERATION,
      details: {
        operation,
        collection,
        success,
        error: error?.message,
      },
    })

    if (error) {
      this.trackError({
        message: `Database operation failed: ${operation} on ${collection}`,
        error,
        category: PERFORMANCE_CONFIG.ERROR_CATEGORIES.FIREBASE,
        details: { operation, collection },
      })
    }
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(action, element, duration = null) {
    this.trackMetric({
      name: 'user_interaction',
      value: duration || Date.now(),
      type: PERFORMANCE_CONFIG.METRIC_TYPES.USER_INTERACTION,
      details: {
        action,
        element,
        timestamp: Date.now(),
      },
    })
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming(entry) {
    this.trackMetric({
      name: 'navigation_timing',
      value: entry.loadEventEnd - entry.navigationStart,
      type: PERFORMANCE_CONFIG.METRIC_TYPES.PAGE_LOAD,
      details: {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
        firstPaint: entry.responseEnd - entry.navigationStart,
        domInteractive: entry.domInteractive - entry.navigationStart,
        loadComplete: entry.loadEventEnd - entry.navigationStart,
      },
    })
  }

  /**
   * Track resource timing
   */
  trackResourceTiming(entry) {
    // Only track slow resources
    const duration = entry.responseEnd - entry.startTime
    if (duration > 1000) { // Only track resources that take > 1 second
      this.trackMetric({
        name: 'slow_resource',
        value: duration,
        type: PERFORMANCE_CONFIG.METRIC_TYPES.PAGE_LOAD,
        details: {
          name: entry.name,
          type: entry.initiatorType,
          size: entry.transferSize,
        },
      })
    }
  }

  /**
   * Track user timing
   */
  trackUserTiming(entry) {
    this.trackMetric({
      name: entry.name,
      value: entry.duration || (entry.startTime - performance.timeOrigin),
      type: PERFORMANCE_CONFIG.METRIC_TYPES.USER_INTERACTION,
      details: {
        entryType: entry.entryType,
      },
    })
  }

  /**
   * Start performance timing
   */
  startTiming(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}_start`)
    }
    return Date.now()
  }

  /**
   * End performance timing
   */
  endTiming(name, startTime = null) {
    const endTime = Date.now()
    let duration = 0

    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      try {
        performance.mark(`${name}_end`)
        performance.measure(name, `${name}_start`, `${name}_end`)
        
        const measure = performance.getEntriesByName(name, 'measure')[0]
        duration = measure ? measure.duration : (startTime ? endTime - startTime : 0)
      } catch {
        duration = startTime ? endTime - startTime : 0
      }
    } else {
      duration = startTime ? endTime - startTime : 0
    }

    return duration
  }

  /**
   * Setup batch sending
   */
  setupBatchSending() {
    setInterval(() => {
      this.sendBatch()
    }, PERFORMANCE_CONFIG.BATCH_SEND_INTERVAL)

    // Send on page unload
    window.addEventListener('beforeunload', () => {
      this.sendBatch(true)
    })

    // Send on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendBatch(true)
      }
    })
  }

  /**
   * Send metrics and errors in batches
   */
  async sendBatch(immediate = false) {
    if (!firebaseService.isAuthenticated() || (!immediate && !this.shouldSendBatch())) {
      return
    }

    const metricsToSend = [...this.metricsQueue]
    const errorsToSend = [...this.errorQueue]

    if (metricsToSend.length === 0 && errorsToSend.length === 0) {
      return
    }

    try {
      // Send to Firebase Analytics (if available)
      if (metricsToSend.length > 0) {
        await this.sendMetricsToFirebase(metricsToSend)
        this.metricsQueue = []
      }

      if (errorsToSend.length > 0) {
        await this.sendErrorsToFirebase(errorsToSend)
        this.errorQueue = []
      }

      this.saveQueues()
      console.log(`Sent ${metricsToSend.length} metrics and ${errorsToSend.length} errors`)

    } catch (error) {
      console.error('Failed to send performance data:', error)
    }
  }

  /**
   * Send errors immediately
   */
  async sendErrorsImmediately() {
    if (this.errorQueue.length === 0) return

    try {
      await this.sendErrorsToFirebase([...this.errorQueue])
      this.errorQueue = []
      this.saveQueues()
    } catch (error) {
      console.error('Failed to send errors immediately:', error)
    }
  }

  /**
   * Send metrics to Firebase
   */
  async sendMetricsToFirebase(metrics) {
    // This would integrate with Firebase Analytics
    // For now, we'll store them in Firestore
    
    const batch = []
    for (const metric of metrics) {
      if (Math.random() <= PERFORMANCE_CONFIG.PERFORMANCE_SAMPLE_RATE) {
        batch.push(metric)
      }
    }

    if (batch.length > 0) {
      await firebaseService.savePerformanceMetrics(batch)
    }
  }

  /**
   * Send errors to Firebase
   */
  async sendErrorsToFirebase(errors) {
    const batch = []
    for (const error of errors) {
      if (Math.random() <= PERFORMANCE_CONFIG.ERROR_SAMPLE_RATE) {
        batch.push(error)
      }
    }

    if (batch.length > 0) {
      await firebaseService.saveErrorLogs(batch)
    }
  }

  /**
   * Utility methods
   */
  shouldSendBatch() {
    return this.metricsQueue.length >= 10 || this.errorQueue.length >= 5
  }

  isCriticalError(error) {
    return error.category === PERFORMANCE_CONFIG.ERROR_CATEGORIES.FIREBASE ||
           error.message?.includes('Network') ||
           error.message?.includes('Auth')
  }

  trimQueue(type) {
    if (type === 'metrics' && this.metricsQueue.length > PERFORMANCE_CONFIG.MAX_QUEUE_SIZE) {
      this.metricsQueue = this.metricsQueue.slice(-PERFORMANCE_CONFIG.MAX_QUEUE_SIZE)
    } else if (type === 'errors' && this.errorQueue.length > PERFORMANCE_CONFIG.MAX_QUEUE_SIZE) {
      this.errorQueue = this.errorQueue.slice(-PERFORMANCE_CONFIG.MAX_QUEUE_SIZE)
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  startSession() {
    const sessionData = {
      id: this.sessionId,
      startTime: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }

    storageService.setItem(PERFORMANCE_CONFIG.SESSION_DATA_KEY, sessionData)
  }

  loadQueues() {
    this.metricsQueue = storageService.getItem(PERFORMANCE_CONFIG.METRICS_QUEUE_KEY, { defaultValue: [] })
    this.errorQueue = storageService.getItem(PERFORMANCE_CONFIG.ERROR_QUEUE_KEY, { defaultValue: [] })
  }

  saveQueues() {
    storageService.setItem(PERFORMANCE_CONFIG.METRICS_QUEUE_KEY, this.metricsQueue)
    storageService.setItem(PERFORMANCE_CONFIG.ERROR_QUEUE_KEY, this.errorQueue)
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      sessionId: this.sessionId,
      queuedMetrics: this.metricsQueue.length,
      queuedErrors: this.errorQueue.length,
      sessionStartTime: storageService.getItem(PERFORMANCE_CONFIG.SESSION_DATA_KEY)?.startTime,
      isInitialized: this.isInitialized,
    }
  }

  /**
   * Clear all performance data
   */
  clearPerformanceData() {
    this.metricsQueue = []
    this.errorQueue = []
    this.saveQueues()
    storageService.removeItem(PERFORMANCE_CONFIG.SESSION_DATA_KEY)
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.sendBatch(true)
    this.saveQueues()
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitoringManager()

// Export configuration
export { PERFORMANCE_CONFIG }

// Helper functions for easy usage
export const trackPageLoad = (pageName, loadTime) => performanceMonitor.trackPageLoad(pageName, loadTime)
export const trackComponentRender = (componentName, renderTime) => performanceMonitor.trackComponentRender(componentName, renderTime)
export const trackAPICall = (endpoint, duration, status, error) => performanceMonitor.trackAPICall(endpoint, duration, status, error)
export const trackCalculation = (calculatorType, duration, inputSize) => performanceMonitor.trackCalculation(calculatorType, duration, inputSize)
export const trackDatabaseOperation = (operation, collection, duration, success, error) => performanceMonitor.trackDatabaseOperation(operation, collection, duration, success, error)
export const trackUserInteraction = (action, element, duration) => performanceMonitor.trackUserInteraction(action, element, duration)
export const startTiming = (name) => performanceMonitor.startTiming(name)
export const endTiming = (name, startTime) => performanceMonitor.endTiming(name, startTime)

// Default export
export default performanceMonitor
