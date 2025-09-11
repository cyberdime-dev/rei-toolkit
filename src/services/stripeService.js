/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */
/**
 * Stripe Service for REI Toolkit
 * 
 * Handles subscription management, payments, and billing:
 * - Stripe Checkout integration
 * - Subscription lifecycle management
 * - Customer portal access
 * - Webhook processing
 * - Plan management
 */

/* global fetch */

import { loadStripe } from '@stripe/stripe-js'
import { authService } from './authService.js'

/**
 * Stripe configuration
 */
const STRIPE_CONFIG = {
  // Stripe keys (set via environment variables)
  PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  
  // Subscription plans
  PLANS: {
    PRO: {
      priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      name: 'Pro',
      price: 19,
      interval: 'month',
      features: [
        'Cloud sync across devices',
        'Unlimited deals and calculations',
        'Professional PDF exports with branding',
        'Priority customer support',
        'Advanced analytics dashboard',
      ],
    },
    TEAM: {
      priceId: import.meta.env.VITE_STRIPE_TEAM_PRICE_ID || 'price_team_monthly',
      name: 'Team',
      price: 49,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Real-time team collaboration',
        'Role-based permissions',
        'Shared deal pipeline',
        'Team analytics and reporting',
        'Client portal access',
      ],
    },
  },
  
  // Stripe URLs
  SUCCESS_URL: `${window.location.origin}/checkout/success`,
  CANCEL_URL: `${window.location.origin}/pricing`,
  PORTAL_URL: `${window.location.origin}/billing/portal`,
  
  // Error messages
  ERROR_MESSAGES: {
    'stripe_not_loaded': 'Payment system is not available. Please try again later.',
    'user_not_authenticated': 'You must be logged in to subscribe.',
    'subscription_exists': 'You already have an active subscription.',
    'payment_failed': 'Payment failed. Please check your payment method.',
    'subscription_not_found': 'Subscription not found.',
    'plan_not_found': 'Selected plan is not available.',
    'checkout_failed': 'Failed to start checkout process.',
    'portal_failed': 'Failed to access billing portal.',
  },
}

/**
 * Stripe Service Class
 */
class StripeService {
  constructor() {
    this.stripe = null
    this.isLoading = false
    this.isInitialized = false
    
    this.init()
  }
  
  /**
   * Initialize Stripe
   */
  async init() {
    try {
      if (!STRIPE_CONFIG.PUBLISHABLE_KEY) {
        console.warn('Stripe publishable key not found in environment variables')
        return
      }
      
      console.log('Initializing Stripe...')
      this.stripe = await loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)
      this.isInitialized = true
      console.log('Stripe initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Stripe:', error)
      throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.stripe_not_loaded)
    }
  }
  
  /**
   * Ensure Stripe is loaded
   */
  async ensureStripeLoaded() {
    if (!this.isInitialized || !this.stripe) {
      await this.init()
    }
    
    if (!this.stripe) {
      throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.stripe_not_loaded)
    }
    
    return this.stripe
  }
  
  /**
   * Get available subscription plans
   */
  getPlans() {
    return STRIPE_CONFIG.PLANS
  }
  
  /**
   * Get specific plan details
   */
  getPlan(planName) {
    const plan = STRIPE_CONFIG.PLANS[planName.toUpperCase()]
    if (!plan) {
      throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.plan_not_found)
    }
    return plan
  }
  
  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(planName) {
    try {
      // Ensure user is authenticated
      const user = authService.getCurrentUser()
      if (!user) {
        throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.user_not_authenticated)
      }
      
      // Get plan details
      const plan = this.getPlan(planName)
      
      // Check if user already has a subscription
      const userProfile = authService.getUserProfile()
      if (userProfile?.subscription?.status === 'active') {
        throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.subscription_exists)
      }
      
      // Create checkout session via your backend API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          userEmail: user.email,
          successUrl: STRIPE_CONFIG.SUCCESS_URL,
          cancelUrl: STRIPE_CONFIG.CANCEL_URL,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }
      
      const { sessionId } = await response.json()
      return sessionId
      
    } catch (error) {
      console.error('Checkout session creation failed:', error)
      throw new Error(error.message || STRIPE_CONFIG.ERROR_MESSAGES.checkout_failed)
    }
  }
  
  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(planName) {
    try {
      this.isLoading = true
      
      // Ensure Stripe is loaded
      await this.ensureStripeLoaded()
      
      // Create checkout session
      const sessionId = await this.createCheckoutSession(planName)
      
      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: sessionId,
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
    } catch (error) {
      console.error('Checkout redirect failed:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }
  
  /**
   * Create customer portal session
   */
  async createPortalSession() {
    try {
      // Ensure user is authenticated
      const user = authService.getCurrentUser()
      if (!user) {
        throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.user_not_authenticated)
      }
      
      // Get user's Stripe customer ID
      const userProfile = authService.getUserProfile()
      if (!userProfile?.stripeCustomerId) {
        throw new Error(STRIPE_CONFIG.ERROR_MESSAGES.subscription_not_found)
      }
      
      // Create portal session via your backend API
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          customerId: userProfile.stripeCustomerId,
          returnUrl: STRIPE_CONFIG.PORTAL_URL,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }
      
      const { url } = await response.json()
      return url
      
    } catch (error) {
      console.error('Portal session creation failed:', error)
      throw new Error(error.message || STRIPE_CONFIG.ERROR_MESSAGES.portal_failed)
    }
  }
  
  /**
   * Redirect to Stripe Customer Portal
   */
  async redirectToPortal() {
    try {
      this.isLoading = true
      
      // Create portal session
      const portalUrl = await this.createPortalSession()
      
      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl
      
    } catch (error) {
      console.error('Portal redirect failed:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }
  
  /**
   * Get user's subscription status
   */
  getSubscriptionStatus() {
    const userProfile = authService.getUserProfile()
    
    if (!userProfile?.subscription) {
      return {
        status: 'none',
        plan: 'free',
        isActive: false,
        isPremium: false,
      }
    }
    
    const subscription = userProfile.subscription
    const isActive = subscription.status === 'active'
    const isPremium = isActive && ['pro', 'team'].includes(subscription.plan?.toLowerCase())
    
    return {
      status: subscription.status,
      plan: subscription.plan || 'free',
      isActive,
      isPremium,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    }
  }
  
  /**
   * Check if user has access to specific feature
   */
  hasFeatureAccess(feature) {
    const subscription = this.getSubscriptionStatus()
    
    // Free users have limited access
    if (!subscription.isPremium) {
      const freeFeatures = ['basic_calculations', 'local_storage', 'pdf_export']
      return freeFeatures.includes(feature)
    }
    
    // Pro users have access to most features
    if (subscription.plan === 'pro') {
      const proFeatures = [
        'basic_calculations', 'local_storage', 'pdf_export',
        'cloud_sync', 'advanced_analytics', 'branded_reports',
      ]
      return proFeatures.includes(feature)
    }
    
    // Team users have access to all features
    if (subscription.plan === 'team') {
      return true
    }
    
    return false
  }
  
  /**
   * Get loading state
   */
  isCheckoutLoading() {
    return this.isLoading
  }
  
  /**
   * Utility Methods
   */
  formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
  
  getErrorMessage(errorCode) {
    return STRIPE_CONFIG.ERROR_MESSAGES[errorCode] || 'An unexpected error occurred.'
  }
}

// Create and export singleton instance
export const stripeService = new StripeService()

// Export configuration and utilities
export { STRIPE_CONFIG }

// Helper functions for components
export const getSubscriptionPlans = () => stripeService.getPlans()
export const getSubscriptionStatus = () => stripeService.getSubscriptionStatus()
export const hasFeatureAccess = (feature) => stripeService.hasFeatureAccess(feature)
export const redirectToCheckout = (plan) => stripeService.redirectToCheckout(plan)
export const redirectToPortal = () => stripeService.redirectToPortal()

// Default export
export default stripeService
