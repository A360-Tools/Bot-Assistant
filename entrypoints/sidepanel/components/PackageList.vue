<template>
  <div class="package-list">
    <div v-if="loading" class="loading">
      <Loader2 :size="24" class="spinner" />
      <p>Loading packages...</p>
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
    
    <div v-else-if="packages.length === 0" class="empty">
      <Package :size="48" />
      <h3>No packages found</h3>
      <p>No packages are available in the system.</p>
    </div>
    
    <div v-else>
      <div class="package-list-header">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span>Select All ({{ selectedPackages.size }}/{{ packages.length }})</span>
        </label>
      </div>
      
      <div class="package-items">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="package-item"
          :class="{ 
            selected: selectedPackages.has(pkg.id)
          }"
        >
          <label class="package-checkbox">
            <input
              type="checkbox"
              :checked="selectedPackages.has(pkg.id)"
              @change="togglePackageSelection(pkg.id)"
            />
          </label>
          
          <div class="package-icon" style="color: #dc2626;">
            <Package :size="16" />
          </div>
          
          <div class="package-info">
            <div class="package-name">
              {{ pkg.name }}
              <span v-if="pkg.packageVersion" class="package-version">v{{ pkg.packageVersion }}</span>
            </div>
            <div class="package-meta">
              <span>by {{ pkg.author }}</span>
              <span class="separator">•</span>
              <span class="status" :class="{ 'status-disabled': pkg.status === 'DISABLED' }">
                {{ pkg.status }}
              </span>
            </div>
          </div>
          
          <div v-if="downloading.has(pkg.id)" class="downloading-indicator">
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
import { Package, AlertCircle, RefreshCw, Loader2 } from 'lucide-vue-next';
import { getErrorType } from '../utils/errorMessages';
import ConnectionError from './ConnectionError.vue';

interface PackageItem {
  id: string;
  name: string;
  packageVersion: string;
  author: string;
  status: string;
  pkgDownloadUrl: string;
}

interface Props {
  packages: PackageItem[];
  loading?: boolean;
  error?: string | null;
  downloading?: Set<string>;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  downloading: () => new Set(),
  hasMore: false,
  loadingMore: false
});

const emit = defineEmits<{
  'update:selectedPackages': [Set<string>];
  retry: [];
  loadMore: [];
}>();

const selectedPackages = ref(new Set<string>());

const isAllSelected = computed(() => {
  return props.packages.length > 0 && 
    props.packages.every(p => selectedPackages.value.has(p.id));
});

const isIndeterminate = computed(() => {
  const selectedCount = props.packages.filter(p => selectedPackages.value.has(p.id)).length;
  return selectedCount > 0 && selectedCount < props.packages.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedPackages.value.clear();
  } else {
    // Select all packages
    props.packages.forEach(p => selectedPackages.value.add(p.id));
  }
  emit('update:selectedPackages', new Set(selectedPackages.value));
};

const togglePackageSelection = (packageId: string) => {
  const pkg = props.packages.find(p => p.id === packageId);
  if (!pkg) return;
  
  if (selectedPackages.value.has(packageId)) {
    selectedPackages.value.delete(packageId);
  } else {
    selectedPackages.value.add(packageId);
  }
  emit('update:selectedPackages', new Set(selectedPackages.value));
};

// Clear selection when packages change
watch(() => props.packages, () => {
  selectedPackages.value.clear();
  emit('update:selectedPackages', new Set());
});
</script>

<style scoped>
.package-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  margin: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #dc2626;
  color: #dc2626;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.retry-btn:hover {
  background: #dc2626;
  color: white;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.empty h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
}

.empty p {
  margin: 0;
  font-size: 0.875rem;
}

.package-list-header {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  z-index: 10;
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

.package-items {
  display: flex;
  flex-direction: column;
}

.package-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s;
}

.package-item:hover {
  background: #f9fafb;
}

.package-item.selected {
  background: #eff6ff;
}


.package-checkbox {
  display: flex;
  align-items: center;
}

.package-icon {
  flex-shrink: 0;
}

.package-info {
  flex: 1;
  min-width: 0;
}

.package-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


.package-version {
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
}

.package-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.separator {
  color: #d1d5db;
}

.status {
  font-weight: 500;
  color: #059669;
}

.status-disabled {
  color: #dc2626;
}

.downloading-indicator {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.load-more {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

.load-more-btn {
  display: flex;
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