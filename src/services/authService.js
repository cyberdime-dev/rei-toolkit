/**
 * Firebase Authentication Service for REI Toolkit
 * 
 * Provides comprehensive authentication functionality:
 * - Email/password authentication
 * - Google OAuth integration
 * - GitHub OAuth integration
 * - Anonymous authentication (trial mode)
 * - Account linking and management
 */

/* global CustomEvent */

import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithCredential,
  updateProfile,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { firebaseApp, firestore } from './firebase.js'

/**
 * Authentication configuration
 */
const AUTH_CONFIG = {
  // Provider configurations
  GOOGLE_SCOPES: ['profile', 'email'],
  GITHUB_SCOPES: ['user:email'],
  
  // Trial mode settings
  TRIAL_DURATION_DAYS: 30,
  TRIAL_FEATURES: {
    MAX_DEALS: 5,
    MAX_CALCULATIONS: 50,
    EXPORT_ENABLED: false,
    REAL_TIME_SYNC: false,
  },
  
  // User roles
  USER_ROLES: {
    ANONYMOUS: 'anonymous',
    TRIAL: 'trial', 
    FREE: 'free',
    PREMIUM: 'premium',
    ADMIN: 'admin',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
    'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',
  },
}

/**
 * Firebase Authentication Service
 */
export class FirebaseAuthService {
  constructor() {
    this.auth = getAuth(firebaseApp)
    this.currentUser = null
    this.userProfile = null
    this.authStateListeners = []
    
    // Setup emulator if in development
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && import.meta.env.DEV) {
      const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost'
      const emulatorPort = import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099
      
      try {
        connectAuthEmulator(this.auth, `http://${emulatorHost}:${emulatorPort}`)
        console.log('🔥 Connected to Firebase Auth emulator')
      } catch (error) {
        console.warn('Failed to connect to Auth emulator:', error)
      }
    }
    
    // Setup auth state listener
    this.setupAuthStateListener()
  }

  /**
   * Setup authentication state listener
   */
  setupAuthStateListener() {
    onAuthStateChanged(this.auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user')
      
      this.currentUser = user
      
      if (user) {
        // Load user profile from Firestore
        await this.loadUserProfile(user.uid)
        
        // Update last login time
        await this.updateLastLogin(user.uid)
        
        // Check if trial user needs upgrade prompt
        if (this.isTrialUser() && this.isTrialExpired()) {
          this.notifyTrialExpired()
        }
      } else {
        this.userProfile = null
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(callback => callback(user, this.userProfile))
    })
  }

  /**
   * Email/Password Authentication
   */
  async signUpWithEmail(email, password, displayName = '') {
    try {
      console.log('Creating account with email:', email)
      
      const result = await createUserWithEmailAndPassword(this.auth, email, password)
      const user = result.user
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName })
      }
      
      // Send email verification
      await sendEmailVerification(user)
      
      // Create user profile in Firestore
      await this.createUserProfile(user, {
        authProvider: 'email',
        role: AUTH_CONFIG.USER_ROLES.FREE,
      })
      
      return {
        success: true,
        user,
        message: 'Account created successfully! Please check your email for verification.',
      }
      
    } catch (error) {
      console.error('Email signup error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async signInWithEmail(email, password) {
    try {
      console.log('Signing in with email:', email)
      
      const result = await signInWithEmailAndPassword(this.auth, email, password)
      const user = result.user
      
      return {
        success: true,
        user,
        message: 'Signed in successfully!',
      }
      
    } catch (error) {
      console.error('Email signin error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * Google OAuth Authentication
   */
  async signInWithGoogle() {
    try {
      console.log('Signing in with Google...')
      
      const provider = new GoogleAuthProvider()
      AUTH_CONFIG.GOOGLE_SCOPES.forEach(scope => provider.addScope(scope))
      
      const result = await signInWithPopup(this.auth, provider)
      const user = result.user
      
      // Check if this is a new user
      const userDoc = await getDoc(doc(firestore, 'users', user.uid))
      const isNewUser = !userDoc.exists()
      
      if (isNewUser) {
        await this.createUserProfile(user, {
          authProvider: 'google',
          role: AUTH_CONFIG.USER_ROLES.FREE,
        })
      }
      
      return {
        success: true,
        user,
        isNewUser,
        message: isNewUser ? 'Welcome! Your account has been created.' : 'Welcome back!',
      }
      
    } catch (error) {
      console.error('Google signin error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * GitHub OAuth Authentication
   */
  async signInWithGitHub() {
    try {
      console.log('Signing in with GitHub...')
      
      const provider = new GithubAuthProvider()
      AUTH_CONFIG.GITHUB_SCOPES.forEach(scope => provider.addScope(scope))
      
      const result = await signInWithPopup(this.auth, provider)
      const user = result.user
      
      // Check if this is a new user
      const userDoc = await getDoc(doc(firestore, 'users', user.uid))
      const isNewUser = !userDoc.exists()
      
      if (isNewUser) {
        await this.createUserProfile(user, {
          authProvider: 'github',
          role: AUTH_CONFIG.USER_ROLES.FREE,
        })
      }
      
      return {
        success: true,
        user,
        isNewUser,
        message: isNewUser ? 'Welcome! Your account has been created.' : 'Welcome back!',
      }
      
    } catch (error) {
      console.error('GitHub signin error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * Anonymous Authentication (Trial Mode)
   */
  async signInAnonymously() {
    try {
      console.log('Starting anonymous trial...')
      
      const result = await signInAnonymously(this.auth)
      const user = result.user
      
      // Create trial user profile
      await this.createUserProfile(user, {
        authProvider: 'anonymous',
        role: AUTH_CONFIG.USER_ROLES.TRIAL,
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + AUTH_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      })
      
      return {
        success: true,
        user,
        message: `Welcome to your ${AUTH_CONFIG.TRIAL_DURATION_DAYS}-day trial!`,
        trialInfo: {
          daysRemaining: AUTH_CONFIG.TRIAL_DURATION_DAYS,
          features: AUTH_CONFIG.TRIAL_FEATURES,
        },
      }
      
    } catch (error) {
      console.error('Anonymous signin error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * Account Linking
   */
  async linkAccountWithEmail(email, password) {
    try {
      if (!this.currentUser || !this.currentUser.isAnonymous) {
        throw new Error('Can only link accounts for anonymous users')
      }
      
      console.log('Linking anonymous account with email:', email)
      
      const credential = EmailAuthProvider.credential(email, password)
      const result = await linkWithCredential(this.currentUser, credential)
      
      // Update user profile
      await this.updateUserProfile(result.user.uid, {
        authProvider: 'email',
        role: AUTH_CONFIG.USER_ROLES.FREE,
        linkedAt: new Date().toISOString(),
      })
      
      // Send email verification
      await sendEmailVerification(result.user)
      
      return {
        success: true,
        user: result.user,
        message: 'Account linked successfully! Please verify your email.',
      }
      
    } catch (error) {
      console.error('Account linking error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async linkAccountWithGoogle() {
    try {
      if (!this.currentUser || !this.currentUser.isAnonymous) {
        throw new Error('Can only link accounts for anonymous users')
      }
      
      console.log('Linking anonymous account with Google...')
      
      const provider = new GoogleAuthProvider()
      AUTH_CONFIG.GOOGLE_SCOPES.forEach(scope => provider.addScope(scope))
      
      const result = await linkWithCredential(this.currentUser, provider)
      
      // Update user profile
      await this.updateUserProfile(result.user.uid, {
        authProvider: 'google',
        role: AUTH_CONFIG.USER_ROLES.FREE,
        linkedAt: new Date().toISOString(),
      })
      
      return {
        success: true,
        user: result.user,
        message: 'Account linked with Google successfully!',
      }
      
    } catch (error) {
      console.error('Google account linking error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * User Profile Management
   */
  async createUserProfile(user, additionalData = {}) {
    try {
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...additionalData,
        
        // User preferences
        preferences: {
          theme: 'system',
          currency: 'USD',
          numberFormat: 'US',
          notifications: {
            email: true,
            browser: true,
          },
        },
        
        // Usage statistics
        usage: {
          totalCalculations: 0,
          totalDeals: 0,
          lastActivity: new Date().toISOString(),
        },
      }
      
      await setDoc(doc(firestore, 'users', user.uid), userProfile)
      this.userProfile = userProfile
      
      console.log('User profile created successfully')
      return { success: true, profile: userProfile }
      
    } catch (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error: error.message }
    }
  }

  async loadUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid))
      
      if (userDoc.exists()) {
        this.userProfile = userDoc.data()
        return { success: true, profile: this.userProfile }
      } else {
        console.warn('User profile not found, creating new one...')
        return await this.createUserProfile(this.currentUser)
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error)
      return { success: false, error: error.message }
    }
  }

  async updateUserProfile(uid, updates) {
    try {
      const userRef = doc(firestore, 'users', uid)
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      
      await updateDoc(userRef, updateData)
      
      // Update local profile if it's the current user
      if (uid === this.currentUser?.uid && this.userProfile) {
        this.userProfile = { ...this.userProfile, ...updateData }
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message }
    }
  }

  async updateLastLogin(uid) {
    try {
      await this.updateUserProfile(uid, {
        lastLoginAt: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('Failed to update last login time:', error)
    }
  }

  /**
   * Password and Email Management
   */
  async updateUserPassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser || !this.currentUser.email) {
        throw new Error('No authenticated user found')
      }
      
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword)
      await linkWithCredential(this.currentUser, credential)
      
      // Update password
      await updatePassword(this.currentUser, newPassword)
      
      return {
        success: true,
        message: 'Password updated successfully',
      }
      
    } catch (error) {
      console.error('Password update error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async updateUserEmail(newEmail, password) {
    try {
      if (!this.currentUser || !this.currentUser.email) {
        throw new Error('No authenticated user found')
      }
      
      // Re-authenticate user before email change
      const credential = EmailAuthProvider.credential(this.currentUser.email, password)
      await linkWithCredential(this.currentUser, credential)
      
      // Update email
      await updateEmail(this.currentUser, newEmail)
      
      // Send verification to new email
      await sendEmailVerification(this.currentUser)
      
      // Update profile
      await this.updateUserProfile(this.currentUser.uid, { email: newEmail })
      
      return {
        success: true,
        message: 'Email updated successfully. Please verify your new email address.',
      }
      
    } catch (error) {
      console.error('Email update error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(this.auth, email)
      
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      }
      
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async resendEmailVerification() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user found')
      }
      
      await sendEmailVerification(this.currentUser)
      
      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      }
      
    } catch (error) {
      console.error('Email verification error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  /**
   * Account Management
   */
  async deleteUserAccount(password = null) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user found')
      }
      
      const uid = this.currentUser.uid
      
      // Re-authenticate if email user
      if (this.currentUser.email && password) {
        const credential = EmailAuthProvider.credential(this.currentUser.email, password)
        await linkWithCredential(this.currentUser, credential)
      }
      
      // Delete user data from Firestore
      await deleteDoc(doc(firestore, 'users', uid))
      
      // Delete user account
      await deleteUser(this.currentUser)
      
      return {
        success: true,
        message: 'Account deleted successfully',
      }
      
    } catch (error) {
      console.error('Account deletion error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      }
    }
  }

  async signOut() {
    try {
      await signOut(this.auth)
      this.currentUser = null
      this.userProfile = null
      
      return {
        success: true,
        message: 'Signed out successfully',
      }
      
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Trial Mode Management
   */
  isTrialUser() {
    return this.userProfile?.role === AUTH_CONFIG.USER_ROLES.TRIAL
  }

  isAnonymousUser() {
    return this.currentUser?.isAnonymous || false
  }

  isTrialExpired() {
    if (!this.isTrialUser() || !this.userProfile?.trialEndDate) {
      return false
    }
    
    return new Date() > new Date(this.userProfile.trialEndDate)
  }

  getTrialDaysRemaining() {
    if (!this.isTrialUser() || !this.userProfile?.trialEndDate) {
      return 0
    }
    
    const endDate = new Date(this.userProfile.trialEndDate)
    const now = new Date()
    const diffTime = endDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  getTrialLimitations() {
    if (!this.isTrialUser()) {
      return null
    }
    
    return {
      ...AUTH_CONFIG.TRIAL_FEATURES,
      daysRemaining: this.getTrialDaysRemaining(),
      expired: this.isTrialExpired(),
    }
  }

  notifyTrialExpired() {
    // This would integrate with your notification system
    console.log('Trial expired - prompting user to upgrade')
    
    const event = new CustomEvent('trialExpired', {
      detail: {
        message: 'Your trial has expired. Please create an account to continue using all features.',
        userProfile: this.userProfile,
      },
    })
    window.dispatchEvent(event)
  }

  /**
   * Utility Methods
   */
  getErrorMessage(errorCode) {
    return AUTH_CONFIG.ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.'
  }

  getCurrentUser() {
    return this.currentUser
  }

  getUserProfile() {
    return this.userProfile
  }

  isAuthenticated() {
    return !!this.currentUser && !this.currentUser.isAnonymous
  }

  isEmailVerified() {
    return this.currentUser?.emailVerified || false
  }

  getUserRole() {
    return this.userProfile?.role || AUTH_CONFIG.USER_ROLES.ANONYMOUS
  }

  hasPermission(permission) {
    const role = this.getUserRole()
    
    // Define role permissions
    const permissions = {
      [AUTH_CONFIG.USER_ROLES.ANONYMOUS]: [],
      [AUTH_CONFIG.USER_ROLES.TRIAL]: ['basic_calculations', 'limited_deals'],
      [AUTH_CONFIG.USER_ROLES.FREE]: ['all_calculations', 'unlimited_deals', 'export'],
      [AUTH_CONFIG.USER_ROLES.PREMIUM]: ['all_calculations', 'unlimited_deals', 'export', 'advanced_features'],
      [AUTH_CONFIG.USER_ROLES.ADMIN]: ['all_permissions'],
    }
    
    return permissions[role]?.includes(permission) || permissions[role]?.includes('all_permissions')
  }

  /**
   * Auth State Management
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback)
    
    // Call immediately with current state
    callback(this.currentUser, this.userProfile)
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.authStateListeners = []
  }
}

// Create and export singleton instance
export const authService = new FirebaseAuthService()

// Export configuration and user roles
export { AUTH_CONFIG }

// Export helper functions
export const getCurrentUser = () => authService.getCurrentUser()
export const getUserProfile = () => authService.getUserProfile()
export const isAuthenticated = () => authService.isAuthenticated()
export const isTrialUser = () => authService.isTrialUser()
export const getTrialLimitations = () => authService.getTrialLimitations()

// Default export
export default authService
