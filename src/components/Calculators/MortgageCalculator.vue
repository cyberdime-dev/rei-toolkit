<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
)

// Form inputs
// Reactive variables
const formData = ref({
  homePrice: 500000,
  downPayment: 100000,
  interestRate: 6.5,
  loanTerm: 30,
  propertyTax: 4800,
  insurance: 1200,
  hoa: 150,
})

// Debug watcher for form changes
watch(formData, (newVal) => {
  console.log('Form data changed:', newVal)
}, { deep: true })

// Form validation rules
const rules = {
  required: (v) => !!v || 'Field is required',
  positiveNumber: (v) => v > 0 || 'Must be a positive number',
  percentage: (v) => v >= 0 && v <= 100 || 'Must be between 0 and 100',
}

// Calculations
const loanAmount = computed(() => {
  const amount = Math.max(0, formData.value.homePrice - formData.value.downPayment)
  console.log('Loan amount calculation:', {
    homePrice: formData.value.homePrice,
    downPayment: formData.value.downPayment,
    calculatedLoanAmount: amount,
  })
  return amount
})

const downPaymentPercentage = computed(() => 
  formData.value.homePrice > 0 ? 
    (formData.value.downPayment / formData.value.homePrice * 100) : 0,
)

const monthlyInterest = computed(() => formData.value.interestRate / 100 / 12)
const numberOfPayments = computed(() => formData.value.loanTerm * 12)

const monthlyPrincipalAndInterest = computed(() => {
  const P = loanAmount.value
  const r = monthlyInterest.value
  const n = numberOfPayments.value
  
  console.log('Monthly payment inputs:', {
    principal: P,
    monthlyInterestRate: r,
    numberOfPayments: n,
    interestRateFromForm: formData.value.interestRate,
    loanTermFromForm: formData.value.loanTerm,
  })
  
  if (!P || !r || !n) return 0
  
  const denominator = 1 - Math.pow(1 + r, -n)
  if (denominator === 0) return 0
  
  const payment = (P * r) / denominator
  console.log('Calculated monthly payment:', payment)
  
  return payment
})

const monthlyTax = computed(() => formData.value.propertyTax / 12)
const monthlyInsurance = computed(() => formData.value.insurance / 12)
const monthlyHOA = computed(() => formData.value.hoa)

const totalMonthlyPayment = computed(() => 
  monthlyPrincipalAndInterest.value + 
  monthlyTax.value + 
  monthlyInsurance.value + 
  monthlyHOA.value,
)

const totalInterest = computed(() => 
  monthlyPrincipalAndInterest.value * numberOfPayments.value - loanAmount.value,
)

const totalPaid = computed(() => 
  monthlyPrincipalAndInterest.value * numberOfPayments.value,
)// Payment breakdown for visualization
const paymentBreakdown = computed(() => [
  {
    label: 'Principal & Interest',
    amount: monthlyPrincipalAndInterest.value,
    color: 'primary',
    percentage: totalMonthlyPayment.value > 0 ? 
      (monthlyPrincipalAndInterest.value / totalMonthlyPayment.value * 100) : 0,
  },
  {
    label: 'Property Tax',
    amount: monthlyTax.value,
    color: 'secondary',
    percentage: totalMonthlyPayment.value > 0 ? 
      (monthlyTax.value / totalMonthlyPayment.value * 100) : 0,
  },
  {
    label: 'Insurance',
    amount: monthlyInsurance.value,
    color: 'warning',
    percentage: totalMonthlyPayment.value > 0 ? 
      (monthlyInsurance.value / totalMonthlyPayment.value * 100) : 0,
  },
  {
    label: 'HOA/PMI',
    amount: monthlyHOA.value,
    color: 'info',
    percentage: totalMonthlyPayment.value > 0 ? 
      (monthlyHOA.value / totalMonthlyPayment.value * 100) : 0,
  },
])

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentage = (value) => `${value.toFixed(1)}%`

// Amortization calculations
const amortizationTable = computed(() => {
  const table = []
  let balance = loanAmount.value
  const r = monthlyInterest.value
  const monthlyPI = monthlyPrincipalAndInterest.value

  // Debug logging
  console.log('Amortization Debug:', {
    loanAmount: loanAmount.value,
    monthlyInterest: r,
    monthlyPI: monthlyPI,
    numberOfPayments: numberOfPayments.value,
  })

  if (!balance || !r || !monthlyPI) return []

  for (let i = 1; i <= numberOfPayments.value && balance > 0.01; i++) {
    const interestPayment = balance * r
    const principalPayment = Math.min(monthlyPI - interestPayment, balance)
    
    table.push({
      payment: i,
      principal: principalPayment,
      interest: interestPayment,
      totalPayment: principalPayment + interestPayment,
      balance: balance - principalPayment,
    })
    
    balance -= principalPayment
  }
  
  console.log(`Amortization table generated with ${table.length} payments`)
  return table
})

// Chart data for amortization visualization
const chartData = computed(() => {
  console.log('Chart data computation - amortization table length:', amortizationTable.value.length)
  
  if (amortizationTable.value.length === 0) return null

  const yearlyData = []
  const table = amortizationTable.value
  
  for (let year = 1; year <= formData.value.loanTerm; year++) {
    const startMonth = (year - 1) * 12
    const endMonth = Math.min(year * 12, table.length)
    
    if (startMonth < table.length) {
      const yearData = table.slice(startMonth, endMonth)
      const totalPrincipal = yearData.reduce((sum, row) => sum + row.principal, 0)
      const totalInterest = yearData.reduce((sum, row) => sum + row.interest, 0)
      const endBalance = yearData[yearData.length - 1]?.balance || 0
      
      yearlyData.push({
        year,
        principal: totalPrincipal,
        interest: totalInterest,
        balance: endBalance,
      })
    }
  }

  return {
    labels: yearlyData.map(d => `Year ${d.year}`),
    datasets: [
      {
        label: 'Remaining Balance',
        data: yearlyData.map(d => d.balance),
        borderColor: 'rgb(var(--v-theme-primary))',
        backgroundColor: 'rgba(var(--v-theme-primary), 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Annual Principal',
        data: yearlyData.map(d => d.principal),
        borderColor: 'rgb(var(--v-theme-success))',
        backgroundColor: 'rgba(var(--v-theme-success), 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Annual Interest',
        data: yearlyData.map(d => d.interest),
        borderColor: 'rgb(var(--v-theme-error))',
        backgroundColor: 'rgba(var(--v-theme-error), 0.1)',
        fill: false,
        tension: 0.3,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value)
        },
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}
</script>

<template>
  <v-container class="mortgage-calculator-container">
    <v-card 
      class="mortgage-calculator-card elevation-0"
      flat
    >
      <!-- Header -->
      <v-card-title class="calculator-header">
        <v-icon 
          icon="mdi-home-city" 
          class="mr-2"
          size="large"
        />
        Mortgage Calculator
      </v-card-title>

      <!-- Input Form -->
      <v-card-text class="pa-6">
        <v-form>
          <!-- Primary Loan Information -->
          <div class="form-section mb-6">
            <h3 class="section-title mb-4">
              <v-icon 
                icon="mdi-cash" 
                class="mr-2 text-primary"
              />
              Loan Details
            </h3>
            
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formData.homePrice"
                  label="Home Price *"
                  :rules="[rules.required, rules.positiveNumber]"
                  prefix="$"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formData.downPayment"
                  label="Down Payment *"
                  :rules="[rules.required, rules.positiveNumber]"
                  prefix="$"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                >
                  <template #append-inner>
                    <v-chip
                      size="small"
                      variant="tonal"
                      color="primary"
                    >
                      {{ formatPercentage(downPaymentPercentage) }}
                    </v-chip>
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formData.interestRate"
                  label="Interest Rate *"
                  :rules="[rules.required, rules.percentage]"
                  suffix="%"
                  type="number"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formData.loanTerm"
                  label="Loan Term *"
                  :rules="[rules.required, rules.positiveNumber]"
                  suffix="years"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Loan Amount Display -->
            <v-alert
              v-if="loanAmount > 0"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              <div class="d-flex align-center justify-space-between">
                <span>Loan Amount</span>
                <strong class="text-h6">{{ formatCurrency(loanAmount) }}</strong>
              </div>
            </v-alert>
          </div>

          <!-- Additional Costs -->
          <div class="form-section mb-6">
            <h3 class="section-title mb-4">
              <v-icon 
                icon="mdi-receipt" 
                class="mr-2 text-secondary"
              />
              Additional Monthly Costs
              <v-chip
                size="small"
                variant="text"
                class="ml-2"
              >
                Optional
              </v-chip>
            </h3>
            
            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model.number="formData.propertyTax"
                  label="Annual Property Tax"
                  prefix="$"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hint="Will be divided by 12 for monthly amount"
                />
              </v-col>
              
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model.number="formData.insurance"
                  label="Annual Home Insurance"
                  prefix="$"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hint="Will be divided by 12 for monthly amount"
                />
              </v-col>
              
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model.number="formData.hoa"
                  label="Monthly HOA/PMI"
                  prefix="$"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hint="Monthly amount"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>

        <!-- Results Section -->
        <div 
          v-if="loanAmount > 0 && monthlyPrincipalAndInterest > 0"
          class="results-section"
        >
          <!-- Payment Summary Cards -->
          <div class="payment-summary mb-6">
            <h3 class="section-title mb-4">
              <v-icon 
                icon="mdi-calculator" 
                class="mr-2 text-success"
              />
              Monthly Payment Breakdown
            </h3>

            <v-row>
              <!-- Main Payment -->
              <v-col
                cols="12"
                md="6"
                lg="3"
              >
                <v-card
                  class="payment-card primary-payment"
                  variant="tonal"
                  color="primary"
                >
                  <v-card-text class="text-center">
                    <v-icon
                      icon="mdi-home-heart"
                      size="32"
                      class="mb-2"
                    />
                    <div class="payment-label">
                      Principal & Interest
                    </div>
                    <div class="payment-amount">
                      {{ formatCurrency(monthlyPrincipalAndInterest) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Total Payment -->
              <v-col
                cols="12"
                md="6"
                lg="3"
              >
                <v-card
                  class="payment-card total-payment"
                  variant="tonal"
                  color="success"
                >
                  <v-card-text class="text-center">
                    <v-icon
                      icon="mdi-credit-card"
                      size="32"
                      class="mb-2"
                    />
                    <div class="payment-label">
                      Total Monthly Payment
                    </div>
                    <div class="payment-amount">
                      {{ formatCurrency(totalMonthlyPayment) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Total Interest -->
              <v-col
                cols="12"
                md="6"
                lg="3"
              >
                <v-card
                  class="payment-card"
                  variant="tonal"
                  color="warning"
                >
                  <v-card-text class="text-center">
                    <v-icon
                      icon="mdi-percent"
                      size="32"
                      class="mb-2"
                    />
                    <div class="payment-label">
                      Total Interest
                    </div>
                    <div class="payment-amount">
                      {{ formatCurrency(totalInterest) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Total Paid -->
              <v-col
                cols="12"
                md="6"
                lg="3"
              >
                <v-card
                  class="payment-card"
                  variant="tonal"
                  color="info"
                >
                  <v-card-text class="text-center">
                    <v-icon
                      icon="mdi-sigma"
                      size="32"
                      class="mb-2"
                    />
                    <div class="payment-label">
                      Total Paid
                    </div>
                    <div class="payment-amount">
                      {{ formatCurrency(totalPaid) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Payment Breakdown -->
          <div 
            v-if="monthlyTax > 0 || monthlyInsurance > 0 || monthlyHOA > 0"
            class="breakdown-section mb-6"
          >
            <h3 class="section-title mb-4">
              <v-icon 
                icon="mdi-chart-pie" 
                class="mr-2 text-info"
              />
              Detailed Monthly Breakdown
            </h3>

            <v-row>
              <v-col
                v-for="item in paymentBreakdown.filter(p => p.amount > 0)"
                :key="item.label"
                cols="12"
                sm="6"
                md="3"
              >
                <v-card
                  class="breakdown-card"
                  variant="outlined"
                >
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <span class="breakdown-label">{{ item.label }}</span>
                      <v-chip
                        :color="item.color"
                        size="small"
                        variant="flat"
                      >
                        {{ formatPercentage(item.percentage) }}
                      </v-chip>
                    </div>
                    <div class="breakdown-amount">
                      {{ formatCurrency(item.amount) }}
                    </div>
                    <v-progress-linear
                      :model-value="item.percentage"
                      :color="item.color"
                      height="4"
                      class="mt-2"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Amortization Visualization -->
          <div class="amortization-section">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon 
                      icon="mdi-chart-line" 
                      class="mr-3 text-primary"
                    />
                    <div>
                      <div class="text-h6">
                        Amortization Schedule
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        View payment breakdown over time
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-title>
                
                <v-expansion-panel-text>
                  <v-row v-if="chartData">
                    <!-- Chart -->
                    <v-col
                      cols="12"
                      lg="8"
                    >
                      <v-card
                        class="chart-container"
                        variant="tonal"
                      >
                        <v-card-title class="text-subtitle-1">
                          Payment Distribution Over Time
                        </v-card-title>
                        <v-card-text>
                          <div class="chart-wrapper">
                            <Line
                              :data="chartData"
                              :options="chartOptions"
                            />
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <!-- Summary Stats -->
                    <v-col
                      cols="12"
                      lg="4"
                    >
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Loan Summary
                        </v-card-title>
                        <v-card-text>
                          <v-list density="compact">
                            <v-list-item>
                              <template #prepend>
                                <v-icon
                                  icon="mdi-calendar"
                                  size="small"
                                />
                              </template>
                              <v-list-item-title>Loan Term</v-list-item-title>
                              <template #append>
                                <span class="font-weight-medium">
                                  {{ formData.loanTerm }} years
                                </span>
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template #prepend>
                                <v-icon
                                  icon="mdi-counter"
                                  size="small"
                                />
                              </template>
                              <v-list-item-title>Total Payments</v-list-item-title>
                              <template #append>
                                <span class="font-weight-medium">
                                  {{ numberOfPayments }}
                                </span>
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template #prepend>
                                <v-icon
                                  icon="mdi-percent"
                                  size="small"
                                />
                              </template>
                              <v-list-item-title>Interest Rate</v-list-item-title>
                              <template #append>
                                <span class="font-weight-medium">
                                  {{ formatPercentage(formData.interestRate) }}
                                </span>
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template #prepend>
                                <v-icon
                                  icon="mdi-trending-down"
                                  size="small"
                                />
                              </template>
                              <v-list-item-title>Down Payment</v-list-item-title>
                              <template #append>
                                <span class="font-weight-medium">
                                  {{ formatPercentage(downPaymentPercentage) }}
                                </span>
                              </template>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>

        <!-- Empty State -->
        <div 
          v-else
          class="empty-state text-center py-12"
        >
          <v-icon
            icon="mdi-calculator-variant"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <h3 class="text-h6 text-medium-emphasis mb-2">
            Enter Your Mortgage Details
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            Fill in the loan information above to see your monthly payment calculations
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
/* Container and Layout */
.mortgage-calculator-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.mortgage-calculator-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Header Styling */
.calculator-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: rgb(var(--v-theme-on-primary));
  padding: 2rem;
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
}

/* Form Sections */
.form-section {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  padding: 1.5rem;
  background: rgba(var(--v-theme-surface), 0.5);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
}

/* Results Section */
.results-section {
  margin-top: 2rem;
  border-top: 2px solid rgba(var(--v-border-color), 0.12);
  padding-top: 2rem;
}

/* Payment Summary Cards */
.payment-summary {
  margin-bottom: 2rem;
}

.payment-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  height: 100%;
}

.payment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.payment-amount {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.primary-payment .payment-amount {
  color: rgb(var(--v-theme-primary));
}

.total-payment .payment-amount {
  color: rgb(var(--v-theme-success));
}

/* Breakdown Cards */
.breakdown-section {
  margin-bottom: 2rem;
}

.breakdown-card {
  border-radius: 12px;
  transition: all 0.2s ease;
  height: 100%;
}

.breakdown-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.breakdown-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.breakdown-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Chart Container */
.amortization-section {
  margin-top: 2rem;
}

.chart-container {
  border-radius: 12px;
  overflow: hidden;
}

.chart-wrapper {
  position: relative;
  height: 400px;
  width: 100%;
}

/* Empty State */
.empty-state {
  padding: 3rem 1rem;
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 16px;
  border: 2px dashed rgba(var(--v-border-color), 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .mortgage-calculator-container {
    padding: 0.5rem;
  }
  
  .calculator-header {
    padding: 1.5rem;
    font-size: 1.5rem;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .payment-amount {
    font-size: 1.25rem;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .calculator-header {
    padding: 1rem;
    font-size: 1.25rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .payment-amount {
    font-size: 1.1rem;
  }
  
  .breakdown-amount {
    font-size: 1.1rem;
  }
}

/* Dark Mode Enhancements */
.v-theme--dark .form-section {
  background: rgba(var(--v-theme-surface-bright), 0.05);
  border-color: rgba(var(--v-border-color), 0.2);
}

.v-theme--dark .empty-state {
  background: rgba(var(--v-theme-surface-bright), 0.05);
  border-color: rgba(var(--v-border-color), 0.2);
}

.v-theme--dark .payment-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .breakdown-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Animation and Transitions */
.payment-card,
.breakdown-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.results-section {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Input Field Enhancements */
.v-text-field {
  margin-bottom: 0.5rem;
}

.v-text-field .v-field {
  border-radius: 12px;
}

/* Chart Responsive */
@media (max-width: 1200px) {
  .chart-wrapper {
    height: 350px;
  }
}
</style>
