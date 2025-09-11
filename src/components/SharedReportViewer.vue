<template>
  <div class="shared-report-viewer">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
      <div class="text-h6 mt-4">
        Loading report...
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center py-12"
    >
      <v-icon
        size="80"
        color="error"
        class="mb-4"
      >
        mdi-alert-circle-outline
      </v-icon>
      <div class="text-h5 mb-2">
        {{ errorTitle }}
      </div>
      <div class="text-body-1 text-medium-emphasis mb-4">
        {{ errorMessage }}
      </div>
      <v-btn
        color="primary"
        @click="$router.push('/')"
      >
        Go to REI Toolkit
      </v-btn>
    </div>

    <!-- Report Content -->
    <div
      v-else-if="report"
      class="report-content"
    >
      <!-- Header with Branding -->
      <v-card
        class="mb-6"
        elevation="2"
      >
        <v-card-text>
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <!-- Custom Logo -->
              <img
                v-if="report.customBranding?.logo"
                :src="report.customBranding.logo"
                alt="Company Logo"
                class="me-4"
                style="max-height: 60px; max-width: 120px;"
              />
              
              <div>
                <div class="text-h4 mb-1">
                  {{ report.title }}
                </div>
                <div class="text-subtitle-1 text-medium-emphasis">
                  {{ report.calculationType }} Analysis
                </div>
                <div
                  v-if="report.customBranding?.companyName"
                  class="text-body-2 text-primary font-weight-medium"
                >
                  by {{ report.customBranding.companyName }}
                </div>
              </div>
            </div>

            <!-- REI Toolkit Branding -->
            <div class="text-right">
              <div class="text-caption text-medium-emphasis">
                Generated with
              </div>
              <div class="text-h6 text-primary font-weight-bold">
                REI Toolkit
              </div>
            </div>
          </div>

          <!-- Description -->
          <div
            v-if="report.description"
            class="mt-4"
          >
            <v-divider class="mb-3" />
            <div class="text-body-1">
              {{ report.description }}
            </div>
          </div>

          <!-- Contact Info -->
          <div
            v-if="report.customBranding?.contactInfo"
            class="mt-4"
          >
            <v-divider class="mb-3" />
            <div class="text-body-2 text-medium-emphasis">
              Contact: {{ report.customBranding.contactInfo }}
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Property Information -->
      <v-card
        class="mb-6"
        elevation="1"
      >
        <v-card-title class="d-flex align-center">
          <v-icon
            class="me-2"
            color="primary"
          >
            mdi-home
          </v-icon>
          Property Overview
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="(value, key) in propertyInputs"
              :key="key"
              cols="12"
              sm="6"
              md="4"
            >
              <div class="text-caption text-medium-emphasis">
                {{ formatFieldName(key) }}
              </div>
              <div class="text-h6">
                {{ formatValue(value, key) }}
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Key Metrics -->
      <v-card
        class="mb-6"
        elevation="1"
      >
        <v-card-title class="d-flex align-center">
          <v-icon
            class="me-2"
            color="success"
          >
            mdi-chart-line
          </v-icon>
          Key Results
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="(metric, index) in keyMetrics"
              :key="index"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                variant="outlined"
                class="pa-4 text-center h-100"
              >
                <div class="text-h4 font-weight-bold mb-1">
                  <span :class="getMetricColor(metric.value, metric.type)">
                    {{ metric.value }}
                  </span>
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ metric.label }}
                </div>
                <div
                  v-if="metric.description"
                  class="text-caption mt-1"
                >
                  {{ metric.description }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Detailed Results -->
      <v-card
        class="mb-6"
        elevation="1"
      >
        <v-card-title class="d-flex align-center">
          <v-icon
            class="me-2"
            color="info"
          >
            mdi-calculator
          </v-icon>
          Detailed Analysis
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="(value, key) in detailedResults"
              :key="key"
              cols="12"
              sm="6"
              md="4"
            >
              <div class="d-flex justify-space-between align-center py-2 border-b">
                <div class="text-body-2">
                  {{ formatFieldName(key) }}
                </div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ formatValue(value, key) }}
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Actions -->
      <v-card
        class="mb-6"
        elevation="1"
      >
        <v-card-text class="text-center">
          <div class="text-h6 mb-4">
            Want to create your own deal analyses?
          </div>
          <v-btn
            color="primary"
            size="large"
            class="me-3"
            @click="goToCalculator"
          >
            <v-icon left>
              mdi-calculator
            </v-icon>
            Try REI Toolkit Free
          </v-btn>
          <v-btn
            variant="outlined"
            color="secondary"
            @click="downloadPDF"
          >
            <v-icon left>
              mdi-download
            </v-icon>
            Download PDF
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Comments Section (if enabled) -->
      <v-card
        v-if="report.allowComments"
        class="mb-6"
        elevation="1"
      >
        <v-card-title class="d-flex align-center">
          <v-icon
            class="me-2"
            color="secondary"
          >
            mdi-comment-multiple
          </v-icon>
          Comments
        </v-card-title>
        <v-card-text>
          <div class="text-center text-medium-emphasis py-4">
            Comments feature coming soon!
          </div>
        </v-card-text>
      </v-card>

      <!-- Report Metadata -->
      <v-card
        variant="outlined"
        class="mb-6"
      >
        <v-card-text>
          <div class="d-flex justify-space-between text-caption text-medium-emphasis">
            <div>
              Created: {{ formatDate(report.createdAt) }}
            </div>
            <div>
              Views: {{ report.viewCount || 0 }}
            </div>
            <div>
              Report ID: {{ reportId }}
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportHostingService } from '@/services/reportHostingService.js'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref(false)
const report = ref(null)

// Computed
const reportId = computed(() => route.params.reportId)

const errorTitle = computed(() => {
  if (!error.value) return ''
  
  switch (error.value) {
    case 'not_found':
      return 'Report Not Found'
    case 'expired':
      return 'Report Expired'
    case 'fetch_failed':
      return 'Loading Error'
    default:
      return 'Something Went Wrong'
  }
})

const errorMessage = computed(() => {
  if (!error.value) return ''
  
  switch (error.value) {
    case 'not_found':
      return 'This report doesn\'t exist or has been removed by the owner.'
    case 'expired':
      return 'This report has expired and is no longer available for viewing.'
    case 'fetch_failed':
      return 'We couldn\'t load this report. Please try again later.'
    default:
      return 'An unexpected error occurred while loading the report.'
  }
})

const propertyInputs = computed(() => {
  if (!report.value?.calculationInputs) return {}
  
  const inputs = { ...report.value.calculationInputs }
  
  // Filter to only show relevant property information
  const relevantFields = [
    'purchasePrice', 'address', 'bedrooms', 'bathrooms', 'squareFeet',
    'monthlyRent', 'downPayment', 'loanAmount', 'interestRate', 'loanTerm',
    'rehabCost', 'arv', 'wholesaleFee', 'assignmentFee',
  ]
  
  const filtered = {}
  relevantFields.forEach(field => {
    if (inputs[field] !== undefined && inputs[field] !== null && inputs[field] !== '') {
      filtered[field] = inputs[field]
    }
  })
  
  return filtered
})

const keyMetrics = computed(() => {
  if (!report.value?.calculationResults) return []
  
  const results = report.value.calculationResults
  const metrics = []
  
  // Define key metrics based on calculation type
  switch (report.value.calculationType) {
    case 'mortgage':
      metrics.push(
        { label: 'Monthly Payment', value: formatCurrency(results.monthlyPayment), type: 'currency' },
        { label: 'Total Interest', value: formatCurrency(results.totalInterest), type: 'currency' },
        { label: 'Total Payment', value: formatCurrency(results.totalPayment), type: 'currency' },
      )
      break
      
    case 'buyAndHold':
      metrics.push(
        { label: 'Monthly Cashflow', value: formatCurrency(results.monthlyRent - results.totalExpenses), type: 'cashflow' },
        { label: 'Cash-on-Cash Return', value: formatPercentage(results.cashOnCash), type: 'percentage' },
        { label: 'Cap Rate', value: formatPercentage(results.capRate), type: 'percentage' },
      )
      break
      
    case 'fixAndFlip':
      metrics.push(
        { label: 'Total Profit', value: formatCurrency(results.profit), type: 'profit' },
        { label: 'ROI', value: formatPercentage(results.roi), type: 'percentage' },
        { label: 'Profit Margin', value: formatPercentage(results.profitMargin), type: 'percentage' },
      )
      break
      
    case 'wholesale':
      metrics.push(
        { label: 'Assignment Fee', value: formatCurrency(results.assignmentFee), type: 'currency' },
        { label: 'Profit Margin', value: formatPercentage(results.profitMargin), type: 'percentage' },
        { label: 'ROI', value: formatPercentage(results.roi), type: 'percentage' },
      )
      break
      
    default:
      // Generic metrics for other calculator types
      Object.entries(results).forEach(([key, value]) => {
        if (typeof value === 'number' && value !== 0) {
          metrics.push({
            label: formatFieldName(key),
            value: formatValue(value, key),
            type: 'currency',
          })
        }
      })
  }
  
  return metrics
})

const detailedResults = computed(() => {
  if (!report.value?.calculationResults) return {}
  
  const results = { ...report.value.calculationResults }
  
  // Remove fields that are already shown in key metrics
  const excludeFields = ['monthlyPayment', 'totalInterest', 'totalPayment', 'profit', 'roi', 'cashOnCash', 'capRate']
  excludeFields.forEach(field => delete results[field])
  
  return results
})

// Methods
onMounted(async () => {
  await loadReport()
})

async function loadReport() {
  loading.value = true
  error.value = false
  
  try {
    const result = await reportHostingService.getSharedReport(reportId.value)
    
    if (result.success) {
      report.value = result.report
    } else {
      error.value = result.error
    }
  } catch (err) {
    console.error('Error loading report:', err)
    error.value = 'fetch_failed'
  } finally {
    loading.value = false
  }
}

function formatFieldName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatValue(value, key) {
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent')) {
      return formatPercentage(value)
    }
    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || 
        key.toLowerCase().includes('payment') || key.toLowerCase().includes('fee') ||
        key.toLowerCase().includes('rent') || key.toLowerCase().includes('income')) {
      return formatCurrency(value)
    }
    return value.toLocaleString()
  }
  return value || 'N/A'
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercentage(value) {
  if (typeof value !== 'number') return '0%'
  return `${(value * 100).toFixed(2)}%`
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getMetricColor(value, type) {
  if (type === 'cashflow' || type === 'profit') {
    const numValue = parseFloat(value.replace(/[$,%]/g, ''))
    return numValue >= 0 ? 'text-success' : 'text-error'
  }
  return 'text-primary'
}

function goToCalculator() {
  router.push('/calculator/standard')
}

function downloadPDF() {
  // This would trigger a PDF generation
  console.log('Downloading PDF of report...')
}
</script>

<style scoped>
.shared-report-viewer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

@media (max-width: 600px) {
  .shared-report-viewer {
    padding: 16px;
  }
}
</style>
