import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { STORAGE_KEYS } from '../utils/storage';

interface Settings {
  toolPreferences: Record<string, string>;
  bestPracticesSettings: {
    enableBotAnalysis: boolean;
    enableCredentialDetection: boolean;
    enableObjectReferences: boolean;
    enableActivitySummary: boolean;
    enableCodeDetection: boolean;
    enableSensitiveDataDetection: boolean;
    enableDescriptionCheck: boolean;
    enableScriptPatternDetection: boolean;
  };
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings>({
    toolPreferences: {},
    bestPracticesSettings: {
      enableBotAnalysis: true,
      enableCredentialDetection: true,
      enableObjectReferences: true,
      enableActivitySummary: true,
      enableCodeDetection: true,
      enableSensitiveDataDetection: true,
      enableDescriptionCheck: true,
      enableScriptPatternDetection: true
    }
  });

  // Load settings from Chrome storage
  const loadSettings = async () => {
    try {
      const stored = await chrome.storage.sync.get([
        STORAGE_KEYS.TOOL_PREFERENCES,
        STORAGE_KEYS.BEST_PRACTICES_SETTINGS
      ]);

      if (stored[STORAGE_KEYS.TOOL_PREFERENCES]) {
        settings.value.toolPreferences = stored[STORAGE_KEYS.TOOL_PREFERENCES];
      }

      if (stored[STORAGE_KEYS.BEST_PRACTICES_SETTINGS]) {
        settings.value.bestPracticesSettings = {
          ...settings.value.bestPracticesSettings,
          ...stored[STORAGE_KEYS.BEST_PRACTICES_SETTINGS]
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Save settings to Chrome storage
  const saveSettings = async () => {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.TOOL_PREFERENCES]: settings.value.toolPreferences,
        [STORAGE_KEYS.BEST_PRACTICES_SETTINGS]: settings.value.bestPracticesSettings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Watch for changes and auto-save
  watch(settings, () => {
    saveSettings();
  }, { deep: true });

  // Actions
  const setToolPreference = (pageType: string, toolId: string) => {
    settings.value.toolPreferences[pageType] = toolId;
  };

  const getToolPreference = (pageType: string) => {
    return settings.value.toolPreferences[pageType] || null;
  };

  const updateBestPracticesSettings = (updates: Partial<typeof settings.value.bestPracticesSettings>) => {
    settings.value.bestPracticesSettings = {
      ...settings.value.bestPracticesSettings,
      ...updates
    };
  };

  // Initialize
  loadSettings();

  return {
    // State
    settings,
    
    // Actions
    loadSettings,
    saveSettings,
    setToolPreference,
    getToolPreference,
    updateBestPracticesSettings
  };
});