import { getCurrentRouteConfig } from './sidepanel/config/routes';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const currentUrl = window.location.href;
    const routeConfig = getCurrentRouteConfig(currentUrl);
    
    // Only show indicator if we have tools for this page
    if (routeConfig) {
      // Detected supported page type
      
      // Add a visual indicator that the extension is active
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 9999;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
      `;
      indicator.textContent = `Bot Assistant: ${routeConfig.name}`;
      indicator.title = 'Click to open side panel';
      
      indicator.addEventListener('click', () => {
        // Provide visual feedback
        indicator.style.transform = 'scale(0.95)';
        setTimeout(() => {
          indicator.style.transform = 'scale(1)';
        }, 100);
        
        chrome.runtime.sendMessage({ action: 'openSidePanel' }, (response) => {
          if (response?.success) {
            // Briefly highlight on successful open
            indicator.style.background = '#10b981';
            setTimeout(() => {
              indicator.style.background = '#2563eb';
            }, 200);
          }
        });
      });
      
      // Add hover effect
      indicator.addEventListener('mouseenter', () => {
        indicator.style.opacity = '1';
      });
      
      document.body.appendChild(indicator);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        indicator.style.opacity = '0.3';
      }, 3000);
    } else {
      // No tools available for this page
    }
    
    // Function to refresh folder list
    function refreshFolderList() {
      const refreshButton = document.getElementsByName("table-refresh")[0] as HTMLElement;
      if (refreshButton) {
        refreshButton.click();
        // Folder list refreshed
      } else {
        // Refresh button not found
      }
    }

    // Function to click action by line number
    function clickActionByLineNumber(lineNumber: number) {
      // First expand all nodes
      expandNodes();
      
      // Try newer UI structure
      let actionElement = document.evaluate(
        `(//div[contains(@class, 'taskbot-canvas-list-node__number') and text()='${lineNumber}']/..//div[contains(@class, 'taskbot-canvas-list-node__title')])[1]`,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue as HTMLElement;
      
      // Try older UI structure if not found
      if (!actionElement) {
        actionElement = document.evaluate(
          `(//div[contains(@class, 'taskbotlistnode-number') and text()='${lineNumber}']/..//div[contains(@class, 'taskbotlistnode-title')])[1]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLElement;
      }
      
      if (actionElement) {
        actionElement.click();
        return true;
      }
      return false;
    }

    // Function to expand all nodes
    function expandNodes() {
      // Switch to list view
      const listViewTab = document.querySelectorAll(`button[role='tab']`)[1] as HTMLElement;
      if (listViewTab) {
        listViewTab.click();
      }
      
      // Expand older UI structure
      let collapsedNodes = document.querySelectorAll(".taskbotlistnode-collapser>.fa-caret-right");
      while (collapsedNodes.length > 0) {
        (collapsedNodes[0] as HTMLElement).click();
        collapsedNodes = document.querySelectorAll(".taskbotlistnode-collapser>.fa-caret-right");
      }
      
      // Expand newer UI structure
      collapsedNodes = document.querySelectorAll(".taskbot-canvas-list-node__collapser>.fa-caret-right");
      while (collapsedNodes.length > 0) {
        (collapsedNodes[0] as HTMLElement).click();
        collapsedNodes = document.querySelectorAll(".taskbot-canvas-list-node__collapser>.fa-caret-right");
      }
    }

    // Function to open variable by name
    function openVariableByName(variableName: string) {
      // Open right panel if closed
      const toggleButton = document.querySelector('button[class*="editor-layout__resize-toggle"]');
      const expandIcon = toggleButton?.querySelector('span[class*="--icon_chevron-right"]');
      if (expandIcon) {
        (toggleButton as HTMLElement).click();
      }
      
      // Wait a bit for panel to open
      setTimeout(() => {
        // Expand variable groups
        const userDefinedButton = document.querySelector(
          `button[data-group-name="variable-group:USER_DEFINED"]`
        ) as HTMLElement;
        const workItemButton = document.querySelector(
          `button[data-group-name="variable-group:WORK_ITEM"]`
        ) as HTMLElement;
        
        if (userDefinedButton && !userDefinedButton.hasAttribute("data-open")) {
          userDefinedButton.click();
        }
        
        if (workItemButton && !workItemButton.hasAttribute("data-open")) {
          workItemButton.click();
        }
        
        // Wait for variable groups to expand
        setTimeout(() => {
          // Click on the variable - try both lowercase and original casing
          let variableButton = document.querySelector(
            `div[data-item-name='${variableName.toLowerCase()}'] button[name='item-button']`
          ) as HTMLElement;
          
          // If not found with lowercase, try original casing
          if (!variableButton) {
            variableButton = document.querySelector(
              `div[data-item-name='${variableName}'] button[name='item-button']`
            ) as HTMLElement;
          }
          
          if (variableButton) {
            variableButton.click();
            return true;
          }
          return false;
        }, 100);
      }, 100);
    }

    // Listen for messages from extension (sidepanel/background)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ping') {
        sendResponse({ success: true, pong: true });
        return true;
      } else if (request.action === 'getAuthToken') {
        try {
          let authToken = localStorage.getItem('authToken');
          // Remove quotes if the token is wrapped in them
          if (authToken && authToken.startsWith('"') && authToken.endsWith('"')) {
            authToken = authToken.slice(1, -1);
          }
          sendResponse({ success: true, authToken });
        } catch (error) {
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        return true;
      } else if (request.action === 'refreshFolderList') {
        refreshFolderList();
        sendResponse({ success: true });
        return true;
      } else if (request.action === 'CLICK_LINE') {
        const success = clickActionByLineNumber(request.lineNumber);
        sendResponse({ success });
        return true;
      } else if (request.action === 'OPEN_VARIABLE') {
        const success = openVariableByName(request.variableName);
        sendResponse({ success });
        return true;
      }
    });
    
    // Watch for save button status changes for Best Practices tool
    function addTaskSavedObserver() {
      let mainLayout = document.getElementById("root");
      if (!mainLayout) {
        window.setTimeout(addTaskSavedObserver, 500);
        return;
      }
      
      let lastSaveTime = 0;
      const DEBOUNCE_TIME = 3000; // 3 seconds debounce
      
      const taskConfig = {
        attributes: true,
        subtree: true,
        attributeFilter: ["aria-label", "data-input-status"],
      };
      
      const taskCallback = (mutationList: MutationRecord[]) => {
        for (const mutation of mutationList) {
          // Check for "Saved" label (new pattern)
          if (
            mutation.target instanceof HTMLElement &&
            mutation.target.classList.contains("editor-page-saver") &&
            mutation.target.innerText?.trim() === "Saved"
          ) {
            const now = Date.now();
            if (now - lastSaveTime > DEBOUNCE_TIME) {
              lastSaveTime = now;
              chrome.runtime.sendMessage({ action: 'botSaved' });
              
              // Show visual indicator
              const indicator = document.createElement('div');
              indicator.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 9999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              `;
              indicator.textContent = 'Bot saved - refreshing analysis...';
              document.body.appendChild(indicator);
              setTimeout(() => indicator.remove(), 3000);
            }
            break;
          }        
        }
      };
      
      const taskObserver = new MutationObserver(taskCallback);
      taskObserver.observe(mainLayout, taskConfig);
    }
    
    // Initialize save button watcher if on a bot edit page
    if (window.location.href.includes('/edit') || window.location.href.includes('/taskbots/')) {
      addTaskSavedObserver();
    }
  },
});