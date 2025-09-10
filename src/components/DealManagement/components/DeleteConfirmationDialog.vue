<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Delete Deal</v-card-title>
      <v-card-text>
        Are you sure you want to delete "{{ dealName }}"? This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          @click="$emit('confirmed')"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  dealName: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue', 'confirmed'])
</script>
