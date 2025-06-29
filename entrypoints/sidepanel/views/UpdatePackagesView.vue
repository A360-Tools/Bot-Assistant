<template>
  <div class="update-packages-view">
    <ToolHeader
      title="Update Bot Packages"
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
      <div class="info-message">
        <Info :size="16" />
        <p>Select bots to update their packages to default versions.</p>
      </div>
      
      <BotList
        :bots="bots"
        :loading="loading"
        :error="error"
        :selectedBots="selectedBots"
        :updating="updatingBots"
        :botStatuses="botStatuses"
        :hasMore="hasMore"
        :loadingMore="loadingMore"
        @update:selectedBots="selectedBots = $event"
        @retry="loadBots"
        @loadMore="loadMore"
      />
      
      <div v-if="selectedBots.size > 0" class="action-bar">
        <button
          @click="updateSelectedBots"
          :disabled="isUpdating"
          class="update-btn"
        >
          <Package :size="16" />
          {{ isUpdating ? 'Updating... Do not close sidepanel' : `Update ${selectedBots.size} Bot${selectedBots.size > 1 ? 's' : ''}` }}
        </button>
      </div>
      
      <!-- Results Modal -->
      <div v-if="showResults" class="modal-overlay" @click="closeResults">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Update Results</h3>
            <button @click="closeResults" class="close-btn">
              <X :size="20" />
            </button>
          </div>
          
          <div class="modal-body">
            <div v-if="updateResults.success.length > 0" class="result-section">
              <div class="result-header success">
                <CheckCircle :size="16" />
                <span>Successfully Updated ({{ updateResults.success.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="botId in updateResults.success" :key="botId">
                  {{ getBotName(botId) }}
                </li>
              </ul>
            </div>
            
            <div v-if="updateResults.skipped.length > 0" class="result-section">
              <div class="result-header skipped">
                <AlertCircle :size="16" />
                <span>Skipped ({{ updateResults.skipped.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="botId in updateResults.skipped" :key="botId">
                  {{ getBotName(botId) }}
                  <span class="skip-message">{{ getSkipReason(botId) }}</span>
                </li>
              </ul>
            </div>
            
            <div v-if="updateResults.failed.length > 0" class="result-section">
              <div class="result-header error">
                <XCircle :size="16" />
                <span>Failed to Update ({{ updateResults.failed.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="failure in updateResults.failed" :key="failure.fileId">
                  <strong>{{ getBotName(failure.fileId) }}</strong>
                  <span class="error-message">{{ failure.error }}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="modal-footer">
            <button @click="closeResults" class="modal-btn">Close</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Info, Package, CheckCircle, XCircle, X } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import BotList from '../components/BotList.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService, type FolderItem } from '../services/api';
import { useTabState } from '../composables/useTabState';
import { usePageContext } from '../composables/usePageContext';

defineEmits<{
  back: [];
}>();


// Use per-tab state
const tabState = useTabState({
  bots: [] as FolderItem[],
  currentOffset: 0,
  totalBots: 0,
  lastLoadedUrl: '',
  isAuthenticated: false
});

// Local reactive state
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const updatingBots = ref(new Set<string>());
const botStatuses = ref(new Map<string, { status: 'updating' | 'success' | 'skipped' | 'failed'; error?: string }>());
const isUpdating = ref(false);
const showResults = ref(false);
const updateResults = ref({
  success: [] as string[],
  skipped: [] as string[],
  failed: [] as Array<{ fileId: string; error: string }>,
});

// Get current URL from page context
const { currentUrl } = usePageContext();

// Create computed refs for tab state
const bots = computed({
  get: () => tabState.value.bots || [],
  set: (value) => { tabState.value.bots = value; }
});

const currentOffset = computed({
  get: () => tabState.value.currentOffset || 0,
  set: (value) => { tabState.value.currentOffset = value; }
});

const totalBots = computed({
  get: () => tabState.value.totalBots || 0,
  set: (value) => { tabState.value.totalBots = value; }
});

const selectedBots = ref(new Set<string>());

const isAuthenticated = computed({
  get: () => tabState.value.isAuthenticated || false,
  set: (value) => { tabState.value.isAuthenticated = value; }
});

const hasMore = computed(() => {
  return currentOffset.value + bots.value.length < totalBots.value;
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
  if (newFolderId && (newFolderId !== oldFolderId || !tabState.value.bots?.length)) {
    // Clear existing data to show loading state
    bots.value = [];
    selectedBots.value.clear();
    initialize();
  }
});

const initialize = async (forceRefresh = false) => {
  try {
    await apiService.initialize();
    isAuthenticated.value = apiService.isAuthenticated();
    
    // Clear selections on force refresh
    if (forceRefresh) {
      selectedBots.value.clear();
    }
    
    // Load bots if: forced refresh, URL changed, or no data loaded yet
    if (isAuthenticated.value && (forceRefresh || currentUrl.value !== tabState.value.lastLoadedUrl || !tabState.value.bots?.length)) {
      await loadBots();
      tabState.value.lastLoadedUrl = currentUrl.value;
    }
  } catch (err) {
    console.error('Failed to initialize:', err);
    error.value = 'Failed to initialize. Please refresh the page.';
  }
};

const getCurrentFolderId = async (): Promise<string | null> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    
    const match = tab.url.match(/folders\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to get folder ID:', error);
    return null;
  }
};

const loadBots = async () => {
  const folderId = await getCurrentFolderId();
  if (!folderId) {
    error.value = 'No folder ID found in URL';
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiService.listBotsInFolder(folderId);
    bots.value = response.list;
    totalBots.value = response.page.totalFilter;
    currentOffset.value = 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load bots';
    bots.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  const folderId = await getCurrentFolderId();
  if (!folderId || loadingMore.value) return;

  loadingMore.value = true;
  
  try {
    // In a real implementation, you'd pass the offset to the API
    const nextOffset = currentOffset.value + 200;
    const response = await apiService.listBotsInFolder(folderId);
    bots.value = [...bots.value, ...response.list];
    currentOffset.value = nextOffset;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load more bots';
  } finally {
    loadingMore.value = false;
  }
};

const updateSelectedBots = async () => {
  if (selectedBots.value.size === 0 || isUpdating.value) return;
  
  isUpdating.value = true;
  updatingBots.value = new Set(selectedBots.value);
  botStatuses.value.clear();
  
  try {
    const fileIds = Array.from(selectedBots.value);
    
    // Progress callback for live updates
    const onProgress = (fileId: string, status: 'updating' | 'success' | 'skipped' | 'failed', error?: string) => {
      botStatuses.value.set(fileId, { status, error });
      
      // Update the updatingBots set based on status
      if (status !== 'updating') {
        updatingBots.value.delete(fileId);
        // Force reactivity
        updatingBots.value = new Set(updatingBots.value);
      }
    };
    
    const results = await apiService.updateBotsPackages(fileIds, onProgress);
    
    updateResults.value = results;
    showResults.value = true;
    
    // Clear selection after successful update
    selectedBots.value.clear();
    
    // Refresh the folder list in the web app if any bots were updated
    if (results.success.length > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshFolderList' });
        }
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update packages';
  } finally {
    isUpdating.value = false;
    updatingBots.value.clear();
    // Don't clear botStatuses here - keep them for display
  }
};

const getBotName = (botId: string): string => {
  const bot = bots.value.find(b => b.id === botId);
  return bot?.name || botId;
};

const getSkipReason = (botId: string): string => {
  // Check bot status to determine why it was skipped
  const status = botStatuses.value.get(botId);
  // For now, return a generic message. In the future, we could track specific reasons
  return 'Already up to date or no packages to update';
};

const closeResults = () => {
  showResults.value = false;
  updateResults.value = {
    success: [],
    skipped: [],
    failed: [],
  };
  // Clear bot statuses after closing results
  botStatuses.value.clear();
};


onMounted(() => {
  // Only initialize if we haven't loaded data for this tab yet
  if (!tabState.value.lastLoadedUrl || !tabState.value.bots || tabState.value.bots.length === 0) {
    initialize();
  }
});
</script>

<style scoped>
.update-packages-view {
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

.update-btn {
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

.update-btn:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
}

.update-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Styles */
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
  z-index: 1000;
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
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
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
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.result-header.success {
  color: #059669;
}

.result-header.skipped {
  color: #f59e0b;
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