// Configuration storage utilities for best practices settings

export interface DefaultToolPreferences {
  privateBot?: string;
  publicBot?: string;
  privateFolder?: string;
  publicFolder?: string;
  credentials?: string;
}

export interface BestPracticesConfig {
  bestPractices: {
    tryCatch: boolean;
    step: boolean;
    comment: boolean;
    timeoutZero: boolean;
    priorityMedium: boolean;
    maxLineOfCode: number;
    maxVariableCount: number;
    botCodeVersion: number;
  };
  actions: {
    emptyContainersDisallowed: boolean;
    disabledActionsDisallowed: boolean;
    outOfErrHandlingDisallowed: boolean;
    msgBoxDisallowed: boolean;
    delayDisallowed: boolean;
    codeBreakDisallowed: boolean;
  };
  variables: {
    inputPattern: string;
    outputPattern: string;
    inputOutputPattern: string;
    variablePattern: string;
    hardCodedNotConstant: boolean;
    constantNotCapital: boolean;
    variableMinSize: number;
  };
}


// Default configuration
export const DEFAULT_CONFIG: BestPracticesConfig = {
  bestPractices: {
    tryCatch: true,
    step: true,
    comment: true,
    timeoutZero: true,
    priorityMedium: true,
    maxLineOfCode: 300,
    maxVariableCount: 50,
    botCodeVersion: 5,
  },
  actions: {
    emptyContainersDisallowed: true,
    disabledActionsDisallowed: true,
    outOfErrHandlingDisallowed: true,
    msgBoxDisallowed: true,
    delayDisallowed: true,
    codeBreakDisallowed: true,
  },
  variables: {
    inputPattern: "^I_.*",
    outputPattern: "^O_.*",
    inputOutputPattern: "^IO_.*",
    variablePattern: ".*",
    hardCodedNotConstant: true,
    constantNotCapital: true,
    variableMinSize: 2,
  },
};

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'bestPracticesConfig',
  DEFAULT_TOOLS: 'defaultToolPreferences',
};

// Get configuration
export async function getConfig(): Promise<BestPracticesConfig> {
  const { [STORAGE_KEYS.CONFIG]: config } = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  if (!config) {
    // Initialize with default config
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return config;
}

// Save configuration
export async function saveConfig(config: BestPracticesConfig): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: config });
}

// Reset to default configuration
export async function resetConfig(): Promise<void> {
  await saveConfig(DEFAULT_CONFIG);
}

// Validate regex pattern
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

// Default tool preferences
export async function getDefaultToolPreferences(): Promise<DefaultToolPreferences> {
  const { [STORAGE_KEYS.DEFAULT_TOOLS]: prefs } = await chrome.storage.sync.get(STORAGE_KEYS.DEFAULT_TOOLS);
  return prefs || {};
}

export async function saveDefaultToolPreferences(prefs: DefaultToolPreferences): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.DEFAULT_TOOLS]: prefs });
}

export async function getDefaultToolForPageType(pageType: string): Promise<string | undefined> {
  const prefs = await getDefaultToolPreferences();
  return prefs[pageType as keyof DefaultToolPreferences];
}