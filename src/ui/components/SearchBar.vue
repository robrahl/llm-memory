<template>
  <div class="relative">
    <input
      v-model="searchQuery"
      @input="handleInput"
      type="text"
      placeholder="Search policies by key, description, or value..."
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <svg
      class="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  searchQuery.value = newVal;
});

const handleInput = () => {
  emit('update:modelValue', searchQuery.value);
};
</script>
