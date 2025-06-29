<template>
  <div class="download-files-view">
    <ToolHeader
      title="Download Files"
      :showBack="true"
      :showRefresh="true"
      :refreshing="loading"
      @refresh="initialize(true)"
      @back="$emit('back')"
    >
      <template #actions>
        <span class="folder-type">{{ folderType }}</span>
      </template>
    </ToolHeader>
    
    <ConnectionError v-if="!isAuthenticated" type="authentication" @retry="initialize()" />
    
    <template v-else>
      <div class="info-message">
        <Info :size="16" />
        <p>Select files to download from this folder.</p>
      </div>
      
      <FileList
        :files="files"
        :loading="loading"
        :error="error"
        :downloading="downloading"
        :hasMore="hasMore"
        :loadingMore="loadingMore"
        @update:selectedFiles="handleSelectionChange"
        @retry="loadFiles"
        @loadMore="loadMore"
      />
      
      <div v-if="selectedFiles.size > 0" class="action-bar">
        <button
          @click="downloadSelectedFiles"
          :disabled="isDownloading"
          class="download-btn"
        >
          <Download :size="16" />
          {{ isDownloading ? 'Downloading...' : `Download ${selectedFiles.size} File${selectedFiles.size > 1 ? 's' : ''}` }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Download, Info } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import FileList from '../components/FileList.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService, type FolderItem } from '../services/api';
import { useTabState } from '../composables/useTabState';
import { usePageContext } from '../composables/usePageContext';

defineEmits<{
  back: [];
}>();


// Use per-tab state
const tabState = useTabState({
  files: [] as FolderItem[],
  currentOffset: 0,
  totalFiles: 0,
  lastLoadedUrl: '',
  isAuthenticated: false
});

// Local reactive state
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const downloading = ref(new Set<string>());
const isDownloading = ref(false);

// Get current URL from page context
const { currentUrl } = usePageContext();

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

const selectedFiles = ref(new Set<string>());

const isAuthenticated = computed({
  get: () => tabState.value.isAuthenticated || false,
  set: (value) => { tabState.value.isAuthenticated = value; }
});

const hasMore = computed(() => {
  return currentOffset.value + files.value.length < totalFiles.value;
});

const folderType = computed(() => {
  if (currentUrl.value.includes('/private/')) return 'Private Folder';
  if (currentUrl.value.includes('/public/')) return 'Public Folder';
  return 'Folder';
});

// Reload when URL changes to a different folder
watch(currentUrl, (newUrl, oldUrl) => {
  if (!newUrl || newUrl === oldUrl) return;
  
  // Extract folder IDs from URLs
  const newFolderId = newUrl.match(/folders\/(\d+)/)?.[1];
  const oldFolderId = oldUrl?.match(/folders\/(\d+)/)?.[1];
  
  // Reload if:
  // 1. We have a new folder ID and it's different from the old one
  // 2. Or if this is a folder URL but we haven't loaded any data yet
  if (newFolderId && (newFolderId !== oldFolderId || !tabState.value.files?.length)) {
    // Clear existing data to show loading state
    files.value = [];
    selectedFiles.value.clear();
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
    
    // Load files if: forced refresh, URL changed, or no data loaded yet
    if (isAuthenticated.value && (forceRefresh || currentUrl.value !== tabState.value.lastLoadedUrl || !tabState.value.files?.length)) {
      await loadFiles();
      tabState.value.lastLoadedUrl = currentUrl.value;
    }
  } catch (err) {
    console.error('Failed to initialize:', err);
    error.value = 'Failed to initialize. Please refresh the page.';
  }
};

const getCurrentFolderId = async (): Promise<string | null> => {
  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    
    // Extract folder ID from URL
    const match = tab.url.match(/folders\/(\d+)/);
    return match ? match[1] : null;
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
    const response = await apiService.listFolderContents(folderId, true);
    files.value = response.list;
    totalFiles.value = response.page.totalFilter;
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
    const response = await apiService.listFolderContents(folderId, true);
    // In a real implementation, you'd pass the offset to the API
    // For now, we'll just append the same results
    files.value = [...files.value, ...response.list];
    currentOffset.value = nextOffset;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load more files';
  } finally {
    loadingMore.value = false;
  }
};

const downloadSelectedFiles = async () => {
  if (selectedFiles.value.size === 0 || isDownloading.value) return;
  
  isDownloading.value = true;
  const fileIds = Array.from(selectedFiles.value);
  
  for (const fileId of fileIds) {
    const file = files.value.find(f => f.id === fileId);
    if (!file) continue;
    
    downloading.value.add(fileId);
    
    try {
      const blob = await apiService.downloadFile(fileId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      // File downloaded successfully
    } catch (err) {
      // Download failed
      // Extract meaningful error message
      let errorMessage = 'Failed to download';
      if (err instanceof Error) {
        // Check if it's a specific error message
        if (err.message.includes('HTTP error')) {
          errorMessage = `Download failed: ${err.message}`;
        } else if (err.message.includes('not found')) {
          errorMessage = `File not found: ${file.name}`;
        } else if (err.message.includes('permission') || err.message.includes('authorized')) {
          errorMessage = `Permission denied: ${file.name}`;
        } else {
          errorMessage = `Failed to download ${file.name}: ${err.message}`;
        }
      } else {
        errorMessage = `Failed to download ${file.name}`;
      }
      error.value = errorMessage;
    } finally {
      downloading.value.delete(fileId);
      // Force reactivity update
      downloading.value = new Set(downloading.value);
    }
  }
  
  // Clear selection after download
  selectedFiles.value.clear();
  selectedFiles.value = new Set(); // Force reactivity
  isDownloading.value = false;
};

const handleSelectionChange = (newSelection: Set<string>) => {
  selectedFiles.value = newSelection;
};

onMounted(() => {
  // Only initialize if we haven't loaded data for this tab yet
  if (!tabState.value.lastLoadedUrl || !tabState.value.files || tabState.value.files.length === 0) {
    initialize();
  }
});
</script>

<style scoped>
.download-files-view {
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
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color, #2563eb);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>