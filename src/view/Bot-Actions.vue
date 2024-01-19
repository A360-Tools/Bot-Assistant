<template>
  <div class="assistant__list__group-container">
    <button type="button" class="assistant__list__group" tabindex="0" @click="showList = !showList">
      <div class="assistant__list__group__icon">
        <span class="icon icon--image aa-icon-color icon--animate-none"></span>
        <img v-if="showList" class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/collapse.svg"
          style="width: 16px; height: 16px; font-size: 16px" title="Click to collapse" />
        <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand.svg"
          style="width: 16px; height: 16px; font-size: 16px" title="Click to expand" />
      </div>

      <div class="assistant__list__group__label">
        {{ ItemType }}
      </div>

      <div class="assistant__list__group__count">
        &nbsp;({{ actionsWithIssue.length }})
      </div>
    </button>
    <div class="assistant__list__group_children" v-show="showList">
      <button v-for="action in actionsWithIssue" :key="action" type="button" class="
          assistant__list__option
          assistant__list__option--icon
          assistant__list__option--clickable
        " tabindex="0" @click="
          clickActionByLineNumber(action.LineNumber), setActiveAction(action)
          " :class="{
    'assistant__list__option--active':
      JSON.stringify(activeAction) == JSON.stringify(action),
  }">
        <span class="assistant__list__option__label" title="">{{ action.commandName }} </span><span
          class="font-museo-sans-200">{{ action.IssueDetail }}</span>
        <span class="assistant__list__option__description"><span v-if="action.LineNumber">Line {{ action.LineNumber
        }}</span><span v-if="action.issueType">{{ action.issueType }}</span></span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    actionsArray: {
      type: Array,
      default: () => [],
    },
    debugArray: {
      type: Array,
      default: () => [],
    },
    preferences: {
      type: Object,
      default: () => { },
    },
  },
  data() {
    return {
      ItemType: "Actions",
      showList: true,
      LineNumber: 0,
      activeAction: {},
    };
  },
  computed: {
    getNonTryCatchParentNodesUID() {
      let nonTryCatchParentNodesUID = [];
      nonTryCatchParentNodesUID = this.actionsArray
        .filter((node) => node.commandName != "try")
        .map((node) => node.uid);
      return nonTryCatchParentNodesUID;
    },
    actionsWithIssue() {
      let actionsWithIssue = this.parseNode(this.actionsArray, []);
      this.$emit("handle-action-count", actionsWithIssue.length);
      return actionsWithIssue;
    },
  },
  methods: {
    parseNode(actionsArray, actionsWithIssue) {
      actionsArray.forEach((action) => {
        this.LineNumber++;
        let issueDetails = {};
        issueDetails["LineNumber"] = this.LineNumber;
        issueDetails["commandName"] = action.commandName;
        if (
          this.preferences?.actions.emptyContainersDisallowed &&
          action.children?.length == 0
        ) {
          issueDetails["IssueDetail"] = "Empty command";
        }
        if (
          this.preferences?.actions.debugDisallowed &&
          this.debugArray.includes(action.uid)
        ) {
          issueDetails["IssueDetail"] = "Debug breakpoint not removed";
        }
        if (
          this.preferences?.actions.outOfErrHandlingDisallowed &&
          this.getNonTryCatchParentNodesUID.includes(action.uid) &&
          !(action.commandName == "Comment" && action.packageName == "Comment")
        ) {
          issueDetails["IssueDetail"] = "Command outside try-catch block";
        }
        if (
          this.preferences?.actions.msgBoxDisallowed &&
          action.commandName == "messageBox" &&
          action.packageName == "MessageBox"
        ) {
          issueDetails["IssueDetail"] = "Message box not removed";
        }
        if (
          this.preferences?.actions.delayDisallowed &&
          action.commandName == "delay" &&
          action.packageName == "Delay"
        ) {
          if (
            action.attributes[0].value.string == "REGULAR" &&
            action.attributes[1].value.number
          ) {
            issueDetails["IssueDetail"] = "Hardcoded delay found";
          } else if (
            action.attributes[0].value.string == "RANDOM" &&
            (action.attributes[1].value.number ||
              action.attributes[2].value.number)
          ) {
            issueDetails["IssueDetail"] = "Hardcoded delay found";
          }
        }
        if (
          this.preferences?.actions.disabledActionsDisallowed &&
          action.disabled
        ) {
          issueDetails["IssueDetail"] = "Disabled action not removed";
        }
        if (
          this.preferences?.actions.codeBreakDisallowed &&
          action.packageName == "TaskBot" &&
          (action.commandName == "stopTask" ||
            action.commandName == "pauseTask")
        ) {
          issueDetails["IssueDetail"] = "Code break present";
        }
        if (Object.hasOwn(issueDetails, "IssueDetail")) {
          actionsWithIssue.push(issueDetails);
        }
        if (action.children) this.parseNode(action.children, actionsWithIssue);
        if (action.branches) this.parseNode(action.branches, actionsWithIssue);
      });
      return actionsWithIssue;
    },

    clickActionByLineNumber(lineNumber) {
      if (lineNumber) {
        this.activeLineNumber = lineNumber;
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            const port = chrome.tabs.connect(tabs[0].id, {
              name: "frame",
            });
            port.postMessage({
              type: "CLICK_LINE",
              lineNo: lineNumber,
            });
          }
        );
      }
    },
    setActiveAction(action) {
      this.activeAction = action;
    },
  },
};
</script>
