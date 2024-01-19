console.log("content-js loaded");
const botContentURI = "/v2/repository/files/<fileID>/content";
const folderContentURI = "/v2/repository/folders/<folderID>/list";
const fileCopyURI = "/v2/repository/files/<fileID>/copy";
const folderCreateURI = "/v2/repository/folders/<folderID>";
const privateFileURI = "/v2/repository/workspaces/private/files/list";
const downloadFileURI = "/v2/repository/files/<fileID>/content";
const packageListURI = "/v2/packages/package/list";
const src = chrome.runtime.getURL("popup.html");
const width = "256px";
const height = "480px";
const minHeight = "32px";
const assistantDiv = createDraggableAssistant();
let variableCache = [];
addTaskSavedObserver();
addFileSelectedObserver();
addVariableObserver();

let framePort;
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "frame") {
    framePort = port;
    port.postMessage({ status: "Port Connected" });
    framePort.onMessage.addListener((message) => {
      switch (message.type) {
        case "GET_BOT": {
          getBotContent();
          return true;
        }
        case "GET_FOLDER": {
          getCurrentFolderDetails(message.folderID);
          return true;
        }
        case "GET_ROW_ITEMS": {
          getSelectedRowItems();
          return true;
        }
        case "TOGGLE_SIZE": {
          toggleAssistantSize();
          return true;
        }
        case "GET_SIZE_STATE": {
          getAssistantSize();
          return true;
        }
        case "COLLAPSE_NODES": {
          collapseNodes();
          return true;
        }
        case "EXPAND_NODES": {
          expandNodes();
          return true;
        }
        case "CLICK_LINE": {
          clickActionByLineNumber(message.lineNo);
          return true;
        }
        case "OPEN_VAR": {
          openVariableByName(message.varName);
          return true;
        }
        case "COPY_FILE": {
          copyfile(
            message.fileId,
            message.fileName,
            message.destinationFolderID
          );
          return true;
        }
        case "COPY_FOLDER": {
          copyfolder(
            message.sourceFolderID,
            message.sourceFolderName,
            message.destinationFolderID
          );
          return true;
        }
        case "DOWNLOAD_FILE": {
          downloadFile(message.fileId, message.fileName);
          return true;
        }
        case "UPDATE_PACKAGES": {
          updatePackages(message.fileIds);
          return true;
        }
        case "PUT_CONTENT": {
          putCurrentBotContent(message.content);
          return true;
        }
        default:
          break;
      }
    });
  }
});

function createDraggableAssistant() {
  let draggableDiv = document.createElement("div");
  draggableDiv.id = "draggable";
  draggableDiv.height = "0px";
  draggableDiv.style.position = "fixed";
  draggableDiv.style.top = "100px";
  draggableDiv.style.left = "50vw";
  draggableDiv.style["z-index"] = "99999999999";

  let iframe = document.createElement("iframe");
  iframe.style.width = width;
  iframe.id = "assistantDiv";
  iframe.style.height = height;
  iframe.style["border"] = "none";
  iframe.style["border-radius"] = "14px";
  iframe.style["border"] = "1px solid #2276d9";
  iframe.src = src;

  let draggableHandleDiv = document.createElement("div");
  draggableHandleDiv.style.position = "absolute";
  draggableHandleDiv.style.height = minHeight;
  draggableHandleDiv.style.width = "160px";
  draggableHandleDiv.style["margin"] = "0px 66px 0px 32px";
  draggableHandleDiv.style["cursor"] = "move";

  draggableDiv.appendChild(draggableHandleDiv);
  draggableDiv.appendChild(iframe);
  document.body.appendChild(draggableDiv);

  let assistantDiv = document.getElementById("assistantDiv");
  let mousedown = false;
  let current = document.getElementById("draggable");
  let currentx = 0;
  let currenty = 0;
  let offsetx = 0;
  let offsety = 0;
  let newx = 0;
  let newy = 0;
  let marginTop = 0;
  let marginLeft = 0;

  current.addEventListener("mousedown", function (e) {
    e.preventDefault();
    mousedown = true;
    marginTop = parseInt(
      window.getComputedStyle(current, null).getPropertyValue("margin-top")
    );
    marginLeft = parseInt(
      window.getComputedStyle(current, null).getPropertyValue("margin-left")
    );
    let rect = current.getBoundingClientRect();
    currentx = rect.left - marginLeft;
    currenty = rect.top - marginTop;
  });

  window.addEventListener("mousemove", function (e) {
    if (mousedown) {
      if (offsetx == 0 && offsety == 0) {
        offsetx = e.clientX - currentx;
        offsety = e.clientY - currenty;
      }

      newx = e.clientX - offsetx;
      newy = e.clientY - offsety;
      current.style.left = newx + "px";
      current.style.top = newy + "px";
      current.style.bottom = "auto";
      current.style.right = "auto";
    }
  });

  window.addEventListener("mouseup", function () {
    if (mousedown) {
      let rect = current.getBoundingClientRect();
      if (rect.left < 0) current.style.left = "0px";
      if (rect.top < 0) current.style.top = "0px";
      if (rect.right > window.innerWidth) {
        current.style.removeProperty("left");
        current.style.right = "0px";
      }
      if (rect.bottom > window.innerHeight) {
        current.style.removeProperty("top");
        current.style.bottom = "0px";
      }

      mousedown = false;
      currentx = 0;
      currenty = 0;
      offsetx = 0;
      offsety = 0;
      marginTop = 0;
      marginLeft = 0;
    }
  });

  window.addEventListener(
    "resize",
    function () {
      let rect = current.getBoundingClientRect();
      if (rect.left < 0) current.style.left = "0px";
      if (rect.top < 0) current.style.top = "0px";
      if (rect.right > window.innerWidth) {
        current.style.removeProperty("left");
        current.style.right = "0px";
      }
      if (rect.bottom > window.innerHeight) {
        current.style.removeProperty("top");
        current.style.bottom = "0px";
      }
    },
    true
  );

  return assistantDiv;
}

function toggleAssistantSize() {
  assistantDiv.style.height =
    assistantDiv.style.height === height ? minHeight : height;
  getAssistantSize();
}

function getAssistantSize() {
  let state;
  assistantDiv.style.height == height
    ? (state = "Expanded")
    : (state = "Collapsed");
  framePort.postMessage({
    type: "SET_SIZE_STATE",
    state: state,
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case "ALIVE": {
      toggleAssistantDisplay();
      sendResponse({ status: "yes" });
      return true;
    }
    default:
      break;
  }
});

function toggleAssistantDisplay() {
  assistantDiv.style.display =
    assistantDiv.style.display === "none" ? "" : "none";
}

function getBotContent() {
  let origin = window.location.origin;
  let URLSplitList = window.location.toString().split("/");
  let fileID = URLSplitList[URLSplitList.length - 2];
  let botContentURL = origin + botContentURI.replace("<fileID>", fileID);
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let requestOptions = {
    method: "GET",
    headers: myHeaders,
  };
  return fetch(botContentURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      setVariableCache(json);
      addInputOutputIcons();
      framePort.postMessage({
        type: "SET_BOT",
        data: json,
      });
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

async function getCurrentFolderDetails(folderID) {
  const fileDetailFilter = {
    operator: "and",
    operands: [
      {
        operator: "eq",
        value: folderID,
        field: "id",
      },
      {
        operator: "eq",
        value: "application/vnd.aa.directory",
        field: "type",
      },
    ],
  };
  const folderContent = await getFolderContent({}, folderID);
  const folder = await getFileDetails(fileDetailFilter);
  framePort.postMessage({
    type: "SET_FOLDER",
    data: folderContent,
    path: folder.list[0].path,
  });
}

function getFolderContent(filter, folderID) {
  let origin = window.location.origin;
  let folderContentURL =
    origin + folderContentURI.replace("<folderID>", folderID);
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);
  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      fields: [],
      filter: filter,
      page: {
        offset: 0,
        length: 1000,
      },
    }),
  };
  return fetch(folderContentURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function copyfile(fileId, newFileName, destinationFolderID) {
  let origin = window.location.origin;
  let authToken = localStorage.authToken.toString().slice(1, -1);
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let fileCopyURL = origin + fileCopyURI.replace("<fileID>", fileId);

  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: newFileName,
      parentId: destinationFolderID,
    }),
  };
  return fetch(fileCopyURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      refreshFolderList();
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function createFolder(folderName, destinationFolderID) {
  let origin = window.location.origin;
  let authToken = localStorage.authToken.toString().slice(1, -1);
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);
  let folderCreateURL =
    origin + folderCreateURI.replace("<folderID>", destinationFolderID);
  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      folderName: folderName,
    }),
  };
  return fetch(folderCreateURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      refreshFolderList();
      return json;
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function copyfolder(
  sourceFolderID,
  sourceFolderName,
  destinationFolderID
) {
  let createdFolder = await createFolder(sourceFolderName, destinationFolderID);
  //list files
  let fileFilter = {};
  fileFilter["operator"] = "ne";
  fileFilter["value"] = "application/vnd.aa.directory";
  fileFilter["field"] = "type";
  let files = await getFolderContent(fileFilter, sourceFolderID);
  //copy files
  if (files?.list) {
    for (let file of files.list) {
      await copyfile(file.id, file.name, createdFolder.id);
    }
  }
  //list directory
  let folderFilter = {};
  folderFilter["operator"] = "eq";
  folderFilter["value"] = "application/vnd.aa.directory";
  folderFilter["field"] = "type";
  let folders = await getFolderContent(folderFilter, sourceFolderID);
  if (folders?.list) {
    for (let folder of folders.list) {
      await copyfolder(folder.id, folder.name, createdFolder.id);
    }
  }
  framePort.postMessage({
    type: "FOLDER_COPIED",
  });
}

function getFileDetails(filter) {
  let origin = window.location.origin;
  let privateFileURL = origin + privateFileURI;
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      filter: filter,
    }),
  };
  return fetch(privateFileURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function clickActionByLineNumber(lineNumber) {
  expandNodes();
  let actionElement = getElementByXpath(
    `(//div[contains(@class, 'taskbot-canvas-list-node__number') and text()='${lineNumber}']/..//div[contains(@class, 'taskbot-canvas-list-node__title')])[1]`
  );
  if (actionElement) {
    actionElement.click();
    return true;
  }
  actionElement = getElementByXpath(
    `(//div[contains(@class, 'taskbotlistnode-number') and text()='${lineNumber}']/..//div[contains(@class, 'taskbotlistnode-title')])[1]`
  );
  if (actionElement) {
    actionElement.click();
    return true;
  }
  return false;
}

function openVariableByName(variableName) {
  document
    .querySelector('button[class*="editor-layout__resize-toggle"]')
    ?.querySelector('span[class*="--icon_chevron-right"]')
    ?.click();

  let userDefinedVariablesButton = document.querySelector(
    `button[data-group-name="variable-group:USER_DEFINED"]`
  );
  let workItemVariablesButton = document.querySelector(
    `button[data-group-name="variable-group:WORK_ITEM"]`
  );
  if (
    userDefinedVariablesButton &&
    !userDefinedVariablesButton.hasAttribute("data-open")
  ) {
    userDefinedVariablesButton.click();
  }

  if (
    workItemVariablesButton &&
    !workItemVariablesButton.hasAttribute("data-open")
  ) {
    workItemVariablesButton.click();
  }
  document
    .querySelector(
      `div[data-item-name='${variableName.toLowerCase()}'] button[name='item-button']`
    )
    ?.click();
  return true;
}

function collapseNodes() {
  document.querySelectorAll(`button[role='tab']`)[1].click();
  let elem = document.querySelectorAll(
    ".taskbotlistnode-collapser>.fa-caret-down"
  );

  while (elem.length > 0) {
    elem[elem.length - 1].click();
    elem = document.querySelectorAll(
      ".taskbotlistnode-collapser>.fa-caret-down"
    );
  }

  elem = document.querySelectorAll(
    ".taskbot-canvas-list-node__collapser>.fa-caret-down"
  );

  while (elem.length > 0) {
    elem[elem.length - 1].click();
    elem = document.querySelectorAll(
      ".taskbot-canvas-list-node__collapser>.fa-caret-down"
    );
  }
}

function expandNodes() {
  document.querySelectorAll(`button[role='tab']`)[1].click();
  let elem = document.querySelectorAll(
    ".taskbotlistnode-collapser>.fa-caret-right"
  );

  while (elem.length > 0) {
    elem[0].click();
    elem = document.querySelectorAll(
      ".taskbotlistnode-collapser>.fa-caret-right"
    );
  }

  elem = document.querySelectorAll(
    ".taskbot-canvas-list-node__collapser>.fa-caret-right"
  );

  while (elem.length > 0) {
    elem[0].click();
    elem = document.querySelectorAll(
      ".taskbot-canvas-list-node__collapser>.fa-caret-right"
    );
  }
}

function getElementByXpath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function getSelectedRowItems() {
  let selectedFiles = [];
  let selectedDataRows = document.getElementsByClassName(
    "datatable-row--selected"
  );
  for (let dataRow of selectedDataRows) {
    selectedFiles.push(dataRow.getAttribute("data-row-id"));
  }
  framePort.postMessage({
    type: "SET_ROW_ITEMS",
    data: selectedFiles,
  });
  return selectedFiles;
}

function addTaskSavedObserver() {
  let mainLayout = document.getElementById("root");
  if (!mainLayout) {
    console.log("root element not loaded");
    window.setTimeout(addTaskSavedObserver, 500);
    return;
  }
  console.log("root element loaded");
  const taskConfig = {
    attributes: true,
    subtree: true,
    attributeFilter: ["aria-label"],
  };
  const taskCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (
        mutation.target.classList.contains("editor-page-saver") &&
        mutation.target["innerText"].trim() == "Saved"
      ) {
        framePort.postMessage({
          type: "RELOAD",
        });
      }
    }
  };
  const taskObserver = new MutationObserver(taskCallback);
  taskObserver.observe(mainLayout, taskConfig);
}

function addFileSelectedObserver() {
  let mainLayout = document.getElementById("root");
  if (!mainLayout) {
    window.setTimeout(addFileSelectedObserver, 500);
    return;
  }

  const fileConfig = {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
  };
  const fileCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.target.classList.contains("datatable-row")) {
        let selectedFiles = [];
        let selectedDataRows = document.getElementsByClassName(
          "datatable-row--selected"
        );
        for (let dataRow of selectedDataRows) {
          selectedFiles.push(dataRow.getAttribute("data-row-id"));
        }
        framePort.postMessage({
          type: "DATA_ROW_CHANGE",
          data: selectedFiles,
        });
      }
    }
  };
  const fileObserver = new MutationObserver(fileCallback);
  fileObserver.observe(mainLayout, fileConfig);
}

function addVariableObserver() {
  let mainLayout = document.getElementById("root");
  if (!mainLayout) {
    console.log("root element not loaded");
    window.setTimeout(addVariableObserver, 500);
    return;
  }
  const taskCallback = (mutationsList) => {
    outerLoop: for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (
            node.classList?.contains("editor-palette-item") ||
            node.classList?.contains("editor-palette")
          ) {
            addInputOutputIcons();
            break outerLoop;
          }
        }
      }
    }
  };

  const observer = new MutationObserver(taskCallback);
  const config = { childList: true, subtree: true };
  observer.observe(document.body, config);
}

function refreshFolderList() {
  if (document.getElementsByName("table-refresh")[0]) {
    document.getElementsByName("table-refresh")[0].click();
  }
}

function downloadFile(fileID, fileName) {
  let origin = window.location.origin;
  let downloadFileURL = origin + downloadFileURI.replace("<fileID>", fileID);
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let requestOptions = {
    method: "GET",
    headers: myHeaders,
  };
  return fetch(downloadFileURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.blob();
      }
      throw new Error("Fetch failed");
    })
    .then((blob) => {
      downloadFilePrompt(blob, fileName);
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function downloadFilePrompt(blob, name) {
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href,
    style: "display:none",
    download: name,
  });
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(href);
  a.remove();
}

async function updatePackages(fileIds) {
  let defaultPackageVersions = await getDefaultPackageVersions();
  const packageVersionsMap = new Map();
  defaultPackageVersions.list.forEach((pkg) => {
    packageVersionsMap.set(pkg.name, pkg.packageVersion);
  });

  for (let fileId of fileIds) {
    await updateTaskPackages(fileId, packageVersionsMap);
  }
  framePort.postMessage({
    type: "PACKAGES_UPDATED",
  });
}

async function updateTaskPackages(fileId, packageVersionsMap) {
  let botJSONContent = await getBotJSONContent(fileId);
  for (let i = 0; i < botJSONContent.packages.length; i++) {
    const packageName = botJSONContent.packages[i].name;
    botJSONContent.packages[i].version = packageVersionsMap.get(packageName);
  }
  await putBotJSONContent(fileId, botJSONContent);
  console.log(botJSONContent);
}
function putBotJSONContent(fileId, botJSONContent) {
  let origin = window.location.origin;
  let botContentURL = origin + botContentURI.replace("<fileID>", fileId);
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: JSON.stringify(botJSONContent),
  };

  return fetch(botContentURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function getBotJSONContent(fileId) {
  let origin = window.location.origin;
  let botContentURL = origin + botContentURI.replace("<fileID>", fileId);
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  let requestOptions = {
    method: "GET",
    headers: myHeaders,
  };
  return fetch(botContentURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

function getDefaultPackageVersions() {
  let origin = window.location.origin;
  let packageListURL = origin + packageListURI;
  let authToken = localStorage.authToken.toString().slice(1, -1);

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Authorization", authToken);

  const filter = {
    operator: "eq",
    value: "DEFAULT",
    field: "status",
  };

  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      fields: [],
      filter: filter,
      page: {
        offset: 0,
        length: 1000,
      },
    }),
  };
  return fetch(packageListURL, requestOptions)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Fetch failed");
    })
    .then((json) => {
      return json;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
}

async function putCurrentBotContent(botJSONContent) {
  let URLSplitList = window.location.toString().split("/");
  let fileID = URLSplitList[URLSplitList.length - 2];
  await putBotJSONContent(fileID, botJSONContent);
  framePort.postMessage({
    type: "PUT_CONTENT_SUCCESS",
  });
}

function setVariableCache(botJSONContent) {
  if (botJSONContent?.variables) {
    variableCache = botJSONContent.variables;
  }
}

function addInputOutputIcons() {
  const elements = document.querySelectorAll("span.custom-variable-symbol");
  elements.forEach((element) => {
    element.parentNode.removeChild(element);
  });

  variableCache.forEach((variable) => {
    let item = document.querySelector(
      `div.editor-palette-item[data-item-name="${variable.name
        .toLowerCase()
        .trim()}"]`
    );
    if (!item) return;

    item.style.position = "relative";

    if (variable.input) {
      let downArrow = document.createElement("span");
      downArrow.textContent = "🡇";
      downArrow.classList.add("custom-variable-symbol");
      downArrow.style = `position: absolute; left: 0; top: 50%; color: #3c5e83; font-size: 15px; transform: translateY(-50%);z-index:10;`;
      item.insertBefore(downArrow, item.firstChild);
    } else if (variable.readOnly) {
      let equalsSymbol = document.createElement("span");
      equalsSymbol.textContent = "🟰";
      equalsSymbol.classList.add("custom-variable-symbol");
      equalsSymbol.style = `position: absolute; left: 0; top: 50%; color: #3c5e83; font-size: 12px; transform: translateY(-50%);z-index:10;`;
      item.insertBefore(equalsSymbol, item.firstChild);
    }

    if (variable.output) {
      let upArrow = document.createElement("span");
      upArrow.textContent = "🡅";
      upArrow.classList.add("custom-variable-symbol");
      upArrow.style = `position: absolute; right: 0; top: 50%; color: #3c5e83; font-size: 15px; transform: translateY(-50%);z-index:10;`;
      item.appendChild(upArrow);
    }
  });
}
