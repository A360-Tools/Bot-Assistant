chrome.action.onClicked.addListener(injectIntoValidTab);

function injectIntoValidTab(activeTab) {
  let activeTabID = activeTab.id;
  chrome.tabs.sendMessage(activeTabID, { type: "ALIVE" }, function (msg) {
    if (chrome.runtime.lastError !== undefined) {
      console.log(chrome.runtime.lastError.message);
    }
    msg = msg || {};
    if (msg.status != "yes") {
      injectContentScript(activeTabID);
    }
  });
}

function injectContentScript(activeTabID) {
  chrome.scripting.executeScript(
    {
      target: { tabId: activeTabID },
      files: ["content.js"],
    },
    (results) => {
      console.log("script injection result: ", results);
    }
  );
}
