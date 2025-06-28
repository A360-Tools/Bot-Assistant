import { ref } from 'vue';

// Simple state management - no tab persistence
export function useTabState<T>(defaultState: T, namespace?: string) {
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
  
  // Create simple reactive state with default values
  const state = ref<T>(deepClone(defaultState));
  
  return state;
}

// These functions are no longer needed but kept for compatibility
export function clearTabState(windowId: number, tabId: number, namespace?: string) {
  // No-op - state is not persisted
}

export function clearAllTabStates(namespace?: string) {
  // No-op - state is not persisted
}

export function clearWindowTabStates(windowId: number, namespace?: string) {
  // No-op - state is not persisted
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