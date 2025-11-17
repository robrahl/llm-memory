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

export const useAppStore = defineStore('app', () => {
  const health = ref<HealthStatus | null>(null);
  const policies = ref<Policy[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  return {
    health,
    policies,
    loading,
    error,
    fetchHealth,
    fetchPolicies,
    createPolicy,
    queryAgent,
  };
});
