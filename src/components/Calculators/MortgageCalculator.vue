<script setup>
import { ref, computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

// Inputs
const homePrice = ref(0);
const downPayment = ref(0);
const interestRate = ref(0);
const loanTerm = ref(30);
const propertyTax = ref(0);
const insurance = ref(0);
const hoa = ref(0);

const showAmortization = ref(false);
const showLineChart = ref(false);

// Calculations
const loanAmount = computed(() => homePrice.value - downPayment.value);

const monthlyInterest = computed(() => interestRate.value / 100 / 12);
const numberOfPayments = computed(() => loanTerm.value * 12);

const monthlyPrincipalAndInterest = computed(() => {
  const P = loanAmount.value;
  const r = monthlyInterest.value;
  const n = numberOfPayments.value;
  if (!P || !r || !n) return 0;
  const denominator = 1 - Math.pow(1 + r, -n);
  if (denominator === 0) return 0;
  return (P * r) / denominator;
});

const monthlyTax = computed(() => propertyTax.value / 12);
const monthlyInsurance = computed(() => insurance.value / 12);
const monthlyOtherCosts = computed(() => hoa.value);

const totalMonthlyPayment = computed(
  () =>
    monthlyPrincipalAndInterest.value +
    monthlyTax.value +
    monthlyInsurance.value +
    monthlyOtherCosts.value
);

const totalInterest = computed(() => {
  // Only principal & interest
  return monthlyPrincipalAndInterest.value * numberOfPayments.value - loanAmount.value;
});

const toUSD = (val) =>
  `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Amortization Table Calculation
const amortizationTable = computed(() => {
  const table = [];
  let balance = loanAmount.value;
  const r = monthlyInterest.value;
  const n = numberOfPayments.value;
  const monthlyPI = monthlyPrincipalAndInterest.value;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principal = monthlyPI - interest;
    table.push({
      payment: i,
      principal: principal > balance ? balance : principal,
      interest: interest > balance ? balance : interest,
      total: principal + interest,
      balance: balance - principal > 0 ? balance - principal : 0,
    });
    balance -= principal;
    if (balance < 0.01) break;
  }
  return table;
});

// Line Chart Data for Amortization
const lineChartData = computed(() => {
  const labels = amortizationTable.value.map((row) => row.payment);
  const balances = amortizationTable.value.map((row) => row.balance);
  const principals = amortizationTable.value.map((row) => row.principal);
  const interests = amortizationTable.value.map((row) => row.interest);

  return {
    labels,
    datasets: [
      {
        label: "Balance",
        data: balances,
        borderColor: "#1976D2",
        backgroundColor: "#1976D2",
        fill: false,
        tension: 0.2,
      },
      {
        label: "Principal Paid",
        data: principals,
        borderColor: "#43A047",
        backgroundColor: "#43A047",
        fill: false,
        tension: 0.2,
      },
      {
        label: "Interest Paid",
        data: interests,
        borderColor: "#E53935",
        backgroundColor: "#E53935",
        fill: false,
        tension: 0.2,
      },
    ],
  };
});
</script>

<template>
  <v-card class="pa-4 max-w-md mx-auto mobile-card">
    <v-row dense class="mb-2">
      <v-col cols="12" md="4">
        <v-sheet color="info" class="pa-3" rounded>
          <strong>Monthly Principal & Interest:</strong><br />
          {{ toUSD(monthlyPrincipalAndInterest) }}
        </v-sheet>
      </v-col>
      <v-col cols="12" md="4" sm="6">
        <v-sheet color="info" class="pa-3" rounded>
          <strong>Monthly PITI + Other Costs:</strong><br />
          {{ toUSD(totalMonthlyPayment) }}
        </v-sheet>
      </v-col>
      <v-col cols="12" md="4" sm="6">
        <v-sheet color="info" class="pa-3" rounded>
          <strong>Total Interest Paid:</strong><br />
          {{ toUSD(totalInterest) }}
        </v-sheet>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-row dense>
      <!-- Inputs -->
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="homePrice" label="Home Price" prefix="$" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="downPayment" label="Down Payment" prefix="$" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="interestRate"
          label="Interest Rate (%)"
          suffix="%"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="loanTerm" label="Loan Term (years)" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="propertyTax"
          label="Annual Property Tax (optional)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="insurance"
          label="Annual Insurance (optional)"
          prefix="$"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="hoa"
          label="Monthly Other Costs (optional)"
          prefix="$"
        />
      </v-col>
    </v-row>

    <v-row class="my-4" v-if="loanAmount > 0 && interestRate > 0 && loanTerm > 0">
     <!-- Amortization Chart -->
      <v-col cols="12" md="5">
        <v-sheet class="pa-3" rounded>
          <h3 class="text-h6 mb-2">Amortization Chart</h3>
          <Line
            :data="lineChartData"
            :options="{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true } }
            }"
            style="max-height:350px;"
          />
        </v-sheet>
      </v-col>
    <!-- Amortization Table and Chart -->   
      <v-col cols="12" md="7">
        <v-sheet class="pa-3" rounded>
          <h3 class="text-h6 mb-2">Amortization Table</h3>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total Payment</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in amortizationTable" :key="row.payment">
                <td>{{ row.payment }}</td>
                <td>{{ toUSD(row.principal) }}</td>
                <td>{{ toUSD(row.interest) }}</td>
                <td>{{ toUSD(row.total) }}</td>
                <td>{{ toUSD(row.balance) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-sheet>
      </v-col>
    </v-row>
  </v-card>
</template>
