<template>
  <div class="row">
    <!-- System Status Section -->
    <div class="col-12 mb-4">
      <h2 class="h4 mb-4 fw-bold">
        <span>🔧</span> System Status
      </h2>
      <div class="row g-3">
        <div class="col-lg-4">
          <StatusCard
            title="Agent Server"
            description="Agent status"
            :status="health?.status || 'unknown'"
          />
        </div>
        <div class="col-lg-4">
          <StatusCard
            title="PostgreSQL"
            description="Database connection"
            :status="health?.postgres || 'unknown'"
          />
        </div>
        <div class="col-lg-4">
          <StatusCard
            title="LLM Provider"
            description="Ollama availability"
            :status="health?.ollama || 'unknown'"
          />
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title m-0">
              <span>📈</span> Quick Stats
            </h5>
            <button
              @click="refreshHealth"
              class="btn btn-sm btn-primary"
            >
              <span>🔄</span> Refresh
            </button>
          </div>
          <div class="row">
            <div class="col-lg-6">
              <div class="bg-light p-3 rounded border-start border-primary border-4">
                <small class="text-secondary d-block mb-1">Total Policies</small>
                <h2 class="h3 m-0 text-primary fw-bold">{{ policyCount }}</h2>
              </div>
            </div>
            <div class="col-lg-6 mt-3 mt-lg-0">
              <div class="bg-light p-3 rounded border-start border-info border-4">
                <small class="text-secondary d-block mb-1">Last Checked</small>
                <h2 class="h5 m-0 text-info font-monospace">{{ lastChecked }}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAppStore } from '../stores/app';
import StatusCard from './StatusCard.vue';

const store = useAppStore();
const lastChecked = ref('Never');
let intervalId: number | null = null;

const health = computed(() => store.health);
const policyCount = computed(() => store.policies.length);

const refreshHealth = async () => {
  await store.fetchHealth();
  lastChecked.value = new Date().toLocaleTimeString();
};

onMounted(() => {
  refreshHealth();
  // Refresh health every 30 seconds
  intervalId = window.setInterval(refreshHealth, 30000);
});

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>
