<template>
  <div>
    <h2 class="h4 mb-4 fw-bold">
      <span>📚</span> Browse Policies
    </h2>
    <SearchBar v-model="searchQuery" />
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-secondary">⏳ Loading policies...</p>
    </div>
    
    <div v-else-if="filteredPolicies.length === 0" class="text-center py-5">
      <p class="text-secondary">📭 No policies found</p>
    </div>
    
    <div v-else class="row g-3" style="max-height: 500px; overflow-y: auto">
      <div class="col-md-6" v-for="policy in filteredPolicies" :key="policy.key">
        <div class="card h-100 border-0 shadow-sm" @click="togglePolicy(policy.key)" style="cursor: pointer">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title mb-0 text-primary">{{ policy.key }}</h5>
              <span class="text-muted">{{ expandedPolicies.has(policy.key) ? '▼' : '▶' }}</span>
            </div>
            <p class="card-text small text-secondary">{{ policy.description }}</p>
            <code class="bg-light p-2 d-block rounded small font-monospace">{{ truncate(formatValue(policy.value)) }}</code>
            <small class="text-muted d-block mt-2">🕐 {{ new Date(policy.updated_at).toLocaleString() }}</small>
            
            <div v-if="expandedPolicies.has(policy.key)" class="mt-3 pt-3 border-top">
              <pre class="bg-light p-3 rounded small font-monospace" style="overflow-x: auto; max-height: 300px">{{ formatValue(policy.value) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAppStore } from '../stores/app';
import SearchBar from './SearchBar.vue';

const store = useAppStore();
const searchQuery = ref('');
const expandedPolicies = ref(new Set<string>());

const policies = computed(() => store.policies);
const loading = computed(() => store.loading);

const filteredPolicies = computed(() => {
  if (!searchQuery.value) {
    return policies.value;
  }
  const query = searchQuery.value.toLowerCase();
  return policies.value.filter((policy) => {
    return (
      policy.key.toLowerCase().includes(query) ||
      (policy.description && policy.description.toLowerCase().includes(query)) ||
      JSON.stringify(policy.value).toLowerCase().includes(query)
    );
  });
});

const togglePolicy = (key: string) => {
  if (expandedPolicies.value.has(key)) {
    expandedPolicies.value.delete(key);
  } else {
    expandedPolicies.value.add(key);
  }
};

const formatValue = (value: any): string => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

const truncate = (str: string, len: number = 100): string => {
  return str.length > len ? str.substring(0, len) + '...' : str;
};

const refreshPolicies = async () => {
  await store.fetchPolicies();
};

onMounted(() => {
  refreshPolicies();
});
</script>
