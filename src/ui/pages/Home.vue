<template>
  <div class="space-y-8">
    <!-- Navigation Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div>
      <Dashboard v-if="activeTab === 'dashboard'" />
      <PolicyBrowser v-else-if="activeTab === 'policies'" />
      <QueryTester v-else-if="activeTab === 'query'" />
      <PolicyForm v-else-if="activeTab === 'add'" />
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
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'policies', name: 'Policy Browser' },
  { id: 'query', name: 'Query Tester' },
  { id: 'add', name: 'Add Policy' },
];
</script>
