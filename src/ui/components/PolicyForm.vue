<template>
  <div>
    <h2 class="h4 mb-4 fw-bold">
      <span>➕</span> Add New Policy
    </h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label class="form-label fw-bold">Policy Key <span class="text-danger">*</span></label>
            <input
              v-model="formData.key"
              type="text"
              required
              placeholder="e.g., naming-convention"
              class="form-control"
            />
            <small class="form-text text-secondary">Use kebab-case</small>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Description</label>
            <textarea
              v-model="formData.description"
              rows="2"
              placeholder="Brief description of this policy..."
              class="form-control"
            ></textarea>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Policy Value (JSON) <span class="text-danger">*</span></label>
            <textarea
              v-model="formData.value"
              rows="8"
              required
              placeholder='{\n  "rule": "value",\n  "details": "..."\n}'
              class="form-control font-monospace"
              style="font-size: 0.875rem"
            ></textarea>
          </div>

          <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
            <span>❌ {{ error }}</span>
            <button type="button" class="btn-close" @click="error = ''"></button>
          </div>

          <div v-if="success" class="alert alert-success alert-dismissible fade show" role="alert">
            <span>✅ Policy created successfully!</span>
            <button type="button" class="btn-close" @click="success = false"></button>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" :disabled="loading" class="btn btn-primary flex-grow-1">
              <span>{{ loading ? '⏳' : '💾' }}</span>
              {{ loading ? 'Saving...' : 'Add Policy' }}
            </button>
            <button type="button" @click="resetForm" class="btn btn-outline-secondary">
              Clear
            </button>
          </div>
        </form>
      </div>
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
