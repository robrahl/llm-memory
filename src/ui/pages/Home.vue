<template>
  <!-- Navigation Tabs in Navbar style -->
  <ul class="navbar-nav me-auto" style="border-bottom: 2px solid #e9ecef; margin: -0.5rem 0 0.5rem 0">
    <li class="nav-item" role="presentation" v-for="tab in tabs" :key="tab.id">
      <button
        :class="['nav-link', { active: activeTab === tab.id }]"
        :id="`${tab.id}-tab`"
        @click="activeTab = tab.id"
        type="button"
        role="tab"
        style="padding: 0.75rem 1rem; font-size: 0.95rem"
      >
        <span style="margin-right: 0.5rem">{{ tab.icon }}</span>
        {{ tab.name }}
      </button>
    </li>
  </ul>
  
  <!-- Tab Content - rendered in main below navbar -->
  <template v-if="activeTab === 'dashboard'">
    <Dashboard />
  </template>
  <template v-else-if="activeTab === 'policies'">
    <PolicyBrowser />
  </template>
  <template v-else-if="activeTab === 'query'">
    <QueryTester />
  </template>
  <template v-else-if="activeTab === 'search'">
    <SearchTester />
  </template>
  <template v-else-if="activeTab === 'add'">
    <PolicyForm />
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from '../components/Dashboard.vue';
import PolicyBrowser from '../components/PolicyBrowser.vue';
import QueryTester from '../components/QueryTester.vue';
import SearchTester from '../components/SearchTester.vue';
import PolicyForm from '../components/PolicyForm.vue';

const activeTab = ref('dashboard');

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'policies', name: 'Policy Browser', icon: '📚' },
  { id: 'query', name: 'Query Tester', icon: '🔍' },
  { id: 'search', name: 'Search Tester', icon: '🔎' },
  { id: 'add', name: 'Add Policy', icon: '➕' },
];
</script>
