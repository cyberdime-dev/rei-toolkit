<template>
  <v-dialog
    v-model="isOpen"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon
          :color="userPlan === 'free' ? 'warning' : 'primary'"
          class="me-3"
        >
          {{ userPlan === 'free' ? 'mdi-lock' : 'mdi-share-variant' }}
        </v-icon>
        {{ userPlan === 'free' ? 'Share Deal Analysis' : 'Share Your Analysis' }}
      </v-card-title>

      <v-card-text>
        <!-- Free User Upgrade Prompt -->
        <div v-if="userPlan === 'free'">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="text-h6 mb-2">
              🚀 Unlock Professional Sharing
            </div>
            <p class="mb-2">
              Share your deal analyses with clients, partners, and investors using professional, branded reports.
            </p>
            <ul class="mb-3">
              <li>Custom branded reports with your logo</li>
              <li>Public shareable links that never expire</li>
              <li>Professional presentation format</li>
              <li>Track views and engagement analytics</li>
              <li>Export to PDF for offline sharing</li>
            </ul>
            <p class="text-subtitle-2 text-medium-emphasis">
              Start sharing professional deal analyses today and impress your network!
            </p>
          </v-alert>

          <div class="text-center">
            <v-btn
              color="primary"
              size="large"
              class="mb-3"
              @click="handleUpgrade"
            >
              <v-icon left>
                mdi-crown
              </v-icon>
              Upgrade to Pro - $19/month
            </v-btn>
            <br />
            <v-btn
              variant="text"
              color="secondary"
              @click="showBasicExport = true"
            >
              Or export as PDF instead
            </v-btn>
          </div>
        </div>

        <!-- Premium User Share Options -->
        <div v-else>
          <!-- Report Creation Form -->
          <div v-if="!sharedReport">
            <v-form ref="shareForm">
              <v-text-field
                v-model="reportTitle"
                label="Report Title"
                :placeholder="`${dealName} - ${calculationType} Analysis`"
                variant="outlined"
                class="mb-3"
                :rules="[v => !!v || 'Title is required']"
              />
              
              <v-textarea
                v-model="reportDescription"
                label="Description (Optional)"
                placeholder="Add a description for context..."
                variant="outlined"
                rows="3"
                class="mb-3"
              />

              <!-- Branding Options (Pro+ only) -->
              <v-expansion-panels
                v-if="userPlan !== 'free'"
                class="mb-4"
              >
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon class="me-2">
                      mdi-palette
                    </v-icon>
                    Custom Branding
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-text-field
                      v-model="branding.companyName"
                      label="Company Name"
                      variant="outlined"
                      class="mb-3"
                    />
                    
                    <v-text-field
                      v-model="branding.contactInfo"
                      label="Contact Information"
                      placeholder="email@company.com | (555) 123-4567"
                      variant="outlined"
                      class="mb-3"
                    />

                    <v-file-input
                      v-model="logoFile"
                      label="Company Logo"
                      accept="image/*"
                      variant="outlined"
                      prepend-icon="mdi-image"
                      @change="handleLogoUpload"
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- Report Settings -->
              <v-card
                variant="outlined"
                class="mb-4"
              >
                <v-card-text>
                  <div class="text-subtitle-1 mb-3">
                    Sharing Settings
                  </div>
                  
                  <v-switch
                    v-model="reportSettings.isPublic"
                    label="Make report publicly viewable"
                    color="primary"
                    hide-details
                    class="mb-2"
                  />
                  
                  <v-switch
                    v-model="reportSettings.allowComments"
                    label="Allow viewers to leave comments"
                    color="primary"
                    hide-details
                    :disabled="!reportSettings.isPublic"
                  />
                </v-card-text>
              </v-card>
            </v-form>
          </div>

          <!-- Shared Report Success -->
          <div v-else>
            <v-alert
              type="success"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-h6 mb-2">
                🎉 Report Created Successfully!
              </div>
              <p>Your deal analysis is now available at the link below.</p>
            </v-alert>

            <v-card
              variant="outlined"
              class="mb-4"
            >
              <v-card-text>
                <div class="text-subtitle-1 mb-2">
                  Shareable Link
                </div>
                <v-text-field
                  :model-value="sharedReport.publicUrl"
                  readonly
                  variant="outlined"
                  append-inner-icon="mdi-content-copy"
                  @click:append-inner="copyToClipboard(sharedReport.publicUrl)"
                />
              </v-card-text>
            </v-card>

            <!-- Share Actions -->
            <div class="text-center mb-4">
              <v-btn
                color="primary"
                class="me-2 mb-2"
                @click="shareViaEmail"
              >
                <v-icon left>
                  mdi-email
                </v-icon>
                Email
              </v-btn>

              <v-btn
                color="secondary"
                class="me-2 mb-2"
                @click="shareOnLinkedIn"
              >
                <v-icon left>
                  mdi-linkedin
                </v-icon>
                LinkedIn
              </v-btn>

              <v-btn
                variant="outlined"
                class="me-2 mb-2"
                @click="copyToClipboard(sharedReport.publicUrl)"
              >
                <v-icon left>
                  mdi-link
                </v-icon>
                Copy Link
              </v-btn>

              <v-btn
                variant="outlined"
                class="mb-2"
                @click="openReport"
              >
                <v-icon left>
                  mdi-open-in-new
                </v-icon>
                View Report
              </v-btn>
            </div>

            <!-- Usage Stats -->
            <v-alert
              v-if="usageStats"
              type="info"
              variant="text"
              class="text-center"
            >
              {{ usageStats.currentCount }} of {{ usageStats.maxReports }} reports used
              <v-progress-linear
                :model-value="(usageStats.currentCount / usageStats.maxReports) * 100"
                color="primary"
                height="4"
                class="mt-2"
              />
            </v-alert>
          </div>
        </div>

        <!-- Basic Export for Free Users -->
        <v-dialog
          v-model="showBasicExport"
          max-width="400"
        >
          <v-card>
            <v-card-title>Export Options</v-card-title>
            <v-card-text>
              <div class="text-center">
                <v-btn
                  color="primary"
                  class="mb-3"
                  block
                  @click="exportToPDF"
                >
                  <v-icon left>
                    mdi-file-pdf-box
                  </v-icon>
                  Download PDF
                </v-btn>
                
                <v-btn
                  variant="outlined"
                  block
                  @click="exportToImage"
                >
                  <v-icon left>
                    mdi-image
                  </v-icon>
                  Download Image
                </v-btn>
              </div>
              
              <v-alert
                type="info"
                variant="text"
                class="mt-4 text-center"
              >
                <small>
                  PDF will include "Generated by REI Toolkit" watermark.<br />
                  Upgrade to Pro for branded, shareable reports.
                </small>
              </v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                @click="showBasicExport = false"
              >
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        
        <v-btn
          @click="handleCancel"
        >
          {{ sharedReport ? 'Close' : 'Cancel' }}
        </v-btn>

        <v-btn
          v-if="userPlan !== 'free' && !sharedReport"
          color="primary"
          :loading="creating"
          :disabled="!reportTitle.trim()"
          @click="createSharedReport"
        >
          <v-icon left>
            mdi-share-variant
          </v-icon>
          Create Share Link
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="creating"
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
    </v-overlay>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService.js'
import { reportHostingService } from '@/services/reportHostingService.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  calculationType: {
    type: String,
    required: true,
  },
  calculationInputs: {
    type: Object,
    required: true,
  },
  calculationResults: {
    type: Object,
    required: true,
  },
  dealName: {
    type: String,
    default: 'Untitled Deal',
  },
})

const emit = defineEmits(['update:modelValue', 'shared', 'upgrade-requested'])

const router = useRouter()

// State
const isOpen = ref(false)
const creating = ref(false)
const showBasicExport = ref(false)
const sharedReport = ref(null)
const usageStats = ref(null)

// Form data
const reportTitle = ref('')
const reportDescription = ref('')
const logoFile = ref(null)
const branding = ref({
  companyName: '',
  contactInfo: '',
  logo: null,
})
const reportSettings = ref({
  isPublic: true,
  allowComments: false,
})

// Computed
const userPlan = computed(() => {
  const subscription = authService.getSubscription()
  return subscription?.plan || 'free'
})

// Watch for dialog open/close
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
  if (newValue) {
    initializeDialog()
  } else {
    resetDialog()
  }
})

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Methods
async function initializeDialog() {
  // Set default title
  reportTitle.value = `${props.dealName} - ${props.calculationType} Analysis`
  
  // Load usage stats for premium users
  if (userPlan.value !== 'free') {
    try {
      const stats = await reportHostingService.getUsageStats()
      if (stats.success) {
        usageStats.value = stats
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }
}

function resetDialog() {
  creating.value = false
  showBasicExport.value = false
  sharedReport.value = null
  reportTitle.value = ''
  reportDescription.value = ''
  logoFile.value = null
  branding.value = {
    companyName: '',
    contactInfo: '',
    logo: null,
  }
  reportSettings.value = {
    isPublic: true,
    allowComments: false,
  }
}

async function createSharedReport() {
  if (!reportTitle.value.trim()) return

  creating.value = true

  try {
    // Prepare calculation data
    const calculationData = reportHostingService.generateReportData(
      props.calculationType,
      props.calculationInputs,
      props.calculationResults,
      props.dealName,
    )

    // Prepare options
    const options = {
      title: reportTitle.value,
      description: reportDescription.value,
      isPublic: reportSettings.value.isPublic,
      allowComments: reportSettings.value.allowComments,
      companyName: branding.value.companyName || null,
      contactInfo: branding.value.contactInfo || null,
      logo: branding.value.logo || null,
    }

    // Create shared report
    const result = await reportHostingService.createSharedReport(calculationData, options)

    if (result.success) {
      sharedReport.value = result.reportData
      
      // Update usage stats
      if (usageStats.value) {
        usageStats.value.currentCount += 1
        usageStats.value.remaining -= 1
      }

      emit('shared', result.reportData)
    } else {
      // Handle error
      console.error('Failed to create shared report:', result.error)
      // You might want to show an error message here
    }
  } catch (error) {
    console.error('Error creating shared report:', error)
  } finally {
    creating.value = false
  }
}

function handleUpgrade() {
  emit('upgrade-requested')
  router.push('/pricing')
  handleCancel()
}

function handleCancel() {
  isOpen.value = false
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    // You might want to show a success message here
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  // Track share analytics
  if (sharedReport.value) {
    reportHostingService.trackReportShare(sharedReport.value.id, 'link')
  }
}

function shareViaEmail() {
  if (!sharedReport.value) return

  const subject = encodeURIComponent(`Check out this deal analysis: ${reportTitle.value}`)
  const body = encodeURIComponent(`Hi,\n\nI wanted to share this deal analysis with you:\n\n${reportTitle.value}\n\n${sharedReport.value.publicUrl}\n\nBest regards`)
  
  window.open(`mailto:?subject=${subject}&body=${body}`)
  
  // Track share analytics
  reportHostingService.trackReportShare(sharedReport.value.id, 'email')
}

function shareOnLinkedIn() {
  if (!sharedReport.value) return

  const url = encodeURIComponent(sharedReport.value.publicUrl)
  const title = encodeURIComponent(reportTitle.value)
  const summary = encodeURIComponent(`Just completed a comprehensive ${props.calculationType} analysis. Check out the numbers!`)
  
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank')
  
  // Track share analytics
  reportHostingService.trackReportShare(sharedReport.value.id, 'social')
}

function openReport() {
  if (!sharedReport.value) return
  window.open(sharedReport.value.publicUrl, '_blank')
}

function handleLogoUpload() {
  if (!logoFile.value?.[0]) return

  const file = logoFile.value[0]
  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    console.error('Logo file is too large. Please select a file under 2MB.')
    logoFile.value = null
    return
  }

  // eslint-disable-next-line no-undef
  const reader = new FileReader()
  reader.onload = (e) => {
    branding.value.logo = e.target.result
  }
  reader.readAsDataURL(file)
}

function exportToPDF() {
  // This would integrate with a PDF generation service
  console.log('Exporting to PDF (free version with watermark)...')
  showBasicExport.value = false
  handleCancel()
}

function exportToImage() {
  // This would generate a shareable image
  console.log('Exporting to image...')
  showBasicExport.value = false
  handleCancel()
}
</script>

<style scoped>
.v-expansion-panel-text {
  padding-top: 16px;
}

.v-progress-linear {
  border-radius: 2px;
}
</style>
