<template>
  <div class="app">
    <header class="header">
      <div class="header-left">
        <img src="/icon48.png" class="logo" alt="Bot Assistant" />
        <div class="header-text">
          <h1>Bot Assistant</h1>
          <span class="version">v3.0</span>
        </div>
      </div>
      <div class="header-right">
        <div class="status-indicator" :class="{ connected: isConnected }">
          <div class="status-dot"></div>
        </div>
        <div class="status-text">
          <span class="status-label">{{ isConnected ? 'Connected' : 'Not Connected' }}</span>
          <span class="status-detail">{{ isConnected ? 'Content script ready' : 'Refresh page' }}</span>
        </div>
      </div>
    </header>
    
    <div class="context-bar" :class="{ 'unsupported': !currentRouteConfig }">
      <template v-if="currentRouteConfig">
        <component :is="getPageIcon(currentRouteConfig.icon)" :size="16" />
        <span class="context-text">{{ currentRouteConfig.name }}</span>
      </template>
      <template v-else>
        <AlertCircle :size="16" />
        <span class="context-text">Unsupported Page</span>
      </template>
      <ChevronRight :size="14" />
      <span class="context-url">{{ currentUrl || 'No active tab' }}</span>
    </div>
    
    <main class="main">
      <TabPanel :tabs="tabs" defaultTab="tools" @tab-change="handleTabChange">
        <template #tools>
          <ToolsView :available-tools="availableTools" :reset-trigger="toolsResetTrigger" />
        </template>
        
        <template #all>
          <AllToolsView />
        </template>
        
        
        <template #settings>
          <SettingsView />
        </template>
      </TabPanel>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Bot, Grid, Settings, ChevronRight, AlertCircle } from 'lucide-vue-next';
import * as icons from 'lucide-vue-next';
import { usePageContext } from './composables/usePageContext';
import TabPanel from './components/TabPanel.vue';
import ToolsView from './views/ToolsView.vue';
import AllToolsView from './views/AllToolsView.vue';
import SettingsView from './views/SettingsView.vue';

const { isConnected, currentUrl, currentRouteConfig, availableTools } = usePageContext();

// Create a reactive signal to reset tools when URL changes
const toolsResetTrigger = ref(0);

// Watch for URL changes and always trigger reset
watch(currentUrl, (newUrl, oldUrl) => {
  if (newUrl !== oldUrl) {
    console.log('[App.vue] URL changed, triggering reset');
    toolsResetTrigger.value++;
  }
});

// Watch for connection status changes
let wasDisconnected = !isConnected.value;
watch(isConnected, (newValue, oldValue) => {
  // If we were disconnected and now connected, trigger reset
  if (wasDisconnected && newValue) {
    toolsResetTrigger.value++;
  }
  wasDisconnected = !newValue;
});

// Handle tab changes
const handleTabChange = (tabId: string) => {
  // Tab changes in the sidepanel don't affect tool selection
};

const tabs = [
  { id: 'tools', label: 'Page Tools', icon: Grid },
  { id: 'all', label: 'All Tools', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const getPageIcon = (iconName: string) => {
  // @ts-ignore - Dynamic icon loading
  return icons[iconName] || icons.File;
};
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
}

.app::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: linear-gradient(to bottom, rgba(219, 234, 254, 0.3) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  color: #1f2937;
  padding: 0.875rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  z-index: var(--z-sticky);
}

/* Removed floating background element for clarity */

/* Removed header overlay */

/* Removed float animation */

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1;
}

.logo {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

/* Mobile responsiveness for header */
@media (max-width: 400px) {
  .header-left,
  .header-right {
    padding: 0.75rem 1rem;
  }
  
  .header-left {
    gap: 0.75rem;
  }
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .header h1 {
    font-size: 1rem;
  }
  
  .status-text {
    display: none;
  }
  
  .context-bar {
    padding: 0.5rem 1rem;
    font-size: 0.688rem;
  }
}

.header h1 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  color: #111827;
}

.version {
  font-size: 0.688rem;
  color: #6b7280;
  font-weight: 400;
  margin-top: 0.125rem;
  display: inline-block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1;
}

.status-indicator {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: all 0.3s ease;
  position: relative;
}

.status-indicator.connected .status-dot {
  background: #10b981;
}

/* Removed pulse animation */

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.2;
}

.status-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  transition: color 0.3s ease;
}

.status-indicator.connected .status-label {
  color: #111827;
}

.status-detail {
  font-size: 0.688rem;
  color: #6b7280;
  font-weight: 400;
}

.context-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(209, 250, 229, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 0.75rem;
  color: var(--text-secondary);
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.context-bar.unsupported {
  background: rgba(254, 243, 199, 0.5);
  border-bottom-color: rgba(251, 191, 36, 0.3);
  color: #92400e;
}

.context-text {
  font-weight: 600;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.context-bar.unsupported .context-text {
  color: #92400e;
}

.context-bar svg {
  flex-shrink: 0;
  color: var(--success);
}

.context-bar.unsupported svg {
  color: #f59e0b;
}

.context-url {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.7;
  font-size: 0.688rem;
}

.context-bar .context-url {
  color: #059669;
}

.context-bar.unsupported .context-url {
  color: #92400e;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
}

.placeholder h3 {
  margin: 1rem 0 0.5rem;
  color: #475569;
  font-size: 1.125rem;
}

.placeholder p {
  margin: 0;
  font-size: 0.875rem;
}
</style>