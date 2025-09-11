/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
<script setup>
import { ref, computed } from 'vue'

const grossIncome = ref(0)
const otherIncome = ref(0)

const taxes = ref(0)
const insurance = ref(0)
const maintenance = ref(0)
const management = ref(0)
const utilities = ref(0)
const otherExpenses = ref(0)

const totalIncome = computed(() => grossIncome.value + otherIncome.value)

const totalExpenses = computed(
  () =>
    taxes.value +
    insurance.value +
    maintenance.value +
    management.value +
    utilities.value +
    otherExpenses.value,
)

const noi = computed(() => totalIncome.value - totalExpenses.value)

const toUSD = val =>
  `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <!-- Output -->
    <v-row
      dense
      class="mb-2"
    >
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="success"
          class="pa-3"
          rounded
        >
          <strong>Net Operating Income (NOI):</strong>
          {{ toUSD(noi) }}
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />
    <v-row dense>
      <!-- Income -->
      <v-col cols="12">
        <h3 class="text-h6 mb-2">
          Gross Income
        </h3>
        <v-text-field
          v-model.number="grossIncome"
          label="Gross Rental Income"
          prefix="$"
        />
        <v-text-field
          v-model.number="otherIncome"
          label="Other Income (Laundry, Parking, etc.)"
          prefix="$"
        />
      </v-col>

      <!-- Expenses -->
      <v-col cols="12">
        <h3 class="text-h6 mb-2">
          Operating Expenses
        </h3>
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
          v-model.number="maintenance"
          label="Maintenance/Repairs"
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
          v-model.number="utilities"
          label="Utilities"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="otherExpenses"
          label="Other Operating Expenses"
          prefix="$"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
