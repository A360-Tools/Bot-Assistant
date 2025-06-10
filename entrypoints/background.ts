export default defineBackground(() => {
  // Bot Assistant background script loaded

  // Set up side panel behavior
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {});

  // Handle extension icon click
  chrome.action.onClicked.addListener((tab) => {
    // Extension icon clicked
  });

  // Listen for messages from content scripts or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle message
    
    if (request.action === 'openSidePanel') {
      // Open the side panel for the tab that sent the message
      if (sender.tab?.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id })
          .then(() => sendResponse({ success: true }))
          .catch((error) => {
            // Failed to open side panel
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep message channel open for async response
      } else {
        sendResponse({ success: false, error: 'No tab ID found' });
      }
    }
    
    // Handle API requests to bypass CORS
    if (request.action === 'apiRequest') {
      handleApiRequest(request.config)
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }
    
    return true;
  });
});

async function handleApiRequest(config: any) {
  try {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body,
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message;
        }
      } catch (e) {
        // If response is not JSON, use default error message
      }
      throw new Error(errorMessage);
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    // Special handling for bot content
    const isBotContent = config.headers && config.headers['X-Bot-Content'] === 'true';
    
    if (contentType && contentType.includes('application/json')) {
      // For JSON responses
      const data = await response.json();
      // Check if this is a download request (has download header or specific request flag)
      const isDownload = config.headers && config.headers['X-Download'] === 'true';
      if (isDownload) {
        // Convert JSON to downloadable blob
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({
            blob: reader.result,
            type: blob.type,
            size: blob.size
          });
          reader.readAsDataURL(blob);
        });
      }
      // Return JSON data as-is for API calls
      return data;
    } else if (contentType && contentType.includes('application/vnd.aa.taskbot') && !isBotContent) {
      // For bot file downloads (when not requesting content as JSON)
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
          blob: reader.result,
          type: blob.type,
          size: blob.size
        });
        reader.readAsDataURL(blob);
      });
    } else if (isBotContent) {
      // For bot content requests (need JSON data)
      const text = await response.text();
      try {
        // Try to parse as JSON
        return JSON.parse(text);
      } catch (e) {
        // If not JSON, return as blob for client-side parsing
        const blob = new Blob([text], { type: contentType || 'application/octet-stream' });
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({
            blob: reader.result,
            type: contentType || 'application/octet-stream',
            size: blob.size
          });
          reader.readAsDataURL(blob);
        });
      }
    } else {
      // For file downloads, return blob as base64
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
          blob: reader.result,
          type: blob.type,
          size: blob.size
        });
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    // API request failed
    throw error;
  }
}