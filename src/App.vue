<template>
  <div class="assistant taskbot-assistant" style="width: 100vw; height: 100vh; top: 0px; left: 0px">
    <div class="assitant_container_body">
      <div class="assistant__title prevent-select">
        {{ pageTitle }}
      </div>
      <div class="assistant__header__title__reload prevent-select" @click="reloadPage">
        <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="./assets/reload.svg" style="height: 22px"
          title="Refresh" />
      </div>
      <div class="assistant__header__title__expand prevent-select" @click="resizeAssistant">
        <img v-if="resizeState == 'Expanded'" class="taskbotnodeicon taskbotnodeicon--theme-default"
          src="./assets/shrink.svg" style="height: 22px" title="Collapse" />
        <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="./assets/grow.svg" style="height: 22px"
          title="Expand" />
      </div>
      <div class="assistant__header__title__setting prevent-select" @click="openOptionPage">
        <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="./assets/wrench.svg" style="height: 22px"
          title="Preferences" />
      </div>
      <div v-if="!supportedPageType">
        <UnsupportedPage />
      </div>
      <div v-else-if="!pageLoaded">
        <LoadingPage />
      </div>
      <div v-else-if="supportedPageType === 'privateBot' ||
        supportedPageType === 'publicBot'
        ">
        <div v-if="botContentJSON" class="assistant__content">
          <div class="assistant__header">
            <div class="assistant__header__title prevent-select" @click="setActiveHeader('Default')" :class="{
                'assistant__header__title--active': 'Default' == activeHeader,
              }">
              Total issues ({{ totalIssues }})
            </div>
            <div v-if="supportedPageType === 'privateBot'" class="assistant__header__title prevent-select" @click="setActiveHeader('Tools')" :class="{
              'assistant__header__title--active': 'Tools' == activeHeader,
            }">
              Tools
            </div>
          </div>
          <div class="assistant__children assistant__children--header">
            <div v-if="activeHeader == 'Default'" class="assistant__list">
              <BotBestPractice v-if="botActionsJSON" @handle-bestpractice-count="setBestPracticesCount"
                :actionsArray="botActionsJSON" :preferences="preferences" :botProperties="botpropertiesJSON"
                :variablesArray="botVariablesJSON" />
              <BotActionsVue v-if="botActionsJSON" @handle-action-count="setActionCount" :debugArray="botBreakpointsJSON"
                :actionsArray="botActionsJSON" :preferences="preferences" />
              <BotVariablesVue v-if="botVariablesJSON" @handle-variable-count="setVariableCount"
                :variablesArray="botVariablesJSON" :preferences="preferences" />
            </div>
            <div v-if="activeHeader == 'Tools'" class="assistant__list">
              <BotToolsUI :botContent="botContentJSON"/>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="supportedPageType === 'privateFolder'">
        <div v-if="folderContentJSON" class="assistant__content">
          <div class="assistant__header">
            <div class="assistant__header__title prevent-select" @click="setActiveHeader('Default')" :class="{
                'assistant__header__title--active': 'Default' == activeHeader,
              }">
              Clipboard
            </div>
            <div class="assistant__header__title prevent-select" @click="setActiveHeader('Tools')" :class="{
                'assistant__header__title--active': 'Tools' == activeHeader,
              }">
              Tools
            </div>
          </div>
          <div class="assistant__children assistant__children--header">
            <div v-if="activeHeader == 'Default'" class="assistant__list">
              <BotFolderUI :folderContentJSON="folderContentJSON" :origin="origin" :folderID="folderID"
                :folderPath="folderPath" />
            </div>
            <div v-if="activeHeader == 'Tools'" class="assistant__list">
              <BotFolderToolsUI :folderContentJSON="folderContentJSON"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BotVariablesVue from "./view/Bot-Variables.vue";
import BotActionsVue from "./view/Bot-Actions.vue";
import UnsupportedPage from "./view/Animation-Page.vue";
import LoadingPage from "./view/Loading-Page.vue";
import BotBestPractice from "./view/Bot-BestPractice.vue";
import BotToolsUI from "./view/Bot-Tools-UI.vue";
import BotFolderUI from "./view/Bot-Folder-UI.vue";
import BotFolderToolsUI from "./view/Bot-Folder-Tools-UI.vue";

export default {
  components: {
    BotVariablesVue,
    BotActionsVue,
    UnsupportedPage,
    LoadingPage,
    BotBestPractice,
    BotToolsUI,
    BotFolderUI,
    BotFolderToolsUI,
  },
  data() {
    return {
      botContentJSON: undefined,
      folderContentJSON: undefined,
      variableIssueCount: 0,
      actionIssueCount: 0,
      bestPracticesCount: 0,
      origin: undefined,
      folderID: undefined,
      folderPath: undefined,
      preferences: {
        formName: "Settings",
        bestPractices: {
          tryCatch: true,
          step: true,
          comment: true,
          timeoutZero: true,
          priorityMedium: true,
          maxLineOfCode: 300,
          maxVariableCount: 50,
          botCodeVersion: 4,
        },
        actions: {
          emptyContainersDisallowed: true,
          disabledActionsDisallowed: true,
          outOfErrHandlingDisallowed: true,
          msgBoxDisallowed: true,
          debugDisallowed: true,
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
      },
      supportedPageType: undefined,
      pageTitle: "A360 Bot Assistant",
      pageLoaded: false,
      resizeState: "Expanded",
      activeHeader: "Default",
    };
  },
  mounted() {
    let vm = this;
    chrome.storage.sync.get(["preferences"], function (value) {
      if (value["preferences"] != undefined)
        vm.preferences = value["preferences"];
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const port = chrome.tabs.connect(tabs[0].id, {
        name: "frame",
      });

      port.onMessage.addListener((msg) => {
        if (msg.type === "RELOAD") {
          vm.reloadPage();
        }
        if (msg.type === "SET_BOT" && msg.data !== false) {
          vm.pageLoaded = true;
          vm.botContentJSON = msg.data;
        }
        if (msg.type === "SET_FOLDER" && msg.data !== false) {
          vm.pageLoaded = true;
          vm.folderContentJSON = msg.data;
          vm.folderPath = msg.path;
        }
        if (msg.type === "SET_SIZE_STATE") {
          vm.resizeState = msg.state;
        }
      });

      port.postMessage({
        type: "GET_SIZE_STATE",
      });

      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
        if (changeInfo.url && tabId) {
          if (tabId == tabs[0].id) {
            vm.reloadPage();
          }
        }
      });

      let url = tabs[0].url;
      let urlObj = new URL(url);
      vm.origin = urlObj.origin;
      let URLSplitList = urlObj.href.toString().split("/");

      if (url && url.includes("/#/bots/repository/private/taskbots/"))
        vm.supportedPageType = "privateBot";
      else if (url && url.includes("/#/bots/repository/public/taskbots/"))
        vm.supportedPageType = "publicBot";
      if (url && url.includes("#/bots/repository/private/folders/")) {
        vm.supportedPageType = "privateFolder";
        vm.folderID = URLSplitList[URLSplitList.length - 1];
        port.postMessage({
          type: "GET_FOLDER",
          folderID: vm.folderID,
        });
      }

      if (
        vm.supportedPageType === "privateBot" ||
        vm.supportedPageType === "publicBot"
      ) {
        port.postMessage({
          type: "GET_BOT",
        });
      }
    });
  },
  computed: {
    botVariablesJSON() {
      if (this.botContentJSON) return this.botContentJSON.variables;
      return null;
    },
    botActionsJSON() {
      if (this.botContentJSON) return this.botContentJSON.nodes;
      return null;
    },
    botpropertiesJSON() {
      if (this.botContentJSON) return this.botContentJSON.properties;
      return null;
    },
    botBreakpointsJSON() {
      if (this.botContentJSON) return this.botContentJSON.breakpoints;
      return null;
    },
    totalIssues() {
      return (
        this.variableIssueCount +
        this.actionIssueCount +
        this.bestPracticesCount
      );
    },
  },
  methods: {
    reloadPage() {
      window.location.reload();
    },
    openOptionPage() {
      chrome.runtime.openOptionsPage();
    },
    setActionCount(count) {
      this.actionIssueCount = count;
    },
    setVariableCount(count) {
      this.variableIssueCount = count;
    },
    setBestPracticesCount(count) {
      this.bestPracticesCount = count;
    },
    setActiveHeader(header) {
      this.activeHeader = header;
    },
    resizeAssistant() {
      let vm = this;
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const port = chrome.tabs.connect(tabs[0].id, {
          name: "frame",
        });
        port.postMessage({
          type: "TOGGLE_SIZE",
        });
        port.onMessage.addListener((msg) => {
          if (msg.type === "SET_SIZE_STATE") {
            vm.resizeState = msg.state;
          }
        });
      });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

@font-face {
  font-family: "Museo Sans";
  font-display: auto;
  src: local("Museo Sans"), url(./assets/MuseoSans_500.woff2) format("woff2");
}

.prevent-select {
  -webkit-user-select: none;
  /* Safari */
  -ms-user-select: none;
  /* IE 10 and IE 11 */
  user-select: none;
  /* Standard syntax */
}

.assistant .assistant__header .assistant__header__title,
.assistant .assistant__list .assistant__list__group,
.assistant .assistant__list .assistant__list__option .assistant__list__option__label,
.font-museo-sans-600 {
  font-family: Museo Sans, sans-serif;
  font-weight: 600;
  font-style: normal;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__description {
  font-family: Museo Sans, sans-serif;
  font-weight: 300;
  font-style: normal;
}

.font-museo-sans-200 {
  font-family: Museo Sans, sans-serif;
  font-weight: 200;
  font-style: normal;
}

.assistant__header__title {
  cursor: pointer;
}

.assistant .assistant__title,
.font-museo-sans-700 {
  font-family: Museo Sans, sans-serif;
  font-weight: 700;
  font-style: normal;
  z-index: 60;
  height: 28px;
}

.assistant .assistant__title,
.font-size-medium {
  font-size: 14px;
  line-height: 14px;
}

.assistant .assistant__header .assistant__header__title,
.assistant .assistant__list .assistant__list__group,
.assistant .assistant__list .assistant__list__option .assistant__list__option__label,
.font-size-small-2 {
  font-size: 13px;
  line-height: 13px;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__description,
.font-size-extra-small {
  font-size: 10px;
  line-height: 10px;
}

.assistant .assistant__list .assistant__list__group,
.assistant .assistant__list .assistant__list__option,
.assistant .assistant__title .assistant__title__hide,
.reset {
  background: transparent;
  margin: 0;
  padding: 0;
  border: 0 solid transparent;
  border-collapse: separate;
  border-spacing: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.assistant .assistant__list .assistant__list__group::-moz-focus-inner,
.assistant .assistant__list .assistant__list__option::-moz-focus-inner,
.assistant .assistant__title .assistant__title__hide::-moz-focus-inner,
.reset::-moz-focus-inner {
  border: 0;
}

.assistant .assistant__list .assistant__list__group,
.assistant .assistant__list .assistant__list__option,
.assistant .assistant__title .assistant__title__hide,
.no-highlight,
.reset {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  outline: none;
}

.assistant .assistant__list .assistant__list__group::-moz-focus-inner,
.assistant .assistant__list .assistant__list__option::-moz-focus-inner,
.assistant .assistant__title .assistant__title__hide::-moz-focus-inner,
.no-highlight::-moz-focus-inner,
.reset::-moz-focus-inner {
  border: 0;
}

.assistant__header__title__reload,
.assistant__header__title__setting,
.assistant__header__title__expand {
  position: absolute;
  padding: 5px;
  cursor: pointer;
  z-index: 100;
}

.assistant__header__title__setting {
  right: 0px;
}

.assistant__header__title__expand {
  right: 34px;
}

.assistant {
  position: absolute;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
  /* border-radius: 8px; */
  overflow: hidden;
  opacity: 1;
  /* text-align: left; */
  z-index: 51;
}

.assistant.assistant--animate {
  transition: opacity 0.25s, top 0.5s, left 0.5s, width 0.5s, height 0.5s;
}

.assistant .assistant__title {
  position: absolute;
  /* top: 0;
  left: 0; */
  height: 32px;
  width: 100%;
  line-height: 34px;
  padding: 0px 66px 0px 32px;
  box-sizing: border-box;
  color: #fff;
  background: #333;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  transition: background-color 0.1s;
  -ms-user-select: none;
  user-select: none;
  /* cursor: move; */
}

.assistant .assistant__title .assistant__title__icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 38px;
  height: 38px;
  line-height: 38px;
  font-size: 16px;
  text-align: center;
}

.assistant .assistant__title .assistant__title__hide {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  text-align: center;
  color: #fff;
  transition: color 0.1s;
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  outline: none;
}

.assistant .assistant__title .assistant__title__hide::-moz-focus-inner {
  border: 0;
}

.assistant .assistant__title .assistant__title__hide:after {
  content: "";
  display: block;
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  left: 4px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #2276d9;
  opacity: 0;
  transition: opacity 0.1s;
  z-index: 50;
  pointer-events: none;
}

.assistant .assistant__title .assistant__title__hide:after {
  box-shadow: 0 0 0 2px rgba(178, 209, 255, 0.9);
}

.assistant .assistant__title .assistant__title__hide:focus:after {
  opacity: 1;
  transition: none;
}

.assistant .assistant__title .assistant__title__hide:focus:not(:focus-visible):after,
.assistant .assistant__title .assistant__title__hide:focus:not(:focus-visible):hover:after {
  opacity: 0;
  transition: opacity 0.1s;
}

.assistant .assistant__title .assistant__title__hide:hover {
  color: #ccc;
  transition: none;
}

.assistant .assistant__title .assistant__title__hide .assistant__title__hide__icon {
  pointer-events: none;
}

.assistant .assistant__content {
  position: absolute;
  top: 32px;
  left: 0;
  width: 100%;
  height: calc(100% - 32px);
  overflow: hidden;
  overflow-y: auto;
}

.assistant .assistant__header {
  position: absolute;
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  background: #eee;
}

.assistant .assistant__header .assistant__header__back {
  height: 28px;
  line-height: 26px;
  width: 18px;
  margin: 0 0 0 4px;
  text-align: right;
}

.assistant .assistant__header .assistant__header__title {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 50%;
}

.assistant .assistant__header .assistant__header__title--active:first-child {
  margin: 0;
  padding: 5px 25px 5px 15px;
  -webkit-clip-path: polygon(100% 0, 90% 0, 100% 100%, 0 100%, 0 0);
  clip-path: polygon(100% 0, 80% 0, 100% 100%, 0 100%, 0 0);
  background: #fff;
  width: 50%;
}

.assistant .assistant__header .assistant__header__title--active:not(:first-child):last-child {
  margin: 0;
  padding: 5px 25px 5px 15px;
  -webkit-clip-path: polygon(100% 0, 100% 0, 100% 100%, 0 100%, 30% 0);
  clip-path: polygon(100% 0, 100% 0, 100% 100%, 0 100%, 20% 0);
  background: #fff;
  width: 50%;
}

.assistant .assistant__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  padding: 0 32px;
  box-sizing: border-box;
  background: #eee;
  text-align: center;
}

.assistant .assistant__footer .assistant__footer__children {
  position: absolute;
  top: 0;
  left: 32px;
  height: 40px;
  width: calc(100% - 64px);
  display: flex;
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 0;
  align-items: center;
  justify-content: center;
}

.assistant .assistant__footer .assistant__footer__previous {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 38px;
  line-height: 38px;
  text-align: center;
}

.assistant .assistant__footer .assistant__footer__next {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 38px;
  line-height: 38px;
  text-align: center;
}

.assistant .assistant__children {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding-bottom: 4px;
  box-sizing: border-box;
  overflow: auto;
  color: #121212;
}

.assistant .assistant__children.assistant__children--header {
  top: 32px;
  height: calc(100% - 32px);
}

.assistant .assistant__children.assistant__children--footer {
  height: calc(100% - 40px);
  padding-bottom: 0;
}

.assistant .assistant__children.assistant__children--header.assistant__children--footer {
  height: calc(100% - 72px);
}

.assistant .assistant__list .assistant__list__group-container:not(:first-child) {
  border-top: 1px solid #eee;
}

.assistant .assistant__list .assistant__list__group-container:not(:first-child):last-child {
  border-bottom: 1px solid #eee;
}

.assistant .assistant__list .assistant__list__group {
  position: sticky;
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  top: 0;
  width: 100%;
  height: 36px;
  line-height: 36px;
  padding: 0 16px 0 0;
  box-sizing: border-box;
  background: #fff;
  -ms-user-select: none;
  user-select: none;
  z-index: 1;
  text-align: left;
  cursor: pointer;
  z-index: 51;
  transition: background 0.1s;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  outline: none;
}

.assistant .assistant__list .assistant__list__group::-moz-focus-inner {
  border: 0;
}

.assistant .assistant__list .assistant__list__group:after {
  content: "";
  display: block;
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  left: 4px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #2276d9;
  opacity: 0;
  transition: opacity 0.1s;
  z-index: 50;
  pointer-events: none;
}

.assistant .assistant__list .assistant__list__group .assistant__list__group__icon {
  position: relative;
  display: block;
  flex-grow: 0;
  flex-shrink: 0;
  width: 32px;
  height: 24px;
  line-height: 24px;
  font-size: 16px;
  text-align: center;
  color: #949494;
  transition: color 0.1s;
}

.assistant .assistant__list .assistant__list__group .assistant__list__group__icon .assistant__list__group__icon__expander {
  transition: transform 0.1s;
}

.assistant .assistant__list .assistant__list__group .assistant__list__group__icon .assistant__list__group__icon__expander.assistant__list__group__icon__expander--open {
  transform: rotate(90deg);
}

.assistant .assistant__list .assistant__list__group .assistant__list__group__label {
  position: relative;
  display: block;
  flex-grow: 0;
  flex-shrink: 1;
  height: 24px;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.assistant .assistant__list .assistant__list__group .assistant__list__group__count {
  position: relative;
  display: block;
  flex-grow: 0;
  flex-shrink: 0;
  height: 24px;
  line-height: 24px;
}

.assistant .assistant__list .assistant__list__group:focus:after {
  opacity: 1;
  transition: none;
}

.assistant .assistant__list .assistant__list__group:focus:not(:focus-visible):after,
.assistant .assistant__list .assistant__list__group:focus:not(:focus-visible):hover:after {
  opacity: 0;
  transition: opacity 0.1s;
}

.assistant .assistant__list .assistant__list__group:hover {
  background: #f5f5f5;
  transition: none;
}

.assistant .assistant__list .assistant__list__group:hover .assistant__list__group__icon {
  color: #666;
  transition: transform 0.1s;
}

.assistant .assistant__list .assistant__list__group:active {
  background: #e0e0e0;
  transition: none;
}

.assistant .assistant__list .assistant__list__group:active .assistant__list__group__icon {
  color: #4f4f4f;
  transition: transform 0.1s;
}

.assistant .assistant__list .assistant__list__group_children {
  position: relative;
  overflow: hidden;
  max-height: auto;
  opacity: 1;
  transition: opacity 0.1s;
}

.assistant .assistant__list .assistant__list__group_children.assistant__list__group_children--hidden {
  max-height: 0;
  opacity: 0;
  transition: none;
}

.assistant .assistant__list .assistant__list__option {
  position: relative;
  display: block;
  width: 100%;
  padding: 8px 16px;
  box-sizing: border-box;
  background: transparent;
  text-align: left;
  -ms-user-select: none;
  user-select: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--icon {
  padding-left: 44px;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--openable {
  padding-right: 32px;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__icon {
  position: absolute;
  top: 8px;
  left: 16px;
  width: 20px;
  font-size: 16px;
  color: #666;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__opener {
  position: absolute;
  display: flex;
  align-items: center;
  -ms-grid-column-align: center;
  justify-items: center;
  top: 8px;
  right: 8px;
  width: 20px;
  height: calc(100% - 16px);
  color: #666;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__opener__icon {
  font-size: 16px;
  pointer-events: none;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__label {
  display: block;
  line-height: 18px;
  color: #2d5472;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__description {
  display: block;
  line-height: 16px;
  color: #666;
}

.assistant .assistant__list .assistant__list__option .assistant__list__option__description>span:first-child:not(:last-child):after {
  content: "|";
  margin: 0 8px;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable {
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  outline: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable::-moz-focus-inner {
  border: 0;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:after {
  content: "";
  display: block;
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  left: 4px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #2276d9;
  opacity: 0;
  transition: opacity 0.1s;
  z-index: 50;
  pointer-events: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable>.assistant__list__option__description,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable>.assistant__list__option__icon,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable>.assistant__list__option__label,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable>.assistant__list__option__opener {
  transition: background-color 0.1s, color 0.1s;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:focus:after {
  opacity: 1;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:focus:not(:focus-visible):after,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:focus:not(:focus-visible):hover:after {
  opacity: 0;
  transition: opacity 0.1s;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:hover {
  background: #e6f5ff;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:hover>.assistant__list__option__description,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:hover>.assistant__list__option__label {
  color: #0009ff;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:hover>.assistant__list__option__icon,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:hover>.assistant__list__option__opener {
  color: #2e4d70;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:active {
  background: #a2c7e0;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:active>.assistant__list__option__description,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:active>.assistant__list__option__label {
  color: #0c2847;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:active>.assistant__list__option__icon,
.assistant .assistant__list .assistant__list__option.assistant__list__option--clickable:active>.assistant__list__option__opener {
  color: #0c2847;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--active,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active.assistant__list__option--clickable {
  background: #cde5f5;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--active.assistant__list__option--clickable>.assistant__list__option__description,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active.assistant__list__option--clickable>.assistant__list__option__label,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active>.assistant__list__option__description,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active>.assistant__list__option__label {
  color: #163b65;
  transition: none;
}

.assistant .assistant__list .assistant__list__option.assistant__list__option--active.assistant__list__option--clickable>.assistant__list__option__icon,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active.assistant__list__option--clickable>.assistant__list__option__opener,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active>.assistant__list__option__icon,
.assistant .assistant__list .assistant__list__option.assistant__list__option--active>.assistant__list__option__opener {
  color: #163b65;
  transition: none;
}

.assistant .assistant__resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 5px;
  box-sizing: border-box;
  background: transparent;
  overflow: hidden;
  transition: background-color 0.1s;
  /* cursor: ns-resize; */
}

.assistant .assistant__resize-handle:hover {
  transition: none;
  background: #e6f5ff;
}

.assistant .assistant__resize-handle:active {
  transition: none;
  background: #a2c7e0;
}

::-webkit-scrollbar {
  /* width */
  height: 0px;
  width: 4px;
}

::-webkit-scrollbar-track {
  /* Track */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  /* Handle on hover */
  background: #717373;
}

::-webkit-scrollbar-track-piece {
  /* not handle on */
  background: #eeeeee;
}
</style>