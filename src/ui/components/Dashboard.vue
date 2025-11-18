<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Agent"
          description="Agent server status"
          :status="health?.status || 'unknown'"
        />
        <StatusCard
          title="PostgreSQL"
          description="Database connection"
          :status="health?.postgres || 'unknown'"
        />
        <StatusCard
          title="LLM Provider"
          description="Ollama/LLM availability"
          :status="health?.ollama || 'unknown'"
        />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Quick Stats</h3>
        <button
          @click="refreshHealth"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-600">Total Policies</p>
          <p class="text-2xl font-bold text-gray-900">{{ policyCount }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Last Checked</p>
          <p class="text-sm font-medium text-gray-900">{{ lastChecked }}</p>
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
