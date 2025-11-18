<template>
  <div>
    <!-- Navigation Tabs with Bootstrap -->
    <ul class="nav nav-tabs mb-4 border-bottom" role="tablist">
      <li class="nav-item" role="presentation" v-for="tab in tabs" :key="tab.id">
        <button
          :class="['nav-link', { active: activeTab === tab.id }]"
          :id="`${tab.id}-tab`"
          @click="activeTab = tab.id"
          type="button"
          role="tab"
        >
          <span style="margin-right: 0.5rem">{{ tab.icon }}</span>
          {{ tab.name }}
        </button>
      </li>
    </ul>
    
    <!-- Tab Content -->
    <div class="tab-content">
      <div v-if="activeTab === 'dashboard'" class="tab-pane fade show active">
        <Dashboard />
      </div>
      <div v-if="activeTab === 'policies'" class="tab-pane fade show active">
        <PolicyBrowser />
      </div>
      <div v-if="activeTab === 'query'" class="tab-pane fade show active">
        <QueryTester />
      </div>
      <div v-if="activeTab === 'add'" class="tab-pane fade show active">
        <PolicyForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from '../components/Dashboard.vue';
import PolicyBrowser from '../components/PolicyBrowser.vue';
import QueryTester from '../components/QueryTester.vue';
import PolicyForm from '../components/PolicyForm.vue';

const activeTab = ref('dashboard');

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'policies', name: 'Policy Browser', icon: '📚' },
  { id: 'query', name: 'Query Tester', icon: '🔍' },
  { id: 'add', name: 'Add Policy', icon: '➕' },
];
</script>
