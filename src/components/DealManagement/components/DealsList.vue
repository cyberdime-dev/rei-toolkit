<template>
  <div>
    <!-- Deals List -->
    <v-card v-if="deals.length > 0">
      <v-list lines="three">
        <template
          v-for="(deal, index) in deals"
          :key="deal.id"
        >
          <v-list-item
            :class="{ 'border-bottom': index < deals.length - 1 }"
            @click="$emit('viewDeal', deal)"
          >
            <template #prepend>
              <v-avatar
                :color="getStatusColor(deal.status)"
                class="text-white"
              >
                <v-icon>{{ getStrategyIcon(deal.strategy) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ deal.name }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <div class="d-flex flex-column">
                <span v-if="deal.address">{{ deal.address }}</span>
                <span class="text-caption">
                  Purchase: ${{ formatCurrency(deal.purchasePrice) }} • 
                  Cash Flow: ${{ formatCurrency(deal.cashFlow) }}/mo • 
                  {{ formatStrategy(deal.strategy) }}
                </span>
              </div>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end">
                <v-chip
                  :color="getStatusColor(deal.status)"
                  size="small"
                  class="mb-1"
                >
                  {{ formatStatus(deal.status) }}
                </v-chip>
                <div class="d-flex">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click.stop="$emit('editDeal', deal)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click.stop="$emit('deleteDeal', deal)"
                  />
                  <v-btn
                    icon="mdi-calculator"
                    variant="text"
                    size="small"
                    @click.stop="$emit('openCalculator', deal)"
                  />
                </div>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <!-- Empty State -->
    <v-card
      v-else
      class="text-center pa-8"
    >
      <v-icon
        icon="mdi-home-search"
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      />
      <h3 class="text-h6 mb-2">
        No deals found
      </h3>
      <p class="text-medium-emphasis mb-4">
        {{ deals.length === 0 ? 
          'Start by adding your first real estate deal.' : 
          'No deals match your current filters.' }}
      </p>
      <v-btn
        v-if="deals.length === 0"
        color="primary"
        prepend-icon="mdi-plus"
        @click="$emit('addDeal')"
      >
        Add Your First Deal
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
defineProps({
  deals: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['viewDeal', 'editDeal', 'deleteDeal', 'openCalculator', 'addDeal'])

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US').format(amount || 0)
}

const formatStatus = (status) => {
  const statusMap = {
    'analyzing': 'Analyzing',
    'under-contract': 'Under Contract',
    'closed': 'Closed',
    'passed': 'Passed',
  }
  return statusMap[status] || status
}

const formatStrategy = (strategy) => {
  const strategyMap = {
    'buy-hold': 'Buy & Hold',
    'fix-flip': 'Fix & Flip',
    'brrr': 'BRRR',
    'wholesale': 'Wholesale',
  }
  return strategyMap[strategy] || strategy
}

const getStatusColor = (status) => {
  const colorMap = {
    'analyzing': 'blue',
    'under-contract': 'orange',
    'closed': 'green',
    'passed': 'grey',
  }
  return colorMap[status] || 'grey'
}

const getStrategyIcon = (strategy) => {
  const iconMap = {
    'buy-hold': 'mdi-home-heart',
    'fix-flip': 'mdi-hammer-wrench',
    'brrr': 'mdi-refresh',
    'wholesale': 'mdi-handshake',
  }
  return iconMap[strategy] || 'mdi-home'
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
