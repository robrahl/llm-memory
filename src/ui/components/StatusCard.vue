<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <p class="text-sm text-gray-600 mt-1">{{ description }}</p>
      </div>
      <div class="ml-4">
        <span
          :class="statusClasses"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
        >
          <span class="mr-2">{{ statusIcon }}</span>
          {{ status }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  description: string;
  status: string;
}

const props = defineProps<Props>();

const statusClasses = computed(() => {
  const status = props.status.toLowerCase();
  if (status === 'ok' || status === 'connected' || status === 'reachable') {
    return 'bg-green-100 text-green-800';
  } else if (status === 'degraded') {
    return 'bg-yellow-100 text-yellow-800';
  } else {
    return 'bg-red-100 text-red-800';
  }
});

const statusIcon = computed(() => {
  const status = props.status.toLowerCase();
  if (status === 'ok' || status === 'connected' || status === 'reachable') {
    return '✅';
  } else if (status === 'degraded') {
    return '⚠️';
  } else {
    return '❌';
  }
});
</script>
