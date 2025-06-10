<template>
  <div class="tool-card" @click="$emit('click', tool)">
    <div class="tool-icon">
      <component :is="iconComponent" :size="24" />
    </div>
    <div class="tool-content">
      <h3 class="tool-name">{{ tool.name }}</h3>
      <p class="tool-description">{{ tool.description }}</p>
    </div>
    <ChevronRight class="tool-arrow" :size="20" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import * as icons from 'lucide-vue-next';
import type { Tool } from '../config/routes';

interface Props {
  tool: Tool;
}

const props = defineProps<Props>();

const iconComponent = computed(() => {
  // @ts-ignore - Dynamic icon loading
  return icons[props.tool.icon] || icons.Wrench;
});

defineEmits<{
  click: [tool: Tool];
}>();
</script>

<style scoped>
.tool-card {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
  transition: left 0.5s ease;
}

.tool-card:hover::before {
  left: 100%;
}

.tool-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(99, 102, 241, 0.1) 100%);
  color: var(--primary);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transition: all 0.3s ease;
}

.tool-card:hover .tool-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.tool-content {
  flex: 1;
  min-width: 0;
}

.tool-name {
  margin: 0 0 0.25rem;
  font-size: 0.938rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.tool-description {
  margin: 0;
  font-size: 0.813rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.tool-arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: all 0.3s ease;
  opacity: 0.5;
}

.tool-card:hover .tool-arrow {
  transform: translateX(4px);
  color: var(--primary);
  opacity: 1;
}
</style>