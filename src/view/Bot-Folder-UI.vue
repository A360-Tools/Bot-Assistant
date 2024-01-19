<template>
  <div class="assistant__list__group-container">
    <button type="button" class="assistant__list__group" tabindex="0" @click="saveToClipboard()" :class="{
      'btn-disable': checkedItemsId.length == 0,
    }">
      <div class="assistant__list__group__icon">
        <span class="icon icon--image aa-icon-color icon--animate-none"></span>
        <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/clipboard-copy.svg"
          style="width: 32px; height: 24px; font-size: 16px" title="Click to expand" />
      </div>
      <div class="assistant__list__group__label">
        COPY [Selected {{ checkedItemsId.length }}]
      </div>
    </button>
    <button type="button" class="assistant__list__group" :tabindex="clipboardItems.length - 1"
      @click="pasteFromClipboard()" :class="{
        'btn-disable': clipboardItems.length == 0,
      }">
      <div class="assistant__list__group__icon">
        <span class="icon icon--image aa-icon-color icon--animate-none"></span>
        <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/clipboard-paste.svg"
          style="width: 32px; height: 24px; font-size: 16px" title="Click to collapse" />
      </div>
      <div class="assistant__list__group__label">
        PASTE [Copied {{ clipboardItems.length }}]
      </div>
    </button>
    <button type="button" class="assistant__list__group" tabindex="0" @click="clearClipboard">
      <div class="assistant__list__group__icon">
        <span class="icon icon--image aa-icon-color icon--animate-none"></span>
        <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/clipboard-remove.svg"
          style="width: 32px; height: 24px; font-size: 16px" title="Click to collapse" />
      </div>
      <div class="assistant__list__group__label">CLEAR</div>
    </button>
    <div v-if="!copyInProgress">
      <button type="button" class="assistant__list__group" tabindex="0" @click="showFolderList = !showFolderList">
        <div class="assistant__list__group__icon">
          <span class="icon icon--image aa-icon-color icon--animate-none"></span>
          <img v-if="showFolderList" class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/collapse.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to collapse" />
          <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to expand" />
        </div>

        <div class="assistant__list__group__label">Folders</div>

        <div class="assistant__list__group__count">
          &nbsp;({{ clipboardFolders.length }})
        </div>
      </button>
      <div class="assistant__list__group_children" v-show="showFolderList">
        <button v-for="folder in clipboardFolders" :key="folder" type="button"
          class="assistant__list__option assistant__list__option--icon">
          <span class="assistant__list__option__label text-overflow" :title="folder.path">{{ folder.name }}
          </span>
        </button>
      </div>
      <button type="button" class="assistant__list__group" tabindex="0" @click="showFileList = !showFileList">
        <div class="assistant__list__group__icon">
          <span class="icon icon--image aa-icon-color icon--animate-none"></span>
          <img v-if="showFileList" class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/collapse.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to collapse" />
          <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to expand" />
        </div>

        <div class="assistant__list__group__label">Files</div>

        <div class="assistant__list__group__count">
          &nbsp;({{ clipboardFiles.length }})
        </div>
      </button>
      <div class="assistant__list__group_children" v-show="showFileList">
        <button v-for="file in clipboardFiles" :key="file" type="button" class="
            assistant__list__option
            assistant__list__option--icon
            assistant__list__option--clickable
          " @click="downloadFile(file)">
          <span class="assistant__list__option__label text-overflow" :title="file.path">{{ file.name }}
          </span>
        </button>
      </div>
    </div>
    <div v-else>
      <h3>Copying...</h3>
      <LoadingPage />
    </div>
    <div id="snackbar" :class="{ show: showToast }">{{ saveMessage }}</div>
  </div>
</template>

<script>
import LoadingPage from "./Loading-Page.vue";
import { getGlobalPort } from '../scripts/portManager.js';
export default {
  components: {
    LoadingPage,
  },
  props: {
    folderContentJSON: {
      type: Object,
      default: () => { },
    },
    origin: String,
    folderID: String,
    folderPath: String,
  },
  data() {
    return {
      showFolderList: true,
      showFileList: true,
      clipboardFileCount: 0,
      clipboardFolderCount: 0,
      checkedItemsId: [],
      clipboardFolders: [],
      clipboardFiles: [],
      clipboardSourceFolderPath: "",
      copyInProgress: false,
      showToast: false,
      saveMessage: null,
    };
  },
  mounted() {
    let vm = this;
    getGlobalPort().onMessage.addListener((msg) => {
      if (msg.type === "DATA_ROW_CHANGE" && msg.data != undefined) {
        vm.checkedItemsId = msg.data;
      }
      if (msg.type === "SET_ROW_ITEMS" && msg.data != undefined) {
        vm.checkedItemsId = msg.data;
      }
    });

    getGlobalPort().postMessage({
      type: "GET_ROW_ITEMS",
    });
    vm.getClipboard();

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[vm.origin]) {
        vm.getClipboard();
      }
    });
    // });
  },
  methods: {
    reloadPage() {
      window.location.reload();
    },

    saveToClipboard() {
      let value = {};
      value["folders"] = this.selectedFolders;
      value["files"] = this.selectedFiles;
      this.saveToLocalStorage(this.origin, value, value);
    },

    saveToLocalStorage(key, value) {
      chrome.storage.local.set({ [key]: value }, function () {
        console.log("data saved", key, value);
      });
    },

    clearClipboard() {
      let value = {};
      value["folders"] = [];
      value["files"] = [];
      this.saveToLocalStorage(this.origin, value);
    },

    getClipboard() {
      let vm = this;
      chrome.storage.local.get(vm.origin, function (result) {
        vm.clipboardFolders = result[vm.origin]?.["folders"]
          ? result[vm.origin]["folders"]
          : [];
        vm.clipboardFiles = result[vm.origin]?.["files"]
          ? result[vm.origin]["files"]
          : [];
      });
    },
    pasteFromClipboard() {
      let clonedClipboardFiles = structuredClone(this.clipboardFiles);
      let clonedClipboardFolders = structuredClone(this.clipboardFolders);
      let clonedFolderID = structuredClone(this.folderID);
      let clonedFolderPath = structuredClone(this.folderPath);

      if (this.clipboardFiles.length > 0)
        this.pasteFiles(clonedClipboardFiles, clonedFolderID, clonedFolderPath);
      if (this.clipboardFolders.length > 0)
        this.pasteFolders(
          clonedClipboardFolders,
          clonedFolderID,
          clonedFolderPath
        );
    },
    pasteFiles(fileList, destinationFolderID, destinationFolderPath) {
      let vm = this;
      let existingFileList = fileList.filter((file) => {
        return (
          file.path.substring(0, file.path.lastIndexOf("\\")) ==
          destinationFolderPath
        );
      });

      let filteredFileList = fileList.filter((file) => {
        return (
          file.path.substring(0, file.path.lastIndexOf("\\")) !=
          destinationFolderPath
        );
      });

      for (let file of filteredFileList) {
        getGlobalPort().postMessage({
          type: "COPY_FILE",
          fileId: file.id,
          fileName: file.name,
          destinationFolderID: destinationFolderID,
        });
        vm.copyInProgress = true;
      }
      vm.copyInProgress = false;

      if (existingFileList.length > 0)
        vm.saveMessage = "Warn: file already present";
      else vm.saveMessage = "Files Copied";
      vm.showToast = true;
      setTimeout(() => {
        vm.showToast = false;
        vm.reloadPage();
      }, 1600);
    },

    pasteFolders(folderList, destinationFolderID, destinationFolderPath) {
      let vm = this;
      let circularReferenceList = folderList.filter((folder) => {
        return destinationFolderPath.startsWith(folder.path);
      });
      if (circularReferenceList.length > 0) {
        vm.saveMessage = "Warn: Folder circular reference found";
        vm.showToast = true;
        setTimeout(() => {
          vm.showToast = false;
        }, 3600);
      }

      let filteredFolderList = folderList.filter((folder) => {
        return !destinationFolderPath.startsWith(folder.path);
      });
      let folder = filteredFolderList.pop();
      getGlobalPort().postMessage({
        type: "COPY_FOLDER",
        sourceFolderID: folder.id,
        sourceFolderName: folder.name,
        destinationFolderID: destinationFolderID,
      });
      vm.copyInProgress = true;

      getGlobalPort().onMessage.addListener((msg) => {
        if (msg.type === "FOLDER_COPIED") {
          vm.copyInProgress = false;
          if (filteredFolderList.length > 0) {
            folder = filteredFolderList.pop();
            if (folder) {
              getGlobalPort().postMessage({
                type: "COPY_FOLDER",
                sourceFolderID: folder.id,
                sourceFolderName: folder.name,
                destinationFolderID: destinationFolderID,
              });
              vm.copyInProgress = true;
            }
          } else {
            vm.saveMessage = "Folders Copied";
            vm.showToast = true;
            setTimeout(() => {
              vm.showToast = false;
              vm.reloadPage();
            }, 1600);
          }
        }
      });
    },

    downloadFile(file) {
      let vm = this;
      getGlobalPort().postMessage({
        type: "DOWNLOAD_FILE",
        fileId: file.id,
        fileName: file.name,
      });
      vm.reloadPage();
    },
  },
  computed: {
    totalClipboardItems() {
      let totalClipboardItems =
        this.clipboardFileCount + this.clipboardFolderCount;
      // this.$emit("total-clipboard-items", totalClipboardItems);
      return totalClipboardItems;
    },
    selectedFolders() {
      const folderMIMEType = "application/vnd.aa.directory";
      let vm = this;
      let folders;
      folders = vm.folderContentJSON["list"].filter(function (item) {
        return (
          vm.checkedItemsId.includes(item.id) && item.type === folderMIMEType
        );
      });
      return folders;
    },
    selectedFiles() {
      const folderMIMEType = "application/vnd.aa.directory";
      let vm = this;
      let files;
      files = vm.folderContentJSON["list"].filter(function (item) {
        return (
          vm.checkedItemsId.includes(item.id) && item.type !== folderMIMEType
        );
      });
      return files;
    },
    clipboardItems() {
      let clipboardAllItems = [];
      clipboardAllItems = clipboardAllItems.concat(this.clipboardFolders);
      clipboardAllItems = clipboardAllItems.concat(this.clipboardFiles);
      return clipboardAllItems;
    },
  },
};
</script>
<style scoped>
.btn-disable {
  cursor: not-allowed;
  pointer-events: none;
  /*Button disabled - CSS color class*/
  color: #c0c0c0;
}

.text-overflow {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#snackbar {
  font-family: "Museo Sans";
  visibility: hidden;
  /* Hidden by default. Visible on click */
  min-width: 224px;
  /* Set a default minimum width */
  background-color: #333;
  /* Black background color */
  color: #fff;
  /* White text color */
  text-align: center;
  /* Centered text */
  border-radius: 6px;
  /* Rounded borders */
  padding: 16px;
  /* Padding */
  position: fixed;
  /* Sit on top of the screen */
  z-index: 1;
  /* Add a z-index if needed */
  bottom: 30px;
  /* 30px from the bottom */
}

/* Show the snackbar when clicking on a button (class added with JavaScript) */
#snackbar.show {
  visibility: visible;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 3.5s;
  animation: fadein 0.5s, fadeout 0.5s 3.5s;
}

/* Animations to fade the snackbar in and out */
@-webkit-keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }

  to {
    bottom: 30px;
    opacity: 1;
  }
}

@keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }

  to {
    bottom: 30px;
    opacity: 1;
  }
}

@-webkit-keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }

  to {
    bottom: 0;
    opacity: 0;
  }
}

@keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }

  to {
    bottom: 0;
    opacity: 0;
  }
}

@keyframes progress {
  100% {
    right: 100%;
  }
}
</style>