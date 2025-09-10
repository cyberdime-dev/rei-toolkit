// Deal Management Utility for localStorage persistence
// Handles CRUD operations for real estate deals

const STORAGE_KEY = 'rei_toolkit_deals'

export class Deal {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.address = data.address || ''
    this.purchasePrice = data.purchasePrice || 0
    this.downPayment = data.downPayment || 0
    this.loanAmount = data.loanAmount || 0
    this.interestRate = data.interestRate || 0
    this.loanTerm = data.loanTerm || 30
    this.monthlyRent = data.monthlyRent || 0
    this.monthlyExpenses = data.monthlyExpenses || 0
    this.repairCosts = data.repairCosts || 0
    this.arv = data.arv || 0 // After Repair Value
    this.strategy = data.strategy || 'buy-hold' // buy-hold, fix-flip, brrr, wholesale
    this.status = data.status || 'analyzing' // analyzing, under-contract, closed, passed
    this.notes = data.notes || ''
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Calculate key metrics
  get cashFlow() {
    const monthlyPayment = this.calculateMonthlyPayment()
    return this.monthlyRent - this.monthlyExpenses - monthlyPayment
  }

  get cashOnCashReturn() {
    const totalCashInvested = this.downPayment + this.repairCosts
    if (totalCashInvested === 0) return 0
    return (this.cashFlow * 12) / totalCashInvested
  }

  get capRate() {
    if (this.purchasePrice === 0) return 0
    const noi = (this.monthlyRent - this.monthlyExpenses) * 12
    return noi / this.purchasePrice
  }

  calculateMonthlyPayment() {
    if (this.loanAmount === 0 || this.interestRate === 0) return 0
    const monthlyRate = this.interestRate / 100 / 12
    const numPayments = this.loanTerm * 12
    return (this.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1)
  }

  // Update timestamp when deal is modified
  touch() {
    this.updatedAt = new Date().toISOString()
  }

  // Validation
  isValid() {
    return this.name.trim() !== '' && this.purchasePrice > 0
  }

  // Export for calculations
  toCalculatorData() {
    return {
      purchasePrice: this.purchasePrice,
      downPayment: this.downPayment,
      interestRate: this.interestRate,
      loanTerm: this.loanTerm,
      monthlyRent: this.monthlyRent,
      monthlyExpenses: this.monthlyExpenses,
      repairCosts: this.repairCosts,
      arv: this.arv,
    }
  }
}

export class DealManager {
  constructor() {
    this.deals = this.loadDeals()
  }

  // Load deals from localStorage
  loadDeals() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      
      const dealsData = JSON.parse(data)
      return dealsData.map(dealData => new Deal(dealData))
    } catch (error) {
      console.error('Error loading deals:', error)
      return []
    }
  }

  // Save deals to localStorage
  saveDeals() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.deals))
      return true
    } catch (error) {
      console.error('Error saving deals:', error)
      return false
    }
  }

  // Create a new deal
  createDeal(dealData) {
    const deal = new Deal(dealData)
    if (!deal.isValid()) {
      throw new Error('Deal data is invalid')
    }
    
    this.deals.unshift(deal) // Add to beginning
    this.saveDeals()
    return deal
  }

  // Get deal by ID
  getDeal(id) {
    return this.deals.find(deal => deal.id === id)
  }

  // Update existing deal
  updateDeal(id, updatedData) {
    const dealIndex = this.deals.findIndex(deal => deal.id === id)
    if (dealIndex === -1) {
      throw new Error('Deal not found')
    }

    // Preserve ID and timestamps
    const existingDeal = this.deals[dealIndex]
    const updatedDeal = new Deal({
      ...updatedData,
      id: existingDeal.id,
      createdAt: existingDeal.createdAt,
    })
    updatedDeal.touch()

    if (!updatedDeal.isValid()) {
      throw new Error('Updated deal data is invalid')
    }

    this.deals[dealIndex] = updatedDeal
    this.saveDeals()
    return updatedDeal
  }

  // Delete deal
  deleteDeal(id) {
    const dealIndex = this.deals.findIndex(deal => deal.id === id)
    if (dealIndex === -1) {
      throw new Error('Deal not found')
    }

    this.deals.splice(dealIndex, 1)
    this.saveDeals()
    return true
  }

  // Get all deals
  getAllDeals() {
    return [...this.deals] // Return copy
  }

  // Get deals by status
  getDealsByStatus(status) {
    return this.deals.filter(deal => deal.status === status)
  }

  // Get deals by strategy
  getDealsByStrategy(strategy) {
    return this.deals.filter(deal => deal.strategy === strategy)
  }

  // Search deals
  searchDeals(query) {
    const searchTerm = query.toLowerCase()
    return this.deals.filter(deal => 
      deal.name.toLowerCase().includes(searchTerm) ||
      deal.address.toLowerCase().includes(searchTerm) ||
      deal.notes.toLowerCase().includes(searchTerm),
    )
  }

  // Export deals to JSON
  exportDeals() {
    return JSON.stringify(this.deals, null, 2)
  }

  // Import deals from JSON
  importDeals(jsonData) {
    try {
      const dealsData = JSON.parse(jsonData)
      const importedDeals = dealsData.map(dealData => new Deal(dealData))
      
      // Validate all deals before importing
      const invalidDeals = importedDeals.filter(deal => !deal.isValid())
      if (invalidDeals.length > 0) {
        throw new Error(`${invalidDeals.length} invalid deals found in import data`)
      }

      this.deals = importedDeals
      this.saveDeals()
      return importedDeals.length
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`)
    }
  }

  // Get summary statistics
  getSummary() {
    const totalDeals = this.deals.length
    const totalValue = this.deals.reduce((sum, deal) => sum + deal.purchasePrice, 0)
    const avgCashFlow = totalDeals > 0 ? 
      this.deals.reduce((sum, deal) => sum + deal.cashFlow, 0) / totalDeals : 0
    
    const statusCounts = this.deals.reduce((counts, deal) => {
      counts[deal.status] = (counts[deal.status] || 0) + 1
      return counts
    }, {})

    const strategyCounts = this.deals.reduce((counts, deal) => {
      counts[deal.strategy] = (counts[deal.strategy] || 0) + 1
      return counts
    }, {})

    return {
      totalDeals,
      totalValue,
      avgCashFlow,
      statusCounts,
      strategyCounts,
    }
  }
}

// Create a singleton instance
export const dealManager = new DealManager()

// Export default
export default dealManager
