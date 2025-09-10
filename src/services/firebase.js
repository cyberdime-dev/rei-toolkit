/**
 * Firebase Configuration for REI Toolkit
 * 
 * Centralized Firebase initialization and configuration
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

/**
 * Firebase configuration object
 * These values should be set via environment variables in production
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rei-toolkit-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rei-toolkit-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rei-toolkit-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF123',
}

/**
 * Development environment configuration
 */
const isDevelopment = import.meta.env.DEV
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

/**
 * Initialize Firebase App
 */
export const app = initializeApp(firebaseConfig)
export const firebaseApp = app // Alias for compatibility

/**
 * Initialize Firestore
 */
export const db = getFirestore(app)
export const firestore = db // Alias for compatibility

/**
 * Initialize Firebase Auth
 */
export const auth = getAuth(app)

/**
 * Initialize Analytics (only in production)
 */
export let analytics = null
export let performance = null

if (!isDevelopment && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
    performance = getPerformance(app)
  } catch (error) {
    console.warn('Firebase Analytics/Performance not available:', error)
  }
}

/**
 * Connect to Firebase Emulators in development
 */
if (isDevelopment && useEmulators) {
  try {
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.database.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
      console.log('Connected to Firestore emulator')
    }

    // Connect to Auth emulator
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      console.log('Connected to Auth emulator')
    }
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error)
  }
}

/**
 * Firebase services configuration
 */
export const firebaseServices = {
  app,
  db,
  auth,
  analytics,
  performance,
}

/**
 * Firebase configuration utilities
 */
export const firebaseUtils = {
  /**
   * Check if Firebase is properly configured
   */
  isConfigured() {
    return !!(
      firebaseConfig.apiKey && 
      firebaseConfig.projectId && 
      firebaseConfig.apiKey !== 'demo-api-key'
    )
  },

  /**
   * Get current environment info
   */
  getEnvironmentInfo() {
    return {
      isDevelopment,
      useEmulators,
      isConfigured: this.isConfigured(),
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    }
  },

  /**
   * Validate Firebase configuration
   */
  validateConfig() {
    const required = [
      'apiKey',
      'authDomain', 
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ]

    const missing = required.filter(key => !firebaseConfig[key] || firebaseConfig[key].includes('demo'))
    
    if (missing.length > 0) {
      console.warn('Missing Firebase configuration:', missing)
      return false
    }

    return true
  },
}

// Log configuration status in development
if (isDevelopment) {
  console.log('Firebase Environment:', firebaseUtils.getEnvironmentInfo())
  
  if (!firebaseUtils.isConfigured()) {
    console.warn(
      '🔥 Firebase is using demo configuration. ' +
      'Set environment variables for production use.',
    )
  }
}

export default firebaseServices
