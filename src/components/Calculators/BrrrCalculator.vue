<script setup>
import { ref, computed } from 'vue'

const purchasePrice = ref(0)
const rehabCosts = ref(0)
const arv = ref(0)
const refiLtv = ref(0)

const monthlyRent = ref(0)
const monthlyExpenses = ref(0)
const refiCosts = ref(0)
const interestRate = ref(0)
const loanTerm = ref(0)

const totalInitialInvestment = computed(
  () => purchasePrice.value + rehabCosts.value
)

const newLoanAmount = computed(() => (arv.value * refiLtv.value) / 100)

const equityCaptured = computed(() => arv.value - newLoanAmount.value)

const cashOutAmount = computed(
  () => newLoanAmount.value - totalInitialInvestment.value - refiCosts.value
)

const monthlyMortgage = computed(() => {
  const P = newLoanAmount.value
  const r = interestRate.value / 100 / 12
  const n = loanTerm.value * 12
  if (!P || !r || !n) return 0
  const denominator = 1 - Math.pow(1 + r, -n)
  if (denominator === 0) return 0
  const result = (P * r) / denominator
  return isNaN(result) ? 0 : result
})

const monthlyCashFlow = computed(() => {
  const value =
    monthlyRent.value - monthlyExpenses.value - monthlyMortgage.value
  return isNaN(value) ? 0 : value
})

const cocReturn = computed(() => {
  if (!totalInitialInvestment.value) return 0
  const value =
    ((monthlyCashFlow.value * 12) / totalInitialInvestment.value) * 100
  return isNaN(value) ? 0 : value
})

const toUSD = val =>
  `$${Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <!-- Results -->
    <v-row dense class="mb-2">
      <v-col cols="12" md="6">
        <v-sheet color="info" class="pa-3" rounded>
          <strong>Total Initial Investment:</strong>
          {{ toUSD(totalInitialInvestment) }}
          <br />
          <strong>New Loan Amount:</strong>
          {{ toUSD(newLoanAmount) }}
        </v-sheet>
      </v-col>
      <v-col cols="12" md="6">
        <v-sheet color="success" class="pa-3" rounded>
          <strong>Equity Captured:</strong>
          {{ toUSD(equityCaptured) }}
          <br />
          <strong>Cash-Out Amount:</strong>
          {{ toUSD(cashOutAmount) }}
        </v-sheet>
      </v-col>
      <v-col cols="12" md="6">
        <v-sheet color="success" class="pa-3" rounded>
          <strong>Monthly Cash Flow:</strong>
          {{ toUSD(monthlyCashFlow) }}
          <br />
          <strong>Cash-on-Cash Return:</strong>
          {{ cocReturn.toFixed(1) }}%
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />
    <v-row dense>
      <!-- Deal Inputs -->
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="purchasePrice"
          label="Purchase Price"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="rehabCosts"
          label="Rehab Costs"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="arv"
          label="After Repair Value (ARV)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="refiLtv"
          label="Refinance LTV (%)"
          suffix="%"
        />
      </v-col>

      <!-- Rental and Refi -->
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="monthlyRent"
          label="Monthly Rent"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="monthlyExpenses"
          label="Monthly Expenses (taxes, insurance, etc.)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="refiCosts"
          label="Refinance Closing Costs"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="interestRate"
          label="New Loan Interest Rate (%)"
          suffix="%"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="loanTerm" label="Loan Term (years)" />
      </v-col>
    </v-row>
  </v-card>
</template>
