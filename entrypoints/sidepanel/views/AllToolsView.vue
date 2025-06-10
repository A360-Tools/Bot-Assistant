<template>
  <div class="all-tools-view">
    <ToolHeader 
      title="All Tools" 
      :show-back="false"
      :show-refresh="false"
    />
    
    <div class="content">
      <div class="info-message">
        <Info :size="16" />
        <p>Available tools activate automatically based on the current page</p>
      </div>
    
    <div class="tools-categories">
      <div v-for="category in allCategories" :key="category.type" class="category">
        <div class="category-header">
          <component :is="getCategoryIcon(category.icon)" :size="20" />
          <h3>{{ category.name }}</h3>
        </div>
        
        <div class="category-tools">
          <div
            v-for="tool in category.tools"
            :key="tool.id"
            class="tool-card-readonly"
          >
            <div class="tool-icon">
              <component :is="getToolIcon(tool.icon)" :size="24" />
            </div>
            <div class="tool-content">
              <h3 class="tool-name">{{ tool.name }}</h3>
              <p class="tool-description">{{ tool.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Info } from 'lucide-vue-next';
import * as icons from 'lucide-vue-next';
import { routeConfigs } from '../config/routes';
import ToolHeader from '../components/ToolHeader.vue';

const allCategories = computed(() => {
  return routeConfigs.map(config => ({
    type: config.type,
    name: config.name,
    icon: config.icon,
    tools: config.tools
  }));
});

const getCategoryIcon = (iconName: string) => {
  // @ts-ignore - Dynamic icon loading
  return icons[iconName] || icons.Folder;
};

const getToolIcon = (iconName: string) => {
  // @ts-ignore - Dynamic icon loading
  return icons[iconName] || icons.Wrench;
};
</script>

<style scoped>
.all-tools-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.content {
  flex: 1;
  overflow-y: auto;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

.info-message p {
  margin: 0;
}

.tools-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.category {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.category-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
}

.category-tools {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-card-readonly {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  gap: 0.75rem;
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.tool-content {
  flex: 1;
  min-width: 0;
}

.tool-name {
  margin: 0 0 0.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.tool-description {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}
</style>