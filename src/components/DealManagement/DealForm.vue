<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon
          :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'"
          class="me-2"
        />
        {{ isEditing ? 'Edit Deal' : 'Add New Deal' }}
      </v-card-title>

      <v-card-text>
        <v-form
          ref="form"
          v-model="isFormValid"
          @submit.prevent="saveDeal"
        >
          <v-row>
            <!-- Basic Information -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3">
                Basic Information
              </h3>
            </v-col>

            <v-col
              cols="12"
              md="8"
            >
              <v-text-field
                v-model="formData.name"
                label="Deal Name *"
                placeholder="e.g., 123 Main St Duplex"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-select
                v-model="formData.strategy"
                :items="strategyOptions"
                label="Investment Strategy *"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.address"
                label="Property Address"
                placeholder="e.g., 123 Main St, City, State 12345"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="Deal Status"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- Financial Information -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">
                Purchase Details
              </h3>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="formData.purchasePrice"
                label="Purchase Price *"
                :rules="[rules.required, rules.positiveNumber]"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="formData.downPayment"
                label="Down Payment"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model.number="formData.interestRate"
                label="Interest Rate"
                suffix="%"
                type="number"
                step="0.01"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model.number="formData.loanTerm"
                label="Loan Term"
                suffix="years"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model.number="formData.repairCosts"
                label="Repair Costs"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- Income & Expenses -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">
                Income & Expenses
              </h3>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="formData.monthlyRent"
                label="Monthly Rent"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="formData.monthlyExpenses"
                label="Monthly Expenses"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- ARV for Fix & Flip / BRRR -->
            <v-col
              v-if="formData.strategy === 'fix-flip' || formData.strategy === 'brrr'"
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="formData.arv"
                label="After Repair Value (ARV)"
                prefix="$"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notes"
                placeholder="Add any additional notes about this deal..."
                variant="outlined"
                rows="3"
                density="comfortable"
              />
            </v-col>

            <!-- Calculated Metrics Preview -->
            <v-col
              v-if="showMetrics"
              cols="12"
            >
              <v-divider class="my-4" />
              <h3 class="text-h6 mb-3">
                Quick Metrics
              </h3>
              <v-row>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold">
                      ${{ formatCurrency(calculatedMetrics.cashFlow) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Monthly Cash Flow
                    </div>
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold">
                      {{ (calculatedMetrics.cashOnCashReturn * 100).toFixed(1) }}%
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Cash-on-Cash Return
                    </div>
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold">
                      {{ (calculatedMetrics.capRate * 100).toFixed(1) }}%
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Cap Rate
                    </div>
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold">
                      ${{ formatCurrency(calculatedMetrics.monthlyPayment) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Monthly Payment
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancelForm"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!isFormValid"
          :loading="isSaving"
          @click="saveDeal"
        >
          {{ isEditing ? 'Update Deal' : 'Save Deal' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import dealManager, { Deal } from '@/utils/dealManager.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  deal: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved', 'canceled'])

// Form state
const form = ref(null)
const isFormValid = ref(false)
const isSaving = ref(false)

// Form data
const formData = ref({
  name: '',
  address: '',
  purchasePrice: 0,
  downPayment: 0,
  loanAmount: 0,
  interestRate: 4.5,
  loanTerm: 30,
  monthlyRent: 0,
  monthlyExpenses: 0,
  repairCosts: 0,
  arv: 0,
  strategy: 'buy-hold',
  status: 'analyzing',
  notes: '',
})

// Form options
const strategyOptions = [
  { title: 'Buy & Hold', value: 'buy-hold' },
  { title: 'Fix & Flip', value: 'fix-flip' },
  { title: 'BRRR', value: 'brrr' },
  { title: 'Wholesale', value: 'wholesale' },
]

const statusOptions = [
  { title: 'Analyzing', value: 'analyzing' },
  { title: 'Under Contract', value: 'under-contract' },
  { title: 'Closed', value: 'closed' },
  { title: 'Passed', value: 'passed' },
]

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required',
  positiveNumber: (value) => value > 0 || 'Must be greater than 0',
}

// Computed properties
const isEditing = computed(() => !!props.deal?.id)

const showMetrics = computed(() => {
  return formData.value.purchasePrice > 0 && 
         (formData.value.monthlyRent > 0 || formData.value.strategy === 'fix-flip')
})

const calculatedMetrics = computed(() => {
  try {
    // Ensure all numeric values are valid numbers, not NaN
    const sanitizedData = { ...formData.value }
    Object.keys(sanitizedData).forEach(key => {
      const value = sanitizedData[key]
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        sanitizedData[key] = 0
      }
    })
    
    const tempDeal = new Deal(sanitizedData)
    
    // Safely calculate metrics with fallbacks
    const cashFlow = isFinite(tempDeal.cashFlow) ? tempDeal.cashFlow : 0
    const cashOnCashReturn = isFinite(tempDeal.cashOnCashReturn) ? tempDeal.cashOnCashReturn : 0
    const capRate = isFinite(tempDeal.capRate) ? tempDeal.capRate : 0
    const monthlyPayment = isFinite(tempDeal.calculateMonthlyPayment()) ? tempDeal.calculateMonthlyPayment() : 0
    
    return {
      cashFlow,
      cashOnCashReturn,
      capRate,
      monthlyPayment,
    }
  } catch (error) {
    console.warn('Error calculating metrics:', error)
    return {
      cashFlow: 0,
      cashOnCashReturn: 0,
      capRate: 0,
      monthlyPayment: 0,
    }
  }
})

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    address: '',
    purchasePrice: 0,
    downPayment: 0,
    loanAmount: 0,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyRent: 0,
    monthlyExpenses: 0,
    repairCosts: 0,
    arv: 0,
    strategy: 'buy-hold',
    status: 'analyzing',
    notes: '',
  }
  
  nextTick(() => {
    if (form.value) {
      form.value.resetValidation()
    }
  })
}

// Watchers
watch(() => props.deal, (newDeal) => {
  try {
    if (newDeal) {
      // Populate form with deal data
      Object.keys(formData.value).forEach(key => {
        if (newDeal[key] !== undefined) {
          // Ensure numeric values are valid
          let value = newDeal[key]
          if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
            value = 0
          }
          formData.value[key] = value
        }
      })
    } else {
      // Reset form for new deal
      resetForm()
    }
  } catch (error) {
    console.warn('Error in deal watcher:', error)
    resetForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && !props.deal) {
    resetForm()
  }
})

// Update loan amount when purchase price or down payment changes
watch([() => formData.value.purchasePrice, () => formData.value.downPayment], () => {
  try {
    const purchasePrice = formData.value.purchasePrice || 0
    const downPayment = formData.value.downPayment || 0
    
    // Ensure values are valid numbers
    if (isFinite(purchasePrice) && isFinite(downPayment)) {
      const loanAmount = Math.max(0, purchasePrice - downPayment)
      formData.value.loanAmount = isFinite(loanAmount) ? loanAmount : 0
    }
  } catch (error) {
    console.warn('Error calculating loan amount:', error)
  }
}, { deep: true })

// Methods (after watchers)
const saveDeal = async () => {
  if (!form.value || !isFormValid.value) return

  isSaving.value = true

  try {
    let savedDeal
    
    if (isEditing.value) {
      savedDeal = dealManager.updateDeal(props.deal.id, formData.value)
    } else {
      savedDeal = dealManager.createDeal(formData.value)
    }

    emit('saved', savedDeal)
  } catch (error) {
    console.error('Error saving deal:', error)
    // Error handling should be done in parent component
  } finally {
    isSaving.value = false
  }
}

const cancelForm = () => {
  emit('canceled')
  resetForm()
}

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US').format(amount || 0)
}
</script>
