/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Initialize cloud sync service for premium users
import('./services/cloudSyncService.js').then(({ cloudSyncService }) => {
  cloudSyncService.init()
})

createApp(App).use(router).use(vuetify).mount('#app')
