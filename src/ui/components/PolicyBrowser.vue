<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">Policy Browser</h2>
      <button
        @click="refreshPolicies"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <SearchBar v-model="searchQuery" />

    <div v-if="loading && policies.length === 0" class="text-center py-8">
      <p class="text-gray-600">Loading policies...</p>
    </div>

    <div v-else-if="filteredPolicies.length === 0" class="text-center py-8">
      <p class="text-gray-600">No policies found.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="policy in filteredPolicies"
        :key="policy.key"
        class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="togglePolicy(policy.key)"
      >
        <div class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ policy.key }}</h3>
              <p v-if="policy.description" class="text-sm text-gray-600 mt-1">
                {{ policy.description }}
              </p>
            </div>
            <button
              class="ml-4 text-gray-400 hover:text-gray-600"
              @click.stop="togglePolicy(policy.key)"
            >
              {{ expandedPolicies.has(policy.key) ? '▼' : '▶' }}
            </button>
          </div>

          <div v-if="expandedPolicies.has(policy.key)" class="mt-4 pt-4 border-t border-gray-200">
            <div class="space-y-2">
              <div>
                <p class="text-sm font-medium text-gray-700">Value:</p>
                <pre class="mt-1 p-3 bg-gray-50 rounded text-sm overflow-x-auto">{{ formatValue(policy.value) }}</pre>
              </div>
              <div v-if="policy.updated_at" class="flex items-center text-sm text-gray-500">
                <span>Last updated: {{ new Date(policy.updated_at).toLocaleString() }}</span>
              </div>
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

const refreshPolicies = async () => {
  await store.fetchPolicies();
};

onMounted(() => {
  refreshPolicies();
});
</script>
