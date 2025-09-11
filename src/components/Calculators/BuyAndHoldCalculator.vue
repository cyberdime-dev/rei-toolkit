/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
<script setup>
import { computed, ref } from 'vue'

const purchasePrice = ref(0)
const downPaymentPercent = ref(0)
const interestRate = ref(0)
const loanTerm = ref(0)

const monthlyRent = ref(0)
const otherIncome = ref(0)

const taxes = ref(0)
const insurance = ref(0)
const repairs = ref(0)
const management = ref(0)
const vacancyPercent = ref(0)

// Loan Calculations
const downPaymentAmount = computed(
  () => (downPaymentPercent.value / 100) * purchasePrice.value,
)
const loanAmount = computed(() => purchasePrice.value - downPaymentAmount.value)

const monthlyMortgage = computed(() => {
  const P = loanAmount.value
  const r = interestRate.value / 100 / 12
  const n = loanTerm.value * 12
  if (!P || !r || !n) return 0
  const denominator = 1 - Math.pow(1 + r, -n)
  if (denominator === 0) return 0
  return (P * r) / denominator
})

// Operating Income and Expenses
const vacancyLoss = computed(
  () => (monthlyRent.value * vacancyPercent.value) / 100,
)
const effectiveGrossIncome = computed(
  () => monthlyRent.value + otherIncome.value - vacancyLoss.value,
)

const totalMonthlyExpenses = computed(
  () =>
    taxes.value +
    insurance.value +
    repairs.value +
    management.value +
    monthlyMortgage.value,
)

const monthlyCashFlow = computed(() => {
  const value = effectiveGrossIncome.value - totalMonthlyExpenses.value
  return isNaN(value) ? 0 : value
})
const annualCashFlow = computed(() => {
  const value = monthlyCashFlow.value * 12
  return isNaN(value) ? 0 : value
})

// Cap Rate and CoC Return
const capRate = computed(() =>
  purchasePrice.value === 0
    ? 0
    : (((monthlyRent.value -
        (vacancyLoss.value +
          taxes.value +
          insurance.value +
          repairs.value +
          management.value)) *
        12) /
        purchasePrice.value) *
      100,
)

const cashOnCashReturn = computed(() =>
  downPaymentAmount.value === 0
    ? 0
    : (annualCashFlow.value / downPaymentAmount.value) * 100,
)

// Formatting
const toUSD = val =>
  `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <!-- Outputs -->
    <v-row
      dense
      class="mb-2"
    >
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="info"
          class="pa-3"
          rounded
        >
          <strong>Loan Amount:</strong>
          {{ toUSD(loanAmount) }}
          <br />
          <strong>Monthly Mortgage:</strong>
          {{ toUSD(monthlyMortgage) }}
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="success"
          class="pa-3"
          rounded
        >
          <strong>Monthly Cash Flow:</strong>
          {{ toUSD(monthlyCashFlow) }}
          <br />
          <strong>Annual Cash Flow:</strong>
          {{ toUSD(annualCashFlow) }}
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="success"
          class="pa-3"
          rounded
        >
          <strong>Cap Rate:</strong>
          {{ capRate.toFixed(1) }}%
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="success"
          class="pa-3"
          rounded
        >
          <strong>Cash-on-Cash Return:</strong>
          {{ cashOnCashReturn.toFixed(1) }}%
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />
    <v-row dense>
      <!-- Inputs -->
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="purchasePrice"
          label="Purchase Price"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="downPaymentPercent"
          label="Down Payment %"
          suffix="%"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="interestRate"
          label="Interest Rate (Annual)"
          suffix="%"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="loanTerm"
          label="Loan Term (Years)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="monthlyRent"
          label="Monthly Rent"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="otherIncome"
          label="Other Monthly Income"
          prefix="$"
        />
      </v-col>

      <!-- Monthly Expenses -->
      <v-col cols="12">
        <v-divider class="my-2" />
      </v-col>
      <v-col cols="12">
        <h4>Monthly Expenses</h4>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="taxes"
          label="Property Taxes"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="insurance"
          label="Insurance"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="repairs"
          label="Repairs & Maintenance"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="management"
          label="Property Management"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="vacancyPercent"
          label="Vacancy Allowance (%)"
          suffix="%"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
