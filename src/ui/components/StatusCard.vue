<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body">
      <h5 class="card-title d-flex align-items-center gap-2">
        <span style="font-size: 1.5rem">{{ statusIcon }}</span>
        <span>{{ title }}</span>
      </h5>
      <p class="card-text small text-secondary mb-3">{{ description }}</p>
      <h6 class="mb-0" :class="statusClass">{{ status }}</h6>
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

const statusClass = computed(() => {
  const status = props.status.toLowerCase();
  if (status === 'ok' || status === 'connected' || status === 'reachable') {
    return 'text-success fw-bold';
  } else if (status === 'degraded') {
    return 'text-warning fw-bold';
  } else {
    return 'text-danger fw-bold';
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
