<template>
  <v-snackbar
    v-model="snackbar"
    :timeout="timeout"
    :color="color"
    :location="location"
    :multi-line="isMultiLine"
    class="success-message"
  >
    <div class="d-flex align-center">
      <v-icon
        :color="iconColor"
        class="me-3"
        size="24"
      >
        {{ icon }}
      </v-icon>
      
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-medium">
          {{ title }}
        </div>
        <div
          v-if="message"
          class="text-body-2 text-medium-emphasis"
        >
          {{ message }}
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn
        v-if="showAction && actionText"
        :color="actionColor"
        variant="text"
        size="small"
        @click="handleAction"
      >
        {{ actionText }}
      </v-btn>
      
      <v-btn
        icon="mdi-close"
        size="small"
        @click="snackbar = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'success', // 'success', 'upgrade', 'feature-unlock', 'info', 'warning'
    validator: (value) => ['success', 'upgrade', 'feature-unlock', 'info', 'warning'].includes(value),
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  timeout: {
    type: Number,
    default: 6000,
  },
  actionText: {
    type: String,
    default: '',
  },
  actionRoute: {
    type: String,
    default: '',
  },
  showAction: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'action-clicked'])

const router = useRouter()

// Snackbar state
const snackbar = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Type configurations
const typeConfigs = {
  success: {
    color: 'success',
    icon: 'mdi-check-circle',
    iconColor: 'white',
    actionColor: 'white',
  },
  upgrade: {
    color: 'primary',
    icon: 'mdi-star',
    iconColor: 'white',
    actionColor: 'white',
  },
  'feature-unlock': {
    color: 'warning',
    icon: 'mdi-lock-open',
    iconColor: 'white',
    actionColor: 'white',
  },
  info: {
    color: 'info',
    icon: 'mdi-information',
    iconColor: 'white',
    actionColor: 'white',
  },
  warning: {
    color: 'warning',
    icon: 'mdi-alert',
    iconColor: 'white',
    actionColor: 'white',
  },
}

// Computed properties
const currentConfig = computed(() => typeConfigs[props.type] || typeConfigs.success)
const color = computed(() => currentConfig.value.color)
const icon = computed(() => currentConfig.value.icon)
const iconColor = computed(() => currentConfig.value.iconColor)
const actionColor = computed(() => currentConfig.value.actionColor)
const location = computed(() => 'top')
const isMultiLine = computed(() => !!props.message)

// Handle action click
const handleAction = () => {
  emit('action-clicked')
  
  if (props.actionRoute) {
    router.push(props.actionRoute)
  }
  
  snackbar.value = false
}

// Watch for modelValue changes to reset any internal state
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Could add entrance animations or effects here
  }
})
</script>

<style scoped>
.success-message {
  font-family: inherit;
}

.success-message .v-snackbar__wrapper {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.success-message .v-snackbar__content {
  padding: 16px 24px;
}
</style>
