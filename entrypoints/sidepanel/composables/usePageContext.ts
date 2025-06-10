import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getCurrentRouteConfig, type RouteConfig, type Tool } from '../config/routes';

export function usePageContext() {
  const currentUrl = ref('');
  const isConnected = ref(false);
  const contentScriptReady = ref(false);
  const currentTab = ref<chrome.tabs.Tab | null>(null);

  const currentRouteConfig = computed(() => {
    return getCurrentRouteConfig(currentUrl.value);
  });

  const availableTools = computed(() => {
    return currentRouteConfig.value?.tools || [];
  });

  const pageType = computed(() => {
    return currentRouteConfig.value?.type || 'unknown';
  });

  const pageName = computed(() => {
    return currentRouteConfig.value?.name || 'Unknown Page';
  });

  // Extract context from URL
  const pageContext = computed(() => {
    const url = currentUrl.value;
    const context: any = {
      url,
      type: pageType.value,
      name: pageName.value
    };

    // Extract file ID for taskbot pages
    if (pageType.value === 'privateBot') {
      // Private bot: /files/task/{id}/edit or /taskbots/
      let match = url.match(/\/files\/task\/(\d+)\/edit/);
      if (match) {
        context.fileId = match[1];
      } else {
        // Try alternate pattern: /private/taskbots/{id}
        match = url.match(/\/private\/taskbots\/(\d+)/);
        if (match) {
          context.fileId = match[1];
        }
      }
    } else if (pageType.value === 'publicBot') {
      // Public bot: /taskbots/{id}/view or /public/taskbots/{id}
      let match = url.match(/\/taskbots\/(\d+)\/view/);
      if (match) {
        context.fileId = match[1];
      } else {
        // Try alternate pattern: /public/taskbots/{id}
        match = url.match(/\/public\/taskbots\/(\d+)/);
        if (match) {
          context.fileId = match[1];
        }
      }
    }

    // Extract folder ID for folder pages
    if (pageType.value === 'privateFolder' || pageType.value === 'publicFolder') {
      const match = url.match(/\/folders\/([^\/]+)/);
      if (match) {
        context.folderId = match[1];
      }
    }

    return context;
  });

  // Store the window ID that this sidepanel is associated with
  const windowId = ref<number | null>(null);
  
  const updateCurrentTab = async () => {
    try {
      // First, get the current window if we don't have it
      if (!windowId.value) {
        const currentWindow = await chrome.windows.getCurrent();
        windowId.value = currentWindow.id;
      }
      
      // Get the active tab in the specific window
      const tabs = await chrome.tabs.query({ 
        active: true, 
        windowId: windowId.value 
      });
      const tab = tabs[0];
      
      if (tab) {
        currentTab.value = tab;
        currentUrl.value = tab.url || '';
        
        // Check if content script is ready by trying to communicate
        if (tab.id) {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            contentScriptReady.value = true;
            isConnected.value = true;
          } catch {
            // Content script not ready or not injected
            contentScriptReady.value = false;
            isConnected.value = false;
          }
        }
      }
    } catch (error) {
      // Error getting current tab
      isConnected.value = false;
      contentScriptReady.value = false;
    }
  };

  // Listen for tab updates
  const handleTabUpdate = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    // Only handle updates for tabs in our window
    if (windowId.value && tab.windowId === windowId.value && tab.active) {
      if (changeInfo.url) {
        currentUrl.value = changeInfo.url;
        currentTab.value = tab;
      }
      // Check connection status on any update (including page loads)
      if (changeInfo.status === 'complete') {
        await updateCurrentTab();
      }
    }
  };

  // Listen for tab activation
  const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    // Only handle activations in our window
    if (windowId.value && activeInfo.windowId === windowId.value) {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          currentUrl.value = tab.url;
          currentTab.value = tab;
          // Check connection status when tab is activated
          await updateCurrentTab();
        }
      } catch (error) {
        // Error getting tab
      }
    }
  };

  let connectionCheckInterval: number | null = null;

  onMounted(() => {
    updateCurrentTab();
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    
    // Check connection status periodically when not connected
    connectionCheckInterval = window.setInterval(() => {
      if (!isConnected.value) {
        updateCurrentTab();
      }
    }, 1000); // Check every second when not connected
  });

  onUnmounted(() => {
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    chrome.tabs.onActivated.removeListener(handleTabActivated);
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
  });

  return {
    currentUrl,
    isConnected,
    contentScriptReady,
    currentTab,
    currentRouteConfig,
    availableTools,
    pageType,
    pageName,
    pageContext,
    updateCurrentTab
  };
}