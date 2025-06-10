<template>
  <div class="connection-error">
    <div class="error-icon">
      <AlertCircle :size="24" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <div v-if="showActions" class="error-actions">
      <button 
        v-if="actionType === 'refresh'"
        @click="handleRefresh" 
        class="action-btn primary"
      >
        <RefreshCw :size="16" />
        Refresh Page
      </button>
      <button 
        v-if="actionType === 'retry'"
        @click="$emit('retry')" 
        class="action-btn primary"
      >
        <RefreshCw :size="16" />
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertCircle, RefreshCw } from 'lucide-vue-next';
import { usePageContext } from '../composables/usePageContext';

interface Props {
  type?: 'authentication' | 'connection' | 'generic';
  customMessage?: string;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'connection',
  showActions: true
});

const emit = defineEmits<{
  retry: [];
}>();

const { isConnected } = usePageContext();

// Determine action type based on connection status and error type
const actionType = computed(() => {
  // If content script is not connected, always show refresh
  if (!isConnected.value) {
    return 'refresh';
  }
  
  // If connected but authentication failed, show retry
  if (props.type === 'authentication') {
    return 'retry';
  }
  
  // For connection errors when supposedly connected, show refresh
  return 'refresh';
});

const title = computed(() => {
  // If not connected at all
  if (!isConnected.value) {
    return 'Not Connected';
  }
  
  switch (props.type) {
    case 'authentication':
      return 'Authentication Required';
    case 'connection':
      return 'Connection Error';
    default:
      return 'Error';
  }
});

const message = computed(() => {
  // If not connected at all
  if (!isConnected.value) {
    return 'Extension is not connected to this page. Please refresh the page to establish connection.';
  }
  
  if (props.customMessage) return props.customMessage;
  
  switch (props.type) {
    case 'authentication':
      return 'Please log in to the Control Room and try again.';
    case 'connection':
      return 'Unable to communicate with the page. Please refresh and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
});

const handleRefresh = () => {
  // Send message to refresh the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
};
</script>

<style scoped>
.connection-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 200px;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.connection-error h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.connection-error p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  max-width: 300px;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #2563eb;
}

.action-btn:active {
  transform: scale(0.95);
}
</style>