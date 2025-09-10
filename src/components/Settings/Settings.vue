<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Settings</h1>
        <v-card>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Theme</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="darkMode"
                    label="Dark Mode"
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Default Calculator</v-list-item-title>
                <template #append>
                  <v-select
                    v-model="defaultCalculator"
                    :items="calculatorOptions"
                    variant="underlined"
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Currency</v-list-item-title>
                <template #append>
                  <v-select
                    v-model="currency"
                    :items="['USD', 'EUR', 'GBP']"
                    variant="underlined"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      darkMode: false,
      defaultCalculator: 'standard',
      currency: 'USD',
      calculatorOptions: [
        { title: 'Standard Calculator', value: 'standard' },
        { title: 'Mortgage Calculator', value: 'mortgage' },
        { title: 'Fix and Flip Calculator', value: 'fix-flip' },
        { title: 'Buy and Hold Calculator', value: 'buy-hold' },
        { title: 'BRRR Calculator', value: 'brrr' },
        { title: 'Wholesale Calculator', value: 'wholesale' },
        { title: 'NOI Calculator', value: 'noi' },
        { title: 'Cash on Cash Calculator', value: 'cash-on-cash' },
        { title: 'Cashflow Calculator', value: 'cashflow' },
        { title: 'Cap Rate Calculator', value: 'cap-rate' },
      ],
    }
  },
  watch: {
    darkMode(newValue) {
      // Implement theme switching
      this.$vuetify.theme.dark = newValue
    },
    defaultCalculator(newValue) {
      // Save to local storage
      localStorage.setItem('defaultCalculator', newValue)
    },
    currency(newValue) {
      // Save to local storage
      localStorage.setItem('currency', newValue)
    },
  },
  mounted() {
    // Load saved preferences
    this.darkMode = this.$vuetify.theme.dark
    this.defaultCalculator =
      localStorage.getItem('defaultCalculator') || 'standard'
    this.currency = localStorage.getItem('currency') || 'USD'
  },
}
</script>
