<template>
  <div class="settings-view">
    <ToolHeader 
      title="Best Practices Settings" 
      :show-back="false"
      :show-refresh="false"
    />
    
    <div class="content">
      <!-- Configuration Sections -->
      <div class="config-sections">
        <!-- Default Tools Section -->
        <div class="card">
          <div class="card-header">
            <Wrench :size="20" />
            <h3>Default Tool Preferences</h3>
          </div>
          <div class="card-content">
            <p class="section-description">Choose your preferred tool behavior for each page type. You can auto-select when only one tool is available, always show the selection menu, or always use a specific tool.</p>
            
            <div class="default-tools-grid">
              <div class="form-field">
                <label>Private Bot Pages</label>
                <select v-model="defaultTools.privateBot">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="best-practices">Always use Best Practices</option>
                  <option value="content-modification">Always use Content Modification</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Public Bot Pages</label>
                <select v-model="defaultTools.publicBot">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="best-practices">Always use Best Practices</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Private Folder Pages</label>
                <select v-model="defaultTools.privateFolder">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="download-files">Always use Download Files</option>
                  <option value="update-packages">Always use Update Packages</option>
                  <option value="copy-files">Always use Copy Files</option>
                  <option value="patch-content">Always use Patch Content</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Public Folder Pages</label>
                <select v-model="defaultTools.publicFolder">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="download-files">Always use Download Files</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Credentials Pages</label>
                <select v-model="defaultTools.credentials">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="view-attributes">Always use View Attributes</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Packages Pages</label>
                <select v-model="defaultTools.packages">
                  <option value="auto-single">Auto-select when single</option>
                  <option value="always-show">Always show selection</option>
                  <option value="package-download">Always use Package Download</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Best Practices Section -->
        <div class="card">
          <div class="card-header">
            <Shield :size="20" />
            <h3>Best Practices</h3>
          </div>
          <div class="card-content">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.bestPractices.tryCatch" />
                <span>Error Handling mandatory</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.bestPractices.comment" />
                <span>Comment mandatory</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.bestPractices.step" />
                <span>Step mandatory</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.bestPractices.timeoutZero" />
                <span>Runtime timeout set to 0 mandatory</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.bestPractices.priorityMedium" />
                <span>Automation priority set to medium mandatory</span>
              </label>
            </div>
            
            <div class="input-group">
              <div class="form-field">
                <label>Maximum lines of code per task</label>
                <input type="number" v-model.number="config.bestPractices.maxLineOfCode" min="0" />
                <small>Set to 0 to disable this check</small>
              </div>
              
              <div class="form-field">
                <label>Maximum number of variables per task</label>
                <input type="number" v-model.number="config.bestPractices.maxVariableCount" min="0" />
                <small>Set to 0 to disable this check</small>
              </div>
              
              <div class="form-field">
                <label>Minimum bot compatibility version</label>
                <input type="number" v-model.number="config.bestPractices.botCodeVersion" min="0" />
                <small>Set to 0 to disable this check</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="card">
          <div class="card-header">
            <Activity :size="20" />
            <h3>Actions</h3>
          </div>
          <div class="card-content">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.emptyContainersDisallowed" />
                <span>Empty containers disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.disabledActionsDisallowed" />
                <span>Disabled actions disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.outOfErrHandlingDisallowed" />
                <span>Commands outside Try-Catch disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.msgBoxDisallowed" />
                <span>Message Box disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.delayDisallowed" />
                <span>Hardcoded delay disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.actions.codeBreakDisallowed" />
                <span>Code break disallowed (Pause/Stop task)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Variables Section -->
        <div class="card">
          <div class="card-header">
            <Variable :size="20" />
            <h3>Variables</h3>
          </div>
          <div class="card-content">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.variables.hardCodedNotConstant" />
                <span>Non-constant variable with hardcoded value disallowed</span>
              </label>
              
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.variables.constantNotCapital" />
                <span>Constant variable with lowercase letter disallowed</span>
              </label>
            </div>
            
            <div class="input-group">
              <div class="form-field">
                <label>Variable name minimum length</label>
                <input type="number" v-model.number="config.variables.variableMinSize" min="0" />
              </div>
              
              <div class="form-field">
                <label>Input type variable name pattern (RegEx)</label>
                <input type="text" v-model="config.variables.inputPattern" @blur="validateRegex('inputPattern')" />
                <small v-if="regexErrors.inputPattern" class="error">{{ regexErrors.inputPattern }}</small>
              </div>
              
              <div class="form-field">
                <label>Output type variable name pattern (RegEx)</label>
                <input type="text" v-model="config.variables.outputPattern" @blur="validateRegex('outputPattern')" />
                <small v-if="regexErrors.outputPattern" class="error">{{ regexErrors.outputPattern }}</small>
              </div>
              
              <div class="form-field">
                <label>Input+Output type variable name pattern (RegEx)</label>
                <input type="text" v-model="config.variables.inputOutputPattern" @blur="validateRegex('inputOutputPattern')" />
                <small v-if="regexErrors.inputOutputPattern" class="error">{{ regexErrors.inputOutputPattern }}</small>
              </div>
              
              <div class="form-field">
                <label>Regular variable name pattern (RegEx)</label>
                <input type="text" v-model="config.variables.variablePattern" @blur="validateRegex('variablePattern')" />
                <small v-if="regexErrors.variablePattern" class="error">{{ regexErrors.variablePattern }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Section -->
    <div class="action-bar">
      <button @click="resetToDefaults" class="reset-btn">
        <RotateCcw :size="16" />
        Reset to Defaults
      </button>
      
      <button @click="saveConfiguration" class="save-btn" :disabled="saving || hasErrors" :class="{ success: showSuccess }">
        <span v-if="!saving && !showSuccess">
          <Check :size="16" />
          Save Settings
        </span>
        <span v-else-if="saving">
          <Loader2 :size="16" class="animate-spin" />
          Saving...
        </span>
        <span v-else-if="showSuccess">
          <CheckCircle :size="16" />
          Saved!
        </span>
      </button>
    </div>
  </div>
  
  <!-- Reset Confirmation Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showResetModal" class="modal-overlay" @click="showResetModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Reset to Default Settings?</h3>
            <button @click="showResetModal = false" class="close-btn">
              <X :size="20" />
            </button>
          </div>
          
          <div class="modal-body">
            <p>This will reset all best practices settings to their default values. This action cannot be undone.</p>
          </div>
          
          <div class="modal-footer">
            <button @click="showResetModal = false" class="cancel-btn">
              Cancel
            </button>
            <button @click="confirmReset" class="confirm-btn">
              <RotateCcw :size="16" />
              Reset Settings
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Check, AlertCircle, CheckCircle, Shield, Activity, Variable, RotateCcw, Loader2, X, Wrench } from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import {
  getConfig,
  saveConfig,
  resetConfig,
  DEFAULT_CONFIG,
  isValidRegex,
  type BestPracticesConfig,
  getDefaultToolPreferences,
  saveDefaultToolPreferences,
  type DefaultToolPreferences,
  TOOL_PREFERENCE_VALUES
} from '../utils/storage';

// State
const config = ref<BestPracticesConfig>(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
const defaultTools = ref<DefaultToolPreferences>({});
const saving = ref(false);
const showSuccess = ref(false);
const showResetModal = ref(false);

// Regex validation
const regexErrors = ref<Record<string, string>>({});

const hasErrors = computed(() => {
  return Object.keys(regexErrors.value).length > 0;
});

// Load configuration
async function loadConfiguration() {
  config.value = await getConfig();
  const prefs = await getDefaultToolPreferences();
  
  // Map existing empty strings to 'auto-single' for backward compatibility
  defaultTools.value = {
    privateBot: prefs.privateBot || TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    publicBot: prefs.publicBot || TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    privateFolder: prefs.privateFolder || TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    publicFolder: prefs.publicFolder || TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    credentials: prefs.credentials || TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    packages: prefs.packages || TOOL_PREFERENCE_VALUES.AUTO_SINGLE
  };
}

// Validate regex patterns
function validateRegex(field: string) {
  const value = (config.value.variables as any)[field];
  if (!isValidRegex(value)) {
    regexErrors.value[field] = 'Invalid regex pattern';
  } else {
    delete regexErrors.value[field];
  }
}

// Save configuration
async function saveConfiguration() {
  if (hasErrors.value) {
    return;
  }
  
  saving.value = true;
  
  try {
    await saveConfig(config.value);
    await saveDefaultToolPreferences(defaultTools.value);
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error('Save error:', error);
  } finally {
    saving.value = false;
  }
}

// Reset to defaults
function resetToDefaults() {
  showResetModal.value = true;
}

async function confirmReset() {
  showResetModal.value = false;
  await resetConfig();
  await saveDefaultToolPreferences({
    privateBot: TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    publicBot: TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    privateFolder: TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    publicFolder: TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    credentials: TOOL_PREFERENCE_VALUES.AUTO_SINGLE,
    packages: TOOL_PREFERENCE_VALUES.AUTO_SINGLE
  });
  await loadConfiguration();
}

// Clear success state when config changes
watch(config, () => {
  showSuccess.value = false;
}, { deep: true });

onMounted(() => {
  loadConfiguration();
});
</script>

<style scoped>
.settings-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #fafbfc);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Cards */
.card {
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  margin-bottom: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(to right, var(--primary-light, #eff6ff), white);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.card-header h3 {
  margin: 0;
  font-size: var(--font-lg, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #1f2937);
}

.card-header svg {
  color: var(--primary, #3b82f6);
}

.card-content {
  padding: 1.25rem;
}

/* Form Elements */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: var(--font-base, 0.875rem);
  color: var(--text-primary, #374151);
  padding: 0.5rem;
  border-radius: var(--radius-md, 0.375rem);
  transition: background-color 0.2s;
}

.checkbox-label:hover {
  background: var(--bg-hover, #f9fafb);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary, #3b82f6);
}

.input-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.default-tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.section-description {
  margin: 0 0 1.25rem 0;
  color: var(--text-secondary, #6b7280);
  font-size: var(--font-base, 0.875rem);
  line-height: 1.5;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field label {
  font-size: var(--font-sm, 0.813rem);
  font-weight: var(--font-medium, 500);
  color: var(--text-primary, #374151);
}

.form-field input,
.form-field select {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  font-size: var(--font-base, 0.875rem);
  color: var(--text-primary, #374151);
  background: white;
  transition: all 0.2s;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-field small {
  font-size: var(--font-xs, 0.75rem);
  color: var(--text-secondary, #6b7280);
}

.form-field small.error {
  color: var(--error, #ef4444);
}

/* Action Bar */
.action-bar {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid var(--border-color, #e5e7eb);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

/* Buttons */
.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  color: var(--text-secondary, #6b7280);
  font-size: var(--font-base, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: var(--bg-hover, #f9fafb);
  color: var(--text-primary, #374151);
  border-color: var(--border-hover, #d1d5db);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: var(--primary, #3b82f6);
  border: none;
  border-radius: var(--radius-md, 0.375rem);
  color: white;
  font-size: var(--font-base, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.save-btn.success {
  background: var(--success, #10b981);
}

.save-btn.success:hover {
  background: var(--success, #10b981);
}

.animate-spin {
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
  z-index: var(--z-modal, 100);
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg, 0.5rem);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-lg, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #1f2937);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  border-radius: var(--radius-md, 0.375rem);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover, #f9fafb);
  color: var(--text-primary, #374151);
}

.modal-body {
  padding: 1.25rem;
}

.modal-body p {
  margin: 0;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem;
  background: var(--bg-secondary, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  color: var(--text-secondary, #6b7280);
  font-size: var(--font-base, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--bg-hover, #f9fafb);
  color: var(--text-primary, #374151);
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--error, #ef4444);
  color: white;
  border: none;
  border-radius: var(--radius-md, 0.375rem);
  font-size: var(--font-base, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: var(--error-hover, #dc2626);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>