/**
 * Firestore Data Schema Definitions for REI Toolkit
 * 
 * Defines the structure and validation rules for all Firestore collections
 * Used for data validation, documentation, and type safety
 */

/**
 * User document schema
 */
export const UserSchema = {
  // Required fields
  uid: 'string',
  email: 'string',
  createdAt: 'timestamp',
  lastLoginAt: 'timestamp',
  
  // Optional fields
  displayName: 'string|null',
  photoURL: 'string|null',
  emailVerified: 'boolean',
  isAnonymous: 'boolean',
  linkedAt: 'timestamp|null',
  
  // User preferences
  preferences: {
    theme: 'string', // 'light', 'dark', 'auto'
    notifications: 'boolean',
    autoSave: 'boolean',
    defaultCurrency: 'string', // 'USD', 'EUR', etc.
    calculatorDefaults: 'object',
  },
  
  // Metadata
  updatedAt: 'timestamp|null',
}

/**
 * Deal document schema
 */
export const DealSchema = {
  // Required fields
  userId: 'string',
  title: 'string',
  propertyType: 'string', // 'single-family', 'multi-family', 'commercial', etc.
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  
  // Property details
  address: {
    street: 'string|null',
    city: 'string|null',
    state: 'string|null',
    zipCode: 'string|null',
    country: 'string|null',
  },
  
  // Financial details
  purchasePrice: 'number|null',
  downPayment: 'number|null',
  loanAmount: 'number|null',
  interestRate: 'number|null',
  
  // Property metrics
  sqft: 'number|null',
  bedrooms: 'number|null',
  bathrooms: 'number|null',
  yearBuilt: 'number|null',
  lotSize: 'number|null',
  
  // Rental information
  monthlyRent: 'number|null',
  grossRentalYield: 'number|null',
  netRentalYield: 'number|null',
  
  // Deal status and strategy
  status: 'string', // 'analyzing', 'under-contract', 'closed', 'rejected'
  strategy: 'string', // 'buy-hold', 'fix-flip', 'brrrr', 'wholesale'
  
  // Notes and attachments
  notes: 'string|null',
  tags: 'array', // Array of strings
  attachments: 'array|null', // Array of file references
  
  // Calculated metrics (computed fields)
  roi: 'number|null',
  capRate: 'number|null',
  cashOnCash: 'number|null',
  noi: 'number|null',
  
  // Deal source and referrals
  source: 'string|null', // 'mls', 'wholesaler', 'direct-mail', etc.
  agent: 'string|null',
  
  // Important dates
  analysisDate: 'timestamp|null',
  contractDate: 'timestamp|null',
  closingDate: 'timestamp|null',
  
  // Custom fields for extensibility
  customFields: 'object|null',
}

/**
 * Calculation document schema
 */
export const CalculationSchema = {
  // Required fields
  userId: 'string',
  type: 'string', // 'mortgage', 'buy-hold', 'fix-flip', etc.
  inputs: 'object',
  results: 'object',
  timestamp: 'timestamp',
  
  // Optional associations
  dealId: 'string|null', // Reference to associated deal
  
  // Calculation metadata
  version: 'string|null', // Calculator version used
  title: 'string|null', // User-provided name for the calculation
  notes: 'string|null',
  
  // Sharing and collaboration
  isShared: 'boolean',
  sharedWith: 'array|null', // Array of user IDs
  
  // Custom parameters
  customInputs: 'object|null',
  
  // Calculation-specific data based on type
  mortgageCalculation: {
    loanAmount: 'number',
    interestRate: 'number',
    loanTerm: 'number',
    downPayment: 'number|null',
    pmi: 'number|null',
    propertyTax: 'number|null',
    insurance: 'number|null',
    hoaFees: 'number|null',
  },
  
  buyHoldCalculation: {
    purchasePrice: 'number',
    downPayment: 'number',
    monthlyRent: 'number',
    vacancy: 'number',
    maintenance: 'number',
    management: 'number',
    propertyTax: 'number',
    insurance: 'number',
    utilities: 'number|null',
  },
  
  fixFlipCalculation: {
    purchasePrice: 'number',
    rehabCosts: 'number',
    holdingCosts: 'number',
    sellingCosts: 'number',
    arv: 'number', // After Repair Value
    timeToFlip: 'number', // months
  },
  
  brrrCalculation: {
    purchasePrice: 'number',
    rehabCosts: 'number',
    arv: 'number',
    refinanceLtv: 'number',
    refinanceRate: 'number',
    monthlyRent: 'number',
    expenses: 'object',
  },
  
  wholesaleCalculation: {
    purchasePrice: 'number',
    arv: 'number',
    rehabCosts: 'number',
    assignmentFee: 'number',
    marketingCosts: 'number|null',
  },
}

/**
 * Preferences document schema (user subcollection)
 */
export const PreferencesSchema = {
  // Calculator preferences
  calculatorDefaults: {
    mortgage: 'object|null',
    buyHold: 'object|null',
    fixFlip: 'object|null',
    brrrr: 'object|null',
    wholesale: 'object|null',
  },
  
  // UI preferences
  theme: 'string',
  language: 'string',
  currency: 'string',
  numberFormat: 'string',
  
  // Notification preferences
  emailNotifications: 'boolean',
  pushNotifications: 'boolean',
  marketingEmails: 'boolean',
  
  // Privacy settings
  profileVisibility: 'string', // 'public', 'private', 'friends'
  dataSharing: 'boolean',
  analytics: 'boolean',
  
  // Feature flags
  betaFeatures: 'boolean',
  experimentalCalculators: 'boolean',
  
  // Backup and sync
  autoBackup: 'boolean',
  syncFrequency: 'string', // 'real-time', 'hourly', 'daily'
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
}

/**
 * Public data schema (for shared/reference data)
 */
export const PublicDataSchema = {
  // Market data
  marketData: {
    region: 'string',
    averageRent: 'number',
    averagePrice: 'number',
    capRates: 'object',
    trends: 'object',
    lastUpdated: 'timestamp',
  },
  
  // Calculator configurations
  calculatorConfigs: {
    type: 'string',
    version: 'string',
    defaultValues: 'object',
    validationRules: 'object',
    updatedAt: 'timestamp',
  },
  
  // System announcements
  announcements: {
    title: 'string',
    message: 'string',
    type: 'string', // 'info', 'warning', 'success', 'error'
    targetUsers: 'array|null', // User segments
    startDate: 'timestamp',
    endDate: 'timestamp|null',
    createdAt: 'timestamp',
  },
}

/**
 * Data validation utilities
 */
export const ValidationUtils = {
  /**
   * Validate deal data against schema
   */
  validateDeal(dealData) {
    const errors = []
    
    // Required fields
    if (!dealData.title || typeof dealData.title !== 'string') {
      errors.push('Title is required and must be a string')
    }
    
    if (!dealData.propertyType || typeof dealData.propertyType !== 'string') {
      errors.push('Property type is required and must be a string')
    }
    
    // Validate property types
    const validPropertyTypes = [
      'single-family',
      'multi-family',
      'commercial',
      'condo',
      'townhouse',
      'land',
      'mixed-use',
    ]
    
    if (dealData.propertyType && !validPropertyTypes.includes(dealData.propertyType)) {
      errors.push(`Property type must be one of: ${validPropertyTypes.join(', ')}`)
    }
    
    // Validate status
    const validStatuses = ['analyzing', 'under-contract', 'closed', 'rejected', 'archived']
    if (dealData.status && !validStatuses.includes(dealData.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
    }
    
    // Validate strategies
    const validStrategies = ['buy-hold', 'fix-flip', 'brrrr', 'wholesale', 'live-in-flip']
    if (dealData.strategy && !validStrategies.includes(dealData.strategy)) {
      errors.push(`Strategy must be one of: ${validStrategies.join(', ')}`)
    }
    
    // Validate numeric fields
    const numericFields = [
      'purchasePrice', 'downPayment', 'loanAmount', 'interestRate',
      'monthlyRent', 'sqft', 'bedrooms', 'bathrooms', 'yearBuilt',
      'roi', 'capRate', 'cashOnCash', 'noi',
    ]
    
    numericFields.forEach(field => {
      if (dealData[field] !== null && dealData[field] !== undefined) {
        if (typeof dealData[field] !== 'number' || isNaN(dealData[field])) {
          errors.push(`${field} must be a valid number`)
        }
        if (dealData[field] < 0) {
          errors.push(`${field} cannot be negative`)
        }
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  /**
   * Validate calculation data against schema
   */
  validateCalculation(calculationData) {
    const errors = []
    
    // Required fields
    if (!calculationData.type || typeof calculationData.type !== 'string') {
      errors.push('Calculation type is required and must be a string')
    }
    
    if (!calculationData.inputs || typeof calculationData.inputs !== 'object') {
      errors.push('Inputs are required and must be an object')
    }
    
    if (!calculationData.results || typeof calculationData.results !== 'object') {
      errors.push('Results are required and must be an object')
    }
    
    // Validate calculation types
    const validTypes = [
      'mortgage',
      'buy-hold',
      'fix-flip',
      'brrrr',
      'wholesale',
      'cap-rate',
      'cash-on-cash',
      'noi',
      'standard',
    ]
    
    if (calculationData.type && !validTypes.includes(calculationData.type)) {
      errors.push(`Calculation type must be one of: ${validTypes.join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  /**
   * Sanitize deal data for storage
   */
  sanitizeDeal(dealData) {
    const sanitized = { ...dealData }
    
    // Ensure required fields have defaults
    sanitized.status = sanitized.status || 'analyzing'
    sanitized.tags = sanitized.tags || []
    
    // Clean up numeric fields
    const numericFields = [
      'purchasePrice', 'downPayment', 'loanAmount', 'interestRate',
      'monthlyRent', 'sqft', 'bedrooms', 'bathrooms', 'yearBuilt',
    ]
    
    numericFields.forEach(field => {
      if (sanitized[field] !== null && sanitized[field] !== undefined) {
        sanitized[field] = Number(sanitized[field])
        if (isNaN(sanitized[field])) {
          sanitized[field] = null
        }
      }
    })
    
    // Ensure address is an object
    if (!sanitized.address || typeof sanitized.address !== 'object') {
      sanitized.address = {}
    }
    
    return sanitized
  },

  /**
   * Get default deal object
   */
  getDefaultDeal() {
    return {
      title: '',
      propertyType: 'single-family',
      status: 'analyzing',
      strategy: 'buy-hold',
      address: {},
      tags: [],
      purchasePrice: null,
      downPayment: null,
      monthlyRent: null,
      notes: '',
    }
  },

  /**
   * Get default calculation object
   */
  getDefaultCalculation(type) {
    return {
      type,
      inputs: {},
      results: {},
      title: '',
      notes: '',
      isShared: false,
    }
  },
}

/**
 * Schema version for migration tracking
 */
export const SCHEMA_VERSION = '1.0.0'

/**
 * Export all schemas for external use
 */
export const FirestoreSchemas = {
  User: UserSchema,
  Deal: DealSchema,
  Calculation: CalculationSchema,
  Preferences: PreferencesSchema,
  PublicData: PublicDataSchema,
}

export default FirestoreSchemas
