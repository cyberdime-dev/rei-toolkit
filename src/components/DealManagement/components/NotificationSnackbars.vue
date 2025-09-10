<template>
  <div>
    <!-- Success Snackbar -->
    <v-snackbar
      :model-value="showSuccess"
      :timeout="3000"
      color="success"
      @update:model-value="$emit('update:showSuccess', $event)"
    >
      {{ successMessage }}
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
      :model-value="showError"
      :timeout="5000"
      color="error"
      @update:model-value="$emit('update:showError', $event)"
    >
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
defineProps({
  successMessage: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  showSuccess: {
    type: Boolean,
    default: false,
  },
  showError: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:showSuccess', 'update:showError'])
</script>
