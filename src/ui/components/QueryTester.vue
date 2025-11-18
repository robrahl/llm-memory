<template>
  <div>
    <h2 class="h4 mb-4 fw-bold">
      <span>🔍</span> Query Tester
    </h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="mb-4">
          <label class="form-label fw-bold">Enter Your Query</label>
          <textarea
            v-model="queryText"
            rows="3"
            placeholder="e.g., What are naming conventions?"
            class="form-control form-control-lg"
          ></textarea>
        </div>
        
        <div class="mb-4">
          <label class="form-label fw-bold">Top K Results</label>
          <input
            v-model.number="topK"
            type="number"
            min="1"
            max="10"
            class="form-control form-control-sm"
            style="max-width: 150px"
          />
        </div>
        
        <button
          @click="submitQuery"
          :disabled="!queryText.trim() || loading"
          class="btn btn-primary w-100 mb-4"
        >
          <span>{{ loading ? '⏳' : '⚡' }}</span>
          {{ loading ? 'Querying...' : 'Execute Query' }}
        </button>
        
        <div v-if="result" class="mt-4 pt-4 border-top">
          <h6 class="fw-bold mb-3">📋 Answer:</h6>
          <p class="mb-3">{{ result.answer }}</p>
          <small class="text-secondary">
            ⚡ Latency: <code>{{ result.latency_ms }}ms</code> | 📚 Sources: <code>{{ result.sources.length }}</code>
          </small>
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
const result = ref<(QueryResult & { query: string }) | null>(null);

const loading = computed(() => store.loading);

const submitQuery = async () => {
  if (!queryText.value.trim()) return;

  const res = await store.queryAgent(queryText.value, topK.value);
  if (res) {
    result.value = {
      ...res,
      query: queryText.value,
    };
  }
};
</script>
