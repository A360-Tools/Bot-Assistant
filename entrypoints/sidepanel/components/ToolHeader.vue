<template>
  <div class="tool-header">
    <button v-if="showBack" @click="handleBack" class="back-btn" :title="backTitle">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    
    <h2 class="title">{{ title }}</h2>
    
    <div class="header-actions">
      <slot name="actions"></slot>
      
      <button v-if="showRefresh" @click="$emit('refresh')" class="refresh-btn" :disabled="refreshing" :title="refreshTitle">
        <svg v-if="!refreshing" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <svg v-else class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  showBack?: boolean
  backTitle?: string
  showRefresh?: boolean
  refreshing?: boolean
  refreshTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
  backTitle: 'Back',
  showRefresh: false,
  refreshing: false,
  refreshTitle: 'Refresh'
})

const emit = defineEmits<{
  refresh: []
  back: []
}>()

const handleBack = () => {
  emit('back')
}
</script>

<style scoped>
.tool-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.back-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--border-hover, #d1d5db);
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--border-hover, #d1d5db);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>