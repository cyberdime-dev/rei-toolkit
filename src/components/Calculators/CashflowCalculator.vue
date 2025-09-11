/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
<script setup>
import { ref, computed } from 'vue'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
)

const incomeItems = ref([{ label: '', amount: 0 }])
const expenseItems = ref([{ label: '', amount: 0 }])

const totalIncome = computed(() =>
  incomeItems.value.reduce((sum, item) => sum + Number(item.amount || 0), 0),
)
const totalExpenses = computed(() =>
  expenseItems.value.reduce((sum, item) => sum + Number(item.amount || 0), 0),
)
const netProfit = computed(() => totalIncome.value - totalExpenses.value)

const toUSD = val =>
  `$${Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function addIncome() {
  incomeItems.value.push({ label: '', amount: 0 })
}
function addExpense() {
  expenseItems.value.push({ label: '', amount: 0 })
}
function removeIncome(idx) {
  if (incomeItems.value.length > 1) incomeItems.value.splice(idx, 1)
}
function removeExpense(idx) {
  if (expenseItems.value.length > 1) expenseItems.value.splice(idx, 1)
}

// Pie chart data (Income, Expenses, Cashflow)
const pieData = computed(() => {
  const income = totalIncome.value
  const expenses = totalExpenses.value
  const cashflow = netProfit.value

  return {
    labels: ['Income', 'Expenses', 'Cashflow'],
    datasets: [
      {
        backgroundColor: [
          '#1976D2', // Income: success blue (Vuetify primary blue)
          '#FF5722', // Expenses: deep-orange-lighten-1
          '#43A047', // Cashflow: success green
        ],
        data: [income, expenses, cashflow],
      },
    ],
  }
})

// Bar chart data (Income & Expenses only, no Cashflow)
const barData = computed(() => {
  const income = totalIncome.value
  const expenses = totalExpenses.value

  return {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        label: 'Amount',
        backgroundColor: [
          '#1976D2', // Income: success blue
          '#FF5722', // Expenses: deep-orange-lighten-1
        ],
        data: [income, expenses],
      },
    ],
  }
})

const showPieModal = ref(false)
const showBarModal = ref(false)
</script>

<template>
  <v-card class="pa-4 mobile-card">
    <!-- Cashflow Results -->
    <v-row
      dense
      class="mb-2"
    >
      <v-col
        cols="12"
        md="4"
      >
        <v-sheet
          color="info"
          class="pa-3"
          rounded
        >
          <strong>Total Income:</strong>
          <br />
          {{ toUSD(totalIncome) }}
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-sheet
          color="deep-orange-lighten-1"
          class="pa-3"
          rounded
        >
          <strong>Total Expenses:</strong>
          <br />
          {{ toUSD(totalExpenses) }}
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-sheet
          :color="netProfit >= 0 ? 'success' : 'error'"
          class="pa-3"
          rounded
        >
          <strong>Cashflow | Net Profit &amp; Loss:</strong>
          <br />
          {{ toUSD(netProfit) }}
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Charts: Dashboard on desktop, modal on mobile -->
    <v-row
      v-if="$vuetify.display.mdAndUp"
      class="mb-4"
    >
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          class="pa-3"
          rounded
        >
          <Pie
            :data="pieData"
            :options="{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }"
            style="max-height: 300px"
          />
        </v-sheet>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          class="pa-3"
          rounded
        >
          <Bar
            :data="barData"
            :options="{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }"
            style="max-height: 300px"
          />
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Chart Buttons (mobile only) -->
    <v-row v-else>
      <v-col
        cols="12"
        class="d-flex justify-end gap-2"
      >
        <v-btn
          color="primary"
          :disabled="totalIncome === 0 && totalExpenses === 0"
          @click="showPieModal = true"
        >
          <v-icon start>
            mdi-chart-pie
          </v-icon>
          Pie Chart
        </v-btn>
        <v-btn
          color="primary"
          :disabled="totalIncome === 0 && totalExpenses === 0"
          @click="showBarModal = true"
        >
          <v-icon start>
            mdi-chart-bar
          </v-icon>
          Bar Chart
        </v-btn>
      </v-col>
    </v-row>

    <!-- Pie Chart Modal (mobile only) -->
    <v-dialog
      v-model="showPieModal"
      max-width="400"
    >
      <v-card>
        <v-card-title>
          Income vs Expenses (Pie)
          <v-spacer />
          <v-btn
            icon
            @click="showPieModal = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <Pie
            :data="pieData"
            :options="{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Bar Chart Modal (mobile only) -->
    <v-dialog
      v-model="showBarModal"
      max-width="400"
    >
      <v-card>
        <v-card-title>
          Income vs Expenses (Bar)
          <v-spacer />
          <v-btn
            icon
            @click="showBarModal = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <Bar
            :data="barData"
            :options="{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-divider class="my-4" />

    <!-- Income & Expense Inputs -->
    <v-row>
      <v-col cols="12">
        <h3 class="text-h6 mb-2">
          Income
        </h3>
        <v-row
          v-for="(item, idx) in incomeItems"
          :key="'inc' + idx"
          class="mb-1"
          align="center"
        >
          <v-col cols="7">
            <v-text-field
              v-model="item.label"
              label="Label"
              dense
              hide-details
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="item.amount"
              label="Amount"
              prefix="$"
              type="number"
              dense
              hide-details
            />
          </v-col>
          <v-col cols="1">
            <v-btn
              icon
              size="small"
              :disabled="incomeItems.length === 1"
              @click="removeIncome(idx)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          @click="addIncome"
        >
          <v-icon start>
            mdi-plus
          </v-icon>
          Add Income
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        class="mt-4"
      >
        <h3 class="text-h6 mb-2">
          Expenses
        </h3>
        <v-row
          v-for="(item, idx) in expenseItems"
          :key="'exp' + idx"
          class="mb-1"
          align="center"
        >
          <v-col cols="7">
            <v-text-field
              v-model="item.label"
              label="Label"
              dense
              hide-details
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="item.amount"
              label="Amount"
              prefix="$"
              type="number"
              dense
              hide-details
            />
          </v-col>
          <v-col cols="1">
            <v-btn
              icon
              size="small"
              :disabled="expenseItems.length === 1"
              @click="removeExpense(idx)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          @click="addExpense"
        >
          <v-icon start>
            mdi-plus
          </v-icon>
          Add Expense
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>
