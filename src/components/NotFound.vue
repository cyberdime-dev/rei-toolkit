<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Oops! The page you're looking for doesn't exist.</p>
    <router-link
      to="/"
      class="home-button"
    >
      Back to Home
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #1e293b;
  color: #f1f5f9;
  text-align: center;
  padding: 1rem;
}

h1 {
  font-size: 10rem;
  margin: 0;
  color: #38bdf8;
}

p {
  font-size: 1.5rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.home-button {
  padding: 0.75rem 1.5rem;
  background-color: #38bdf8;
  color: #0f172a;
  text-decoration: none;
  font-weight: bold;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.home-button:hover {
  background-color: #0ea5e9;
}
</style>
