<template>
  <div class="patch-content-view">
    <ToolHeader
      title="Patch Files"
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
        <p>Find and replace text in selected bot files.</p>
      </div>
      
      <!-- String replacement inputs -->
      <div v-if="!isReplacing" class="replacement-inputs">
        <!-- Search Mode Selection -->
        <div class="search-mode-section">
          <label class="section-label">Search Mode:</label>
          <div class="radio-group">
            <label class="radio-label">
              <input 
                type="radio" 
                v-model="searchMode" 
                value="values"
                class="radio-input"
              />
              <div class="radio-content">
                <span class="radio-title">Values Only</span>
                <small class="radio-description">Search and replace within text values</small>
              </div>
            </label>
            <label class="radio-label">
              <input 
                type="radio" 
                v-model="searchMode" 
                value="json"
                class="radio-input"
              />
              <div class="radio-content">
                <span class="radio-title">Full JSON</span>
                <small class="radio-description">Search and replace in entire JSON structure</small>
              </div>
            </label>
          </div>
        </div>

        <!-- Mode-specific info -->
        <div v-if="searchMode === 'values'" class="mode-info info">
          <Info :size="16" />
          <span>Searching within text values only. Your search text will be matched literally.</span>
        </div>
        
        <div v-else class="mode-info warning">
          <AlertCircle :size="16" />
          <span>Searching in raw JSON structure. Special characters (quotes, backslashes) must be properly escaped.</span>
        </div>

        <!-- Escape option (only for JSON mode) -->
        <div v-if="searchMode === 'json'" class="escape-option">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="escapeForJson"
              class="checkbox-input"
            />
            <span>Escape for JSON</span>
          </label>
          <span class="help-text">Automatically escape quotes, backslashes, and other special characters</span>
        </div>
        
        <div class="input-group">
          <label for="search-string">Find Text:</label>
          <textarea
            id="search-string"
            v-model="searchString"
            placeholder="Enter text to find..."
            class="input-field textarea-field"
            rows="3"
          />
          <div v-if="searchMode === 'json' && escapeForJson" class="preview-field">
            <span class="preview-label">Will search for:</span>
            <code>{{ escapeJsonString(searchString) }}</code>
          </div>
        </div>
        
        <div class="input-group">
          <label for="replace-string">Replace With:</label>
          <textarea
            id="replace-string"
            v-model="replaceString"
            placeholder="Enter replacement text..."
            class="input-field textarea-field"
            rows="3"
          />
          <div v-if="searchMode === 'json' && escapeForJson && (replaceString || replaceString === '')" class="preview-field">
            <span class="preview-label">Will replace with:</span>
            <code>{{ escapeJsonString(replaceString) }}</code>
          </div>
        </div>

        <!-- Examples -->
        <div class="examples-section">
          <h4>Examples for {{ searchMode === 'values' ? 'Values Only' : 'Full JSON' }} mode:</h4>
          <div v-if="searchMode === 'values'" class="example">
            <div class="example-item">
              <strong>Find:</strong> <code>John</code><br>
              <strong>Matches:</strong> <code>"name": "John"</code>, <code>"user": "John Doe"</code><br>
              <strong>Doesn't match:</strong> <code>{"John": "value"}</code> (key names)
            </div>
          </div>
          <div v-else class="example">
            <div class="example-item">
              <strong>Find:</strong> <code>"name": "John"</code><br>
              <strong>Matches:</strong> Exact JSON structure<br>
              <strong>Note:</strong> Use "Escape for JSON" if entering unescaped text
            </div>
          </div>
        </div>
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
      
      <div v-if="selectedBots.size > 0 && searchString" class="action-bar">
        <button
          @click="replaceInSelectedBots"
          :disabled="isReplacing || !searchString"
          class="replace-btn"
        >
          <Code :size="16" />
          {{ isReplacing ? 'Patching... Do not close sidepanel' : `Patch ${selectedBots.size} Bot${selectedBots.size > 1 ? 's' : ''}` }}
        </button>
        
        <div v-if="isReplacing" class="patch-progress">
          <div class="progress-info">
            <Loader2 :size="16" class="spinner" />
            <span>Patching bot {{ currentPatchIndex + 1 }} of {{ totalPatchCount }}...</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: patchProgress + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- Results Modal -->
      <div v-if="showResults" class="modal-overlay" @click="closeResults">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Patch Results</h3>
            <button @click="closeResults" class="close-btn">
              <X :size="20" />
            </button>
          </div>
          
          <div class="modal-body">
            <div v-if="replaceResults.success.length > 0" class="result-section">
              <div class="result-header success">
                <CheckCircle :size="16" />
                <span>Successfully Updated ({{ replaceResults.success.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="result in replaceResults.success" :key="result.fileId">
                  <strong>{{ getBotName(result.fileId) }}</strong>
                  <span class="replace-count">{{ result.count }} replacement{{ result.count !== 1 ? 's' : '' }}</span>
                </li>
              </ul>
            </div>
            
            <div v-if="replaceResults.skipped.length > 0" class="result-section">
              <div class="result-header skipped">
                <AlertCircle :size="16" />
                <span>Skipped ({{ replaceResults.skipped.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="botId in replaceResults.skipped" :key="botId">
                  {{ getBotName(botId) }}
                  <span class="skip-message">No occurrences found</span>
                </li>
              </ul>
            </div>
            
            <div v-if="replaceResults.failed.length > 0" class="result-section">
              <div class="result-header error">
                <XCircle :size="16" />
                <span>Failed to Update ({{ replaceResults.failed.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="failure in replaceResults.failed" :key="failure.fileId">
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
import { Info, Code, CheckCircle, XCircle, X, AlertCircle, Loader2 } from 'lucide-vue-next';
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
  isAuthenticated: false,
  searchString: '',
  replaceString: '',
  escapeForJson: false,
  searchMode: 'values' // Default to values mode
});

// Local reactive state
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const updatingBots = ref(new Set<string>());
const botStatuses = ref(new Map<string, { status: 'updating' | 'success' | 'skipped' | 'failed'; error?: string }>());
const isReplacing = ref(false);
const showResults = ref(false);
const currentPatchIndex = ref(0);
const totalPatchCount = ref(0);
const replaceResults = ref({
  success: [] as Array<{ fileId: string; count: number }>,
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

const searchString = computed({
  get: () => tabState.value.searchString || '',
  set: (value) => { tabState.value.searchString = value; }
});

const replaceString = computed({
  get: () => tabState.value.replaceString || '',
  set: (value) => { tabState.value.replaceString = value; }
});

const escapeForJson = computed({
  get: () => tabState.value.escapeForJson || false,
  set: (value) => { tabState.value.escapeForJson = value; }
});

const searchMode = computed({
  get: () => tabState.value.searchMode || 'values',
  set: (value) => { tabState.value.searchMode = value; }
});

const hasMore = computed(() => {
  return currentOffset.value + bots.value.length < totalBots.value;
});

const patchProgress = computed(() => {
  if (totalPatchCount.value === 0) return 0;
  return Math.round((currentPatchIndex.value / totalPatchCount.value) * 100);
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

// JSON escape function
const escapeJsonString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')  // Replace backslash with double backslash
    .replace(/"/g, '\\"')    // Replace quotes with escaped quotes
    .replace(/\n/g, '\\n')   // Replace newline with \n
    .replace(/\r/g, '\\r')   // Replace carriage return with \r
    .replace(/\t/g, '\\t')   // Replace tab with \t
    .replace(/\f/g, '\\f');  // Replace form feed with \f
};

// Utility function to escape regex special characters
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Search only in string values
const searchInValues = (obj: any, search: string, replace: string): { newObj: any; count: number } => {
  let count = 0;
  
  const traverse = (current: any): any => {
    if (typeof current === 'string') {
      // Count matches
      const matches = (current.match(new RegExp(escapeRegExp(search), 'g')) || []).length;
      if (matches > 0) {
        count += matches;
        // Replace all occurrences
        return current.replace(new RegExp(escapeRegExp(search), 'g'), replace);
      }
      return current;
    } else if (Array.isArray(current)) {
      return current.map(item => traverse(item));
    } else if (typeof current === 'object' && current !== null) {
      const newObj: any = {};
      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          newObj[key] = traverse(current[key]);
        }
      }
      return newObj;
    }
    return current;
  };
  
  const newObj = traverse(obj);
  return { newObj, count };
};

// Search in full JSON (current behavior)
const searchInFullJson = (jsonString: string, search: string, replace: string): { newJson: string; count: number } => {
  const matches = (jsonString.match(new RegExp(escapeRegExp(search), 'g')) || []).length;
  const newJson = jsonString.replace(new RegExp(escapeRegExp(search), 'g'), replace);
  return { newJson, count: matches };
};

const replaceInSelectedBots = async () => {
  if (selectedBots.value.size === 0 || isReplacing.value || !searchString.value) return;
  
  isReplacing.value = true;
  updatingBots.value = new Set(selectedBots.value);
  botStatuses.value.clear();
  
  replaceResults.value = {
    success: [],
    skipped: [],
    failed: [],
  };
  
  // Initialize progress tracking
  currentPatchIndex.value = 0;
  totalPatchCount.value = selectedBots.value.size;
  
  try {
    const fileIds = Array.from(selectedBots.value);
    
    // Process each bot
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      currentPatchIndex.value = i;
      try {
        // Notify that we're starting to update this bot
        botStatuses.value.set(fileId, { status: 'updating' });
        
        // Get bot content
        const botContent = await apiService.getBotContent(fileId);
        
        let updatedContent;
        let occurrences = 0;
        
        if (searchMode.value === 'values') {
          // Search in values only
          const result = searchInValues(botContent, searchString.value, replaceString.value);
          updatedContent = result.newObj;
          occurrences = result.count;
        } else {
          // Search in full JSON
          const contentString = JSON.stringify(botContent);
          const searchText = escapeForJson.value ? escapeJsonString(searchString.value) : searchString.value;
          const replaceText = escapeForJson.value ? escapeJsonString(replaceString.value) : replaceString.value;
          
          const result = searchInFullJson(contentString, searchText, replaceText);
          occurrences = result.count;
          
          if (occurrences > 0) {
            // Parse back to JSON and validate
            try {
              updatedContent = JSON.parse(result.newJson);
            } catch (parseError) {
              throw new Error('Invalid JSON after replacement');
            }
          }
        }
        
        if (occurrences === 0) {
          // Skip if no occurrences found
          replaceResults.value.skipped.push(fileId);
          botStatuses.value.set(fileId, { status: 'skipped' });
          updatingBots.value.delete(fileId);
          updatingBots.value = new Set(updatingBots.value);
          continue;
        }
        
        // Save updated content
        await apiService.updateBotContent(fileId, updatedContent);
        
        replaceResults.value.success.push({ fileId, count: occurrences });
        botStatuses.value.set(fileId, { status: 'success' });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to update bot';
        replaceResults.value.failed.push({ fileId, error: errorMsg });
        botStatuses.value.set(fileId, { status: 'failed', error: errorMsg });
      } finally {
        updatingBots.value.delete(fileId);
        // Force reactivity
        updatingBots.value = new Set(updatingBots.value);
      }
    }
    
    showResults.value = true;
    
    // Clear selection after completion
    selectedBots.value.clear();
    
    // Refresh the folder list in the web app if any bots were updated
    if (replaceResults.value.success.length > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshFolderList' });
        }
      });
      
      // Refresh the bot list to show updated content
      await loadBots();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to patch content';
  } finally {
    isReplacing.value = false;
    updatingBots.value.clear();
    currentPatchIndex.value = totalPatchCount.value; // Set to 100% when done
  }
};

const getBotName = (botId: string): string => {
  const bot = bots.value.find(b => b.id === botId);
  return bot?.name || botId;
};

const closeResults = () => {
  showResults.value = false;
  replaceResults.value = {
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
.patch-content-view {
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

.replacement-inputs {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-mode-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.radio-label:has(input:checked) {
  border-color: var(--primary-color, #2563eb);
  background: #eff6ff;
}

.radio-input {
  margin-top: 0.125rem;
  cursor: pointer;
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.radio-title {
  font-weight: 500;
  color: #111827;
}

.radio-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.mode-info {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.mode-info.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.mode-info.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fbbf24;
}

.escape-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input-field {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-color, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.preview-field {
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.preview-label {
  color: #6b7280;
  margin-right: 0.5rem;
}

.preview-field code {
  color: #111827;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.examples-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.examples-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.example-item {
  font-size: 0.75rem;
  line-height: 1.5;
  color: #4b5563;
}

.example-item strong {
  color: #374151;
}

.example-item code {
  background: #e5e7eb;
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
  font-size: 0.6875rem;
}

.action-bar {
  position: sticky;
  bottom: 0;
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.replace-btn {
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

.replace-btn:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
}

.replace-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Progress Bar Styles */
.patch-progress {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  margin-top: 0.75rem;
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

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.replace-count {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #059669;
  background: #d1fae5;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
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