<template>
  <v-row class="align-center mb-4">
    <v-col>
      <h1 class="text-h4 font-weight-bold">
        Deal Management
      </h1>
      <p class="text-subtitle-1 text-medium-emphasis">
        Track and analyze your real estate deals
      </p>
    </v-col>
    <v-col cols="auto">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="$emit('addDeal')"
      >
        Add New Deal
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
defineEmits(['addDeal'])
</script>
