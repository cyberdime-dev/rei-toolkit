/**
 * Firebase Service Layer for REI Toolkit
 * 
 * Provides a comprehensive abstraction layer for all Firebase operations
 * Includes Firestore, Authentication, and data management utilities
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  linkWithCredential,
} from 'firebase/auth'

import { db, auth } from './firebase.js'

/**
 * Firebase Service Configuration
 */
const SERVICE_CONFIG = {
  // Collection names
  COLLECTIONS: {
    USERS: 'users',
    DEALS: 'deals',
    CALCULATIONS: 'calculations',
    PREFERENCES: 'preferences',
    PUBLIC: 'public',
  },
  
  // Batch operation limits
  BATCH_SIZE: 500,
  
  // Query limits
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  
  // Cache settings
  CACHE_SIZE_BYTES: 40 * 1024 * 1024, // 40MB
}

/**
 * Firebase Service Class
 */
export class FirebaseService {
  constructor() {
    this.currentUser = null
    this.authStateCallbacks = new Map()
    this.realtimeListeners = new Map()
    
    // Set up auth state listener
    this.setupAuthStateListener()
  }

  /**
   * Authentication Methods
   */
  
  /**
   * Set up authentication state listener
   */
  setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      this.notifyAuthStateCallbacks(user)
    })
  }

  /**
   * Register auth state change callback
   */
  onAuthStateChange(callback) {
    const id = Date.now().toString()
    this.authStateCallbacks.set(id, callback)
    
    // Call immediately with current state
    callback(this.currentUser)
    
    return () => this.authStateCallbacks.delete(id)
  }

  /**
   * Notify auth state callbacks
   */
  notifyAuthStateCallbacks(user) {
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(user)
      } catch (error) {
        console.error('Auth state callback error:', error)
      }
    })
  }

  /**
   * Create user with email and password
   */
  async createUser(email, password, displayName = null) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }
      
      // Create user document
      await this.createUserDocument(result.user)
      
      // Send verification email
      await sendEmailVerification(result.user)
      
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await this.updateUserLastLogin(result.user.uid)
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      await this.createUserDocument(result.user)
      await this.updateUserLastLogin(result.user.uid)
      
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in with GitHub
   */
  async signInWithGitHub() {
    try {
      const provider = new GithubAuthProvider()
      provider.addScope('user:email')
      
      const result = await signInWithPopup(auth, provider)
      await this.createUserDocument(result.user)
      await this.updateUserLastLogin(result.user.uid)
      
      return { success: true, user: result.user }
    } catch (error) {
      console.error('GitHub sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth)
      await this.createUserDocument(result.user, { isAnonymous: true })
      
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Anonymous sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await signOut(auth)
      this.clearRealtimeListeners()
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Link anonymous account with email/password
   */
  async linkAnonymousAccount(email, password) {
    try {
      if (!this.currentUser || !this.currentUser.isAnonymous) {
        throw new Error('No anonymous user to link')
      }

      const credential = EmailAuthProvider.credential(email, password)
      const result = await linkWithCredential(this.currentUser, credential)
      
      // Update user document
      await this.updateUserDocument(result.user.uid, {
        email: result.user.email,
        isAnonymous: false,
        linkedAt: serverTimestamp(),
      })
      
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Link account error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * User Document Methods
   */
  
  /**
   * Create user document in Firestore
   */
  async createUserDocument(user, additionalData = {}) {
    if (!user) return

    const userRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, user.uid)
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        theme: 'auto',
        notifications: true,
        autoSave: true,
      },
      ...additionalData,
    }

    try {
      const docSnap = await getDoc(userRef)
      if (!docSnap.exists()) {
        await updateDoc(userRef, userData)
      }
    } catch {
      // Document doesn't exist, create it
      await updateDoc(userRef, userData)
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateUserLastLogin(userId) {
    try {
      const userRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, userId)
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn('Failed to update last login:', error)
    }
  }

  /**
   * Update user document
   */
  async updateUserDocument(userId, updates) {
    try {
      const userRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error('Update user error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user document
   */
  async getUserDocument(userId) {
    try {
      const userRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, userId)
      const docSnap = await getDoc(userRef)
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() }
      } else {
        return { success: false, error: 'User document not found' }
      }
    } catch (error) {
      console.error('Get user error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deal Management Methods
   */
  
  /**
   * Create a new deal
   */
  async createDeal(dealData) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const dealsRef = collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS)
      const deal = {
        ...dealData,
        userId: this.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(dealsRef, deal)
      return { success: true, id: docRef.id, data: deal }
    } catch (error) {
      console.error('Create deal error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(dealId, updates) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const dealRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS, dealId)
      await updateDoc(dealRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      
      return { success: true }
    } catch (error) {
      console.error('Update deal error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(dealId) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const dealRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS, dealId)
      await deleteDoc(dealRef)
      
      return { success: true }
    } catch (error) {
      console.error('Delete deal error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user's deals with optional filtering and pagination
   */
  async getDeals(options = {}) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const {
        propertyType = null,
        status = null,
        limit: queryLimit = SERVICE_CONFIG.DEFAULT_LIMIT,
        lastDoc = null,
      } = options

      let q = query(
        collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS),
        orderBy('updatedAt', 'desc'),
      )

      // Add filters
      if (propertyType) {
        q = query(q, where('propertyType', '==', propertyType))
      }
      if (status) {
        q = query(q, where('status', '==', status))
      }

      // Add limit
      q = query(q, limit(queryLimit))

      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const deals = []
      
      querySnapshot.forEach((doc) => {
        deals.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return {
        success: true,
        data: deals,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === queryLimit,
      }
    } catch (error) {
      console.error('Get deals error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(dealId) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const dealRef = doc(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS, dealId)
      const docSnap = await getDoc(dealRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data(),
          },
        }
      } else {
        return { success: false, error: 'Deal not found' }
      }
    } catch (error) {
      console.error('Get deal error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Calculation Management Methods
   */
  
  /**
   * Save a calculation result
   */
  async saveCalculation(calculationData) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const calculationsRef = collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.CALCULATIONS)
      const calculation = {
        ...calculationData,
        userId: this.currentUser.uid,
        timestamp: serverTimestamp(),
      }

      const docRef = await addDoc(calculationsRef, calculation)
      return { success: true, id: docRef.id, data: calculation }
    } catch (error) {
      console.error('Save calculation error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user's calculations with filtering
   */
  async getCalculations(options = {}) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const {
        type = null,
        dealId = null,
        limit: queryLimit = SERVICE_CONFIG.DEFAULT_LIMIT,
        lastDoc = null,
      } = options

      let q = query(
        collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.CALCULATIONS),
        orderBy('timestamp', 'desc'),
      )

      // Add filters
      if (type) {
        q = query(q, where('type', '==', type))
      }
      if (dealId) {
        q = query(q, where('dealId', '==', dealId))
      }

      // Add limit
      q = query(q, limit(queryLimit))

      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const calculations = []
      
      querySnapshot.forEach((doc) => {
        calculations.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return {
        success: true,
        data: calculations,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === queryLimit,
      }
    } catch (error) {
      console.error('Get calculations error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Batch Operations
   */
  
  /**
   * Batch create deals
   */
  async batchCreateDeals(userId, deals) {
    try {
      const batch = writeBatch(db)
      const dealsRef = collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, userId, SERVICE_CONFIG.COLLECTIONS.DEALS)

      deals.forEach((dealData) => {
        const docRef = doc(dealsRef)
        batch.set(docRef, {
          ...dealData,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
      return { success: true, count: deals.length }
    } catch (error) {
      console.error('Batch create deals error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Batch create calculations
   */
  async batchCreateCalculations(userId, calculations) {
    try {
      const batch = writeBatch(db)
      const calculationsRef = collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, userId, SERVICE_CONFIG.COLLECTIONS.CALCULATIONS)

      calculations.forEach((calculationData) => {
        const docRef = doc(calculationsRef)
        batch.set(docRef, {
          ...calculationData,
          userId,
          timestamp: serverTimestamp(),
        })
      })

      await batch.commit()
      return { success: true, count: calculations.length }
    } catch (error) {
      console.error('Batch create calculations error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Real-time Methods
   */
  
  /**
   * Listen to deals changes in real-time
   */
  listenToDeals(callback, options = {}) {
    if (!this.currentUser) {
      callback({ success: false, error: 'User not authenticated' })
      return () => {}
    }

    try {
      const q = query(
        collection(db, SERVICE_CONFIG.COLLECTIONS.USERS, this.currentUser.uid, SERVICE_CONFIG.COLLECTIONS.DEALS),
        orderBy('updatedAt', 'desc'),
        limit(options.limit || SERVICE_CONFIG.DEFAULT_LIMIT),
      )

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const deals = []
        querySnapshot.forEach((doc) => {
          deals.push({
            id: doc.id,
            ...doc.data(),
          })
        })

        callback({ success: true, data: deals })
      }, (error) => {
        console.error('Deals listener error:', error)
        callback({ success: false, error: error.message })
      })

      // Store listener for cleanup
      const listenerId = `deals_${Date.now()}`
      this.realtimeListeners.set(listenerId, unsubscribe)

      return () => {
        unsubscribe()
        this.realtimeListeners.delete(listenerId)
      }
    } catch (error) {
      console.error('Listen to deals error:', error)
      callback({ success: false, error: error.message })
      return () => {}
    }
  }

  /**
   * Clear all real-time listeners
   */
  clearRealtimeListeners() {
    this.realtimeListeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.realtimeListeners.clear()
  }

  /**
   * Utility Methods
   */
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Enable offline support
   */
  async enableOffline() {
    try {
      await disableNetwork(db)
      console.log('Offline mode enabled')
      return { success: true }
    } catch (error) {
      console.error('Enable offline error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Disable offline support
   */
  async disableOffline() {
    try {
      await enableNetwork(db)
      console.log('Online mode enabled')
      return { success: true }
    } catch (error) {
      console.error('Disable offline error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService()

// Export service configuration for external use
export { SERVICE_CONFIG }

// Default export
export default firebaseService
