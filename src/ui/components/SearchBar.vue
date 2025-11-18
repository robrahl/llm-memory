<template>
  <div class="mb-4">
    <input
      v-model="searchQuery"
      @input="handleInput"
      type="text"
      placeholder="🔍 Search policies..."
      class="form-control form-control-lg"
    />
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
