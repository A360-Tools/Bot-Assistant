<template>
  <div class="tab-panel">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setActiveTab(tab.id)"
        :class="[
          'tab-button',
          activeTab === tab.id ? 'active' : ''
        ]"
      >
        <component :is="tab.icon" class="tab-icon" :size="16" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
    
    <div class="tab-content">
      <div class="tab-pane">
        <slot :name="activeTab" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Component } from 'vue';

interface Tab {
  id: string;
  label: string;
  icon: Component;
}

interface Props {
  tabs: Tab[];
  defaultTab?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'tab-change': [tabId: string]
}>();

const activeTab = ref(props.defaultTab || props.tabs[0]?.id || '');

// Emit tab change event
const setActiveTab = (tabId: string) => {
  activeTab.value = tabId;
  emit('tab-change', tabId);
};
</script>

<style scoped>
.tab-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-header {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.375rem;
  gap: 0.25rem;
  overflow: hidden;
  min-height: 52px;
  max-height: 52px;
  flex-shrink: 0;
  position: relative;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.813rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0;
  justify-content: center;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tab-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tab-button:hover {
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.tab-button.active {
  color: white;
  background: transparent;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.tab-button.active::before {
  opacity: 1;
}

.tab-button.active .tab-icon,
.tab-button.active .tab-label {
  position: relative;
  z-index: 1;
}

.tab-icon {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.tab-button:hover .tab-icon {
  transform: scale(1.1);
}

.tab-button.active .tab-icon {
  transform: scale(1);
}

.tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
  position: relative;
  min-height: 0;
}

.tab-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.tab-pane {
  height: 100%;
  position: relative;
}

/* Responsive breakpoints */
@media (max-width: 360px) {
  .tab-header {
    padding: 0.25rem;
    min-height: 48px;
    max-height: 48px;
  }
  
  .tab-button {
    padding: 0.375rem 0.5rem;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
  
  .tab-icon {
    width: 14px;
    height: 14px;
  }
  
  .tab-label {
    display: none;
  }
}

@media (min-width: 361px) and (max-width: 420px) {
  .tab-button {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
  }
  
  .tab-label {
    max-width: 55px;
  }
}

@media (min-width: 421px) and (max-width: 500px) {
  .tab-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.813rem;
  }
  
  .tab-label {
    max-width: 75px;
  }
}
</style>