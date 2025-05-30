<script setup>
import { ref, computed } from "vue";

const noi = ref(50000);
const purchasePrice = ref(0);
const desiredCapRate = ref(0);

const capRate = computed(() =>
  purchasePrice.value ? (noi.value / purchasePrice.value) * 100 : 0
);

const valueFromCapRate = computed(() =>
  desiredCapRate.value ? noi.value / (desiredCapRate.value / 100) : 0
);

const toUSD = (val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <v-row>
      <v-col cols="12" sm="6">
        <v-alert type="info" variant="tonal">
          <strong>Cap Rate:</strong> {{ capRate.toFixed(2) }}%
        </v-alert>
      </v-col>
      <v-col cols="12" sm="6">
        <v-alert type="success" variant="tonal">
          <strong>Value Based on Cap Rate:</strong> {{ toUSD(valueFromCapRate) }}
        </v-alert>
      </v-col>
    </v-row>
    <v-divider class="my-4" />

    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="noi"
          label="Net Operating Income (NOI)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="purchasePrice" label="Purchase Price" prefix="$" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="desiredCapRate"
          label="Desired Cap Rate (for value)"
          suffix="%"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
