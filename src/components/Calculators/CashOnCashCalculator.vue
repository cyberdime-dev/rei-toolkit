<script setup>
import { ref, computed } from "vue";

const noi = ref(0);
const annualDebtService = ref(0);

const downPayment = ref(0);
const closingCosts = ref(0);
const rehabCosts = ref(0);

const annualCashFlow = computed(() => noi.value - annualDebtService.value);

const totalCashInvested = computed(
  () => downPayment.value + closingCosts.value + rehabCosts.value
);

const cashOnCashReturn = computed(() =>
  totalCashInvested.value > 0 ? (annualCashFlow.value / totalCashInvested.value) * 100 : 0
);

const toUSD = (val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <v-row dense class="mb-2">
      <v-col cols="12" md="6">
        <v-sheet color="success" class="pa-3" rounded>
          <strong>Annual Cash Flow:</strong> {{ toUSD(annualCashFlow) }}
        </v-sheet>
      </v-col>
      <v-col cols="12" md="6">
        <v-sheet color="success" class="pa-3" rounded>
          <strong>Cash-on-Cash Return:</strong> {{ cashOnCashReturn.toFixed(2) }}%
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />
    <v-row dense>
      <v-col cols="12">
        <h3 class="text-h6 mb-2">Annual Income</h3>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="noi"
          label="Net Operating Income (NOI)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="annualDebtService"
          label="Annual Debt Service (Loan Payments)"
          prefix="$"
        />
      </v-col>

      <v-col cols="12">
        <h3 class="text-h6 mt-6 mb-2">Cash Investment</h3>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="downPayment" label="Down Payment" prefix="$" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="closingCosts" label="Closing Costs" prefix="$" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="rehabCosts"
          label="Rehab/Initial Repairs"
          prefix="$"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
