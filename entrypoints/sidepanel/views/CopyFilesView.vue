<template>
  <div class="copy-files-view">
    <ToolHeader
      :title="mode === 'copy' ? 'Copy Files' : 'Paste Files'"
      :showBack="true"
      :showRefresh="true"
      :refreshing="loading"
      @refresh="initialize(true)"
      @back="$emit('back')"
    >
      <template #actions>
        <span class="folder-type">Private Folder</span>
      </template>
    </ToolHeader>
    
    <ConnectionError v-if="!isAuthenticated" type="authentication" @retry="initialize()" />
    
    <template v-else>
      <!-- Copy Mode -->
      <template v-if="mode === 'copy'">
        <div class="info-message" v-if="copiedFiles.size === 0">
          <Info :size="16" />
          <p>Select files to copy, then navigate to the destination folder.</p>
        </div>
        
        <div v-else class="info-message success">
          <CheckCircle :size="16" />
          <p>{{ copiedFiles.size }} file{{ copiedFiles.size > 1 ? 's' : '' }} copied to clipboard. Navigate to destination folder to paste.</p>
        </div>
        
        <!-- Show copied files -->
        <div v-if="copiedFiles.size > 0 && sourceFolderId === getCurrentFolderIdFromUrl(currentUrl)" class="copied-files-preview">
          <h3>Files in clipboard:</h3>
          <div class="clipboard-files">
            <div v-for="fileId in copiedFiles" :key="fileId" class="clipboard-file">
              <Copy :size="14" />
              <span>{{ getFileName(fileId) }}</span>
            </div>
          </div>
        </div>
        
        <FileList
          :files="files"
          :loading="loading"
          :error="error"
          :selectedFiles="selectedFiles"
          :hasMore="hasMore"
          :loadingMore="loadingMore"
          @update:selectedFiles="handleSelectionChange"
          @retry="loadFiles"
          @loadMore="loadMore"
        />
        
        <div v-if="selectedFiles.size > 0 || copiedFiles.size > 0" class="action-bar">
          <button
            v-if="selectedFiles.size > 0"
            @click="copySelectedFiles"
            class="copy-btn"
          >
            <Copy :size="16" />
            Copy {{ selectedFiles.size }} File{{ selectedFiles.size > 1 ? 's' : '' }}
          </button>
          
          <button
            v-if="copiedFiles.size > 0"
            @click="clearCopiedFiles"
            class="clear-btn"
          >
            <X :size="16" />
            Clear Clipboard
          </button>
        </div>
      </template>
      
      <!-- Paste Mode -->
      <template v-else-if="mode === 'paste'">
        <div class="info-message success">
          <CheckCircle :size="16" />
          <p>{{ copiedFiles.size }} file{{ copiedFiles.size > 1 ? 's' : '' }} ready to paste in this folder.</p>
        </div>
        
        <div class="copied-files-list">
          <h3>Files to paste:</h3>
          <ul>
            <li v-for="fileId in copiedFiles" :key="fileId">
              {{ getFileName(fileId) }}
            </li>
          </ul>
        </div>
        
        <div class="action-bar">
          <button
            @click="pasteFiles"
            :disabled="isPasting"
            class="paste-btn"
          >
            <Clipboard :size="16" />
            {{ isPasting ? 'Pasting...' : 'Paste Files Here' }}
          </button>
          <button
            @click="clearCopiedFiles"
            class="cancel-btn"
          >
            <X :size="16" />
            Cancel
          </button>
        </div>
        
        <div v-if="isPasting" class="paste-progress">
          <div class="progress-info">
            <Loader2 :size="16" class="spinner" />
            <span>Pasting file {{ currentPasteIndex + 1 }} of {{ copiedFiles.size }}...</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pasteProgress + '%' }"></div>
          </div>
        </div>
      </template>
    </template>
    
    <!-- Paste Results Modal -->
    <div v-if="showPasteResults" class="modal-overlay" @click="closePasteResults">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Paste Results</h3>
          <button @click="closePasteResults" class="close-btn">
            <X :size="20" />
          </button>
        </div>
        
        <div class="modal-body">
          
          <div v-if="pasteResults.success.length > 0" class="result-section">
            <div class="result-header success">
              <CheckCircle :size="16" />
              <span>Successfully Pasted ({{ pasteResults.success.length }})</span>
            </div>
            <ul class="result-list">
              <li v-for="fileName in pasteResults.success" :key="fileName">
                {{ fileName }}
              </li>
            </ul>
          </div>
          
          <div v-if="pasteResults.duplicates.length > 0" class="result-section">
            <div class="result-header warning">
              <AlertCircle :size="16" />
              <span>Already Exists ({{ pasteResults.duplicates.length }})</span>
            </div>
            <ul class="result-list">
              <li v-for="fileName in pasteResults.duplicates" :key="fileName">
                {{ fileName }}
                <span class="skip-message">File with this name already exists in destination</span>
              </li>
            </ul>
          </div>
          
          <div v-if="pasteResults.failed.length > 0" class="result-section">
            <div class="result-header error">
              <XCircle :size="16" />
              <span>Failed to Copy ({{ pasteResults.failed.length }})</span>
            </div>
            <ul class="result-list">
              <li v-for="item in pasteResults.failed" :key="item.fileName">
                <strong>{{ item.fileName }}</strong>
                <span class="error-message">{{ item.error }}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closePasteResults" class="modal-btn">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Info, Copy, Clipboard, X, CheckCircle, Loader2, XCircle, AlertCircle } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import FileList from '../components/FileList.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService, type FolderItem } from '../services/api';
import { useTabState } from '../composables/useTabState';
import { storeToRefs } from 'pinia';
import { useConnectionStore } from '../stores/connection';
import { useClipboardStore } from '../stores/clipboard';
import { useTabsStore } from '../stores/tabs';

defineEmits<{
  back: [];
}>();


// Use per-tab state for file list data
const tabState = useTabState({
  files: [] as FolderItem[],
  currentOffset: 0,
  totalFiles: 0,
  lastLoadedUrl: '',
  isAuthenticated: false
});

// Get stores
const connectionStore = useConnectionStore();
const clipboardStore = useClipboardStore();

const { currentUrl } = storeToRefs(connectionStore);
const { copiedFiles, copiedFileNames, sourceFolderId, canPaste } = storeToRefs(clipboardStore);

// Local reactive state
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const isPasting = ref(false);
const currentPasteIndex = ref(0);
const showPasteResults = ref(false);
const pasteResults = ref({
  success: [] as string[],
  duplicates: [] as string[],
  failed: [] as { fileName: string; error: string }[]
});

// Already have currentUrl from connectionStore above

// Create computed refs for tab state
const files = computed({
  get: () => tabState.value.files || [],
  set: (value) => { tabState.value.files = value; }
});

const currentOffset = computed({
  get: () => tabState.value.currentOffset || 0,
  set: (value) => { tabState.value.currentOffset = value; }
});

const totalFiles = computed({
  get: () => tabState.value.totalFiles || 0,
  set: (value) => { tabState.value.totalFiles = value; }
});

// No need for computed refs - copiedFiles, copiedFileNames, and sourceFolderId are already refs from the store

const selectedFiles = ref(new Set<string>());

const isAuthenticated = computed({
  get: () => tabState.value.isAuthenticated || false,
  set: (value) => { tabState.value.isAuthenticated = value; }
});

const hasMore = computed(() => {
  return currentOffset.value + files.value.length < totalFiles.value;
});

const pasteProgress = computed(() => {
  if (copiedFiles.value.size === 0) return 0;
  return Math.round((currentPasteIndex.value / copiedFiles.value.size) * 100);
});

// Determine mode based on whether we have copied files and if we're in a different folder
const mode = computed(() => {
  return canPaste.value ? 'paste' : 'copy';
});

// Watch for URL changes
watch(currentUrl, (newUrl, oldUrl) => {
  if (!newUrl || newUrl === oldUrl) return;
  
  const newFolderId = newUrl.match(/folders\/(\d+)/)?.[1];
  const oldFolderId = oldUrl?.match(/folders\/(\d+)/)?.[1];
  
  if (newFolderId && newFolderId !== oldFolderId) {
    files.value = [];
    // Don't clear selectedFiles - we need to preserve them for copy/paste
    // Only clear if we're in copy mode (no files copied yet)
    if (copiedFiles.value.size === 0) {
      selectedFiles.value.clear();
    }
    initialize();
  }
});

const initialize = async (forceRefresh = false) => {
  try {
    await apiService.initialize();
    isAuthenticated.value = apiService.isAuthenticated();
    
    // Clear selections on force refresh
    if (forceRefresh) {
      selectedFiles.value.clear();
    }
    
    if (isAuthenticated.value && (forceRefresh || currentUrl.value !== tabState.value.lastLoadedUrl || !tabState.value.files?.length)) {
      await loadFiles();
      tabState.value.lastLoadedUrl = currentUrl.value;
    }
  } catch (err) {
    console.error('Failed to initialize:', err);
    error.value = 'Failed to initialize. Please refresh the page.';
  }
};

const getCurrentFolderIdFromUrl = (url: string): string | null => {
  const match = url.match(/folders\/(\d+)/);
  return match ? match[1] : null;
};

const getCurrentFolderId = async (): Promise<string | null> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    
    return getCurrentFolderIdFromUrl(tab.url);
  } catch (error) {
    console.error('Failed to get folder ID:', error);
    return null;
  }
};

const loadFiles = async () => {
  const folderId = await getCurrentFolderId();
  if (!folderId) {
    error.value = 'No folder ID found in URL';
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    // Load files (excluding folders and directories)
    const response = await apiService.listFolderContents(folderId, false);
    files.value = response.list.filter(item => 
      item.type !== 'application/vnd.aa.folder' && 
      item.type !== 'application/vnd.aa.directory'
    );
    totalFiles.value = files.value.length;
    currentOffset.value = 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load files';
    files.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  const folderId = await getCurrentFolderId();
  if (!folderId || loadingMore.value) return;

  loadingMore.value = true;
  
  try {
    const nextOffset = currentOffset.value + 200;
    const response = await apiService.listFolderContents(folderId, false);
    const newFiles = response.list.filter(item => 
      item.type !== 'application/vnd.aa.folder' && 
      item.type !== 'application/vnd.aa.directory'
    );
    files.value = [...files.value, ...newFiles];
    currentOffset.value = nextOffset;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load more files';
  } finally {
    loadingMore.value = false;
  }
};

const copySelectedFiles = async () => {
  if (selectedFiles.value.size === 0) return;
  
  const currentFolderId = await getCurrentFolderId();
  if (!currentFolderId) {
    error.value = 'Could not determine current folder';
    return;
  }
  
  // Create a new Map for file names
  const fileNamesMap = new Map<string, string>();
  
  // Store file names for display
  selectedFiles.value.forEach(fileId => {
    const file = files.value.find(f => f.id === fileId);
    if (file) {
      fileNamesMap.set(fileId, file.name);
    }
  });
  
  // Copy files using the clipboard store
  clipboardStore.copyFiles(selectedFiles.value, fileNamesMap, currentFolderId);
  
  // Clear selection
  selectedFiles.value.clear();
  
  // Show success message
  error.value = null;
  // Files copied successfully
};

const pasteFiles = async () => {
  if (copiedFiles.value.size === 0 || isPasting.value) return;
  
  const destinationFolderId = await getCurrentFolderId();
  if (!destinationFolderId) {
    error.value = 'Could not determine destination folder';
    return;
  }
  
  if (destinationFolderId === sourceFolderId.value) {
    error.value = 'Cannot paste files into the same folder';
    return;
  }
  
  isPasting.value = true;
  currentPasteIndex.value = 0;
  error.value = null;
  
  // First, get existing files in destination folder to check for duplicates
  let existingFileNames = new Set<string>();
  try {
    const response = await apiService.listFolderContents(destinationFolderId, false);
    existingFileNames = new Set(response.list.map(item => item.name.toLowerCase()));
  } catch (err) {
    console.error('Failed to check existing files:', err);
  }
  
  const fileIds = Array.from(copiedFiles.value);
  const results = {
    success: [] as string[],
    duplicates: [] as string[],
    failed: [] as { fileName: string; error: string }[]
  };
  
  for (let i = 0; i < fileIds.length; i++) {
    currentPasteIndex.value = i;
    const fileId = fileIds[i];
    const fileName = copiedFileNames.value.get(fileId) || 'Unknown';
    
    // Check if file already exists
    if (existingFileNames.has(fileName.toLowerCase())) {
      results.duplicates.push(fileName);
      continue;
    }
    
    try {
      await apiService.copyFile(fileId, fileName, destinationFolderId);
      results.success.push(fileName);
    } catch (err) {
      console.error(`Failed to copy file ${fileName}:`, err);
      results.failed.push({
        fileName,
        error: err instanceof Error ? err.message : 'Copy failed'
      });
    }
  }
  
  isPasting.value = false;
  showPasteResults.value = true;
  pasteResults.value = results;
  
  // Refresh the tool to show updated files in the current folder
  if (results.success.length > 0) {
    await loadFiles();
    
    // Refresh the folder list in the web app
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshFolderList' });
      }
    });
  }
};

const clearCopiedFiles = () => {
  clipboardStore.clearClipboard();
  currentPasteIndex.value = 0;
  showPasteResults.value = false;
  pasteResults.value = {
    success: [],
    duplicates: [],
    failed: []
  };
};

const closePasteResults = () => {
  showPasteResults.value = false;
  // Clear copied files after viewing results
  clearCopiedFiles();
};

const getFileName = (fileId: string): string => {
  // Try to get from the stored map
  const fileName = copiedFileNames.value.get(fileId);
  if (fileName) return fileName;
  
  // If not found in map, return a placeholder
  return 'Unknown file';
};

const handleSelectionChange = (newSelection: Set<string>) => {
  selectedFiles.value = newSelection;
};

onMounted(() => {
  if (!tabState.value.lastLoadedUrl || !tabState.value.files || tabState.value.files.length === 0) {
    initialize();
  }
});
</script>

<style scoped>
.copy-files-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.folder-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  font-weight: 500;
}

.auth-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid var(--warning-border, #fbbf24);
  border-radius: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.info-message.success {
  background: #d1fae5;
  color: #065f46;
}

.info-message p {
  margin: 0;
}

.action-bar {
  position: sticky;
  bottom: 0;
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 0.5rem;
}

.copy-btn, .paste-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--primary-color, #2563eb);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.copy-btn:hover, .paste-btn:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
}

.paste-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--danger-color, #ef4444);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--danger-hover, #dc2626);
}

.copied-files-preview {
  padding: 1rem;
  background: #f0fdf4;
  border-bottom: 1px solid var(--success-border, #bbf7d0);
}

.copied-files-preview h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #166534;
  font-weight: 600;
}

.clipboard-files {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.clipboard-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: white;
  border: 1px solid var(--success-border, #bbf7d0);
  border-radius: 0.375rem;
  font-size: 0.813rem;
  color: #166534;
}

.clipboard-file svg {
  color: #22c55e;
  flex-shrink: 0;
}

.copied-files-list {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.copied-files-list h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.copied-files-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.copied-files-list li {
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #374151;
}

.paste-progress {
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color, #2563eb);
  transition: width 0.3s ease;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.result-section {
  margin-bottom: 1.5rem;
}

.result-section:last-child {
  margin-bottom: 0;
}


.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.result-header.success {
  color: #059669;
}

.result-header.warning {
  color: #d97706;
}

.result-header.error {
  color: #dc2626;
}

.result-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.result-list li {
  padding: 0.375rem 0;
  font-size: 0.875rem;
  color: #374151;
}

.skip-message, .error-message {
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  text-align: right;
}

.modal-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  background: #e5e7eb;
}
</style>