import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useTabsStore } from './tabs';
import { getDefaultToolForPageType } from '../utils/storage';
import { getCurrentRouteConfig, type Tool, type RouteConfig } from '../config/routes';

type PageType = 'privateBots' | 'publicBots' | 'privateFolders' | 'publicFolders' | 
                'credentials' | 'credentialProviders' | 'packages' | 'processes' | 
                'myDevices' | 'unsupported' | null;

export const useConnectionStore = defineStore('connection', () => {
  const tabsStore = useTabsStore();
  
  // State
  const isConnected = ref(false);
  const currentUrl = ref('');
  const pageType = ref<PageType>(null);
  const availableTools = ref<Tool[]>([]);
  const defaultToolId = ref<string | null>(null);
  const currentRouteConfig = ref<RouteConfig | null>(null);

  // Store the window ID
  const windowId = ref<number | null>(null);
  
  const updateCurrentTab = async () => {
    try {
      // Get current window if we don't have it
      if (!windowId.value) {
        const currentWindow = await chrome.windows.getCurrent();
        windowId.value = currentWindow.id ?? null;
      }
      
      // Get active tab in the specific window
      const tabs = await chrome.tabs.query({ 
        active: true, 
        windowId: windowId.value ?? undefined 
      });
      const tab = tabs[0];
      
      if (tab && tab.id && tab.url) {
        // Extract hostname
        let hostname = '';
        try {
          const urlObj = new URL(tab.url);
          hostname = urlObj.hostname;
        } catch (e) {
          console.error('Failed to parse URL:', e);
        }
        
        // Update connection state
        currentUrl.value = tab.url;
        const routeConfig = getCurrentRouteConfig(tab.url);
        currentRouteConfig.value = routeConfig;
        pageType.value = routeConfig?.type || null;
        availableTools.value = routeConfig?.tools || [];
        
        // Update tab store
        tabsStore.setActiveTab(windowId.value!, tab.id);
        tabsStore.updateTabState(windowId.value!, tab.id, { url: tab.url, hostname });
        
        // Get default tool
        if (pageType.value) {
          defaultToolId.value = await getDefaultToolForPageType(pageType.value);
        }
        
        // Check content script
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
          isConnected.value = true;
        } catch {
          isConnected.value = false;
        }
      }
    } catch (error) {
      console.error('Failed to update tab:', error);
      isConnected.value = false;
    }
  };

  // Handle tab updates
  const handleTabUpdate = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (windowId.value && tab.windowId === windowId.value && tab.active) {
      if (changeInfo.url || changeInfo.status === 'complete') {
        await updateCurrentTab();
      }
    }
  };

  // Handle tab activation
  const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    if (windowId.value && activeInfo.windowId === windowId.value) {
      await updateCurrentTab();
    }
  };

  // Initialize listeners
  const initializeListeners = () => {
    updateCurrentTab();
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    
    // Periodic connection check
    setInterval(() => {
      if (!isConnected.value) {
        updateCurrentTab();
      }
    }, 1000);
  };

  // Cleanup listeners
  const cleanupListeners = () => {
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    chrome.tabs.onActivated.removeListener(handleTabActivated);
  };

  // Watch for disconnection
  let disconnectionTimeout: NodeJS.Timeout | null = null;
  
  const startDisconnectionTimer = () => {
    if (disconnectionTimeout) clearTimeout(disconnectionTimeout);
    
    disconnectionTimeout = setTimeout(() => {
      isConnected.value = false;
    }, 5000); // 5 seconds timeout
  };

  // Reset disconnection timer on any update
  watch(currentUrl, () => {
    if (disconnectionTimeout) clearTimeout(disconnectionTimeout);
    isConnected.value = true;
  });

  return {
    // State
    isConnected,
    currentUrl,
    pageType,
    availableTools,
    defaultToolId,
    currentRouteConfig,
    
    // Actions
    initializeListeners,
    cleanupListeners,
    updateCurrentTab,
    startDisconnectionTimer
  };
});