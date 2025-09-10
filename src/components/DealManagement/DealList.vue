<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Deal Management</h1>
        <v-card>
          <v-list>
            <v-list-item v-for="deal in deals" :key="deal.id">
              <v-list-item-title>{{ deal.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Added: {{ new Date(deal.date).toLocaleDateString() }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  @click="editDeal(deal)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  @click="deleteDeal(deal)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-btn
          color="primary"
          class="mt-4"
          prepend-icon="mdi-plus"
          @click="createDeal"
        >
          Add New Deal
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'DealList',
  data() {
    return {
      deals: [],
    }
  },
  methods: {
    createDeal() {
      // To be implemented with data persistence
    },
    editDeal(selectedDeal) {
      console.log('Editing deal:', selectedDeal)
      // To be implemented
    },
    deleteDeal(selectedDeal) {
      console.log('Deleting deal:', selectedDeal)
      // To be implemented
    },
  },
}
</script>
