<template>
  <div>
    <h2 class="h4 mb-4 fw-bold">
      <span>🔎</span> Search Tester
    </h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="mb-4">
          <label class="form-label fw-bold">Search Query</label>
          <textarea
            v-model="searchQuery"
            rows="3"
            placeholder="e.g., Docker deployment, architecture patterns, authentication..."
            class="form-control form-control-lg"
          ></textarea>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">Top K Results</label>
            <input
              v-model.number="topK"
              type="number"
              min="1"
              max="20"
              class="form-control form-control-sm"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Search Type</label>
            <div class="form-check form-switch mt-2">
              <input
                v-model="useSemanticSearch"
                class="form-check-input"
                type="checkbox"
                id="semanticSearchToggle"
              />
              <label class="form-check-label" for="semanticSearchToggle">
                {{ useSemanticSearch ? 'Semantic Search' : 'Text Search' }}
              </label>
            </div>
          </div>
        </div>
        
        <button
          @click="executeSearch"
          :disabled="!searchQuery.trim() || loading"
          class="btn btn-primary w-100 mb-4"
        >
          <span>{{ loading ? '⏳' : '🚀' }}</span>
          {{ loading ? 'Searching...' : 'Search Documents' }}
        </button>
        
        <div v-if="error" class="alert alert-danger" role="alert">
          <strong>Error:</strong> {{ error }}
        </div>
        
        <div v-if="result" class="mt-4 pt-4 border-top">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0">📚 Results ({{ result.count }})</h6>
            <small class="text-secondary">
              <span class="badge bg-secondary me-2">{{ result.search_type }}</span>
              ⚡ {{ result.latency_ms }}ms
            </small>
          </div>
          
          <div v-if="result.results.length === 0" class="text-center text-secondary py-4">
            <p>No documents found matching your query.</p>
          </div>
          
          <div
            v-for="(doc, index) in result.results"
            :key="doc.id"
            class="card mb-3 border"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="card-title mb-0 fw-bold">
                  {{ doc.metadata?.title || doc.doc_key || 'Untitled Document' }}
                </h6>
                <span
                  v-if="doc.similarity !== null"
                  class="badge"
                  :class="getSimilarityBadgeClass(doc.similarity)"
                >
                  {{ (doc.similarity * 100).toFixed(1) }}% match
                </span>
              </div>
              
              <div v-if="doc.doc_key" class="mb-2">
                <small class="text-secondary">
                  <code>{{ doc.doc_key }}</code>
                </small>
              </div>
              
              <p class="card-text mb-2">
                {{ truncateContent(doc.content, 300) }}
              </p>
              
              <div v-if="doc.metadata" class="mt-2">
                <small class="text-secondary">
                  <strong>Metadata:</strong>
                  <span v-for="(value, key) in doc.metadata" :key="key" class="ms-2">
                    <code>{{ key }}: {{ formatMetadataValue(value) }}</code>
                  </span>
                </small>
              </div>
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

const store = useAppStore();
const searchQuery = ref('');
const topK = ref(5);
const useSemanticSearch = ref(true);
const result = ref<any | null>(null);
const error = ref<string | null>(null);

const loading = computed(() => store.loading);

const executeSearch = async () => {
  if (!searchQuery.value.trim()) return;
  
  error.value = null;
  result.value = null;
  
  const res = await store.searchDocuments(
    searchQuery.value,
    topK.value,
    useSemanticSearch.value
  );
  
  if (res) {
    result.value = res;
  } else {
    error.value = store.error || 'Search failed';
  }
};

const truncateContent = (content: string, maxLength: number): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const getSimilarityBadgeClass = (similarity: number): string => {
  if (similarity >= 0.8) return 'bg-success';
  if (similarity >= 0.6) return 'bg-primary';
  if (similarity >= 0.4) return 'bg-warning';
  return 'bg-secondary';
};

const formatMetadataValue = (value: any): string => {
  if (typeof value === 'string') {
    return value.length > 50 ? value.substring(0, 50) + '...' : value;
  }
  return JSON.stringify(value);
};
</script>
