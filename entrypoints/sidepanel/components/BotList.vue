<template>
  <div class="bot-list">
    <div v-if="loading" class="loading">
      <Loader2 :size="24" class="spinner" />
      <p>Loading bots...</p>
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
    
    <div v-else-if="bots.length === 0" class="empty">
      <FileX :size="48" />
      <h3>No bots found</h3>
      <p>This folder doesn't contain any bot files.</p>
    </div>
    
    <div v-else>
      <div class="bot-list-header">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span>Select All ({{ selectedBots.size }}/{{ bots.length }})</span>
        </label>
      </div>
      
      <div class="bot-items">
        <div
          v-for="bot in bots"
          :key="bot.id"
          class="bot-item"
          :class="{ selected: selectedBots.has(bot.id) }"
        >
          <label class="bot-checkbox">
            <input
              type="checkbox"
              :checked="selectedBots.has(bot.id)"
              @change="toggleBotSelection(bot.id)"
            />
          </label>
          
          <div class="bot-icon" :style="{ color: getFileIcon(bot.type).color }">
            <component :is="getFileIcon(bot.type).icon" :size="16" />
          </div>
          
          <div class="bot-info">
            <div class="bot-name">{{ bot.name }}</div>
            <div class="bot-meta">
              <span>{{ formatFileSize(bot.size) }}</span>
              <span class="separator">•</span>
              <span>Modified {{ formatDate(bot.lastModified) }}</span>
            </div>
          </div>
          
          <div v-if="updating.has(bot.id)" class="updating-indicator">
            <Loader2 :size="14" class="spinner" />
          </div>
          <div v-else-if="botStatus(bot.id)" class="status-indicator" :class="botStatus(bot.id).status">
            <template v-if="botStatus(bot.id).status === 'success'">
              <CheckCircle :size="14" />
            </template>
            <template v-else-if="botStatus(bot.id).status === 'skipped'">
              <AlertCircle :size="14" />
            </template>
            <template v-else-if="botStatus(bot.id).status === 'failed'">
              <XCircle :size="14" />
            </template>
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
import { computed } from 'vue';
import { FileX, AlertCircle, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-vue-next';
import type { FolderItem } from '../services/api';
import { getFileIcon } from '../utils/fileIcons';
import { getErrorType } from '../utils/errorMessages';
import ConnectionError from './ConnectionError.vue';

interface Props {
  bots: FolderItem[];
  loading?: boolean;
  error?: string | null;
  selectedBots: Set<string>;
  updating?: Set<string>;
  botStatuses?: Map<string, { status: 'updating' | 'success' | 'skipped' | 'failed'; error?: string }>;
  hasMore?: boolean;
  loadingMore?: boolean;
}

interface Emits {
  (e: 'update:selectedBots', value: Set<string>): void;
  (e: 'retry'): void;
  (e: 'loadMore'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  updating: () => new Set(),
  botStatuses: () => new Map(),
  hasMore: false,
  loadingMore: false,
});

const emit = defineEmits<Emits>();

const isAllSelected = computed(() => {
  return props.bots.length > 0 && props.selectedBots.size === props.bots.length;
});

const isIndeterminate = computed(() => {
  return props.selectedBots.size > 0 && props.selectedBots.size < props.bots.length;
});

const toggleSelectAll = () => {
  const newSelection = new Set<string>();
  if (!isAllSelected.value) {
    props.bots.forEach(bot => newSelection.add(bot.id));
  }
  emit('update:selectedBots', newSelection);
};

const toggleBotSelection = (botId: string) => {
  const newSelection = new Set(props.selectedBots);
  if (newSelection.has(botId)) {
    newSelection.delete(botId);
  } else {
    newSelection.add(botId);
  }
  emit('update:selectedBots', newSelection);
};

const formatFileSize = (bytes: string | number): string => {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

const botStatus = (botId: string) => {
  return props.botStatuses.get(botId);
};
</script>

<style scoped>
.bot-list {
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
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
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

.bot-list-header {
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

.bot-items {
  flex: 1;
  overflow-y: auto;
}

.bot-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.bot-item:hover {
  background: #f9fafb;
}

.bot-item.selected {
  background: #e0e7ff;
}

.bot-checkbox {
  display: flex;
  align-items: center;
}

.bot-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.bot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 0.375rem;
  color: #6b7280;
}

.bot-info {
  flex: 1;
  min-width: 0;
}

.bot-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bot-meta {
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

.updating-indicator {
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

.updating-indicator {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 0.25rem;
}

.status-indicator.success {
  color: #22c55e;
}

.status-indicator.skipped {
  color: #f59e0b;
}

.status-indicator.failed {
  color: #ef4444;
}
</style>