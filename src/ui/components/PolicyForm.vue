<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">Add/Edit Policy</h2>
    
    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="policy-key" class="block text-sm font-medium text-gray-700 mb-2">
            Policy Key <span class="text-red-500">*</span>
          </label>
          <input
            id="policy-key"
            v-model="formData.key"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., naming-conventions"
          />
          <p class="text-sm text-gray-500 mt-1">Use kebab-case for policy keys</p>
        </div>

        <div>
          <label for="policy-description" class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="policy-description"
            v-model="formData.description"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of what this policy defines"
          ></textarea>
        </div>

        <div>
          <label for="policy-value" class="block text-sm font-medium text-gray-700 mb-2">
            Value <span class="text-red-500">*</span>
          </label>
          <textarea
            id="policy-value"
            v-model="formData.value"
            rows="8"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter the policy value (text or JSON)"
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">
            Can be plain text or JSON. If JSON, it will be validated.
          </p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-800">Policy created successfully!</p>
        </div>

        <div class="flex space-x-3">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ loading ? 'Saving...' : 'Save Policy' }}
          </button>
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
const formData = ref({
  key: '',
  description: '',
  value: '',
});
const error = ref('');
const success = ref(false);

const loading = computed(() => store.loading);

const resetForm = () => {
  formData.value = {
    key: '',
    description: '',
    value: '',
  };
  error.value = '';
  success.value = false;
};

const handleSubmit = async () => {
  error.value = '';
  success.value = false;

  // Validate key format
  if (!/^[a-z0-9-]+$/.test(formData.value.key)) {
    error.value = 'Policy key must use lowercase letters, numbers, and hyphens only';
    return;
  }

  // Try to parse value as JSON, fallback to string
  let valueToSend: any = formData.value.value;
  try {
    valueToSend = JSON.parse(formData.value.value);
  } catch {
    // Value is not JSON, use as string
  }

  const result = await store.createPolicy({
    key: formData.value.key,
    value: valueToSend,
    description: formData.value.description || undefined,
  });

  if (result) {
    success.value = true;
    // Reset form after 2 seconds
    setTimeout(() => {
      resetForm();
    }, 2000);
  } else {
    error.value = store.error || 'Failed to create policy';
  }
};
</script>
