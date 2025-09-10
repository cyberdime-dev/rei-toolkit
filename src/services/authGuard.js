/**
 * Authentication Guards for REI Toolkit
 * 
 * Provides route protection and role-based access control:
 * - Route guards for authenticated/unauthenticated access
 * - Role-based permission checks
 * - Trial user limitations
 * - Redirect logic for authentication flows
 */

/* global URLSearchParams, URL */

import { authService } from './authService.js'

/**
 * Navigation guard configuration
 */
const GUARD_CONFIG = {
  // Redirect routes
  LOGIN_ROUTE: '/login',
  TRIAL_ROUTE: '/login',
  UPGRADE_ROUTE: '/login',
  HOME_ROUTE: '/',
  
  // Protected routes that require authentication
  PROTECTED_ROUTES: [
    '/deals',
    '/settings',
    '/profile',
    '/export',
    '/calculator',
    '/dashboard',
  ],
  
  // Routes that require full account (not trial)
  PREMIUM_ROUTES: [
    '/export',
    '/advanced',
    '/integrations',
  ],
  
  // Routes only for unauthenticated users
  AUTH_ONLY_ROUTES: [
    '/login',
    '/register',
    '/forgot-password',
  ],
  
  // Public routes accessible to everyone
  PUBLIC_ROUTES: [
    '/',
    '/calculators',
    '/about',
    '/privacy',
    '/terms',
  ],
}

/**
 * Authentication Guard Service
 */
export class AuthGuardService {
  constructor() {
    this.authService = authService
  }

  /**
   * Check if user can access a route
   */
  canAccess(to, from = null) {
    const user = this.authService.getCurrentUser()
    const userProfile = this.authService.getUserProfile()
    const isAuthenticated = this.authService.isAuthenticated()
    const isTrialUser = this.authService.isTrialUser()
    const isAnonymous = this.authService.isAnonymousUser()
    
    console.log('Route guard check:', {
      to: to.path,
      user: user?.email || 'anonymous',
      isAuthenticated,
      isTrialUser,
      isAnonymous,
    })

    // Check if route requires authentication
    if (this.requiresAuth(to.path)) {
      if (!user) {
        return {
          allowed: false,
          redirect: GUARD_CONFIG.LOGIN_ROUTE,
          reason: 'authentication_required',
        }
      }

      // Check if trial user accessing premium features
      if (isTrialUser && this.requiresPremium(to.path)) {
        return {
          allowed: false,
          redirect: GUARD_CONFIG.UPGRADE_ROUTE,
          reason: 'premium_required',
        }
      }

      // Check trial expiration
      if (isTrialUser && this.authService.isTrialExpired()) {
        return {
          allowed: false,
          redirect: GUARD_CONFIG.UPGRADE_ROUTE,
          reason: 'trial_expired',
        }
      }
    }

    // Check if authenticated user accessing auth-only routes
    if (isAuthenticated && this.isAuthOnlyRoute(to.path)) {
      return {
        allowed: false,
        redirect: GUARD_CONFIG.HOME_ROUTE,
        reason: 'already_authenticated',
      }
    }

    // Check role-based permissions
    const roleCheck = this.checkRolePermissions(to, userProfile)
    if (!roleCheck.allowed) {
      return roleCheck
    }

    return { allowed: true }
  }

  /**
   * Check if route requires authentication
   */
  requiresAuth(path) {
    return GUARD_CONFIG.PROTECTED_ROUTES.some(route => 
      path.startsWith(route),
    )
  }

  /**
   * Check if route requires premium account
   */
  requiresPremium(path) {
    return GUARD_CONFIG.PREMIUM_ROUTES.some(route => 
      path.startsWith(route),
    )
  }

  /**
   * Check if route is auth-only (login, register, etc.)
   */
  isAuthOnlyRoute(path) {
    return GUARD_CONFIG.AUTH_ONLY_ROUTES.some(route => 
      path.startsWith(route),
    )
  }

  /**
   * Check if route is public
   */
  isPublicRoute(path) {
    return GUARD_CONFIG.PUBLIC_ROUTES.some(route => 
      path === route || (route !== '/' && path.startsWith(route)),
    )
  }

  /**
   * Check role-based permissions
   */
  checkRolePermissions(to, userProfile) {
    const userRole = userProfile?.role || 'anonymous'
    
    // Define route permissions
    const routePermissions = {
      '/deals': ['trial', 'free', 'premium', 'admin'],
      '/export': ['free', 'premium', 'admin'],
      '/advanced': ['premium', 'admin'],
      '/admin': ['admin'],
      '/integrations': ['premium', 'admin'],
    }

    // Check if route has specific role requirements
    for (const [route, allowedRoles] of Object.entries(routePermissions)) {
      if (to.path.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          return {
            allowed: false,
            redirect: userRole === 'trial' ? GUARD_CONFIG.UPGRADE_ROUTE : GUARD_CONFIG.LOGIN_ROUTE,
            reason: 'insufficient_permissions',
          }
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Check trial limitations for specific features
   */
  checkTrialLimitations(feature) {
    if (!this.authService.isTrialUser()) {
      return { allowed: true }
    }

    const limitations = this.authService.getTrialLimitations()
    
    if (limitations.expired) {
      return {
        allowed: false,
        reason: 'trial_expired',
        message: 'Your trial has expired. Please upgrade to continue.',
      }
    }

    // Check specific feature limitations
    switch (feature) {
      case 'export':
        return {
          allowed: limitations.EXPORT_ENABLED,
          reason: 'trial_limitation',
          message: 'Export feature is not available in trial mode.',
        }

      case 'real_time_sync':
        return {
          allowed: limitations.REAL_TIME_SYNC,
          reason: 'trial_limitation',
          message: 'Real-time sync is not available in trial mode.',
        }

      case 'create_deal':
        // This would be checked against current deal count
        return {
          allowed: true, // Would check against actual count
          reason: 'trial_limitation',
          message: `Trial users can create up to ${limitations.MAX_DEALS} deals.`,
        }

      case 'save_calculation':
        // This would be checked against current calculation count
        return {
          allowed: true, // Would check against actual count
          reason: 'trial_limitation',
          message: `Trial users can save up to ${limitations.MAX_CALCULATIONS} calculations.`,
        }

      default:
        return { allowed: true }
    }
  }

  /**
   * Get redirect route for authentication
   */
  getAuthRedirect(reason, originalRoute = '/') {
    switch (reason) {
      case 'authentication_required':
        return `${GUARD_CONFIG.LOGIN_ROUTE}?redirect=${encodeURIComponent(originalRoute)}`
      
      case 'trial_expired':
      case 'premium_required':
        return `${GUARD_CONFIG.UPGRADE_ROUTE}?from=${encodeURIComponent(originalRoute)}`
      
      case 'already_authenticated':
        return GUARD_CONFIG.HOME_ROUTE
      
      default:
        return GUARD_CONFIG.LOGIN_ROUTE
    }
  }

  /**
   * Handle authentication redirect after login
   */
  handlePostLoginRedirect(defaultRoute = GUARD_CONFIG.HOME_ROUTE) {
    // Check for redirect parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirectTo = urlParams.get('redirect')
    
    if (redirectTo) {
      try {
        const decodedRedirect = decodeURIComponent(redirectTo)
        
        // Validate redirect URL (security check)
        if (this.isValidRedirect(decodedRedirect)) {
          return decodedRedirect
        }
      } catch (error) {
        console.warn('Invalid redirect parameter:', error)
      }
    }
    
    return defaultRoute
  }

  /**
   * Validate redirect URL for security
   */
  isValidRedirect(url) {
    // Prevent open redirect vulnerabilities
    try {
      const parsedUrl = new URL(url, window.location.origin)
      
      // Only allow same-origin redirects
      return parsedUrl.origin === window.location.origin
    } catch {
      return false
    }
  }

  /**
   * Check if user needs to verify email
   */
  needsEmailVerification() {
    const user = this.authService.getCurrentUser()
    return user && user.email && !user.emailVerified
  }

  /**
   * Check if user profile is complete
   */
  needsProfileCompletion() {
    const userProfile = this.authService.getUserProfile()
    
    if (!userProfile) return true
    
    // Check required profile fields
    const requiredFields = ['displayName']
    return requiredFields.some(field => !userProfile[field])
  }

  /**
   * Get onboarding step for new users
   */
  getOnboardingStep() {
    if (!this.authService.isAuthenticated()) {
      return 'authentication'
    }
    
    if (this.needsEmailVerification()) {
      return 'email_verification'
    }
    
    if (this.needsProfileCompletion()) {
      return 'profile_completion'
    }
    
    const userProfile = this.authService.getUserProfile()
    if (!userProfile?.onboardingCompleted) {
      return 'feature_introduction'
    }
    
    return 'completed'
  }

  /**
   * Vue Router navigation guard
   */
  createRouterGuard() {
    return (to, from, next) => {
      const result = this.canAccess(to, from)
      
      if (result.allowed) {
        next()
      } else {
        const redirectRoute = this.getAuthRedirect(result.reason, to.fullPath)
        console.log('Redirecting to:', redirectRoute, 'Reason:', result.reason)
        next(redirectRoute)
      }
    }
  }

  /**
   * Composable for Vue 3 components
   */
  useAuthGuard() {
    return {
      canAccess: (route) => this.canAccess(route),
      requiresAuth: (path) => this.requiresAuth(path),
      requiresPremium: (path) => this.requiresPremium(path),
      checkTrialLimitations: (feature) => this.checkTrialLimitations(feature),
      getOnboardingStep: () => this.getOnboardingStep(),
      isAuthenticated: () => this.authService.isAuthenticated(),
      isTrialUser: () => this.authService.isTrialUser(),
      getUserRole: () => this.authService.getUserRole(),
    }
  }
}

// Create and export singleton instance
export const authGuard = new AuthGuardService()

// Export configuration
export { GUARD_CONFIG }

// Helper functions for components
export const canAccessRoute = (route) => authGuard.canAccess(route)
export const requiresAuthentication = (path) => authGuard.requiresAuth(path)
export const checkFeatureAccess = (feature) => authGuard.checkTrialLimitations(feature)
export const getOnboardingStep = () => authGuard.getOnboardingStep()

// Default export
export default authGuard
