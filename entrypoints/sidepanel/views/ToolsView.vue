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
    
    <div v-else-if="showPackageDownload">
      <PackageDownloadView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showPatchContent">
      <PatchContentView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
    </div>
    
    <div v-else-if="showDeviceReset">
      <DeviceResetView @back="activeToolId = null" :key="`${currentUrl}-${toolKey}`" />
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
import PackageDownloadView from './PackageDownloadView.vue';
import PatchContentView from './PatchContentView.vue';
import DeviceResetView from './DeviceResetView.vue';
import type { Tool } from '../config/routes';
import { usePageContext } from '../composables/usePageContext';
import { getDefaultToolForPageType, TOOL_PREFERENCE_VALUES } from '../utils/storage';
import { getSupportedSections } from '../config/routes';

interface Props {
  availableTools: Tool[];
  resetTrigger?: number;
}

const props = defineProps<Props>();
const { currentUrl, pageType } = usePageContext();

// Simple state - no tab persistence
const activeToolId = ref<string | null>(null);

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

const showPackageDownload = computed(() => {
  return activeToolId.value === 'package-download' && props.availableTools.some(t => t.id === 'package-download');
});

const showPatchContent = computed(() => {
  return activeToolId.value === 'patch-content' && props.availableTools.some(t => t.id === 'patch-content');
});

const showDeviceReset = computed(() => {
  return activeToolId.value === 'device-reset' && props.availableTools.some(t => t.id === 'device-reset');
});

const supportedSections = computed(() => getSupportedSections());

// Store the last URL
const lastUrl = ref(currentUrl.value);

// Handle URL changes - always reset tool on URL change
watch(() => currentUrl.value, (newUrl, oldUrl) => {
  if (newUrl !== oldUrl) {
    console.log('[ToolsView] URL changed, resetting tool selection');
    activeToolId.value = null;
    lastUrl.value = newUrl;
    toolKey.value++;
  }
});

// Watch for reset trigger from parent - always reset
watch(() => props.resetTrigger, (newVal, oldVal) => {
  if (oldVal !== undefined) {
    console.log('[ToolsView] Reset trigger, clearing tool selection');
    activeToolId.value = null;
    toolKey.value++;
  }
});

// Also watch for when we navigate back to this tab
watch(() => props.availableTools, (newTools, oldTools) => {
  // Skip if we're just switching tabs (tools haven't actually changed)
  if (oldTools && JSON.stringify(newTools) === JSON.stringify(oldTools)) {
    return;
  }
  
  // If we have an active tool but it's not in the available tools, reset
  if (activeToolId.value && !newTools.some(t => t.id === activeToolId.value)) {
    console.log('[ToolsView] Active tool no longer in available tools, resetting...');
    activeToolId.value = null;
    // Increment key to force remount
    toolKey.value++;
  }
  
  // Auto-launch if no tool is active
  if (!activeToolId.value && newTools.length > 0) {
    // Check for user's default preference
    getDefaultToolForPageType(pageType.value).then(preference => {
      if (!preference || preference === TOOL_PREFERENCE_VALUES.AUTO_SINGLE) {
        // Auto-single mode: launch if only one tool available
        if (newTools.length === 1) {
          const singleTool = newTools[0];
          // Auto-launching single tool
          handleToolClick(singleTool);
        }
      } else if (preference === TOOL_PREFERENCE_VALUES.ALWAYS_SHOW) {
        // Always show selection - do nothing
        return;
      } else if (newTools.some(t => t.id === preference)) {
        // Specific tool preference
        const defaultTool = newTools.find(t => t.id === preference)!;
        // Auto-launching preferred tool
        handleToolClick(defaultTool);
      }
    });
  }
}, { immediate: true, deep: true });

const handleToolClick = (tool: Tool) => {
  console.log('[ToolsView] Tool clicked:', tool.id);
  
  const validToolIds = [
    'download-files', 'update-packages', 'copy-files', 
    'best-practices', 'view-attributes', 'content-modification',
    'package-download', 'patch-content', 'device-reset'
  ];
  
  if (validToolIds.includes(tool.id)) {
    activeToolId.value = tool.id;
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
  console.log('[ToolsView] Component mounted');
  lastUrl.value = currentUrl.value;
  
  // Check for auto-launch
  const preference = await getDefaultToolForPageType(pageType.value);
  
  if (!preference || preference === TOOL_PREFERENCE_VALUES.AUTO_SINGLE) {
    // Auto-single mode: launch if only one tool available
    if (props.availableTools.length === 1) {
      const singleTool = props.availableTools[0];
      console.log('[ToolsView] Auto-launching single tool:', singleTool.id);
      handleToolClick(singleTool);
    }
  } else if (preference === TOOL_PREFERENCE_VALUES.ALWAYS_SHOW) {
    // Always show selection - do nothing
    return;
  } else if (props.availableTools.some(t => t.id === preference)) {
    // Specific tool preference
    const defaultTool = props.availableTools.find(t => t.id === preference)!;
    console.log('[ToolsView] Auto-launching preferred tool:', defaultTool.id);
    handleToolClick(defaultTool);
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