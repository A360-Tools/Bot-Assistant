import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface TabState {
  windowId: number;
  tabId: number;
  url: string;
  hostname: string;
  selectedToolId: string | null;
  toolState: Record<string, any>; // Tool-specific state
  lastUpdated: number;
}

/**
 * Tabs Store - Manages per-tab state isolation
 * 
 * Why Window+Tab ID?
 * - Tab IDs can be reused across different browser windows
 * - Users may have multiple Control Room instances open in different windows
 * - Window+Tab ensures unique identification and prevents state conflicts
 * 
 * State Persistence:
 * - State is maintained in memory only (not persisted to storage)
 * - Each tab maintains its own selected tool and tool-specific state
 * - State survives navigation within the same tab
 * - State is lost on page refresh (by design for security)
 * - Old tab states are automatically cleaned up after 30 minutes
 */
export const useTabsStore = defineStore('tabs', () => {
  // State
  const tabStates = ref<Map<string, TabState>>(new Map());
  const activeTabKey = ref<string | null>(null);

  // Helper to create tab key
  const createTabKey = (windowId: number, tabId: number) => `${windowId}-${tabId}`;

  // Getters
  const activeTabState = computed(() => {
    if (!activeTabKey.value) return null;
    return tabStates.value.get(activeTabKey.value) || null;
  });

  const activeToolId = computed(() => activeTabState.value?.selectedToolId || null);

  // Actions
  const setActiveTab = (windowId: number, tabId: number) => {
    const key = createTabKey(windowId, tabId);
    activeTabKey.value = key;
  };

  const updateTabState = (windowId: number, tabId: number, updates: Partial<TabState>) => {
    const key = createTabKey(windowId, tabId);
    const existingState = tabStates.value.get(key);

    const newState: TabState = {
      windowId,
      tabId,
      url: updates.url || existingState?.url || '',
      hostname: updates.hostname || existingState?.hostname || '',
      selectedToolId: updates.selectedToolId !== undefined ? updates.selectedToolId : existingState?.selectedToolId || null,
      toolState: updates.toolState || existingState?.toolState || {},
      lastUpdated: Date.now()
    };

    tabStates.value.set(key, newState);
  };

  const setSelectedTool = (toolId: string | null) => {
    if (!activeTabKey.value) return;
    
    const [windowId, tabId] = activeTabKey.value.split('-').map(Number);
    updateTabState(windowId, tabId, { selectedToolId: toolId });
  };

  const updateToolState = (toolId: string, state: any) => {
    if (!activeTabState.value) return;
    
    const newToolState = { ...activeTabState.value.toolState };
    newToolState[toolId] = state;
    
    const [windowId, tabId] = activeTabKey.value!.split('-').map(Number);
    updateTabState(windowId, tabId, { toolState: newToolState });
  };

  const getToolState = (toolId: string) => {
    return activeTabState.value?.toolState[toolId] || null;
  };

  const clearTabState = (windowId: number, tabId: number) => {
    const key = createTabKey(windowId, tabId);
    tabStates.value.delete(key);
  };

  const clearInactiveTabs = (maxAge: number = 30 * 60 * 1000) => { // 30 minutes default
    const now = Date.now();
    const keysToDelete: string[] = [];

    tabStates.value.forEach((state, key) => {
      if (now - state.lastUpdated > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => tabStates.value.delete(key));
  };

  return {
    // State
    tabStates,
    activeTabKey,
    
    // Getters
    activeTabState,
    activeToolId,
    
    // Actions
    setActiveTab,
    updateTabState,
    setSelectedTool,
    updateToolState,
    getToolState,
    clearTabState,
    clearInactiveTabs
  };
});