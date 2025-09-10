<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- Header -->
        <v-row class="align-center mb-4">
          <v-col>
            <h1 class="text-h4 font-weight-bold">
              Market Updates
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Stay informed with the latest real estate news and insights
            </p>
          </v-col>
          <v-col cols="auto">
            <v-btn
              :loading="isRefreshing"
              icon="mdi-refresh"
              variant="text"
              @click="refreshNews"
            />
          </v-col>
        </v-row>

        <!-- Quick Stats -->
        <v-row class="mb-4">
          <v-col
            cols="6"
            sm="3"
          >
            <v-card class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-primary">
                {{ summary.totalArticles }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Total Articles
              </div>
            </v-card>
          </v-col>
          <v-col
            cols="6"
            sm="3"
          >
            <v-card class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-success">
                {{ summary.recentArticles }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Last 24 Hours
              </div>
            </v-card>
          </v-col>
          <v-col
            cols="6"
            sm="3"
          >
            <v-card class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-warning">
                {{ summary.trendingCount }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Trending
              </div>
            </v-card>
          </v-col>
          <v-col
            cols="6"
            sm="3"
          >
            <v-card class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-info">
                {{ summary.featuredCount }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Featured
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Filters and Search -->
        <v-row class="mb-4">
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="searchQuery"
              placeholder="Search articles..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              placeholder="All Categories"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            >
              <template #prepend-item>
                <v-list-item
                  title="All Categories"
                  value=""
                  @click="selectedCategory = ''"
                />
                <v-divider />
              </template>
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon" />
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <!-- Featured Articles Section -->
        <div
          v-if="featuredArticles.length > 0 && !searchQuery && !selectedCategory"
          class="mb-6"
        >
          <h2 class="text-h5 font-weight-bold mb-3">
            Featured Stories
          </h2>
          <v-row>
            <v-col
              v-for="article in featuredArticles"
              :key="article.id"
              cols="12"
              md="6"
            >
              <v-card
                class="featured-card"
                @click="openArticle(article)"
              >
                <v-img
                  v-if="article.imageUrl"
                  :src="article.imageUrl"
                  height="200"
                  cover
                />
                <div
                  v-else
                  class="d-flex align-center justify-center bg-grey-lighten-3"
                  style="height: 200px;"
                >
                  <v-icon
                    :icon="getCategoryIcon(article.category)"
                    size="48"
                    color="grey"
                  />
                </div>
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-chip
                      :color="getCategoryColor(article.category)"
                      size="small"
                      class="me-2"
                    >
                      {{ getCategoryTitle(article.category) }}
                    </v-chip>
                    <v-chip
                      v-if="article.trending"
                      color="error"
                      size="small"
                      prepend-icon="mdi-trending-up"
                    >
                      Trending
                    </v-chip>
                  </div>
                  <h3 class="text-h6 font-weight-medium mb-2">
                    {{ article.title }}
                  </h3>
                  <p class="text-body-2 text-medium-emphasis mb-3">
                    {{ article.summary }}
                  </p>
                  <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
                    <span>{{ article.author }} • {{ article.timeAgo }}</span>
                    <span>{{ article.readTime }} min read</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Articles List -->
        <div>
          <h2
            v-if="!searchQuery && !selectedCategory"
            class="text-h5 font-weight-bold mb-3"
          >
            Latest News
          </h2>
          <h2
            v-else-if="selectedCategory"
            class="text-h5 font-weight-bold mb-3"
          >
            {{ getCategoryTitle(selectedCategory) }}
          </h2>
          <h2
            v-else
            class="text-h5 font-weight-bold mb-3"
          >
            Search Results
          </h2>

          <v-row v-if="paginatedArticles.length > 0">
            <v-col
              v-for="article in paginatedArticles"
              :key="article.id"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card
                height="100%"
                class="d-flex flex-column"
                @click="openArticle(article)"
              >
                <v-img
                  v-if="article.imageUrl"
                  :src="article.imageUrl"
                  height="150"
                  cover
                />
                <div
                  v-else
                  class="d-flex align-center justify-center bg-grey-lighten-3"
                  style="height: 150px;"
                >
                  <v-icon
                    :icon="getCategoryIcon(article.category)"
                    size="36"
                    color="grey"
                  />
                </div>
                
                <v-card-text class="flex-grow-1 d-flex flex-column">
                  <div class="d-flex align-center mb-2">
                    <v-chip
                      :color="getCategoryColor(article.category)"
                      size="small"
                      class="me-2"
                    >
                      {{ getCategoryTitle(article.category) }}
                    </v-chip>
                    <v-chip
                      v-if="article.trending"
                      color="error"
                      size="x-small"
                      prepend-icon="mdi-trending-up"
                    >
                      Hot
                    </v-chip>
                  </div>
                  
                  <h3 class="text-subtitle-1 font-weight-medium mb-2 line-clamp-2">
                    {{ article.title }}
                  </h3>
                  
                  <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1 line-clamp-3">
                    {{ article.summary }}
                  </p>
                  
                  <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
                    <span class="line-clamp-1">{{ article.author }}</span>
                    <span>{{ article.timeAgo }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Empty State -->
          <v-card
            v-else
            class="text-center pa-8"
          >
            <v-icon
              icon="mdi-newspaper-variant-outline"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 mb-2">
              No articles found
            </h3>
            <p class="text-medium-emphasis mb-4">
              {{ searchQuery ? 
                'Try adjusting your search terms or browse by category.' : 
                'No articles match your current filters.' }}
            </p>
            <v-btn
              v-if="searchQuery || selectedCategory"
              @click="clearFilters"
            >
              Clear Filters
            </v-btn>
          </v-card>

          <!-- Pagination -->
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            class="mt-6"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Article Detail Dialog -->
    <v-dialog
      v-model="showArticleDialog"
      max-width="800"
      scrollable
    >
      <v-card v-if="selectedArticle">
        <v-card-title class="d-flex align-center">
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showArticleDialog = false"
          />
          <v-spacer />
          <v-btn
            v-if="selectedArticle.url"
            :href="selectedArticle.url"
            target="_blank"
            icon="mdi-open-in-new"
            variant="text"
          />
        </v-card-title>

        <v-img
          v-if="selectedArticle.imageUrl"
          :src="selectedArticle.imageUrl"
          height="300"
          cover
        />

        <v-card-text>
          <div class="d-flex align-center mb-3">
            <v-chip
              :color="getCategoryColor(selectedArticle.category)"
              class="me-2"
            >
              {{ getCategoryTitle(selectedArticle.category) }}
            </v-chip>
            <v-chip
              v-if="selectedArticle.trending"
              color="error"
              prepend-icon="mdi-trending-up"
            >
              Trending
            </v-chip>
          </div>

          <h1 class="text-h4 font-weight-bold mb-3">
            {{ selectedArticle.title }}
          </h1>

          <div class="d-flex align-center text-medium-emphasis mb-4">
            <span>By {{ selectedArticle.author }}</span>
            <v-divider
              vertical
              class="mx-2"
            />
            <span>{{ selectedArticle.formattedDate }}</span>
            <v-divider
              vertical
              class="mx-2"
            />
            <span>{{ selectedArticle.readTime }} min read</span>
          </div>

          <div class="text-h6 font-weight-medium text-medium-emphasis mb-4">
            {{ selectedArticle.summary }}
          </div>

          <div
            class="article-content"
            v-text="formatContent(selectedArticle.content)"
          />

          <v-divider class="my-4" />

          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="tag in selectedArticle.tags"
              :key="tag"
              size="small"
              variant="outlined"
            >
              #{{ tag }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccessMessage"
      :timeout="3000"
      color="success"
    >
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import newsManager from '@/utils/newsManager.js'

// Reactive state
const articles = ref([])
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const articlesPerPage = 9
const isRefreshing = ref(false)
const showArticleDialog = ref(false)
const selectedArticle = ref(null)
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Computed properties
const summary = computed(() => newsManager.getSummary())

const categories = computed(() => newsManager.getCategories())

const categoryOptions = computed(() => 
  categories.value.map(cat => ({
    title: cat.title,
    value: cat.value,
    icon: cat.icon,
  })),
)

const filteredArticles = computed(() => {
  let filtered = articles.value

  // Search filter
  if (searchQuery.value) {
    filtered = newsManager.searchArticles(searchQuery.value)
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  return filtered
})

const featuredArticles = computed(() => {
  if (searchQuery.value || selectedCategory.value) return []
  return newsManager.getFeaturedArticles().slice(0, 2)
})

const totalPages = computed(() => 
  Math.ceil(filteredArticles.value.length / articlesPerPage),
)

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage
  const end = start + articlesPerPage
  return filteredArticles.value.slice(start, end)
})

// Methods
const loadArticles = () => {
  articles.value = newsManager.getAllArticles()
}

const refreshNews = async () => {
  isRefreshing.value = true
  try {
    await newsManager.refreshArticles()
    loadArticles()
    showSuccess('News updated successfully')
  } catch (error) {
    console.error('Error refreshing news:', error)
  } finally {
    isRefreshing.value = false
  }
}

const openArticle = (article) => {
  selectedArticle.value = article
  showArticleDialog.value = true
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
}

const getCategoryTitle = (categoryValue) => {
  const category = newsManager.getCategoryInfo(categoryValue)
  return category ? category.title : categoryValue
}

const getCategoryIcon = (categoryValue) => {
  const category = newsManager.getCategoryInfo(categoryValue)
  return category ? category.icon : 'mdi-newspaper'
}

const getCategoryColor = (categoryValue) => {
  const colorMap = {
    'market-update': 'primary',
    'interest-rates': 'success',
    'legislation': 'warning',
    'tips-strategies': 'info',
    'technology': 'purple',
    'local-news': 'teal',
  }
  return colorMap[categoryValue] || 'grey'
}

const formatContent = (content) => {
  // Simple content formatting - return plain text for security
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
}

const showSuccess = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
}

// Watch for filter changes to reset pagination
const resetPagination = () => {
  currentPage.value = 1
}

// Lifecycle
onMounted(() => {
  loadArticles()
})

// Watch searchQuery and selectedCategory to reset pagination
computed(() => [searchQuery.value, selectedCategory.value]).effect = resetPagination
</script>

<style scoped>
.featured-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.featured-card:hover {
  transform: translateY(-2px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-content {
  line-height: 1.8;
}

.article-content p {
  margin-bottom: 1rem;
}

.article-content strong {
  font-weight: 600;
}

.gap-2 {
  gap: 8px;
}
</style>
