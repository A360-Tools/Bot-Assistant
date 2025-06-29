<template>
  <div class="device-reset-view">
    <ToolHeader
      title="Device Reset"
      :showBack="true"
      :showRefresh="true"
      :refreshing="loading"
      @refresh="initialize(true)"
      @back="$emit('back')"
    >
      <template #actions>
        <span class="page-type">Device Management</span>
      </template>
    </ToolHeader>
    
    <ConnectionError v-if="!isAuthenticated" type="authentication" @retry="initialize()" />
    
    <template v-else>
      <div class="info-message">
        <Info :size="16" />
        <p>Select devices to reset. This will reset the bot agent on selected devices.</p>
      </div>
      
      <DeviceList
        :devices="devices"
        :loading="loading"
        :error="error"
        :selectedDevices="selectedDevices"
        :resetting="resettingDevices"
        :deviceStatuses="deviceStatuses"
        @update:selectedDevices="selectedDevices = $event"
        @retry="loadDevices"
      />
      
      <div v-if="selectedDevices.size > 0" class="action-bar">
        <button
          @click="resetSelectedDevices"
          :disabled="isResetting"
          class="reset-btn"
        >
          <RotateCcw :size="16" />
          {{ isResetting ? 'Resetting... Do not close sidepanel' : `Reset ${selectedDevices.size} Device${selectedDevices.size > 1 ? 's' : ''}` }}
        </button>
        
        <div v-if="isResetting" class="reset-progress">
          <div class="progress-info">
            <Loader2 :size="16" class="spinner" />
            <span>Resetting device {{ currentResetIndex + 1 }} of {{ totalResetCount }}...</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: resetProgress + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- Results Modal -->
      <div v-if="showResults" class="modal-overlay" @click="closeResults">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Reset Results</h3>
            <button @click="closeResults" class="close-btn">
              <X :size="20" />
            </button>
          </div>
          
          <div class="modal-body">
            <div v-if="resetResults.success.length > 0" class="result-section">
              <div class="result-header success">
                <CheckCircle :size="16" />
                <span>Successfully Reset ({{ resetResults.success.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="deviceId in resetResults.success" :key="deviceId">
                  {{ getDeviceName(deviceId) }}
                </li>
              </ul>
            </div>
            
            <div v-if="resetResults.failed.length > 0" class="result-section">
              <div class="result-header error">
                <XCircle :size="16" />
                <span>Failed to Reset ({{ resetResults.failed.length }})</span>
              </div>
              <ul class="result-list">
                <li v-for="failure in resetResults.failed" :key="failure.deviceId">
                  <strong>{{ getDeviceName(failure.deviceId) }}</strong>
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
import { ref, onMounted, computed } from 'vue';
import { Info, RotateCcw, CheckCircle, XCircle, X, Loader2 } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import DeviceList from '../components/DeviceList.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService, type Device } from '../services/api';
import { usePageContext } from '../composables/usePageContext';

defineEmits<{
  back: [];
}>();

// Local reactive state
const devices = ref<Device[]>([]);
const selectedDevices = ref(new Set<string>());
const loading = ref(false);
const error = ref<string | null>(null);
const resettingDevices = ref(new Set<string>());
const deviceStatuses = ref(new Map<string, { status: 'resetting' | 'success' | 'failed'; error?: string }>());
const isResetting = ref(false);
const showResults = ref(false);
const currentResetIndex = ref(0);
const totalResetCount = ref(0);
const resetResults = ref({
  success: [] as string[],
  failed: [] as Array<{ deviceId: string; error: string }>,
});
const isAuthenticated = ref(false);

// Get current URL from page context
const { currentUrl } = usePageContext();

const resetProgress = computed(() => {
  if (totalResetCount.value === 0) return 0;
  return Math.round((currentResetIndex.value / totalResetCount.value) * 100);
});

const initialize = async (force = false) => {
  try {
    await apiService.initialize();
    isAuthenticated.value = apiService.isAuthenticated();
    
    if (isAuthenticated.value) {
      await loadDevices();
    }
  } catch (err) {
    console.error('Failed to initialize:', err);
    error.value = err instanceof Error ? err.message : 'Failed to initialize';
  }
};

const loadDevices = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiService.listDevices();
    devices.value = response.list;
  } catch (err) {
    console.error('Failed to load devices:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load devices';
  } finally {
    loading.value = false;
  }
};

const resetSelectedDevices = async () => {
  if (selectedDevices.value.size === 0 || isResetting.value) return;
  
  isResetting.value = true;
  resetResults.value = {
    success: [],
    failed: [],
  };
  
  // Clear previous statuses
  deviceStatuses.value.clear();
  
  // Initialize progress tracking
  currentResetIndex.value = 0;
  totalResetCount.value = selectedDevices.value.size;
  
  const deviceIds = Array.from(selectedDevices.value);
  
  for (let i = 0; i < deviceIds.length; i++) {
    const deviceId = deviceIds[i];
    currentResetIndex.value = i;
    try {
      // Mark as resetting
      resettingDevices.value.add(deviceId);
      deviceStatuses.value.set(deviceId, { status: 'resetting' });
      
      // Perform reset
      await apiService.resetDevices([deviceId]);
      
      // Mark as success
      resetResults.value.success.push(deviceId);
      deviceStatuses.value.set(deviceId, { status: 'success' });
    } catch (err) {
      // Mark as failed
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset device';
      resetResults.value.failed.push({ deviceId, error: errorMsg });
      deviceStatuses.value.set(deviceId, { status: 'failed', error: errorMsg });
    } finally {
      resettingDevices.value.delete(deviceId);
    }
  }
  
  isResetting.value = false;
  currentResetIndex.value = totalResetCount.value; // Set to 100% when done
  
  // Clear selection after reset
  selectedDevices.value.clear();
  
  // Show results
  showResults.value = true;
  
  // Refresh device list to get updated statuses
  setTimeout(() => {
    loadDevices();
  }, 2000);
};

const getDeviceName = (deviceId: string): string => {
  const device = devices.value.find(d => d.id === deviceId);
  return device?.hostName || `Device ${deviceId}`;
};

const closeResults = () => {
  showResults.value = false;
  // Clear statuses after closing results
  deviceStatuses.value.clear();
};

onMounted(() => {
  initialize();
});
</script>

<style scoped>
.device-reset-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-type {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  margin: 0 1rem 1rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.info-message p {
  margin: 0;
}

.action-bar {
  position: sticky;
  bottom: 0;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.reset-btn {
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

.reset-btn:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Progress Bar Styles */
.reset-progress {
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1e293b;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #334155;
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
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.result-header.success {
  color: #15803d;
}

.result-header.error {
  color: #dc2626;
}

.result-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.result-list li:last-child {
  border-bottom: none;
}

.error-message {
  display: block;
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  background: #2563eb;
}
</style>