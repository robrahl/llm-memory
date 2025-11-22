import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export interface HealthStatus {
  status: string;
  postgres: string;
  ollama: string;
}

export interface Policy {
  key: string;
  description: string;
  value: any;
  created_at?: string;
  updated_at?: string;
}

export interface QueryResult {
  answer: string;
  sources: { key: string; excerpt: string }[];
  latency_ms: number;
}

export interface SearchResult {
  id: string;
  doc_key: string;
  content: string;
  metadata: any;
  similarity: number | null;
  source: 'semantic' | 'text';
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  search_type: string;
  latency_ms: number;
}

export const useAppStore = defineStore('app', () => {
  const health = ref<HealthStatus | null>(null);
  const policies = ref<Policy[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const theme = ref<'light' | 'dark'>('dark');

  async function fetchHealth() {
    try {
      const response = await axios.get<HealthStatus>('/health');
      health.value = response.data;
      error.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch health status';
      console.error('Health check failed:', err);
    }
  }

  async function fetchPolicies() {
    loading.value = true;
    try {
      const response = await axios.get<Policy[]>('/policies');
      policies.value = response.data;
      error.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch policies';
      console.error('Fetch policies failed:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createPolicy(policy: { key: string; value: any; description?: string }) {
    loading.value = true;
    try {
      await axios.post('/policy', policy);
      await fetchPolicies(); // Refresh the list
      error.value = null;
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to create policy';
      console.error('Create policy failed:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function queryAgent(query: string, topK = 3): Promise<QueryResult | null> {
    loading.value = true;
    try {
      const response = await axios.post<QueryResult>('/query', { query, topK });
      error.value = null;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to query agent';
      console.error('Query failed:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function searchDocuments(query: string, topK = 5, useSemanticSearch = true): Promise<SearchResponse | null> {
    loading.value = true;
    try {
      const response = await axios.post<SearchResponse>('/search', { 
        query, 
        topK, 
        useSemanticSearch 
      });
      error.value = null;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to search documents';
      console.error('Search failed:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    theme.value = savedTheme || 'dark';
    applyTheme(theme.value);
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    applyTheme(theme.value);
    localStorage.setItem('theme', theme.value);
  }

  function applyTheme(themeMode: 'light' | 'dark') {
    const htmlElement = document.documentElement;
    if (themeMode === 'dark') {
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.setAttribute('data-theme', 'light');
    }
  }

  return {
    health,
    policies,
    loading,
    error,
    theme,
    fetchHealth,
    fetchPolicies,
    createPolicy,
    queryAgent,
    searchDocuments,
    initTheme,
    toggleTheme,
  };
});
