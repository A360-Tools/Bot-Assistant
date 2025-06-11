<template>
  <div class="package-download-view">
    <ToolHeader
      title="Package Download"
      :showBack="true"
      :showRefresh="true"
      :refreshing="loading"
      @refresh="initialize(true)"
      @back="$emit('back')"
    >
      <template #actions>
        <span class="packages-badge">Packages</span>
      </template>
    </ToolHeader>
    
    <ConnectionError v-if="!isAuthenticated" type="authentication" @retry="initialize()" />
    
    <template v-else>
      <div class="info-message">
        <Info :size="16" />
        <p>Select packages to download JAR files.</p>
      </div>
      
      <PackageList
        :packages="packages"
        :loading="loading"
        :error="error"
        :downloading="downloading"
        :hasMore="hasMore"
        :loadingMore="loadingMore"
        @update:selectedPackages="handleSelectionChange"
        @retry="loadPackages"
        @loadMore="loadMore"
      />
      
      <div v-if="selectedPackages.size > 0" class="action-bar">
        <button
          @click="downloadSelectedPackages"
          :disabled="isDownloading"
          class="download-btn"
        >
          <Download :size="16" />
          {{ isDownloading ? 'Downloading...' : `Download ${selectedPackages.size} Package${selectedPackages.size > 1 ? 's' : ''}` }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Download, Info } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import PackageList from '../components/PackageList.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService } from '../services/api';
import { useTabState } from '../composables/useTabState';
import { usePageContext } from '../composables/usePageContext';

interface Package {
  id: string;
  name: string;
  label: string;
  packageVersion: string;
  author: string;
  pkgDownloadUrl: string;
  status: string;
  publishedDate: string;
  createdBy: string;
  createdOn: string;
}

defineEmits<{
  back: [];
}>();

// Use per-tab state
const tabState = useTabState({
  packages: [] as Package[],
  currentOffset: 0,
  totalPackages: 0,
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
const packages = computed({
  get: () => tabState.value.packages || [],
  set: (value) => { tabState.value.packages = value; }
});

const currentOffset = computed({
  get: () => tabState.value.currentOffset || 0,
  set: (value) => { tabState.value.currentOffset = value; }
});

const totalPackages = computed({
  get: () => tabState.value.totalPackages || 0,
  set: (value) => { tabState.value.totalPackages = value; }
});

const selectedPackages = ref(new Set<string>());

const isAuthenticated = computed({
  get: () => tabState.value.isAuthenticated || false,
  set: (value) => { tabState.value.isAuthenticated = value; }
});

const hasMore = computed(() => {
  return currentOffset.value + packages.value.length < totalPackages.value;
});

// Reload when URL changes
watch(currentUrl, (newUrl, oldUrl) => {
  if (!newUrl || newUrl === oldUrl) return;
  
  // Check if we're on the packages page
  if (newUrl.includes('/#/bots/packages/versions')) {
    // Clear existing data to show loading state
    packages.value = [];
    selectedPackages.value.clear();
    initialize();
  }
});

const initialize = async (forceRefresh = false) => {
  try {
    await apiService.initialize();
    isAuthenticated.value = apiService.isAuthenticated();
    
    // Load packages if: forced refresh, URL changed, or no data loaded yet
    if (isAuthenticated.value && (forceRefresh || currentUrl.value !== tabState.value.lastLoadedUrl || !tabState.value.packages?.length)) {
      await loadPackages();
      tabState.value.lastLoadedUrl = currentUrl.value;
    }
  } catch (err) {
    console.error('Failed to initialize:', err);
    error.value = 'Failed to initialize. Please refresh the page.';
  }
};

const loadPackages = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiService.post('/v3/packages/package/list', {
      includeDownloadUrls: true,
      page: {
        offset: 0,
        length: 200
      }
    });

    if (response.list) {
      // Include all packages, both DEFAULT and DISABLED status
      packages.value = response.list;
      totalPackages.value = response.page.totalFilter || response.list.length;
      currentOffset.value = 0;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load packages';
    packages.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (loadingMore.value) return;

  loadingMore.value = true;
  
  try {
    const nextOffset = currentOffset.value + 200;
    const response = await apiService.post('/v3/packages/package/list', {
      includeDownloadUrls: true,
      page: {
        offset: nextOffset,
        length: 200
      }
    });
    
    if (response.list) {
      packages.value = [...packages.value, ...response.list];
      currentOffset.value = nextOffset;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load more packages';
  } finally {
    loadingMore.value = false;
  }
};

const downloadSelectedPackages = async () => {
  if (selectedPackages.value.size === 0 || isDownloading.value) return;
  
  isDownloading.value = true;
  const packageIds = Array.from(selectedPackages.value);
  
  for (const packageId of packageIds) {
    const pkg = packages.value.find(p => p.id === packageId);
    if (!pkg || !pkg.pkgDownloadUrl) continue;
    
    downloading.value.add(packageId);
    
    try {
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = pkg.pkgDownloadUrl;
      a.download = `${pkg.name}-${pkg.packageVersion}.jar`;
      a.target = '_blank'; // Open in new tab to avoid navigation
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Package downloaded successfully
    } catch (err) {
      // Download failed
      let errorMessage = 'Failed to download';
      if (err instanceof Error) {
        errorMessage = `Failed to download ${pkg.name}: ${err.message}`;
      } else {
        errorMessage = `Failed to download ${pkg.name}`;
      }
      error.value = errorMessage;
    } finally {
      downloading.value.delete(packageId);
      // Force reactivity update
      downloading.value = new Set(downloading.value);
    }
  }
  
  // Clear selection after download
  selectedPackages.value.clear();
  selectedPackages.value = new Set(); // Force reactivity
  isDownloading.value = false;
};

const handleSelectionChange = (newSelection: Set<string>) => {
  selectedPackages.value = newSelection;
};

onMounted(() => {
  // Only initialize if we haven't loaded data for this tab yet
  if (!tabState.value.lastLoadedUrl || !tabState.value.packages || tabState.value.packages.length === 0) {
    initialize();
  }
});
</script>

<style scoped>
.package-download-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.packages-badge {
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