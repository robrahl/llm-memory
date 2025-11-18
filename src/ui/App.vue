<template>
  <div class="d-flex flex-column" :class="[appStore.theme === 'dark' ? 'dark-theme' : 'light-theme']" style="min-height: 100vh">
    <!-- Navigation Bar (Dream Gallery style) -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm py-3">
      <div class="container-lg">
        <RouterLink to="/dashboard" class="navbar-brand fw-bold fs-6 d-flex align-items-center gap-2" style="text-decoration: none">
          <span style="font-size: 1.5rem">🧠</span>
          <span>llm-memory</span>
        </RouterLink>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto gap-1">
            <li class="nav-item" v-for="link in navLinks" :key="link.path">
              <RouterLink 
                :to="link.path" 
                class="nav-link d-flex align-items-center gap-2"
                :class="{ active: isActive(link.path) }"
                style="padding: 0.5rem 1rem; font-size: 0.95rem"
              >
                <span>{{ link.icon }}</span>
                <span>{{ link.title }}</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <button 
                @click="appStore.toggleTheme()" 
                class="btn btn-sm btn-outline-light d-flex align-items-center gap-2"
                style="margin-left: 0.5rem; border: 1px solid rgba(255,255,255,0.3); padding: 0.5rem 1rem; font-size: 0.95rem"
                :title="appStore.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              >
                <span>{{ appStore.theme === 'dark' ? '☀️' : '🌙' }}</span>
                <span class="d-none d-lg-inline">{{ appStore.theme === 'dark' ? 'Light' : 'Dark' }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow-1 py-5">
      <div class="container-lg">
        <RouterView />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-top mt-auto py-3" style="border-color: #333">
      <div class="container-lg">
        <p class="mb-0 text-center small">
          llm-memory v1.1 • Powered by Vue 3 + Bootstrap 5
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { useAppStore } from './stores/app';

const appStore = useAppStore();
const route = useRoute();

const navLinks = [
  { path: '/dashboard', title: 'Dashboard', icon: '📊' },
  { path: '/policies', title: 'Policy Browser', icon: '📚' },
  { path: '/query', title: 'Query Tester', icon: '🔍' },
  { path: '/add-policy', title: 'Add Policy', icon: '➕' },
];

const isActive = (path: string) => {
  return route.path === path;
};

onMounted(() => {
  appStore.initTheme();
});
</script>
