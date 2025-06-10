import { ref, watch, computed } from 'vue';
import { usePageContext } from './usePageContext';

// Store state for each tab across all windows
const tabStates = ref<Map<string, any>>(new Map());

export function useTabState<T>(defaultState: T) {
  const { currentTab } = usePageContext();
  
  // Create unique key for tab that includes window ID
  const getTabKey = () => {
    if (!currentTab.value) return 'unknown';
    return `${currentTab.value.windowId}-${currentTab.value.id}`;
  };
  
  // Get current tab key
  const currentTabKey = computed(() => getTabKey());
  
  // Deep clone function that handles Maps and Sets
  const deepClone = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Set) return new Set(Array.from(obj));
    if (obj instanceof Map) return new Map(Array.from(obj.entries()));
    
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  };

  // Get or create state for current tab
  const getTabState = () => {
    const key = currentTabKey.value;
    if (key === 'unknown') return deepClone(defaultState);
    
    if (!tabStates.value.has(key)) {
      tabStates.value.set(key, deepClone(defaultState));
    }
    
    return tabStates.value.get(key);
  };
  
  // Create reactive state for current tab
  const state = ref<T>(getTabState());
  
  // Update state when tab changes
  watch(currentTabKey, (newKey, oldKey) => {
    // Save current state for old tab
    if (oldKey !== 'unknown' && oldKey !== newKey) {
      tabStates.value.set(oldKey, deepClone(state.value));
    }
    
    // Load state for new tab
    state.value = getTabState();
  }, { immediate: true });
  
  // Save state whenever it changes
  watch(state, (newState) => {
    if (currentTabKey.value !== 'unknown') {
      tabStates.value.set(currentTabKey.value, deepClone(newState));
    }
  }, { deep: true });
  
  // Cleanup old tab states (keep only last 20 tabs)
  watch(tabStates, () => {
    if (tabStates.value.size > 20) {
      const entries = Array.from(tabStates.value.entries());
      const toRemove = entries.slice(0, entries.length - 20);
      toRemove.forEach(([key]) => tabStates.value.delete(key));
    }
  });
  
  return state;
}

// Clear state for a specific tab
export function clearTabState(windowId: number, tabId: number) {
  const key = `${windowId}-${tabId}`;
  tabStates.value.delete(key);
}

// Clear all tab states
export function clearAllTabStates() {
  tabStates.value.clear();
}

// Clear states for a specific window
export function clearWindowTabStates(windowId: number) {
  const keysToDelete: string[] = [];
  tabStates.value.forEach((_, key) => {
    if (key.startsWith(`${windowId}-`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => tabStates.value.delete(key));
}

// Send message to content script
export async function sendMessage(message: any) {
  try {
    // Get the active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      throw new Error('No active tab found');
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    // Failed to send message to content script
    throw error;
  }
}