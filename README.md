# REI Toolkit

A collection of real estate investment calculators built with [Vue 3](https://vuejs.org/), [Vuetify 3](https://vuetifyjs.com/), and [Vite](https://vitejs.dev/).

## Features

- **Standard Calculator**: Basic arithmetic calculator.
- **Fix & Flip Calculator**: Analyze fix-and-flip deals, including MAO, ROI, and profit.
- **Buy & Hold Calculator**: Evaluate rental properties with cash flow, cap rate, and cash-on-cash return.
- **BRRR Calculator**: Analyze BRRR (Buy, Rehab, Rent, Refinance, Repeat) deals.
- **Wholesale Calculator**: Calculate assignment fees, MAO, and deal spread.
- **NOI Calculator**: Compute Net Operating Income for rental properties.
- **Cap Rate Calculator**: Calculate cap rate and property value based on NOI.
- **Cash-on-Cash Calculator**: Determine cash-on-cash return for investments.
- **Mortgage Calculator**: Calculate loan payments with taxes and insurance.
- Responsive navigation drawer for quick access to all calculators.

## 📊 Examples and Use Cases

See [EXAMPLES.md](./EXAMPLES.md) for detailed real-world examples and scenarios for each calculator, including:

- Fix & flip renovation project analysis
- Buy & hold rental property evaluation
- BRRR strategy implementation
- Wholesale deal assessment
- NOI and cap rate calculations
- Cash-on-cash return analysis
- Mortgage payment calculations

Each example includes realistic input values, expected results, and investment analysis tips.

## Project Structure

```
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── style.css
│   ├── plugins/
│   │   └── vuetify.js
│   ├── router/
│   │   └── index.js
│   ├── views/
│   │   └── Home.vue
│   └── components/
│       └── Calculators/
│           ├── BrrrCalculator.vue
│           ├── BuyAndHoldCalculator.vue
│           ├── CapRateCalculator.vue
│           ├── CashOnCashCalculator.vue
│           ├── FixAndFlipCalculator.vue
│           ├── Index.vue
│           ├── NoiCalculator.vue
│           ├── StandardCalculator.vue
│           └── WholesaleCalculator.vue
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Install dependencies

```sh
npm install
```

### Run the development server

```sh
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Build for production

```sh
npm run build
```

### Preview production build

```sh
npm run preview
```

## Tech Stack

- [Vue 3](https://vuejs.org/) with `<script setup>` SFCs
- [Vuetify 3](https://vuetifyjs.com/) for UI components
- [Vite](https://vitejs.dev/) for fast development and build
- [Vue Router](https://router.vuejs.org/) for navigation

## Calculator Components

Each calculator is implemented as a Vue SFC in [`src/components/Calculators/`](src/components/Calculators/Index.vue):

- [`StandardCalculator.vue`](src/components/Calculators/StandardCalculator.vue)
- [`FixAndFlipCalculator.vue`](src/components/Calculators/FixAndFlipCalculator.vue)
- [`BuyAndHoldCalculator.vue`](src/components/Calculators/BuyAndHoldCalculator.vue)
- [`BrrrCalculator.vue`](src/components/Calculators/BrrrCalculator.vue)
- [`WholesaleCalculator.vue`](src/components/Calculators/WholesaleCalculator.vue)
- [`NoiCalculator.vue`](src/components/Calculators/NoiCalculator.vue)
- [`CapRateCalculator.vue`](src/components/Calculators/CapRateCalculator.vue)
- [`CashOnCashCalculator.vue`](src/components/Calculators/CashOnCashCalculator.vue)

## Customization

- Add or modify calculators in [`src/components/Calculators/`](src/components/Calculators/Index.vue).
- Update navigation in [`src/App.vue`](src/App.vue) and routes in [`src/router/index.js`](src/router/index.js).

## License

MIT

---
Built by John Norris @ Cyberdime
