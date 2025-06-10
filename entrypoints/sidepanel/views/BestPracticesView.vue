<template>
  <div class="best-practices-view">
    <ToolHeader 
      title="Best Practices Analysis" 
      :show-back="true"
      :show-refresh="true"
      :refreshing="loading"
      @refresh="refreshAnalysis"
      @back="$emit('back')"
    />
    
    <div class="content-wrapper">
    <div v-if="reloadingAfterSave" class="loading-container">
      <Loader2 class="loader-icon" />
      <p>Refreshing analysis after save...</p>
    </div>
    
    <div v-else-if="loading" class="loading-container">
      <Loader2 class="loader-icon" />
      <p>Analyzing bot content...</p>
    </div>

    <ConnectionError 
      v-else-if="error"
      :type="getErrorType(error)"
      :customMessage="error"
      @retry="refreshAnalysis"
    />

    <div v-else-if="!botContent" class="empty-container">
      <AlertCircle class="warning-icon" />
      <h3>No Bot Content</h3>
      <p>Unable to load bot content. Please ensure you're on a taskbot page.</p>
    </div>

    <div v-else class="content-wrapper">
      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-header">
          <h3>Analysis Summary</h3>
        </div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">{{ totalIssues }}</div>
            <div class="summary-label">Total Issues</div>
          </div>
          <div class="summary-card orange">
            <div class="summary-value">{{ bestPracticesIssues.length }}</div>
            <div class="summary-label">Best Practices</div>
          </div>
          <div class="summary-card red">
            <div class="summary-value">{{ actionIssues.length + variableIssues.length }}</div>
            <div class="summary-label">Code Issues</div>
          </div>
        </div>
      </div>

      <!-- Issues Sections -->
      <div class="issues-container">
        <!-- Best Practices Issues -->
        <div v-if="bestPracticesIssues.length > 0" class="issue-section">
          <div class="section-header" @click="toggleSection('bestPractices')">
            <div class="header-content">
              <CheckCircle class="section-icon orange" />
              <span>Best Practices ({{ bestPracticesIssues.length }})</span>
            </div>
            <ChevronRight :size="20" class="chevron-icon" :class="{ expanded: !collapsedSections.bestPractices }" />
          </div>
          <div v-show="!collapsedSections.bestPractices" class="section-content">
            <div
              v-for="(issue, index) in bestPracticesIssues"
              :key="`bp-${index}`"
              class="issue-item"
              @click="handleIssueClick(issue)"
            >
              <h4>{{ issue.commandName }}</h4>
              <p>{{ issue.IssueDetail }}</p>
              <span v-if="issue.issueType" class="issue-type">{{ issue.issueType }}</span>
            </div>
          </div>
        </div>

        <!-- Action Issues -->
        <div v-if="actionIssues.length > 0" class="issue-section">
          <div class="section-header" @click="toggleSection('actions')">
            <div class="header-content">
              <AlertCircle class="section-icon red" />
              <span>Actions Breaking Rules ({{ actionIssues.length }})</span>
            </div>
            <ChevronRight :size="20" class="chevron-icon" :class="{ expanded: !collapsedSections.actions }" />
          </div>
          <div v-show="!collapsedSections.actions" class="section-content">
            <div
              v-for="(issue, index) in actionIssues"
              :key="`action-${index}`"
              class="issue-item clickable"
              @click="handleIssueClick(issue)"
            >
              <h4>{{ issue.commandName }}</h4>
              <p>{{ issue.IssueDetail }}</p>
              <span v-if="issue.LineNumber" class="line-number">Line {{ issue.LineNumber }}</span>
            </div>
          </div>
        </div>

        <!-- Variable Issues -->
        <div v-if="variableIssues.length > 0" class="issue-section">
          <div class="section-header" @click="toggleSection('variables')">
            <div class="header-content">
              <Variable class="section-icon yellow" />
              <span>Variables Breaking Rules ({{ variableIssues.length }})</span>
            </div>
            <ChevronRight :size="20" class="chevron-icon" :class="{ expanded: !collapsedSections.variables }" />
          </div>
          <div v-show="!collapsedSections.variables" class="section-content">
            <div
              v-for="(issue, index) in variableIssues"
              :key="`var-${index}`"
              class="issue-item clickable"
              @click="handleVariableClick(issue)"
            >
              <h4>
                <component v-if="issue.type" :is="getVariableTypeIcon(issue.type)" :size="16" class="inline-icon" />
                {{ issue.name }}
              </h4>
              <p>{{ issue.IssueDetail }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Variable Information Section -->
      <div v-if="variableInfo.length > 0" class="variable-info-section issue-section">
        <div class="section-header" @click="toggleSection('variableInfo')">
          <div class="header-content">
            <Variable class="section-icon blue" />
            <span>Arguments & Constants ({{ inputVariables.length + outputVariables.length + inputOutputVariables.length }} args, {{ constantVariables.length }} const)</span>
          </div>
          <ChevronRight :size="20" class="chevron-icon" :class="{ expanded: !collapsedSections.variableInfo }" />
        </div>
        <div v-show="!collapsedSections.variableInfo" class="section-content">
          <!-- Show placeholder if no categorized variables -->
          <div v-if="inputVariables.length === 0 && outputVariables.length === 0 && inputOutputVariables.length === 0 && constantVariables.length === 0" class="empty-variables">
            <div class="empty-icon">
              <Variable :size="48" />
            </div>
            <h3>No Categorized Variables</h3>
            <p>This bot doesn't have any input, output, or constant variables defined.</p>
          </div>

          <!-- Show categorized variables -->
          <div v-else class="variable-grid">
            <!-- Input Variables -->
            <div v-if="inputVariables.length > 0" class="variable-category">
              <div class="category-header">
                <ArrowDown :size="20" class="category-icon input" />
                <div class="category-info">
                  <h4>Input Variables</h4>
                  <span class="category-count">{{ inputVariables.length }}</span>
                </div>
              </div>
              <div class="variable-list">
                <div
                  v-for="(variable, index) in inputVariables"
                  :key="`input-${index}`"
                  class="variable-card clickable"
                  @click="handleVariableClick(variable)"
                >
                  <div class="variable-header">
                    <span class="variable-name">
                      <component :is="getVariableTypeIcon(variable.type)" :size="14" class="type-icon" />
                      {{ variable.name }}
                    </span>
                    <span class="variable-type">{{ variable.type }}</span>
                  </div>
                  <div v-if="variable.defaultValue" class="variable-default">
                    Default: {{ formatVariableValue(variable) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Output Variables -->
            <div v-if="outputVariables.length > 0" class="variable-category">
              <div class="category-header">
                <ArrowUp :size="20" class="category-icon output" />
                <div class="category-info">
                  <h4>Output Variables</h4>
                  <span class="category-count">{{ outputVariables.length }}</span>
                </div>
              </div>
              <div class="variable-list">
                <div
                  v-for="(variable, index) in outputVariables"
                  :key="`output-${index}`"
                  class="variable-card clickable"
                  @click="handleVariableClick(variable)"
                >
                  <div class="variable-header">
                    <span class="variable-name">
                      <component :is="getVariableTypeIcon(variable.type)" :size="14" class="type-icon" />
                      {{ variable.name }}
                    </span>
                    <span class="variable-type">{{ variable.type }}</span>
                  </div>
                  <div v-if="variable.defaultValue" class="variable-default">
                    Default: {{ formatVariableValue(variable) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Input/Output Variables -->
            <div v-if="inputOutputVariables.length > 0" class="variable-category">
              <div class="category-header">
                <ArrowUpDown :size="20" class="category-icon input-output" />
                <div class="category-info">
                  <h4>Input/Output Variables</h4>
                  <span class="category-count">{{ inputOutputVariables.length }}</span>
                </div>
              </div>
              <div class="variable-list">
                <div
                  v-for="(variable, index) in inputOutputVariables"
                  :key="`io-${index}`"
                  class="variable-card clickable"
                  @click="handleVariableClick(variable)"
                >
                  <div class="variable-header">
                    <span class="variable-name">
                      <component :is="getVariableTypeIcon(variable.type)" :size="14" class="type-icon" />
                      {{ variable.name }}
                    </span>
                    <span class="variable-type">{{ variable.type }}</span>
                  </div>
                  <div v-if="variable.defaultValue" class="variable-default">
                    Default: {{ formatVariableValue(variable) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Constant Variables -->
            <div v-if="constantVariables.length > 0" class="variable-category">
              <div class="category-header">
                <Anchor :size="20" class="category-icon constant" />
                <div class="category-info">
                  <h4>Constant Variables</h4>
                  <span class="category-count">{{ constantVariables.length }}</span>
                </div>
              </div>
              <div class="variable-list">
                <div
                  v-for="(variable, index) in constantVariables"
                  :key="`const-${index}`"
                  class="variable-card clickable"
                  @click="handleVariableClick(variable)"
                >
                  <div class="variable-header">
                    <span class="variable-name">
                      <component :is="getVariableTypeIcon(variable.type)" :size="14" class="type-icon" />
                      {{ variable.name }}
                    </span>
                    <span class="variable-type">{{ variable.type }}</span>
                  </div>
                  <div v-if="variable.defaultValue" class="variable-default">
                    Value: {{ formatVariableValue(variable) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Issues -->
      <div v-if="totalIssues === 0" class="success-container">
        <CheckCircle class="success-icon" />
        <h3>Excellent!</h3>
        <p>No best practice violations found.</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { sendMessage } from '../composables/useTabState';
import { usePageContext } from '../composables/usePageContext';
import { getConfig, type BestPracticesConfig } from '../utils/storage';
import { 
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  RefreshCw,
  Variable,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Anchor,
  Box,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  List,
  Book,
  Table as TableIcon,
  File,
  Key,
  Grid3x3,
  Rows3,
  Monitor,
  FileText,
  FormInput
} from 'lucide-vue-next';
import ToolHeader from '../components/ToolHeader.vue';
import ConnectionError from '../components/ConnectionError.vue';
import { getErrorType } from '../utils/errorMessages';

defineEmits<{
  back: [];
}>();

const { pageContext, currentUrl } = usePageContext();

const loading = ref(true);
const error = ref<string | null>(null);
const botContent = ref<any>(null);
const config = ref<BestPracticesConfig | null>(null);

// Analysis results
const bestPracticesIssues = ref<any[]>([]);
const actionIssues = ref<any[]>([]);
const variableIssues = ref<any[]>([]);
const variableInfo = ref<any[]>([]);

// UI state
const collapsedSections = ref({
  bestPractices: false,
  actions: false,
  variables: false,
  variableInfo: false
});

const totalIssues = computed(() => 
  bestPracticesIssues.value.length + 
  actionIssues.value.length + 
  variableIssues.value.length
);

// Computed properties for different variable types
const inputVariables = computed(() => 
  variableInfo.value.filter(v => v.input === true && v.output !== true)
);

const outputVariables = computed(() => 
  variableInfo.value.filter(v => v.output === true && v.input !== true)
);

const inputOutputVariables = computed(() => 
  variableInfo.value.filter(v => v.input === true && v.output === true)
);

const constantVariables = computed(() => 
  variableInfo.value.filter(v => v.readOnly === true)
);

// All variables that don't fall into the above categories
const allVariables = computed(() => variableInfo.value);

// Load bot content
async function loadBotContent() {
  loading.value = true;
  error.value = null;
  
  try {
    // Get configuration
    config.value = await getConfig();
    
    // Get bot content from API
    const fileId = pageContext.value.fileId;
    if (!fileId) {
      throw new Error('No file ID found');
    }
    
    // Get auth token from content script
    const authResponse = await sendMessage({ action: 'getAuthToken' });
    if (!authResponse.success) {
      throw new Error('Failed to get auth token');
    }
    
    // Call API through background script
    const response = await chrome.runtime.sendMessage({
      action: 'apiRequest',
      config: {
        url: `${pageContext.value.url.split('#')[0].replace(/\/[^\/]*$/, '')}/v2/repository/files/${fileId}/content`,
        method: 'GET',
        headers: {
          'X-Authorization': authResponse.authToken,
          'Content-Type': 'application/json',
          'X-Bot-Content': 'true'
        }
      }
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load bot content');
    }
    
    botContent.value = response.data;
    analyzeBotContent();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load bot content';
  } finally {
    loading.value = false;
  }
}

// Analyze bot content
function analyzeBotContent() {
  if (!botContent.value || !config.value) return;
  
  // Reset results
  bestPracticesIssues.value = [];
  actionIssues.value = [];
  variableIssues.value = [];
  variableInfo.value = [];
  
  // Analyze best practices
  analyzeBestPractices();
  
  // Analyze actions
  analyzeActions(botContent.value.nodes || [], 0);
  
  // Analyze variables
  analyzeVariables();
  
  // Populate variable info
  populateVariableInfo();
}

// Best practices analysis
function analyzeBestPractices() {
  if (!config.value) return;
  const cfg = config.value.bestPractices;
  const props = botContent.value.properties || {};
  const nodes = botContent.value.nodes || [];
  const variables = botContent.value.variables || [];
  
  // Check for error handling
  if (cfg.tryCatch && !hasErrorHandling(nodes)) {
    bestPracticesIssues.value.push({
      issueType: 'Code reliability',
      commandName: 'Try-Catch',
      IssueDetail: 'Missing error handling commands'
    });
  }
  
  // Check for comments
  if (cfg.comment && !hasComments(nodes)) {
    bestPracticesIssues.value.push({
      issueType: 'Code readability & maintenance',
      commandName: 'Comment',
      IssueDetail: 'Missing Comment command'
    });
  }
  
  // Check for steps
  if (cfg.step && !hasSteps(nodes)) {
    bestPracticesIssues.value.push({
      issueType: 'Code readability & maintenance',
      commandName: 'Step',
      IssueDetail: 'Missing Step command'
    });
  }
  
  // Check timeout
  if (cfg.timeoutZero && props.timeout && props.timeout !== '0s') {
    bestPracticesIssues.value.push({
      issueType: 'Bot Execution Behavior',
      commandName: 'Runtime timeout',
      IssueDetail: `Automation is set to stop after: ${props.timeout}`
    });
  }
  
  // Check priority
  if (cfg.priorityMedium && props.automationPriority && props.automationPriority !== 'PRIORITY_MEDIUM') {
    bestPracticesIssues.value.push({
      issueType: 'Bot Execution Behavior',
      commandName: 'Automation Priority',
      IssueDetail: `Current Automation Priority: ${props.automationPriority}`
    });
  }
  
  // Check line count
  const totalLines = countTotalLines(nodes);
  if (cfg.maxLineOfCode > 0 && totalLines > cfg.maxLineOfCode) {
    bestPracticesIssues.value.push({
      issueType: 'Code readability & maintenance',
      commandName: 'Action count exceeds',
      IssueDetail: `More than ${cfg.maxLineOfCode} lines in same taskbot`
    });
  }
  
  // Check variable count
  if (cfg.maxVariableCount > 0 && variables.length > cfg.maxVariableCount) {
    bestPracticesIssues.value.push({
      issueType: 'Code readability & maintenance',
      commandName: 'Variable count exceeds',
      IssueDetail: `More than ${cfg.maxVariableCount} variables in same taskbot`
    });
  }
  
  // Check bot version
  if (cfg.botCodeVersion > 0 && props.botCodeVersion && props.botCodeVersion < cfg.botCodeVersion) {
    bestPracticesIssues.value.push({
      issueType: 'Bot Execution Behavior',
      commandName: 'Bot Compatibility',
      IssueDetail: `Bot compatibility version is lower than: ${cfg.botCodeVersion}`
    });
  }
}

// Action analysis
function analyzeActions(nodes: any[], startLineNumber: number = 0): number {
  if (!config.value) return startLineNumber;
  const cfg = config.value.actions;
  
  // Get all nodes from the root that are outside try-catch blocks
  const nonTryCatchNodes = getNonTryCatchParentNodesUID(botContent.value.nodes || []);
  
  let lineNumber = startLineNumber;
  
  nodes.forEach((node) => {
    lineNumber++;
    const issues: any = {
      LineNumber: lineNumber,
      commandName: node.commandName
    };
    
    // Check empty containers
    if (cfg.emptyContainersDisallowed && node.children?.length === 0) {
      issues.IssueDetail = 'Empty command';
    }
    
    // Check disabled actions
    if (cfg.disabledActionsDisallowed && node.disabled) {
      issues.IssueDetail = 'Disabled action not removed';
    }
    
    // Check commands outside try-catch
    if (cfg.outOfErrHandlingDisallowed && 
        nonTryCatchNodes.includes(node.uid) &&
        !(node.commandName === 'Comment' && node.packageName === 'Comment')) {
      issues.IssueDetail = 'Command outside try-catch block';
    }
    
    // Check message box
    if (cfg.msgBoxDisallowed && 
        node.commandName === 'messageBox' && 
        node.packageName === 'MessageBox') {
      issues.IssueDetail = 'Message box not removed';
    }
    
    // Check delays
    if (cfg.delayDisallowed && 
        node.commandName === 'delay' && 
        node.packageName === 'Delay') {
      if (node.attributes?.[0]?.value?.string === 'REGULAR' && 
          node.attributes?.[1]?.value?.number) {
        issues.IssueDetail = 'Hardcoded delay found';
      } else if (node.attributes?.[0]?.value?.string === 'RANDOM' &&
                 (node.attributes?.[1]?.value?.number || 
                  node.attributes?.[2]?.value?.number)) {
        issues.IssueDetail = 'Hardcoded delay found';
      }
    }
    
    // Check code breaks
    if (cfg.codeBreakDisallowed && 
        node.packageName === 'TaskBot' &&
        (node.commandName === 'stopTask' || node.commandName === 'pauseTask')) {
      issues.IssueDetail = 'Code break present';
    }
    
    if (issues.IssueDetail) {
      actionIssues.value.push(issues);
    }
    
    // Recurse through children and branches
    if (node.children && node.children.length > 0) {
      lineNumber = analyzeActions(node.children, lineNumber);
    }
    if (node.branches && node.branches.length > 0) {
      lineNumber = analyzeActions(node.branches, lineNumber);
    }
  });
  
  return lineNumber;
}

// Variable analysis
function analyzeVariables() {
  if (!config.value) return;
  const cfg = config.value.variables;
  const variables = botContent.value.variables || [];
  
  variables.forEach((variable: any) => {
    const issues: any = { name: variable.name, type: variable.type };
    
    // Check hardcoded values
    if (cfg.hardCodedNotConstant && 
        variable.defaultValue && 
        !variable.readOnly) {
      if ((variable.type === 'STRING' && variable.defaultValue.string) ||
          (variable.type === 'NUMBER' && variable.defaultValue.number !== 0)) {
        issues.IssueDetail = 'Hardcoded value assigned to non-constant variable';
      }
    }
    
    // Check constant naming
    if (cfg.constantNotCapital && 
        variable.readOnly && 
        variable.name !== variable.name.toUpperCase()) {
      issues.IssueDetail = 'Constant variable name not capitalized';
    }
    
    // Check variable patterns
    if (variable.input && variable.output && cfg.inputOutputPattern) {
      if (!new RegExp(cfg.inputOutputPattern).test(variable.name)) {
        issues.IssueDetail = `Input+Output type variable name mismatch regex ${cfg.inputOutputPattern}`;
      }
    } else if (variable.input && !variable.output && cfg.inputPattern) {
      if (!new RegExp(cfg.inputPattern).test(variable.name)) {
        issues.IssueDetail = `Input type variable name mismatch regex ${cfg.inputPattern}`;
      }
    } else if (!variable.input && variable.output && cfg.outputPattern) {
      if (!new RegExp(cfg.outputPattern).test(variable.name)) {
        issues.IssueDetail = `Output type variable name mismatch regex ${cfg.outputPattern}`;
      }
    } else if (!variable.input && !variable.output && cfg.variablePattern) {
      if (!new RegExp(cfg.variablePattern).test(variable.name)) {
        issues.IssueDetail = `Regular type variable name mismatch regex ${cfg.variablePattern}`;
      }
    }
    
    // Check variable name length
    if (cfg.variableMinSize && variable.name.length < cfg.variableMinSize) {
      issues.IssueDetail = `Variable name length less than allowed minimum length of ${cfg.variableMinSize}`;
    }
    
    if (issues.IssueDetail) {
      variableIssues.value.push(issues);
    }
  });
}

// Helper functions
function hasErrorHandling(nodes: any[]): boolean {
  return nodes.some(node => 
    node.commandName === 'try' && node.packageName === 'ErrorHandler' ||
    (node.children && hasErrorHandling(node.children)) ||
    (node.branches && hasErrorHandling(node.branches))
  );
}

function hasComments(nodes: any[]): boolean {
  return nodes.some(node => 
    node.commandName === 'Comment' && node.packageName === 'Comment' ||
    (node.children && hasComments(node.children)) ||
    (node.branches && hasComments(node.branches))
  );
}

function hasSteps(nodes: any[]): boolean {
  return nodes.some(node => 
    node.commandName === 'step' && node.packageName === 'Step' ||
    (node.children && hasSteps(node.children)) ||
    (node.branches && hasSteps(node.branches))
  );
}

function countTotalLines(nodes: any[]): number {
  let count = 0;
  nodes.forEach(node => {
    count++;
    if (node.children) count += countTotalLines(node.children);
    if (node.branches) count += countTotalLines(node.branches);
  });
  return count;
}

// Helper function to get UIDs of nodes that are not inside try-catch blocks
function getNonTryCatchParentNodesUID(nodes: any[]): string[] {
  const nodesOutsideTryCatch: string[] = [];
  
  function collectNodesOutsideTryCatch(nodeList: any[], isInsideTryCatch: boolean = false) {
    if (!nodeList || !Array.isArray(nodeList)) return;
    
    nodeList.forEach(node => {
      // Check if this is a try block
      const isTryBlock = node.commandName === 'try' && node.packageName === 'ErrorHandler';
      
      // For non-try nodes: if we're not inside any try-catch, add this node
      if (!isTryBlock && !isInsideTryCatch) {
        nodesOutsideTryCatch.push(node.uid);
      }
      
      // Recurse through children
      if (node.children && node.children.length > 0) {
        // If this is a try block, its children ARE inside try-catch protection
        collectNodesOutsideTryCatch(node.children, isInsideTryCatch || isTryBlock);
      }
      
      // Recurse through branches (for if/else, catch blocks, etc.)
      if (node.branches && node.branches.length > 0) {
        // For try blocks, branches (catch blocks) are still inside error handling
        // For other nodes, branches inherit the parent's try-catch status
        collectNodesOutsideTryCatch(node.branches, isInsideTryCatch || isTryBlock);
      }
    });
  }
  
  collectNodesOutsideTryCatch(nodes);
  return nodesOutsideTryCatch;
}

// Populate variable info
function populateVariableInfo() {
  if (!botContent.value || !botContent.value.variables) return;
  
  variableInfo.value = botContent.value.variables.map((variable: any) => ({
    name: variable.name,
    type: variable.type,
    input: variable.input || false,
    output: variable.output || false,
    readOnly: variable.readOnly || false,
    defaultValue: variable.defaultValue || null
  }));
}

// Get icon for variable type
function getVariableTypeIcon(type: string) {
  switch(type) {
    case 'STRING':
      return Type;
    case 'NUMBER':
      return Hash;
    case 'BOOLEAN':
      return ToggleLeft;
    case 'DATETIME':
      return Calendar;
    case 'LIST':
      return List;
    case 'DICTIONARY':
      return Book;
    case 'TABLE':
    case 'DATATABLE':
      return TableIcon;
    case 'FILE':
      return File;
    case 'CREDENTIAL':
      return Key;
    case 'RECORD':
      return Rows3;
    case 'WINDOW':
      return Monitor;
    case 'SESSION':
      return FileText;
    case 'FORM':
      return FormInput;
    default:
      return Box;
  }
}

// Format variable value based on type
function formatVariableValue(variable: any): string {
  if (!variable.defaultValue) return 'None';
  
  const type = variable.type;
  const value = variable.defaultValue;
  
  switch(type) {
    case 'STRING':
      return value.string || '""';
    case 'NUMBER':
      return value.number !== undefined ? value.number.toString() : '0';
    case 'BOOLEAN':
      return value.boolean !== undefined ? value.boolean.toString() : 'false';
    case 'DATETIME':
      return value.string || 'Not set';
    case 'LIST':
      return value.list && value.list.length > 0 ? `[${value.list.length} items]` : '[]';
    case 'DICTIONARY':
      return value.dictionary && value.dictionary.length > 0 ? `{${value.dictionary.length} entries}` : '{}';
    case 'TABLE':
      return value.table ? `Table with ${value.table.rows?.length || 0} rows` : 'Empty table';
    case 'FILE':
      return value.string || 'No file';
    case 'CREDENTIAL':
      return 'Credential';
    case 'RECORD':
      return value.record ? `Record with ${value.record.schema?.length || 0} fields` : 'Empty record';
    default:
      return 'Not set';
  }
}

// Event handlers
async function handleIssueClick(issue: any) {
  if (issue.LineNumber) {
    await sendMessage({
      action: 'CLICK_LINE',
      lineNumber: issue.LineNumber
    });
  }
}

async function handleVariableClick(variable: any) {
  await sendMessage({
    action: 'OPEN_VARIABLE',
    variableName: variable.name
  });
}

async function refreshAnalysis() {
  await loadBotContent();
}

function toggleSection(section: 'bestPractices' | 'actions' | 'variables') {
  collapsedSections.value[section] = !collapsedSections.value[section];
}

// Watch for URL changes
watch(currentUrl, (newUrl, oldUrl) => {
  if (!newUrl || newUrl === oldUrl) return;
  
  // Check if we're still on a bot page and the file ID has changed
  const newFileId = pageContext.value.fileId;
  if (newFileId) {
    loadBotContent();
  }
});

// Track if we're reloading due to save
const reloadingAfterSave = ref(false);

// Listen for bot save events
const handleMessage = (request: any, sender: any, sendResponse: any) => {
  if (request.action === 'botSaved') {
    // Show loading state
    reloadingAfterSave.value = true;
    
    // Reload bot content after a short delay to ensure save is complete
    setTimeout(() => {
      loadBotContent().finally(() => {
        reloadingAfterSave.value = false;
      });
    }, 1500);
  }
};

onMounted(() => {
  loadBotContent();
  
  // Listen for messages
  chrome.runtime.onMessage.addListener(handleMessage);
});

onBeforeUnmount(() => {
  // Remove message listener
  chrome.runtime.onMessage.removeListener(handleMessage);
});
</script>

<style scoped>
.best-practices-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--bg-secondary, #fafbfc);
}

/* Loading, Error, and Empty States */
.loading-container,
.error-container,
.empty-container,
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 400px;
}

.loader-icon {
  width: 64px;
  height: 64px;
  animation: spin 1s linear infinite;
  color: #667eea;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.issue-section {
  animation: fadeIn 0.3s ease-out;
}

.error-icon,
.warning-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fee2e2;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
}

.warning-icon {
  color: #f59e0b;
  background: #fef3c7;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2);
}

.success-icon {
  width: 80px;
  height: 80px;
  color: #10b981;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #d1fae5;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

/* Buttons */
.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 1rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.875rem;
  color: var(--text-primary, #374151);
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--border-hover, #d1d5db);
}

/* Summary Section */
.summary-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-xl, 0.75rem);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1.25rem;
  border-radius: var(--radius-lg, 0.5rem);
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-card.orange .summary-value {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-card.red .summary-value {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-label {
  font-size: 0.813rem;
  color: var(--text-primary, #374151);
  margin-top: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Issues Container */
.issues-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Variable Information Section spacing */
.variable-info-section {
  margin-top: 1.5rem;
}

/* Issue Sections */
.issue-section {
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;
}

.issue-section:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(to right, var(--bg-hover, #f9fafb), white);
  border-bottom: 2px solid var(--border-color, #e5e7eb);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.section-header:hover {
  background: linear-gradient(to right, #f3f4f6, #fafbfc);
  padding-left: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-weight: 600;
  font-size: 0.938rem;
}

.section-icon {
  width: 24px;
  height: 24px;
  padding: 4px;
  border-radius: var(--radius-md, 0.375rem);
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-icon.orange {
  color: #f59e0b;
  background: #fef3c7;
}

.section-icon.red {
  color: #ef4444;
  background: #fee2e2;
}

.section-icon.yellow {
  color: #eab308;
  background: #fef9c3;
}

.section-icon.blue {
  color: #3b82f6;
  background: #dbeafe;
}

.section-icon.yellow {
  color: #eab308;
  background: #fef9c3;
}

.chevron-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary, #6b7280);
  transition: transform 0.2s;
}

.chevron-icon.expanded {
  transform: rotate(90deg);
}

.section-content {
  padding: 0.5rem;
  background: #fafbfc;
}

/* Issue Items */
.issue-item {
  padding: 1rem 1.25rem;
  margin: 0.75rem;
  background: var(--bg-hover, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.issue-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary, #3b82f6);
  transform: scaleY(0);
  transition: transform 0.2s;
}

.issue-item.clickable {
  cursor: pointer;
}

.issue-item:hover {
  background: white;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateX(4px);
}

.issue-item:hover::before {
  transform: scaleY(1);
}

.issue-item h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.inline-icon {
  color: var(--primary, #3b82f6);
  flex-shrink: 0;
}

.issue-item p {
  margin: 0;
  font-size: 0.813rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

.issue-type,
.line-number {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--text-tertiary, #9ca3af);
  margin-top: 0.25rem;
}

.line-number {
  background: var(--primary-light, #eff6ff);
  color: var(--primary, #3b82f6);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
}

/* Empty Variables State */
.empty-variables {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-icon {
  margin-bottom: 1.5rem;
  color: var(--text-tertiary, #9ca3af);
}

.empty-variables h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem 0;
}

.empty-variables p {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

/* Variable Grid */
.variable-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  padding: 1.25rem;
}

@media (max-width: 640px) {
  .content-wrapper {
    padding: 1rem;
  }

  .summary-section {
    padding: 1.25rem;
  }

  .summary-grid {
    gap: 0.75rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .summary-value {
    font-size: 1.75rem;
  }

  .variable-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .section-header {
    padding: 0.875rem 1rem;
  }

  .header-content {
    font-size: 0.875rem;
  }

  .issue-item {
    padding: 0.875rem 1rem;
    margin: 0.5rem;
  }
}

.variable-category {
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  padding: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.variable-category:hover {
  border-color: var(--border-hover, #d1d5db);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-color, #e5e7eb);
}

.category-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
  letter-spacing: 0.025em;
}

.category-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  background: white;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.category-icon {
  width: 32px;
  height: 32px;
  padding: 6px;
  border-radius: var(--radius-md, 0.375rem);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-icon.input {
  color: #3b82f6;
  background: #dbeafe;
}

.category-icon.output {
  color: #10b981;
  background: #d1fae5;
}

.category-icon.input-output {
  color: #8b5cf6;
  background: #ede9fe;
}

.category-icon.constant {
  color: #6366f1;
  background: #e0e7ff;
}

.variable-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-card {
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  padding: 0.75rem;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.variable-card.clickable {
  cursor: pointer;
}

.variable-card.clickable:hover {
  background: white;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.variable-card.clickable::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary, #3b82f6);
  transform: scaleX(0);
  transition: transform 0.2s;
}

.variable-card.clickable:hover::before {
  transform: scaleX(1);
}

.variable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.variable-name {
  font-weight: 600;
  font-size: 0.813rem;
  color: var(--text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.variable-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-icon {
  color: var(--text-secondary, #6b7280);
  flex-shrink: 0;
}

.variable-type {
  font-size: 0.688rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  background: var(--bg-tertiary, #f3f4f6);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm, 0.25rem);
  flex-shrink: 0;
}

.variable-default {
  font-size: 0.688rem;
  color: var(--text-tertiary, #9ca3af);
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Utilities */
h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

p {
  margin: 0;
  color: #6b7280;
}
</style>