<template>
  <div class="credentials-view">
    <ToolHeader
      title="Credential Attributes"
      :show-back="true"
      :show-refresh="true"
      :refreshing="loading"
      @refresh="loadCredentialData"
      @back="handleBack"
    />

    <div v-if="loading" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
      <p>Loading credential data...</p>
    </div>

    <ConnectionError 
      v-else-if="error"
      :type="getErrorType(error)"
      :customMessage="error"
      @retry="loadCredentialData"
    />

    <div v-else-if="credential" class="content">
      <div class="credential-card">
        <div class="credential-header">
          <div class="credential-icon">
            <Key :size="24" />
          </div>
          <div class="credential-details">
            <h3>{{ credential.name }}</h3>
            <div class="credential-meta">
              <span class="meta-item">
                <Hash :size="14" />
                {{ credentialId }}
              </span>
              <span v-if="credential.description" class="meta-item">
                <FileText :size="14" />
                {{ credential.description }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="attributes-section">
        <div class="section-header">
          <h4>
            <Shield :size="18" />
            Credential Attributes
          </h4>
          <span class="attribute-count">{{ attributes.length }} {{ attributes.length === 1 ? 'attribute' : 'attributes' }}</span>
        </div>
        
        <div v-if="attributes.length === 0" class="empty-state">
          <Database :size="48" />
          <p>No attributes found for this credential</p>
        </div>
        
        <div v-else class="attributes-grid">
          <div
            v-for="attr in attributes"
            :key="attr.id"
            class="attribute-card"
            :class="{ 'user-provided': attr.userProvided }"
          >
            <div class="attribute-header">
              <div class="attribute-info">
                <span class="attribute-name">
                  <Lock v-if="attr.passwordFlag" :size="16" />
                  <User v-else-if="attr.userProvided" :size="16" />
                  <Database v-else :size="16" />
                  {{ attr.name }}
                </span>
                <span v-if="attr.userProvided" class="attribute-badge">User Provided</span>
              </div>
              <div class="attribute-actions">
                <button
                  v-if="attr.masked || attr.passwordFlag"
                  @click="togglePasswordVisibility(attr.id)"
                  class="action-button"
                  :title="visiblePasswords.has(attr.id) ? 'Hide value' : 'Show value'"
                >
                  <Eye v-if="visiblePasswords.has(attr.id)" :size="18" />
                  <EyeOff v-else :size="18" />
                </button>
                <button
                  @click="copyAttribute(attr)"
                  class="action-button copy-button"
                  :class="{ 'copied': copiedId === attr.id }"
                  :title="`Copy ${attr.name}`"
                >
                  <CheckCircle v-if="copiedId === attr.id" :size="18" />
                  <Copy v-else :size="18" />
                </button>
              </div>
            </div>
            <div class="attribute-value-wrapper">
              <input
                :type="(attr.masked || attr.passwordFlag) && !visiblePasswords.has(attr.id) ? 'password' : 'text'"
                :value="attr.value || ''"
                :placeholder="attr.value === null ? 'No value set' : 'Loading...'"
                readonly
                class="value-input"
                :class="{ 
                  'loading': attr.value === null,
                  'masked': (attr.masked || attr.passwordFlag) && !visiblePasswords.has(attr.id),
                  'has-value': attr.value !== null
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { 
  Copy, 
  Key, 
  Lock, 
  User, 
  Database, 
  Shield, 
  Hash, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { apiService } from '../services/api';
import { ERROR_MESSAGES, getErrorType } from '../utils/errorMessages';
import { usePageContext } from '../composables/usePageContext';

const emit = defineEmits(['back']);
const { pageContext, currentUrl } = usePageContext();

const loading = ref(true);
const error = ref('');
const credential = ref<any>(null);
const attributes = ref<Array<{ 
  id: string; 
  name: string; 
  value: string | null; 
  userProvided?: boolean;
  masked?: boolean;
  passwordFlag?: boolean;
}>>([]);
const copiedId = ref<string | null>(null);
const visiblePasswords = ref<Set<string>>(new Set());

// Extract credential ID from URL
const credentialId = computed(() => {
  if (!currentUrl.value) return null;
  const match = currentUrl.value.match(/\/credentials\/mycredentials\/(\d+)\//);
  return match ? match[1] : null;
});

const loadCredentialData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Wait for credential ID to be available
    if (!credentialId.value) {
      throw new Error('No credential ID found in URL');
    }
    
    // Initialize API service first
    await apiService.initialize();
    
    if (!apiService.isAuthenticated()) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    if (!credentialId.value) {
      throw new Error('No credential ID found in URL');
    }

    // Get credential details
    credential.value = await apiService.getCredentialById(credentialId.value);
    
    // Initialize attributes from credential data
    if (credential.value.attributes && Array.isArray(credential.value.attributes)) {
      attributes.value = credential.value.attributes.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        value: null, // Will be loaded separately
        userProvided: attr.userProvided,
        masked: attr.masked,
        passwordFlag: attr.passwordFlag
      }));
      
      // Load attribute values
      await loadAttributeValues();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load credential data';
  } finally {
    loading.value = false;
  }
};

// Helper function to get user ID from auth token
const getUserIdFromToken = (token: string): string | null => {
  try {
    const chunks = token.split('.');
    if (chunks.length !== 3) return null;
    
    const payload = JSON.parse(atob(chunks[1]));
    return payload.sub || null;
  } catch (error) {
    return null;
  }
};

const loadAttributeValues = async () => {
  try {
    // Get auth token to extract user ID - needed for all attribute queries per Java implementation
    const token = await apiService.getAuthToken();
    const userId = token ? getUserIdFromToken(token) : null;
    
    if (!userId) {
      return;
    }
    
    // Following Java pattern: query each attribute individually with credentialAttributeId and userId
    for (const attr of attributes.value) {
      try {
        const response = await apiService.getCredentialAttributeWithUser(
          credentialId.value!,
          attr.id,
          userId
        );
        
        if (response.list && Array.isArray(response.list)) {
          // Find the attribute value matching our credentialAttributeId
          const attrValue = response.list.find((av: any) => 
            av.credentialAttributeId === attr.id
          );
          if (attrValue) {
            attr.value = attrValue.value;
          }
        }
      } catch (err) {
        // Continue with other attributes
      }
    }
  } catch (err) {
    // Failed to load attribute values
  }
};

const copyAttribute = async (attr: { id: string; name: string; value: string | null }) => {
  if (!attr.value) return;
  
  try {
    await navigator.clipboard.writeText(attr.value);
    copiedId.value = attr.id;
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (err) {
    // Failed to copy to clipboard
  }
};

const togglePasswordVisibility = (attrId: string) => {
  const newSet = new Set(visiblePasswords.value);
  if (newSet.has(attrId)) {
    newSet.delete(attrId);
  } else {
    newSet.add(attrId);
  }
  visiblePasswords.value = newSet;
};

const handleBack = () => {
  emit('back');
};

// Watch for URL changes
watch(currentUrl, (newUrl) => {
  if (newUrl && credentialId.value) {
    loadCredentialData();
  }
});

onMounted(() => {
  // Try loading immediately if credential ID is available
  if (credentialId.value) {
    loadCredentialData();
  }
});
</script>

<style scoped>
.credentials-view {
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
  color: var(--primary);
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

.credential-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.credential-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
}

.credential-icon {
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

.credential-details {
  flex: 1;
}

.credential-details h3 {
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
}

.credential-meta {
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

.attributes-section {
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

.attribute-count {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  background: var(--bg-primary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  gap: var(--space-md);
}

.empty-state svg {
  color: var(--text-tertiary);
}

.empty-state p {
  font-size: var(--font-base);
  color: var(--text-secondary);
  margin: 0;
}

.attributes-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.attribute-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.attribute-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.attribute-card.user-provided {
  border-left: 3px solid var(--primary);
}

.attribute-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.attribute-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.attribute-name {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.attribute-name svg {
  color: var(--text-secondary);
}

.attribute-badge {
  font-size: var(--font-xs);
  font-weight: var(--font-medium);
  color: var(--primary);
  background: var(--info-light);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.attribute-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.05);
}

.copy-button.copied {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.copy-button.copied:hover {
  background: var(--success);
  transform: scale(1);
}

.attribute-value-wrapper {
  position: relative;
}

.value-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: var(--font-base);
  color: var(--text-primary);
  cursor: text;
  transition: all 0.2s ease;
}

.value-input:hover {
  background: var(--bg-tertiary);
}

.value-input.loading {
  color: var(--text-tertiary);
  font-style: italic;
}

.value-input.masked {
  letter-spacing: 0.1em;
}

.value-input.has-value {
  font-weight: var(--font-medium);
}

.value-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.value-input::placeholder {
  color: var(--text-tertiary);
  font-style: italic;
  font-weight: normal;
}
</style>