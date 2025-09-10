<template>
  <v-row class="mb-4">
    <v-col
      cols="12"
      sm="6"
      md="3"
    >
      <v-card>
        <v-card-text>
          <div class="text-h4 font-weight-bold">
            {{ summary.totalDeals }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Total Deals
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="3"
    >
      <v-card>
        <v-card-text>
          <div class="text-h4 font-weight-bold">
            ${{ formatCurrency(summary.totalValue) }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Portfolio Value
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="3"
    >
      <v-card>
        <v-card-text>
          <div class="text-h4 font-weight-bold">
            ${{ formatCurrency(summary.avgCashFlow) }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Avg. Cash Flow
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="3"
    >
      <v-card>
        <v-card-text>
          <div class="text-h4 font-weight-bold">
            {{ activeDealsCount }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Active Deals
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
})

const activeDealsCount = computed(() => {
  const statusCounts = props.summary.statusCounts || {}
  return (statusCounts.analyzing || 0) + (statusCounts['under-contract'] || 0)
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US').format(amount || 0)
}
</script>
