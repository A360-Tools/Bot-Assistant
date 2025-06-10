// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

function initializePopup() {
  const button = document.getElementById('openPanel');
  if (!button) {
    console.error('Open panel button not found');
    return;
  }
  
  button.addEventListener('click', async () => {
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.id) {
        // Open the side panel for the current tab
        await chrome.sidePanel.open({ tabId: tab.id });
        
        // Close the popup
        window.close();
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  });
}