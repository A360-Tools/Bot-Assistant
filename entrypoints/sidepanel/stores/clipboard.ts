import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTabsStore } from './tabs';

interface ClipboardState {
  copiedFiles: Set<string>;
  copiedFileNames: Map<string, string>;
  sourceFolderId: string | null;
  sourceHostname: string;
  sourceTabKey: string;
}

/**
 * Clipboard Store - Manages copy/paste functionality with hostname isolation
 * 
 * Hostname-based Scoping:
 * - Each Control Room instance (hostname) has its own clipboard
 * - Prevents accidental cross-instance paste attempts
 * - Auth tokens are instance-specific, so this prevents security issues
 * 
 * State Persistence:
 * - Clipboard state is maintained in memory only
 * - State persists across folder navigation within the same hostname
 * - State is shared across all tabs on the same hostname
 * - State is lost on page refresh (users need to copy again)
 * - This is intentional for security - no persistent storage of file IDs
 * 
 * Copy/Paste Rules:
 * - Can only paste on the same hostname where files were copied
 * - Can only paste in a different folder than the source
 * - Paste option automatically appears when navigating to valid destination
 */
export const useClipboardStore = defineStore('clipboard', () => {
  const tabsStore = useTabsStore();
  
  // State - clipboard per hostname
  const clipboardByHostname = ref<Map<string, ClipboardState>>(new Map());

  // Getters
  const currentHostname = computed(() => tabsStore.activeTabState?.hostname || null);
  
  const currentClipboard = computed(() => {
    if (!currentHostname.value) return null;
    return clipboardByHostname.value.get(currentHostname.value) || null;
  });

  const copiedFiles = computed(() => currentClipboard.value?.copiedFiles || new Set<string>());
  const copiedFileNames = computed(() => currentClipboard.value?.copiedFileNames || new Map<string, string>());
  const sourceFolderId = computed(() => currentClipboard.value?.sourceFolderId || null);

  const canPaste = computed(() => {
    if (!currentClipboard.value || copiedFiles.value.size === 0) return false;
    
    // Check if we're on the same hostname
    if (currentClipboard.value.sourceHostname !== currentHostname.value) return false;
    
    // Check if we're in a different folder
    const currentUrl = tabsStore.activeTabState?.url || '';
    const currentFolderId = currentUrl.match(/folders\/(\d+)/)?.[1];
    
    return currentFolderId !== null && currentFolderId !== sourceFolderId.value;
  });

  // Actions
  const copyFiles = (files: Set<string>, fileNames: Map<string, string>, folderId: string) => {
    if (!currentHostname.value || !tabsStore.activeTabKey) return;

    const clipboardState: ClipboardState = {
      copiedFiles: new Set(files),
      copiedFileNames: new Map(fileNames),
      sourceFolderId: folderId,
      sourceHostname: currentHostname.value,
      sourceTabKey: tabsStore.activeTabKey
    };

    clipboardByHostname.value.set(currentHostname.value, clipboardState);
  };

  const clearClipboard = () => {
    if (!currentHostname.value) return;
    clipboardByHostname.value.delete(currentHostname.value);
  };

  const clearAllClipboards = () => {
    clipboardByHostname.value.clear();
  };

  const clearHostnameClipboard = (hostname: string) => {
    clipboardByHostname.value.delete(hostname);
  };

  return {
    // Getters
    copiedFiles,
    copiedFileNames,
    sourceFolderId,
    canPaste,
    currentClipboard,
    
    // Actions
    copyFiles,
    clearClipboard,
    clearAllClipboards,
    clearHostnameClipboard
  };
});