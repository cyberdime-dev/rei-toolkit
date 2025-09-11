/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
<script setup>
import { computed, ref } from 'vue'

const purchasePrice = ref(0)
const repairCosts = ref(0)
const arv = ref(0)
const holdingCosts = ref(0)
const closingCosts = ref(0)
const sellingCostPercent = ref(0)

// Calculations
const totalInvestment = computed(
  () =>
    purchasePrice.value +
    repairCosts.value +
    holdingCosts.value +
    closingCosts.value,
)

const sellingCosts = computed(
  () => (arv.value * sellingCostPercent.value) / 100,
)

const netProfit = computed(
  () => arv.value - sellingCosts.value - totalInvestment.value,
)

const roi = computed(() =>
  totalInvestment.value === 0
    ? 0
    : (netProfit.value / totalInvestment.value) * 100,
)

const mao = computed(
  () => arv.value * 0.7 - repairCosts.value, // Simple 70% rule
)

// Formatters
const toUSD = val => `$${val.toLocaleString()}`
const totalInvestmentFormatted = computed(() => toUSD(totalInvestment.value))
const netProfitFormatted = computed(() => toUSD(netProfit.value))
const maoFormatted = computed(() => toUSD(mao.value))
</script>

<template>
  <v-card class="pa-4 mobile-card">
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
          <strong>Total Investment:</strong>
          <br />
          {{ totalInvestmentFormatted }}
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
          <strong>Net Profit:</strong>
          <br />
          {{ netProfitFormatted }}
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="light-green-darken-4"
          class="pa-3"
          rounded
        >
          <strong>ROI:</strong>
          <br />
          {{ roi.toFixed(1) }}%
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          color="deep-orange"
          class="pa-3"
          rounded
        >
          <strong>Max Allowable Offer (MAO):</strong>
          <br />
          {{ maoFormatted }}
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-row dense>
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
          v-model.number="repairCosts"
          label="Repair Costs"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="arv"
          label="ARV (After Repair Value)"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="holdingCosts"
          label="Holding Costs"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="closingCosts"
          label="Closing Costs"
          prefix="$"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model.number="sellingCostPercent"
          label="Selling Costs (% of ARV)"
          suffix="%"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
