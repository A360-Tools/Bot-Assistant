<template>
  <div class="device-list">
    <div v-if="loading" class="loading">
      <Loader2 :size="24" class="spinner" />
      <p>Loading devices...</p>
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
    
    <div v-else-if="devices.length === 0" class="empty">
      <HardDrive :size="48" />
      <h3>No devices found</h3>
      <p>No devices are currently registered.</p>
    </div>
    
    <div v-else>
      <div class="device-list-header">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span>Select All ({{ selectedDevices.size }}/{{ devices.length }})</span>
        </label>
      </div>
      
      <div class="device-items">
        <div
          v-for="device in devices"
          :key="device.id"
          class="device-item"
          :class="{ selected: selectedDevices.has(device.id) }"
        >
          <label class="device-checkbox">
            <input
              type="checkbox"
              :checked="selectedDevices.has(device.id)"
              @change="toggleDeviceSelection(device.id)"
            />
          </label>
          
          <div class="device-icon">
            <HardDrive :size="16" />
          </div>
          
          <div class="device-info">
            <div class="device-name">{{ device.hostName }}</div>
            <div class="device-meta">
              <span :class="['status-badge', getStatusClass(device.status)]">
                <component :is="getStatusIcon(device.status)" :size="12" />
                {{ formatStatus(device.status) }}
              </span>
              <span class="separator">•</span>
              <span>{{ device.type === 'SINGLE_USER' ? 'Single User' : 'Multi User' }}</span>
              <span class="separator">•</span>
              <span>Agent {{ device.botAgentVersion }}</span>
            </div>
          </div>
          
          <div v-if="resetting.has(device.id)" class="resetting-indicator">
            <Loader2 :size="14" class="spinner" />
          </div>
          <div v-else-if="deviceStatus(device.id)" class="status-indicator" :class="deviceStatus(device.id).status">
            <template v-if="deviceStatus(device.id).status === 'success'">
              <CheckCircle :size="14" />
            </template>
            <template v-else-if="deviceStatus(device.id).status === 'failed'">
              <XCircle :size="14" />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { HardDrive, AlertCircle, RefreshCw, Loader2, CheckCircle, XCircle, Wifi, WifiOff, AlertTriangle, RefreshCcw } from 'lucide-vue-next';
import type { Device } from '../services/api';
import { getErrorType } from '../utils/errorMessages';
import ConnectionError from './ConnectionError.vue';

interface Props {
  devices: Device[];
  loading?: boolean;
  error?: string | null;
  selectedDevices: Set<string>;
  resetting?: Set<string>;
  deviceStatuses?: Map<string, { status: 'resetting' | 'success' | 'failed'; error?: string }>;
}

interface Emits {
  (e: 'update:selectedDevices', value: Set<string>): void;
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  resetting: () => new Set(),
  deviceStatuses: () => new Map(),
});

const emit = defineEmits<Emits>();

const isAllSelected = computed(() => {
  return props.devices.length > 0 && props.selectedDevices.size === props.devices.length;
});

const isIndeterminate = computed(() => {
  return props.selectedDevices.size > 0 && props.selectedDevices.size < props.devices.length;
});

const toggleSelectAll = () => {
  const newSelection = new Set<string>();
  if (!isAllSelected.value) {
    props.devices.forEach(device => newSelection.add(device.id));
  }
  emit('update:selectedDevices', newSelection);
};

const toggleDeviceSelection = (deviceId: string) => {
  const newSelection = new Set(props.selectedDevices);
  if (newSelection.has(deviceId)) {
    newSelection.delete(deviceId);
  } else {
    newSelection.add(deviceId);
  }
  emit('update:selectedDevices', newSelection);
};

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'CONNECTED': 'Connected',
    'CONNECTED_HAS_UPDATE': 'Update Available',
    'CONNECTED_NEEDS_UPDATE': 'Update Required',
    'WAITING_FOR_UPDATE': 'Waiting for Update',
    'UPDATING': 'Updating',
    'DISCONNECTED': 'Disconnected',
    'DISCONNECTED_FOR_UPDATE': 'Restarting for Update',
    'CONFIGURING': 'Configuring',
    'INITIALIZING': 'Initializing'
  };
  return statusMap[status] || status;
};

const getStatusClass = (status: string): string => {
  if (status.startsWith('CONNECTED')) return 'status-connected';
  if (status === 'UPDATING' || status === 'WAITING_FOR_UPDATE') return 'status-updating';
  if (status === 'DISCONNECTED' || status === 'DISCONNECTED_FOR_UPDATE') return 'status-disconnected';
  return 'status-other';
};

const getStatusIcon = (status: string) => {
  if (status.startsWith('CONNECTED')) return Wifi;
  if (status === 'UPDATING' || status === 'WAITING_FOR_UPDATE') return RefreshCcw;
  if (status.startsWith('DISCONNECTED')) return WifiOff;
  return AlertTriangle;
};

const deviceStatus = (deviceId: string) => {
  return props.deviceStatuses.get(deviceId);
};
</script>

<style scoped>
.device-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.loading p,
.empty p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
}

.empty h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
  font-size: 1.125rem;
}

.error {
  gap: 0.5rem;
  padding: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  margin: 1rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #fca5a5;
  border-radius: 0.25rem;
  color: #dc2626;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.device-list-header {
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #475569;
}

.select-all input[type="checkbox"] {
  cursor: pointer;
}

.device-items {
  flex: 1;
  overflow-y: auto;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.device-item:hover {
  background: #f8fafc;
}

.device-item.selected {
  background: #eff6ff;
}

.device-checkbox {
  display: flex;
  align-items: center;
}

.device-icon {
  color: #3b82f6;
  display: flex;
  align-items: center;
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.separator {
  color: #cbd5e1;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.status-connected {
  background: #dcfce7;
  color: #15803d;
}

.status-updating {
  background: #fef3c7;
  color: #a16207;
}

.status-disconnected {
  background: #fee2e2;
  color: #991b1b;
}

.status-other {
  background: #e0e7ff;
  color: #3730a3;
}

.resetting-indicator {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-indicator.success {
  color: #22c55e;
}

.status-indicator.failed {
  color: #ef4444;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>