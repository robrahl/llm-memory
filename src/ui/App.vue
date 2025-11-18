<template>
  <div class="d-flex flex-column" style="min-height: 100vh; background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)">
    <!-- Bootstrap Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
      <div class="container-lg">
        <a class="navbar-brand fw-bold fs-5" href="#" style="letter-spacing: 0.5px">
          <span style="font-size: 1.8rem; margin-right: 0.5rem">🧠</span>llm-memory
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="#dashboard">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#policies">Policies</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#query">Query Tester</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="bg-primary text-white py-4 border-bottom">
      <div class="container-lg">
        <h2 class="mb-0 fs-5 fw-light">
          Architectural Policy Control Panel • Real-time Management & Query Engine
        </h2>
      </div>
    </section>

    <!-- Main Content -->
    <main class="flex-grow-1 py-5">
      <div class="container-lg">
        <Home />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-top bg-white mt-5 py-4">
      <div class="container-lg">
        <p class="mb-0 text-center text-secondary small">
          llm-memory v1.1 • Powered by Vue 3 + Bootstrap 5
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Home from './pages/Home.vue';
</script>
