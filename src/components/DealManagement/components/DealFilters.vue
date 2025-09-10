<template>
  <v-row class="mb-4">
    <v-col
      cols="12"
      md="6"
    >
      <v-text-field
        :model-value="search"
        placeholder="Search deals..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        @update:model-value="$emit('update:search', $event)"
      />
    </v-col>
    <v-col
      cols="12"
      md="3"
    >
      <v-select
        :model-value="status"
        :items="statusOptions"
        placeholder="Filter by status"
        variant="outlined"
        density="comfortable"
        hide-details
        @update:model-value="$emit('update:status', $event)"
      />
    </v-col>
    <v-col
      cols="12"
      md="3"
    >
      <v-select
        :model-value="strategy"
        :items="strategyOptions"
        placeholder="Filter by strategy"
        variant="outlined"
        density="comfortable"
        hide-details
        @update:model-value="$emit('update:strategy', $event)"
      />
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  search: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: '',
  },
  strategy: {
    type: String,
    default: '',
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  strategyOptions: {
    type: Array,
    required: true,
  },
})

defineEmits(['update:search', 'update:status', 'update:strategy'])
</script>
