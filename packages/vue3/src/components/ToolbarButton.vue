<script setup lang="ts">
defineProps<{
  name?: string;
  title: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <button
    type="button"
    class="ue-toolbar-btn"
    :class="[name ? `ue-btn-${name}` : '', { 'is-active': active }]"
    :disabled="disabled"
    :title="title"
    :aria-label="title"
    :aria-pressed="active ? 'true' : 'false'"
    @click="$emit('click', $event)"
    v-html="icon"
  />
</template>
