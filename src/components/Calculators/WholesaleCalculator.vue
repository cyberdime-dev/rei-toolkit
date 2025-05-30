<script setup>
import { ref, computed } from "vue";

const contractPrice = ref(0);
const repairEstimate = ref(0);
const arv = ref(0);
const buyerDiscount = ref(0); // Typical end buyer wants 70% ARV - repairs
const assignmentFee = ref(0);
const closingCosts = ref(0);
const buyerPaysClosing = ref("Yes");

// Buyer Offer Price (what they'd pay for this flip)
const buyerOfferPrice = computed(
  () => arv.value * ((100 - buyerDiscount.value) / 100) - repairEstimate.value
);

// Max Allowable Offer (MAO) = Buyer offer - assignment fee - closing costs (if not paid by buyer)
const maxAllowableOffer = computed(
  () =>
    buyerOfferPrice.value -
    assignmentFee.value -
    (buyerPaysClosing.value === "Yes" ? 0 : closingCosts.value)
);

// Spread = MAO - what you're under contract for
const spread = computed(() => maxAllowableOffer.value - contractPrice.value);

const isAssignable = computed(() => spread.value >= 0);

const toUSD = (val) =>
  `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
</script>

<template>
  <v-card class="pa-4">
    <v-row dense>
      <!-- Outputs -->
      <v-row>
        <v-col cols="12" sm="6">
          <v-alert type="info" variant="tonal">
            <strong>End Buyer Offer Price:</strong> {{ toUSD(buyerOfferPrice) }}<br />
            <strong>Max Allowable Offer (MAO):</strong> {{ toUSD(maxAllowableOffer) }}
          </v-alert>
        </v-col>

        <v-col cols="12" sm="6">
          <v-alert :type="isAssignable ? 'success' : 'error'" variant="tonal">
            <strong>Spread:</strong> {{ toUSD(spread) }}<br />
            <strong>Deal is Assignable:</strong>
            <span class="font-weight-bold">{{ isAssignable ? "✅ YES" : "❌ NO" }}</span>
          </v-alert>
        </v-col>
      </v-row>

      <v-divider class="my-4" />
      <!-- Inputs -->
      <v-col cols="12" sm="6"
        ><v-text-field
          v-model.number="contractPrice"
          label="Seller Contract Price"
          prefix="$"
      /></v-col>
      <v-col cols="12" sm="6"
        ><v-text-field v-model.number="repairEstimate" label="Repair Estimate" prefix="$"
      /></v-col>
      <v-col cols="12" sm="6"
        ><v-text-field v-model.number="arv" label="After Repair Value (ARV)" prefix="$"
      /></v-col>
      <v-col cols="12" sm="6"
        ><v-text-field
          v-model.number="buyerDiscount"
          label="End Buyer Discount %"
          suffix="%"
      /></v-col>
      <v-col cols="12" sm="6"
        ><v-text-field
          v-model.number="assignmentFee"
          label="Your Assignment Fee"
          prefix="$"
      /></v-col>
      <v-col cols="12" sm="6"
        ><v-text-field
          v-model.number="closingCosts"
          label="Closing Costs (optional)"
          prefix="$"
      /></v-col>
      <v-col cols="12" sm="6">
        <v-select
          v-model="buyerPaysClosing"
          :items="['Yes', 'No']"
          label="Buyer Pays Closing Costs?"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
