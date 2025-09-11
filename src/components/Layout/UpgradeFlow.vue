<template>
  <v-dialog
    v-model="dialog"
    max-width="600"
    persistent
  >
    <v-card class="upgrade-flow-card">
      <v-card-title class="d-flex align-center">
        <v-icon
          :color="iconColor"
          class="me-3"
          size="28"
        >
          {{ titleIcon }}
        </v-icon>
        {{ title }}
      </v-card-title>

      <v-card-text>
        <div class="text-body-1 mb-4">
          {{ description }}
        </div>

        <!-- Feature Benefits -->
        <v-list
          v-if="benefits.length > 0"
          class="mb-4"
          density="compact"
        >
          <v-list-item
            v-for="benefit in benefits"
            :key="benefit"
            class="px-0"
          >
            <template #prepend>
              <v-icon
                color="success"
                size="20"
              >
                mdi-check-circle
              </v-icon>
            </template>
            <v-list-item-title class="text-body-2">
              {{ benefit }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Pricing Information -->
        <v-card
          v-if="showPricing"
          variant="outlined"
          class="mb-4"
        >
          <v-card-text class="text-center">
            <div class="text-h4 text-primary font-weight-bold">
              ${{ recommendedPlan.price }}
              <span class="text-body-2 text-medium-emphasis">/month</span>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ recommendedPlan.name }} Plan
            </div>
          </v-card-text>
        </v-card>

        <!-- Success Message for Completed Upgrades -->
        <v-alert
          v-if="flowType === 'success'"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <v-icon>mdi-party-popper</v-icon>
          </template>
          Welcome to {{ recommendedPlan.name }}! You now have access to all premium features.
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end pa-4">
        <v-btn
          v-if="showCancelButton"
          variant="text"
          @click="handleCancel"
        >
          {{ cancelText }}
        </v-btn>
        
        <v-btn
          :color="primaryButtonColor"
          :variant="primaryButtonVariant"
          :loading="loading"
          @click="handlePrimaryAction"
        >
          {{ primaryButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  flowType: {
    type: String,
    default: 'upgrade', // 'upgrade', 'feature-locked', 'success', 'limit-reached'
    validator: (value) => ['upgrade', 'feature-locked', 'success', 'limit-reached'].includes(value),
  },
  featureName: {
    type: String,
    default: '',
  },
  customTitle: {
    type: String,
    default: '',
  },
  customDescription: {
    type: String,
    default: '',
  },
  customBenefits: {
    type: Array,
    default: () => [],
  },
  recommendedPlan: {
    type: Object,
    default: () => ({ name: 'Pro', price: 19 }),
  },
  showPricing: {
    type: Boolean,
    default: true,
  },
  autoRedirectToPricing: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'upgrade-clicked', 'cancel'])

const router = useRouter()
const loading = ref(false)

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Flow configurations
const flowConfigs = {
  'upgrade': {
    title: 'Upgrade to Pro',
    description: 'Unlock professional features and take your real estate analysis to the next level.',
    icon: 'mdi-star',
    iconColor: 'primary',
    benefits: [
      'Unlimited cloud sync across all devices',
      'Create professional shareable reports',
      'Custom branding with your company logo',
      'Advanced analytics and insights',
      'Priority customer support',
    ],
    primaryButtonText: 'Upgrade Now',
    primaryButtonColor: 'primary',
    primaryButtonVariant: 'flat',
    cancelText: 'Maybe Later',
    showCancel: true,
  },
  'feature-locked': {
    title: `Unlock ${props.featureName}`,
    description: `${props.featureName} is a premium feature. Upgrade to Pro to access this and many other professional tools.`,
    icon: 'mdi-lock',
    iconColor: 'warning',
    benefits: [
      `Access to ${props.featureName}`,
      'All premium calculator features',
      'Professional report sharing',
      'Cloud backup and sync',
      'Custom branding options',
    ],
    primaryButtonText: 'Unlock Feature',
    primaryButtonColor: 'warning',
    primaryButtonVariant: 'flat',
    cancelText: 'Continue with Free',
    showCancel: true,
  },
  'limit-reached': {
    title: 'Usage Limit Reached',
    description: 'You\'ve reached the limit for your free account. Upgrade to Pro for unlimited access to all features.',
    icon: 'mdi-speedometer',
    iconColor: 'error',
    benefits: [
      'Unlimited deals and calculations',
      'Unlimited cloud storage',
      'Unlimited report sharing',
      'Advanced features and integrations',
      'Remove all usage restrictions',
    ],
    primaryButtonText: 'Remove Limits',
    primaryButtonColor: 'error',
    primaryButtonVariant: 'flat',
    cancelText: 'Stay on Free',
    showCancel: true,
  },
  'success': {
    title: 'Welcome to Pro!',
    description: 'Your upgrade was successful! You now have access to all premium features.',
    icon: 'mdi-party-popper',
    iconColor: 'success',
    benefits: [],
    primaryButtonText: 'Explore Features',
    primaryButtonColor: 'success',
    primaryButtonVariant: 'flat',
    cancelText: '',
    showCancel: false,
  },
}

// Computed properties for current flow
const currentConfig = computed(() => {
  const config = flowConfigs[props.flowType] || flowConfigs.upgrade
  
  // Override with custom props if provided
  return {
    ...config,
    title: props.customTitle || config.title,
    description: props.customDescription || config.description,
    benefits: props.customBenefits.length > 0 ? props.customBenefits : config.benefits,
  }
})

const title = computed(() => currentConfig.value.title)
const description = computed(() => currentConfig.value.description)
const benefits = computed(() => currentConfig.value.benefits)
const titleIcon = computed(() => currentConfig.value.icon)
const iconColor = computed(() => currentConfig.value.iconColor)
const primaryButtonText = computed(() => currentConfig.value.primaryButtonText)
const primaryButtonColor = computed(() => currentConfig.value.primaryButtonColor)
const primaryButtonVariant = computed(() => currentConfig.value.primaryButtonVariant)
const cancelText = computed(() => currentConfig.value.cancelText)
const showCancelButton = computed(() => currentConfig.value.showCancel)

// Actions
const handlePrimaryAction = async () => {
  loading.value = true
  
  try {
    if (props.flowType === 'success') {
      // Close dialog and maybe navigate somewhere
      dialog.value = false
      emit('upgrade-clicked', { action: 'explore' })
    } else {
      // Emit upgrade event and potentially redirect
      emit('upgrade-clicked', { 
        flowType: props.flowType,
        featureName: props.featureName,
        plan: props.recommendedPlan,
      })
      
      // Auto-redirect to pricing page if enabled
      if (props.autoRedirectToPricing) {
        await router.push('/pricing')
        dialog.value = false
      }
    }
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  dialog.value = false
  emit('cancel', { 
    flowType: props.flowType,
    featureName: props.featureName,
  })
}
</script>

<style scoped>
.upgrade-flow-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-surface), 1));
}

.upgrade-flow-card .v-card-title {
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.upgrade-flow-card .v-list-item {
  margin-bottom: 8px;
}

.upgrade-flow-card .v-alert {
  border-radius: 12px;
}
</style>
