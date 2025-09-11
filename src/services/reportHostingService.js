/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */
/**
 * Report Hosting Service
 * 
 * Handles generation and hosting of shareable calculation reports for premium users.
 * This is a key monetization feature that drives free-to-paid conversions.
 * 
 * Features:
 * - Generate public report links for calculations
 * - Custom branding for Pro users
 * - View tracking and analytics
 * - Report expiration and access control
 * - PDF generation and sharing
 */

import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { firestore } from './firebase.js'
import { authService } from './authService.js'

export class ReportHostingService {
  constructor() {
    this.firestore = firestore
    this.authService = authService
    this.reportsCollection = 'shared_reports'
    this.maxReportsPerUser = {
      free: 0, // Free users cannot create shared reports
      pro: 50,
      team: 200,
    }
  }

  /**
   * Check if user can create shared reports
   */
  async canCreateSharedReports() {
    const user = this.authService.getCurrentUser()
    if (!user) return { allowed: false, reason: 'authentication_required' }

    const subscription = await this.authService.getSubscription()
    const plan = subscription?.plan || 'free'
    
    if (plan === 'free') {
      return { 
        allowed: false, 
        reason: 'premium_required',
        message: 'Shared reports are only available for Pro and Team subscribers. Upgrade to start sharing your deal analyses!',
      }
    }

    // Check if user has reached their report limit
    const userReportsCount = await this.getUserReportsCount(user.uid)
    const maxReports = this.maxReportsPerUser[plan] || 0

    if (userReportsCount >= maxReports) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: `You've reached your ${plan} plan limit of ${maxReports} shared reports. Delete some reports or upgrade to Team plan for more capacity.`,
      }
    }

    return { allowed: true, remaining: maxReports - userReportsCount }
  }

  /**
   * Generate a shareable report from calculation data
   */
  async createSharedReport(calculationData, options = {}) {
    try {
      // Check permissions
      const canCreate = await this.canCreateSharedReports()
      if (!canCreate.allowed) {
        return { 
          success: false, 
          error: canCreate.reason, 
          message: canCreate.message, 
        }
      }

      const user = this.authService.getCurrentUser()
      const subscription = await this.authService.getSubscription()
      const reportId = this.generateReportId()

      // Prepare report data
      const reportData = {
        id: reportId,
        userId: user.uid,
        userEmail: user.email,
        userPlan: subscription?.plan || 'free',
        
        // Calculation data
        calculationType: calculationData.type,
        calculationInputs: calculationData.inputs,
        calculationResults: calculationData.results,
        dealName: calculationData.dealName || 'Untitled Deal',
        
        // Report settings
        title: options.title || `${calculationData.dealName || 'Deal Analysis'} - ${calculationData.type}`,
        description: options.description || '',
        isPublic: options.isPublic !== false, // Default to public
        allowComments: options.allowComments || false,
        
        // Branding (Pro+ feature)
        customBranding: subscription?.plan !== 'free' ? {
          logo: options.logo || null,
          companyName: options.companyName || null,
          colors: options.colors || null,
          contactInfo: options.contactInfo || null,
        } : null,
        
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: options.expiresAt || this.getDefaultExpiration(),
        viewCount: 0,
        lastViewedAt: null,
        
        // Analytics
        viewers: [],
        shares: {
          email: 0,
          link: 0,
          social: 0,
        },
      }

      // Save to Firestore
      const reportRef = doc(this.firestore, this.reportsCollection, reportId)
      await setDoc(reportRef, reportData)

      // Generate public URL
      const publicUrl = this.generatePublicUrl(reportId)

      return {
        success: true,
        reportId,
        publicUrl,
        reportData: {
          id: reportId,
          title: reportData.title,
          createdAt: reportData.createdAt,
          expiresAt: reportData.expiresAt,
          publicUrl,
        },
      }

    } catch (error) {
      console.error('Error creating shared report:', error)
      return {
        success: false,
        error: 'creation_failed',
        message: 'Failed to create shared report. Please try again.',
      }
    }
  }

  /**
   * Get a shared report by ID (for public viewing)
   */
  async getSharedReport(reportId) {
    try {
      const reportRef = doc(this.firestore, this.reportsCollection, reportId)
      const reportSnap = await getDoc(reportRef)

      if (!reportSnap.exists()) {
        return {
          success: false,
          error: 'not_found',
          message: 'Report not found or has been removed.',
        }
      }

      const reportData = reportSnap.data()

      // Check if report has expired
      if (new Date(reportData.expiresAt) < new Date()) {
        return {
          success: false,
          error: 'expired',
          message: 'This report has expired and is no longer available.',
        }
      }

      // Update view count and analytics
      await this.trackReportView(reportId, reportData)

      return {
        success: true,
        report: reportData,
      }

    } catch (error) {
      console.error('Error getting shared report:', error)
      return {
        success: false,
        error: 'fetch_failed',
        message: 'Failed to load report. Please try again.',
      }
    }
  }

  /**
   * Get user's shared reports
   */
  async getUserReports(userId = null) {
    try {
      const targetUserId = userId || this.authService.getCurrentUser()?.uid
      if (!targetUserId) {
        return { success: false, error: 'authentication_required' }
      }

      const reportsQuery = query(
        collection(this.firestore, this.reportsCollection),
        where('userId', '==', targetUserId),
        orderBy('createdAt', 'desc'),
      )

      const querySnapshot = await getDocs(reportsQuery)
      const reports = []

      querySnapshot.forEach((doc) => {
        const reportData = doc.data()
        reports.push({
          id: reportData.id,
          title: reportData.title,
          calculationType: reportData.calculationType,
          dealName: reportData.dealName,
          createdAt: reportData.createdAt,
          expiresAt: reportData.expiresAt,
          viewCount: reportData.viewCount,
          isPublic: reportData.isPublic,
          publicUrl: this.generatePublicUrl(reportData.id),
        })
      })

      return {
        success: true,
        reports,
        count: reports.length,
      }

    } catch (error) {
      console.error('Error getting user reports:', error)
      return {
        success: false,
        error: 'fetch_failed',
        message: 'Failed to load your reports. Please try again.',
      }
    }
  }

  /**
   * Update a shared report
   */
  async updateSharedReport(reportId, updates) {
    try {
      const user = this.authService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'authentication_required' }
      }

      // Verify ownership
      const reportRef = doc(this.firestore, this.reportsCollection, reportId)
      const reportSnap = await getDoc(reportRef)

      if (!reportSnap.exists()) {
        return { success: false, error: 'not_found' }
      }

      const reportData = reportSnap.data()
      if (reportData.userId !== user.uid) {
        return { success: false, error: 'unauthorized' }
      }

      // Update report
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(reportRef, updateData)

      return { success: true }

    } catch (error) {
      console.error('Error updating shared report:', error)
      return {
        success: false,
        error: 'update_failed',
        message: 'Failed to update report. Please try again.',
      }
    }
  }

  /**
   * Delete a shared report
   */
  async deleteSharedReport(reportId) {
    try {
      const user = this.authService.getCurrentUser()
      if (!user) {
        return { success: false, error: 'authentication_required' }
      }

      // Verify ownership
      const reportRef = doc(this.firestore, this.reportsCollection, reportId)
      const reportSnap = await getDoc(reportRef)

      if (!reportSnap.exists()) {
        return { success: false, error: 'not_found' }
      }

      const reportData = reportSnap.data()
      if (reportData.userId !== user.uid) {
        return { success: false, error: 'unauthorized' }
      }

      // Delete report
      await deleteDoc(reportRef)

      return { success: true }

    } catch (error) {
      console.error('Error deleting shared report:', error)
      return {
        success: false,
        error: 'delete_failed',
        message: 'Failed to delete report. Please try again.',
      }
    }
  }

  /**
   * Track analytics for report sharing
   */
  async trackReportShare(reportId, shareMethod = 'link') {
    try {
      const reportRef = doc(this.firestore, this.reportsCollection, reportId)
      const reportSnap = await getDoc(reportRef)

      if (reportSnap.exists()) {
        const currentShares = reportSnap.data().shares || {}
        const updatedShares = {
          ...currentShares,
          [shareMethod]: (currentShares[shareMethod] || 0) + 1,
        }

        await updateDoc(reportRef, {
          shares: updatedShares,
          updatedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Error tracking report share:', error)
    }
  }

  /**
   * Get user's report count
   */
  async getUserReportsCount(userId) {
    try {
      const reportsQuery = query(
        collection(this.firestore, this.reportsCollection),
        where('userId', '==', userId),
      )

      const querySnapshot = await getDocs(reportsQuery)
      return querySnapshot.size

    } catch (error) {
      console.error('Error getting user reports count:', error)
      return 0
    }
  }

  /**
   * Track report view
   */
  async trackReportView(reportId, reportData) {
    try {
      const now = new Date().toISOString()
      const viewerInfo = {
        timestamp: now,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
      }

      const updatedViewers = [...(reportData.viewers || []), viewerInfo]
      
      // Keep only last 100 viewers for performance
      if (updatedViewers.length > 100) {
        updatedViewers.splice(0, updatedViewers.length - 100)
      }

      await updateDoc(doc(this.firestore, this.reportsCollection, reportId), {
        viewCount: (reportData.viewCount || 0) + 1,
        lastViewedAt: now,
        viewers: updatedViewers,
        updatedAt: now,
      })

    } catch (error) {
      console.error('Error tracking report view:', error)
    }
  }

  /**
   * Generate unique report ID
   */
  generateReportId() {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    return `rpt_${timestamp}_${randomStr}`
  }

  /**
   * Generate public URL for report
   */
  generatePublicUrl(reportId) {
    const baseUrl = window.location.origin
    return `${baseUrl}/shared-report/${reportId}`
  }

  /**
   * Get default expiration date (90 days from now)
   */
  getDefaultExpiration() {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 90)
    return expirationDate.toISOString()
  }

  /**
   * Generate shareable report data for a calculator
   */
  generateReportData(calculatorType, inputs, results, dealName = null) {
    return {
      type: calculatorType,
      dealName: dealName || `${calculatorType} Analysis`,
      inputs: this.sanitizeInputs(inputs),
      results: this.sanitizeResults(results),
      generatedAt: new Date().toISOString(),
      version: '1.0',
    }
  }

  /**
   * Sanitize inputs for sharing (remove sensitive data)
   */
  sanitizeInputs(inputs) {
    const sanitized = { ...inputs }
    
    // Remove potentially sensitive fields
    delete sanitized.personalNotes
    delete sanitized.privateComments
    delete sanitized.ownerContact
    
    return sanitized
  }

  /**
   * Sanitize results for sharing
   */
  sanitizeResults(results) {
    const sanitized = { ...results }
    
    // Keep only relevant calculation results
    const allowedFields = [
      'monthlyPayment', 'totalPayment', 'totalInterest',
      'cashOnCash', 'capRate', 'noi', 'cashflow',
      'totalCost', 'arv', 'profit', 'roi',
      'monthlyRent', 'expenses', 'netIncome',
    ]

    // Filter to only allowed fields
    Object.keys(sanitized).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete sanitized[key]
      }
    })
    
    return sanitized
  }

  /**
   * Get report usage statistics for user
   */
  async getUsageStats(userId = null) {
    try {
      const targetUserId = userId || this.authService.getCurrentUser()?.uid
      if (!targetUserId) {
        return { success: false, error: 'authentication_required' }
      }

      const subscription = await this.authService.getSubscription()
      const plan = subscription?.plan || 'free'
      const maxReports = this.maxReportsPerUser[plan] || 0
      const currentCount = await this.getUserReportsCount(targetUserId)

      return {
        success: true,
        plan,
        maxReports,
        currentCount,
        remaining: Math.max(0, maxReports - currentCount),
        canCreate: currentCount < maxReports && plan !== 'free',
      }

    } catch (error) {
      console.error('Error getting usage stats:', error)
      return {
        success: false,
        error: 'fetch_failed',
      }
    }
  }
}

// Create and export singleton instance
export const reportHostingService = new ReportHostingService()

// Export individual functions for direct import
export const createSharedReport = (data, options) => reportHostingService.createSharedReport(data, options)
export const getSharedReport = (reportId) => reportHostingService.getSharedReport(reportId)
export const getUserReports = (userId) => reportHostingService.getUserReports(userId)
export const canCreateSharedReports = () => reportHostingService.canCreateSharedReports()
export const trackReportShare = (reportId, method) => reportHostingService.trackReportShare(reportId, method)

// Default export
export default reportHostingService
