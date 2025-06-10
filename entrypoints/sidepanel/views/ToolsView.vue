<template>
  <div class="tools-view">
    <div v-if="showDownloadFiles">
      <DownloadFilesView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showUpdatePackages">
      <UpdatePackagesView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showCopyFiles">
      <CopyFilesView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showBestPractices">
      <BestPracticesView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showViewAttributes">
      <CredentialsView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showContentModification">
      <ContentModificationView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="availableTools.length > 0" class="tools-grid">
      <ToolCard
        v-for="tool in availableTools"
        :key="tool.id"
        :tool="tool"
        @click="handleToolClick"
      />
    </div>
    
    <div v-else class="empty-state">
      <AlertCircle :size="48" />
      <h3>No tools available for this page</h3>
      <p>Bot Assistant works on specific Control Room pages. Navigate to:</p>
      <div class="navigation-sections">
        <div v-for="section in supportedSections" :key="section.name" class="nav-section">
          <strong>{{ section.name }}</strong>
          <span>{{ section.description }}</span>
        </div>
      </div>
      <p class="hint">Tools will automatically appear when you navigate to these sections.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import ToolCard from '../components/ToolCard.vue';
import DownloadFilesView from './DownloadFilesView.vue';
import UpdatePackagesView from './UpdatePackagesView.vue';
import CopyFilesView from './CopyFilesView.vue';
import BestPracticesView from './BestPracticesView.vue';
import CredentialsView from './CredentialsView.vue';
import ContentModificationView from './ContentModificationView.vue';
import type { Tool } from '../config/routes';
import { usePageContext } from '../composables/usePageContext';
import { useTabState } from '../composables/useTabState';
import { getDefaultToolForPageType } from '../utils/storage';
import { SUPPORTED_SECTIONS } from '../utils/navigationHelp';

interface Props {
  availableTools: Tool[];
  resetTrigger?: number;
}

const props = defineProps<Props>();
const { currentUrl, pageType } = usePageContext();

// Use per-tab state for active tool
const tabState = useTabState({
  activeToolId: null as string | null
});

const activeToolId = computed({
  get: () => {
    // Check if the stored tool is still available
    const storedTool = tabState.value.activeToolId;
    if (storedTool && !props.availableTools.some(t => t.id === storedTool)) {
      // Tool is no longer available, clear it
      tabState.value.activeToolId = null;
      return null;
    }
    return storedTool;
  },
  set: (value) => {
    tabState.value.activeToolId = value;
  }
});

// Add a force refresh key
const toolKey = ref(0);

const showDownloadFiles = computed(() => {
  return activeToolId.value === 'download-files' && props.availableTools.some(t => t.id === 'download-files');
});

const showUpdatePackages = computed(() => {
  return activeToolId.value === 'update-packages' && props.availableTools.some(t => t.id === 'update-packages');
});

const showCopyFiles = computed(() => {
  return activeToolId.value === 'copy-files' && props.availableTools.some(t => t.id === 'copy-files');
});

const showBestPractices = computed(() => {
  return activeToolId.value === 'best-practices' && props.availableTools.some(t => t.id === 'best-practices');
});

const showViewAttributes = computed(() => {
  return activeToolId.value === 'view-attributes' && props.availableTools.some(t => t.id === 'view-attributes');
});

const showContentModification = computed(() => {
  return activeToolId.value === 'content-modification' && props.availableTools.some(t => t.id === 'content-modification');
});

const supportedSections = computed(() => SUPPORTED_SECTIONS);

// Store the last URL for this tab
const lastUrl = ref(currentUrl.value);

// Handle URL changes and tool availability
watch(() => currentUrl.value, (newUrl) => {
  // Skip if URL hasn't actually changed
  if (newUrl === lastUrl.value) return;
  
  // Update last URL
  lastUrl.value = newUrl;
  
  // Check if the active tool is still available
  if (activeToolId.value) {
    const toolStillAvailable = props.availableTools.some(t => t.id === activeToolId.value);
    
    if (!toolStillAvailable) {
      // Tool is no longer available, go back to tool selection
      activeToolId.value = null;
    }
    // If tool is still available, the child component will handle refresh via its own URL watcher
  }
});

// Watch for reset trigger from parent (handles case when we're not the active tab)
watch(() => props.resetTrigger, (newVal, oldVal) => {
  // Skip initial trigger
  if (oldVal === undefined) return;
  
  // Force refresh the tool key to remount components
  toolKey.value++;
  
  // Check if the active tool is still available
  if (activeToolId.value) {
    const toolStillAvailable = props.availableTools.some(t => t.id === activeToolId.value);
    
    if (!toolStillAvailable) {
      // Tool is no longer available, go back to tool selection
      // Tool is no longer available, resetting...
      activeToolId.value = null;
      // Force update of the tab state
      tabState.value.activeToolId = null;
    }
  }
});

// Also watch for when we navigate back to this tab
watch(() => props.availableTools, (newTools, oldTools) => {
  // If we have an active tool but it's not in the available tools, reset
  if (activeToolId.value && !newTools.some(t => t.id === activeToolId.value)) {
    // Active tool no longer in available tools, resetting...
    activeToolId.value = null;
    tabState.value.activeToolId = null;
    // Increment key to force remount
    toolKey.value++;
  }
  
  // Auto-launch if no tool is active
  if (!activeToolId.value && newTools.length > 0) {
    // Check for user's default preference
    getDefaultToolForPageType(pageType.value).then(defaultToolId => {
      if (defaultToolId && newTools.some(t => t.id === defaultToolId)) {
        const defaultTool = newTools.find(t => t.id === defaultToolId)!;
        // Auto-launching preferred default tool
        handleToolClick(defaultTool);
      } else if (newTools.length === 1) {
        // If no preference set, but only one tool available, auto-launch it
        const singleTool = newTools[0];
        // Auto-launching single tool
        handleToolClick(singleTool);
      }
    });
  }
}, { immediate: true, deep: true });

const handleToolClick = (tool: Tool) => {
  // Tool clicked
  
  if (tool.id === 'download-files') {
    activeToolId.value = 'download-files';
  } else if (tool.id === 'update-packages') {
    activeToolId.value = 'update-packages';
  } else if (tool.id === 'copy-files') {
    activeToolId.value = 'copy-files';
  } else if (tool.id === 'best-practices') {
    activeToolId.value = 'best-practices';
  } else if (tool.id === 'view-attributes') {
    activeToolId.value = 'view-attributes';
  } else if (tool.id === 'content-modification') {
    activeToolId.value = 'content-modification';
  } else {
    // For other tools, send message to background
    chrome.runtime.sendMessage({
      action: tool.action,
      toolId: tool.id
    });
  }
};

// Check for auto-launch on mount
onMounted(async () => {
  // If no tool is active, check for auto-launch
  if (!activeToolId.value) {
    // First check for user's default preference
    const defaultToolId = await getDefaultToolForPageType(pageType.value);
    if (defaultToolId && props.availableTools.some(t => t.id === defaultToolId)) {
      const defaultTool = props.availableTools.find(t => t.id === defaultToolId)!;
      handleToolClick(defaultTool);
    } else if (props.availableTools.length === 1) {
      // If no preference set, but only one tool available, auto-launch it
      const singleTool = props.availableTools[0];
      // Auto-launching single tool on mount
      handleToolClick(singleTool);
    }
  }
});
</script>

<style scoped>
.tools-view {
  padding: 1rem;
}

.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
  font-size: 1.125rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
  max-width: 300px;
}

.supported-paths {
  margin: 1rem 0;
  padding: 0;
  list-style: none;
  text-align: left;
  font-size: 0.875rem;
}

.supported-paths li {
  padding: 0.25rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.supported-paths li::before {
  content: '•';
  position: absolute;
  left: 0.5rem;
  color: #3b82f6;
}

.hint {
  margin-top: 1rem !important;
  font-style: italic;
  color: #94a3b8;
}

.navigation-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
  text-align: left;
  width: 100%;
  max-width: 500px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.nav-section:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.nav-section strong {
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 600;
}

.nav-section span {
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.4;
}
</style>