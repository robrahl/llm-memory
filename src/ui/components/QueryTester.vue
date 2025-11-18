<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">Query Tester</h2>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="space-y-4">
        <div>
          <label for="query-input" class="block text-sm font-medium text-gray-700 mb-2">
            Enter your query
          </label>
          <textarea
            id="query-input"
            v-model="queryText"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., What is the naming convention for classes?"
          ></textarea>
        </div>

        <div>
          <label for="topk-input" class="block text-sm font-medium text-gray-700 mb-2">
            Top K Results
          </label>
          <input
            id="topk-input"
            v-model.number="topK"
            type="number"
            min="1"
            max="10"
            class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          @click="submitQuery"
          :disabled="!queryText.trim() || loading"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ loading ? 'Querying...' : 'Submit Query' }}
        </button>
      </div>
    </div>

    <div v-if="results.length > 0" class="space-y-4">
      <h3 class="text-xl font-semibold text-gray-900">Results</h3>
      
      <div
        v-for="(result, index) in results"
        :key="index"
        class="bg-white rounded-lg shadow p-6 space-y-4"
      >
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <span class="text-sm font-medium text-gray-500">
            Query: {{ result.query }}
          </span>
          <span class="text-sm text-gray-500">
            {{ result.latency_ms }}ms
          </span>
        </div>

        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Answer:</h4>
          <p class="text-gray-900 whitespace-pre-wrap">{{ result.answer }}</p>
        </div>

        <div v-if="result.sources.length > 0">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Sources:</h4>
          <div class="space-y-2">
            <div
              v-for="(source, sIndex) in result.sources"
              :key="sIndex"
              class="p-3 bg-gray-50 rounded"
            >
              <p class="text-sm font-medium text-gray-900">{{ source.key }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ source.excerpt }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../stores/app';
import type { QueryResult } from '../stores/app';

const store = useAppStore();
const queryText = ref('');
const topK = ref(3);
const results = ref<Array<QueryResult & { query: string }>>([]);

const loading = computed(() => store.loading);

const submitQuery = async () => {
  if (!queryText.value.trim()) return;

  const result = await store.queryAgent(queryText.value, topK.value);
  if (result) {
    results.value.unshift({
      ...result,
      query: queryText.value,
    });
    // Keep only the last 5 results
    if (results.value.length > 5) {
      results.value = results.value.slice(0, 5);
    }
  }
};
</script>
