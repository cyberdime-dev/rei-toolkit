<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- Header Section -->
        <DealListHeader @add-deal="showDealForm = true" />

        <!-- Summary Cards Section -->
        <DealSummaryCards :summary="summary" />

        <!-- Filters Section -->
        <DealFilters
          v-model:search="searchQuery"
          v-model:status="statusFilter"
          v-model:strategy="strategyFilter"
          :status-options="statusOptions"
          :strategy-options="strategyOptions"
        />

        <!-- Deals List Section -->
        <DealsList
          :deals="filteredDeals"
          :loading="false"
          @view-deal="viewDeal"
          @edit-deal="editDeal"
          @delete-deal="confirmDelete"
          @open-calculator="openInCalculator"
        />
      </v-col>
    </v-row>

    <!-- Deal Form Dialog -->
    <DealForm
      v-model="showDealForm"
      :deal="selectedDeal"
      @saved="handleDealSaved"
      @canceled="handleDealCanceled"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationDialog
      v-model="showDeleteDialog"
      :deal-name="dealToDelete?.name"
      @confirmed="deleteDeal"
    />

    <!-- Notifications -->
    <NotificationSnackbars
      :success-message="successMessage"
      :error-message="errorMessage"
      :show-success="showSuccessMessage"
      :show-error="showErrorMessage"
      @update:show-success="showSuccessMessage = $event"
      @update:show-error="showErrorMessage = $event"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dealManager from '@/utils/dealManager.js'
import DealForm from './DealForm.vue'

// Import child components
import DealListHeader from './components/DealListHeader.vue'
import DealSummaryCards from './components/DealSummaryCards.vue'
import DealFilters from './components/DealFilters.vue'
import DealsList from './components/DealsList.vue'
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog.vue'
import NotificationSnackbars from './components/NotificationSnackbars.vue'

const router = useRouter()

// Reactive state
const deals = ref([])
const showDealForm = ref(false)
const selectedDeal = ref(null)
const showDeleteDialog = ref(false)
const dealToDelete = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const strategyFilter = ref('')
const showSuccessMessage = ref(false)
const successMessage = ref('')
const showErrorMessage = ref(false)
const errorMessage = ref('')

// Options for filters
const statusOptions = [
  { title: 'All Statuses', value: '' },
  { title: 'Analyzing', value: 'analyzing' },
  { title: 'Under Contract', value: 'under-contract' },
  { title: 'Closed', value: 'closed' },
  { title: 'Passed', value: 'passed' },
]

const strategyOptions = [
  { title: 'All Strategies', value: '' },
  { title: 'Buy & Hold', value: 'buy-hold' },
  { title: 'Fix & Flip', value: 'fix-flip' },
  { title: 'BRRR', value: 'brrr' },
  { title: 'Wholesale', value: 'wholesale' },
]

// Computed properties
const summary = computed(() => dealManager.getSummary())

const filteredDeals = computed(() => {
  let filtered = deals.value

  // Search filter
  if (searchQuery.value) {
    filtered = dealManager.searchDeals(searchQuery.value)
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(deal => deal.status === statusFilter.value)
  }

  // Strategy filter
  if (strategyFilter.value) {
    filtered = filtered.filter(deal => deal.strategy === strategyFilter.value)
  }

  return filtered
})

// Methods
const loadDeals = () => {
  deals.value = dealManager.getAllDeals()
}

const viewDeal = (deal) => {
  selectedDeal.value = deal
  showDealForm.value = true
}

const editDeal = (deal) => {
  selectedDeal.value = deal
  showDealForm.value = true
}

const confirmDelete = (deal) => {
  dealToDelete.value = deal
  showDeleteDialog.value = true
}

const deleteDeal = () => {
  try {
    dealManager.deleteDeal(dealToDelete.value.id)
    loadDeals()
    showDeleteDialog.value = false
    dealToDelete.value = null
    showSuccess('Deal deleted successfully')
  } catch (error) {
    showError('Failed to delete deal: ' + error.message)
  }
}

const openInCalculator = (deal) => {
  // Store deal data for calculator and navigate
  sessionStorage.setItem('calculator_deal_data', JSON.stringify(deal.toCalculatorData()))
  
  // Navigate to appropriate calculator based on strategy
  const calculatorRoutes = {
    'buy-hold': '/calculator/buy-hold',
    'fix-flip': '/calculator/fix-flip',
    'brrr': '/calculator/brrr',
    'wholesale': '/calculator/wholesale',
  }
  
  const route = calculatorRoutes[deal.strategy] || '/calculator/standard'
  router.push(route)
}

const handleDealSaved = (deal) => {
  loadDeals()
  showDealForm.value = false
  selectedDeal.value = null
  
  if (deal.id) {
    showSuccess('Deal updated successfully')
  } else {
    showSuccess('Deal created successfully')
  }
}

const handleDealCanceled = () => {
  showDealForm.value = false
  selectedDeal.value = null
}

const showSuccess = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
}

const showError = (message) => {
  errorMessage.value = message
  showErrorMessage.value = true
}

// Lifecycle
onMounted(() => {
  loadDeals()
})
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
