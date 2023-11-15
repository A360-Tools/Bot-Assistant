<template>
  <div>
    <div v-if="!updateInProgress">
      <button type="button" class="assistant__list__group" tabindex="0" @click="showList = !showList">
        <div class="assistant__list__group__icon">
          <span class="icon icon--image aa-icon-color icon--animate-none"></span>
          <img v-if="showList" class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/collapse.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to collapse" />
          <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand.svg"
            style="width: 16px; height: 16px; font-size: 16px" title="Click to expand" />
        </div>
        <div class="assistant__list__group__label">
          Bot Content
        </div>
      </button>
      <!-- <div class="assistant__list__group-container">
      <button type="button" class="assistant__list__group" tabindex="0" @click="expandNodes">
        <div class="assistant__list__group__icon">
          <span class="icon icon--image aa-icon-color icon--animate-none"></span>
          <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand_action.svg"
            style="width: 32px; height: 24px; font-size: 16px" title="Click to expand" />
        </div>
        <div class="assistant__list__group__label">Expand All Actions</div>
      </button>
    </div>
    <div class="assistant__list__group-container">
      <button type="button" class="assistant__list__group" tabindex="0" @click="collapseNodes">
        <div class="assistant__list__group__icon">
          <span class="icon icon--image aa-icon-color icon--animate-none"></span>
          <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/collapse_action.svg"
            style="width: 32px; height: 24px; font-size: 16px" title="Click to collapse" />
        </div>
        <div class="assistant__list__group__label">Collapse All Actions</div>
      </button>
    </div> -->

      <div class="assistant__list__group-container" v-show="showList">
        <textarea class="assistant__list__group__textarea" v-model="botContentJSONString"></textarea>
        <button type="button" class="assistant__list__group" @click="copyToClipboard"
          title="Copy bot content to clipboard">
          <div class="assistant__list__group__icon">
            <span class="icon icon--image aa-icon-color icon--animate-none"></span>
            <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/clipboard-copy.svg"
              style="width: 32px; height: 24px; font-size: 16px" />
          </div>
          <div class="assistant__list__group__label">
            Copy to clipboard
          </div>
        </button>
        <button type="button" class="assistant__list__group" @click="patchContent" title="Overwrite current bot content">
          <div class="assistant__list__group__icon">
            <span class="icon icon--image aa-icon-color icon--animate-none"></span>
            <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/file_upload.svg"
              style="width: 32px; height: 24px; font-size: 16px" />
          </div>
          <div class="assistant__list__group__label">
            Patch Content
          </div>
        </button>
      </div>
    </div>
    <div v-else>
      <h3>Patching Content...</h3>
      <LoadingPage />
    </div>
    <div id="snackbar" :class="{ show: showToast }">{{ saveMessage }}</div>
  </div>
</template>

<style>
.assistant__list__group__textarea {
  width: 92%;
  height: 200px;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  resize: none;
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

<script>
import LoadingPage from "./Loading-Page.vue";
export default {
  components: {
    LoadingPage,
  },
  data() {
    return {
      showList: true,
      updateInProgress: false,
      showToast: false,
      saveMessage: null,
      botContentJSONString: JSON.stringify(this.botContent, null, 2),
    };
  },
  props: {
    botContent: {
      type: Object,
      required: true,
    },
  },
  methods: {
    copyToClipboard() {
      const textarea = document.querySelector(".assistant__list__group__textarea");
      textarea.select();
      document.execCommand("copy");
    },
    patchContent() {
      let vm = this;
      try {
        const contentJSON = JSON.parse(vm.botContentJSONString);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const port = chrome.tabs.connect(tabs[0].id, {
            name: "frame",
          });
          vm.updateInProgress = true;
          port.postMessage({
            type: "PUT_CONTENT",
            content: contentJSON,
          });

          port.onMessage.addListener((msg) => {
            if (msg.type === "PUT_CONTENT_SUCCESS") {
              vm.updateInProgress = false;
              vm.saveMessage = "Success";
              vm.showToast = true;
              setTimeout(() => {
                vm.showToast = false;
                vm.reloadPage();
              }, 1600);
            }
          });

        });
      } catch (error) {
        console.error("Invalid JSON format:", error);
      }
    },
    // expandNodes() {
    //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     const port = chrome.tabs.connect(tabs[0].id, {
    //       name: "frame",
    //     });
    //     port.postMessage({
    //       type: "EXPAND_NODES",
    //     });
    //   });
    // },
    // collapseNodes() {
    //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     const port = chrome.tabs.connect(tabs[0].id, {
    //       name: "frame",
    //     });
    //     port.postMessage({
    //       type: "COLLAPSE_NODES",
    //     });
    //   });
    // },
  },
};
</script>
