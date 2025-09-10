<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>News & Updates</h1>
        <v-card>
          <v-list>
            <v-list-item v-for="article in articles" :key="article.id">
              <v-list-item-title>{{ article.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ article.date }}</v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-open-in-new"
                  variant="text"
                  @click="readArticle(article)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-pagination v-model="page" :length="totalPages" class="mt-4" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'NewsList',
  data() {
    return {
      articles: [],
      page: 1,
      totalPages: 1,
    }
  },
  methods: {
    readArticle(selectedArticle) {
      console.log('Opening article:', selectedArticle)
      // To be implemented
    },
  },
}
</script>
