<template>
  <div class="content-modification-view">
    <ToolHeader
      title="Content Modification"
      :show-back="true"
      :show-refresh="true"
      :refreshing="loading"
      @refresh="loadBotContent"
      @back="handleBack"
    />

    <div v-if="reloadingAfterSave" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
      <p>Refreshing content after save...</p>
    </div>
    
    <div v-else-if="loading" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
      <p>Loading bot content...</p>
    </div>

    <ConnectionError 
      v-else-if="error"
      :type="getErrorType(error)"
      :customMessage="error"
      @retry="loadBotContent"
    />

    <div v-else class="content">
      <div class="bot-info-card">
        <div class="bot-info-header">
          <div class="bot-icon">
            <Code :size="24" />
          </div>
          <div class="bot-details">
            <h3>Bot Content Editor</h3>
            <div class="bot-meta">
              <span class="meta-item">
                <FileJson :size="14" />
                JSON Format
              </span>
              <span v-if="fileId" class="meta-item">
                <Hash :size="14" />
                {{ fileId }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-section">
        <div class="section-header">
          <h4>
            <FileText :size="18" />
            Bot Content
          </h4>
          <div class="header-actions">
            <span v-if="isDirty" class="status-badge modified">
              <Edit :size="14" />
              Modified
            </span>
            <span v-else class="status-badge saved">
              <Check :size="14" />
              Original
            </span>
          </div>
        </div>

        <div class="editor-container">
          <div class="editor-toolbar">
            <button
              @click="copyToClipboard"
              class="toolbar-button"
              :class="{ 'success': copied }"
              title="Copy content to clipboard"
            >
              <Copy v-if="!copied" :size="18" />
              <CheckCircle v-else :size="18" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
            
            <button
              @click="formatJSON"
              class="toolbar-button"
              title="Format JSON"
            >
              <Wand2 :size="18" />
              Format
            </button>
            
            <button
              @click="validateJSON"
              class="toolbar-button"
              :class="{ 'error': !isValidJSON && jsonContent.trim() !== '' }"
              title="Validate JSON"
            >
              <Shield :size="18" />
              Validate
            </button>
            
            <button
              @click="resetContent"
              class="toolbar-button"
              :disabled="!isDirty"
              title="Reset to original content"
            >
              <RotateCcw :size="18" />
              Reset
            </button>
          </div>

          <div class="editor-wrapper">
            <textarea
              v-model="jsonContent"
              @input="handleContentChange"
              class="json-editor"
              :class="{ 
                'invalid': !isValidJSON && jsonContent.trim() !== '',
                'modified': isDirty
              }"
              placeholder="Paste or edit bot content JSON here..."
              spellcheck="false"
            ></textarea>
            
            <div v-if="!isValidJSON && jsonContent.trim() !== ''" class="validation-error">
              <AlertCircle :size="16" />
              {{ validationError }}
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button
            @click="updateBotContent"
            class="primary-button"
            :disabled="!isValidJSON || !isDirty || updating"
            :class="{ 'updating': updating }"
          >
            <Loader2 v-if="updating" :size="18" class="animate-spin" />
            <Upload v-else :size="18" />
            {{ updating ? 'Updating...' : 'Update Bot Content' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="toast success">
        <CheckCircle :size="20" />
        <span>Bot content updated successfully! Refreshing page...</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { 
  Code,
  FileText,
  FileJson,
  Hash,
  Copy,
  CheckCircle,
  Upload,
  Wand2,
  Shield,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Loader2,
  Edit,
  Check
} from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService } from '../services/api';
import { ERROR_MESSAGES, getErrorType } from '../utils/errorMessages';
import { usePageContext } from '../composables/usePageContext';

const emit = defineEmits(['back']);
const { pageContext } = usePageContext();

const loading = ref(true);
const error = ref('');
const updating = ref(false);
const copied = ref(false);
const showSuccessToast = ref(false);
const reloadingAfterSave = ref(false);

const originalContent = ref('');
const jsonContent = ref('');
const isValidJSON = ref(true);
const validationError = ref('');

// Extract file ID from page context
const fileId = computed(() => pageContext.value?.fileId || null);

// Check if content has been modified
const isDirty = computed(() => jsonContent.value !== originalContent.value);

const loadBotContent = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    await apiService.initialize();
    
    if (!apiService.isAuthenticated()) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    if (!fileId.value) {
      throw new Error('No bot file ID found. Please open a bot file.');
    }

    // Get bot content
    const botContent = await apiService.getBotContent(fileId.value);
    const formattedContent = JSON.stringify(botContent, null, 2);
    
    originalContent.value = formattedContent;
    jsonContent.value = formattedContent;
    isValidJSON.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load bot content';
  } finally {
    loading.value = false;
  }
};

const handleContentChange = () => {
  validateJSON();
};

const validateJSON = () => {
  if (jsonContent.value.trim() === '') {
    isValidJSON.value = true;
    validationError.value = '';
    return;
  }
  
  try {
    JSON.parse(jsonContent.value);
    isValidJSON.value = true;
    validationError.value = '';
  } catch (err) {
    isValidJSON.value = false;
    if (err instanceof Error) {
      const match = err.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const lines = jsonContent.value.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        validationError.value = `Invalid JSON: ${err.message} (Line ${line}, Column ${column})`;
      } else {
        validationError.value = `Invalid JSON: ${err.message}`;
      }
    } else {
      validationError.value = 'Invalid JSON format';
    }
  }
};

const formatJSON = () => {
  if (!isValidJSON.value) return;
  
  try {
    const parsed = JSON.parse(jsonContent.value);
    jsonContent.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    // Already validated, shouldn't happen
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(jsonContent.value);
    copied.value = true;
    
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    // Failed to copy to clipboard
  }
};

const resetContent = () => {
  jsonContent.value = originalContent.value;
  validateJSON();
};

const updateBotContent = async () => {
  if (!isValidJSON.value || !isDirty.value || !fileId.value) return;
  
  updating.value = true;
  
  try {
    const content = JSON.parse(jsonContent.value);
    await apiService.updateBotContent(fileId.value, content);
    
    // Update original content to reflect the saved state
    originalContent.value = jsonContent.value;
    
    // Show success toast
    showSuccessToast.value = true;
    setTimeout(() => {
      showSuccessToast.value = false;
    }, 3000);
    
    // Refresh the page to show updated content
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }, 1000); // Wait a second to let the success message show
  } catch (err) {
    // Failed to update bot content
    error.value = err instanceof Error ? err.message : 'Failed to update bot content';
  } finally {
    updating.value = false;
  }
};

const handleBack = () => {
  emit('back');
};

// Watch for file ID changes
watch(fileId, (newFileId) => {
  if (newFileId) {
    loadBotContent();
  }
});

onMounted(() => {
  if (fileId.value) {
    loadBotContent();
  }
  
  // Listen for bot saved events from content script
  const handleBotSaved = (message: any) => {
    if (message.action === 'botSaved' && !loading.value && !updating.value && !reloadingAfterSave.value) {
      // Show loading state with refresh message
      reloadingAfterSave.value = true;
      
      // Wait a bit for the save to complete before reloading
      setTimeout(() => {
        loadBotContent().finally(() => {
          reloadingAfterSave.value = false;
        });
      }, 1500);
    }
  };
  
  chrome.runtime.onMessage.addListener(handleBotSaved);
  
  // Cleanup listener on unmount
  onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleBotSaved);
  });
});

onUnmounted(() => {
  // Defined above in onMounted for proper cleanup
});
</script>

<style scoped>
.content-modification-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  text-align: center;
  gap: var(--space-md);
}

.error-state {
  color: var(--error);
}

.error-state svg {
  color: var(--error);
}

.loading-state p,
.error-state p {
  font-size: var(--font-base);
  color: var(--text-secondary);
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-base);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.bot-info-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.bot-info-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
}

.bot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--info-light);
  color: var(--primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.bot-details {
  flex: 1;
}

.bot-details h3 {
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
}

.bot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.meta-item svg {
  color: var(--text-tertiary);
}

.content-section {
  margin-top: var(--space-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.section-header h4 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-header h4 svg {
  color: var(--primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.status-badge.saved {
  background: var(--success-light);
  color: var(--success);
}

.status-badge.modified {
  background: var(--warning-light);
  color: var(--warning);
}

.editor-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--primary);
  color: var(--primary);
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-button.success {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.toolbar-button.error {
  background: var(--error-light);
  color: var(--error);
  border-color: var(--error);
}

.editor-wrapper {
  position: relative;
}

.json-editor {
  width: 100%;
  min-height: 400px;
  max-height: 600px;
  padding: var(--space-lg);
  background: var(--bg-primary);
  border: none;
  font-family: 'Courier New', monospace;
  font-size: var(--font-sm);
  line-height: 1.5;
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.json-editor.invalid {
  background: var(--error-light);
}

.json-editor.modified {
  border-left: 3px solid var(--warning);
}

.validation-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--error-light);
  color: var(--error);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

.primary-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button.updating {
  background: var(--primary-hover);
}

/* Toast Styles */
.toast {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-weight: var(--font-medium);
  z-index: 1000;
}

.toast.success {
  background: var(--success);
  color: white;
}

/* Toast Animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(-50%) translateY(100px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}
</style>