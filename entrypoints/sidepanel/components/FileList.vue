<template>
  <div class="file-list">
    <div v-if="loading" class="loading">
      <Loader2 :size="24" class="spinner" />
      <p>Loading files...</p>
    </div>
    
    <ConnectionError 
      v-else-if="error && (getErrorType(error) === 'authentication' || getErrorType(error) === 'connection')"
      :type="getErrorType(error)"
      :customMessage="error"
    />
    
    <div v-else-if="error" class="error">
      <AlertCircle :size="20" />
      <span>{{ error }}</span>
      <button @click="$emit('retry')" class="retry-btn">
        <RefreshCw :size="14" />
        Retry
      </button>
    </div>
    
    <div v-else-if="files.length === 0" class="empty">
      <FileX :size="48" />
      <h3>No files found</h3>
      <p>This folder doesn't contain any files.</p>
    </div>
    
    <div v-else>
      <div class="file-list-header">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span>Select All ({{ selectedFiles.size }}/{{ files.length }})</span>
        </label>
      </div>
      
      <div class="file-items">
        <div
          v-for="file in files"
          :key="file.id"
          class="file-item"
          :class="{ selected: selectedFiles.has(file.id) }"
        >
          <label class="file-checkbox">
            <input
              type="checkbox"
              :checked="selectedFiles.has(file.id)"
              @change="toggleFileSelection(file.id)"
            />
          </label>
          
          <div class="file-icon" :style="{ color: getFileIcon(file.type).color }">
            <component :is="getFileIcon(file.type).icon" :size="16" />
          </div>
          
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">
              <span>{{ formatFileSize(file.size) }}</span>
              <span class="separator">•</span>
              <span>Modified {{ formatDate(file.lastModified) }}</span>
            </div>
          </div>
          
          <div v-if="downloading.has(file.id)" class="downloading-indicator">
            <Loader2 :size="14" class="spinner" />
          </div>
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more">
        <button 
          @click="$emit('loadMore')" 
          class="load-more-btn"
          :disabled="loadingMore"
        >
          <template v-if="loadingMore">
            <Loader2 :size="16" class="spinner" />
            Loading more...
          </template>
          <template v-else>
            Load More
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FileX, AlertCircle, RefreshCw, Loader2 } from 'lucide-vue-next';
import type { FolderItem } from '../services/api';
import { getFileIcon, formatFileSize } from '../utils/fileIcons';
import { getErrorType } from '../utils/errorMessages';
import ConnectionError from './ConnectionError.vue';

interface Props {
  files: FolderItem[];
  loading?: boolean;
  error?: string | null;
  downloading?: Set<string>;
  hasMore?: boolean;
  loadingMore?: boolean;
}

interface Emits {
  (e: 'update:selectedFiles', value: Set<string>): void;
  (e: 'retry'): void;
  (e: 'loadMore'): void;
  (e: 'download'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  downloading: () => new Set(),
  hasMore: false,
  loadingMore: false,
});

const emit = defineEmits<Emits>();

const selectedFiles = ref(new Set<string>());

const isAllSelected = computed(() => {
  return props.files.length > 0 && selectedFiles.value.size === props.files.length;
});

const isIndeterminate = computed(() => {
  return selectedFiles.value.size > 0 && selectedFiles.value.size < props.files.length;
});

const toggleSelectAll = () => {
  const newSelection = new Set<string>();
  if (!isAllSelected.value) {
    props.files.forEach(file => newSelection.add(file.id));
  }
  selectedFiles.value = newSelection;
  emit('update:selectedFiles', newSelection);
};

const toggleFileSelection = (fileId: string) => {
  const newSelection = new Set(selectedFiles.value);
  if (newSelection.has(fileId)) {
    newSelection.delete(fileId);
  } else {
    newSelection.add(fileId);
  }
  selectedFiles.value = newSelection;
  emit('update:selectedFiles', newSelection);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};

// Watch for download trigger
watch(() => selectedFiles.value.size, (newSize) => {
  if (newSize > 0) {
    emit('download');
  }
});
</script>

<style scoped>
.file-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading, .error, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading p {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.error {
  color: #ef4444;
  gap: 0.5rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 1rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--border-hover, #d1d5db);
}

.empty h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
  font-size: 1.125rem;
}

.empty p {
  margin: 0;
  font-size: 0.875rem;
}

.file-list-header {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 5;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.select-all input[type="checkbox"] {
  cursor: pointer;
}

.file-items {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.file-item:hover {
  background: #f9fafb;
}

.file-item.selected {
  background: #e0e7ff;
}

.file-checkbox {
  display: flex;
  align-items: center;
}

.file-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 0.375rem;
  color: #6b7280;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

.separator {
  opacity: 0.5;
}

.downloading-indicator {
  color: #3b82f6;
}

.load-more {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>