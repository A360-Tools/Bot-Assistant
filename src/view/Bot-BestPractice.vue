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
      <button v-for="action in actionsWithIssue" :key="action" type="button"
        class="assistant__list__option assistant__list__option--icon" tabindex="0">
        <span class="assistant__list__option__label" title="">{{ action.commandName }} </span><span
          class="font-museo-sans-200">{{ action.IssueDetail }}</span>
        <span class="assistant__list__option__description"><span v-if="action.issueType">{{ action.issueType
        }}</span></span>
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
    variablesArray: {
      type: Array,
      default: () => [],
    },
    botProperties: {
      type: Object,
      default: () => { },
    },
    preferences: {
      type: Object,
      default: () => { },
    },
  },
  data() {
    return {
      ItemType: "Best Practices",
      LineNumber: 0,
      ErrorHandlingPresent: false,
      CommentsPresent: false,
      StepsPresent: false,
      showList: true,
    };
  },
  computed: {
    actionsWithIssue() {
      let actionsWithIssue = [];
      this.parseNode(this.actionsArray);
      if (
        this.LineNumber > this.preferences?.bestPractices.maxLineOfCode &&
        this.preferences?.bestPractices.maxLineOfCode !== 0
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Code readability & maintenance";
        issueDetails["commandName"] = "Action count exceeds";
        issueDetails["IssueDetail"] =
          "More than " +
          this.preferences?.bestPractices.maxLineOfCode +
          " lines in same taskbot";
        actionsWithIssue.push(issueDetails);
      }

      if (
        this.variablesArray.length >
        this.preferences?.bestPractices.maxVariableCount &&
        this.preferences?.bestPractices.maxVariableCount !== 0
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Code readability & maintenance";
        issueDetails["commandName"] = "Variable count exceeds";
        issueDetails["IssueDetail"] =
          "More than " +
          this.preferences?.bestPractices.maxVariableCount +
          " variables in same taskbot";
        actionsWithIssue.push(issueDetails);
      }

      if (
        this.preferences?.bestPractices.tryCatch &&
        !this.ErrorHandlingPresent
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Code reliability";
        issueDetails["commandName"] = "Try-Catch";
        issueDetails["IssueDetail"] = "Missing error handling commands";
        actionsWithIssue.push(issueDetails);
      }
      if (this.preferences?.bestPractices.comment && !this.CommentsPresent) {
        let issueDetails = {};
        issueDetails["issueType"] = "Code readability & maintenance";
        issueDetails["commandName"] = "Comment";
        issueDetails["IssueDetail"] = "Missing Comment command";
        actionsWithIssue.push(issueDetails);
      }

      if (this.preferences?.bestPractices.step && !this.StepsPresent) {
        let issueDetails = {};
        issueDetails["issueType"] = "Code readability & maintenance";
        issueDetails["commandName"] = "Step";
        issueDetails["IssueDetail"] = "Missing Step command";
        actionsWithIssue.push(issueDetails);
      }

      if (
        this.preferences?.bestPractices.timeoutZero &&
        this.botProperties?.timeout != undefined &&
        this.botProperties.timeout != "0s"
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Bot Execution Behavior";
        issueDetails["commandName"] = "Runtime time out";
        issueDetails["IssueDetail"] =
          "Automation is set to stop after: " + this.botProperties.timeout;
        actionsWithIssue.push(issueDetails);
      }

      if (
        this.preferences?.bestPractices.priorityMedium &&
        this.botProperties?.automationPriority != undefined &&
        this.botProperties.automationPriority != "PRIORITY_MEDIUM"
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Bot Execution Behavior";
        issueDetails["commandName"] = "Automation Priority";
        issueDetails["IssueDetail"] =
          "Curent Automation Priority: " +
          this.botProperties.automationPriority;
        actionsWithIssue.push(issueDetails);
      }

      if (
        this.preferences?.bestPractices.botCodeVersion &&
        this.botProperties?.botCodeVersion != undefined &&
        this.botProperties.botCodeVersion < this.preferences.bestPractices.botCodeVersion
      ) {
        let issueDetails = {};
        issueDetails["issueType"] = "Bot Execution Behavior";
        issueDetails["commandName"] = "Bot Compatibility";
        issueDetails["IssueDetail"] =
          "Bot compatibility version is lower than: " + this.preferences.bestPractices.botCodeVersion;
        actionsWithIssue.push(issueDetails);
      }

      this.$emit("handle-bestpractice-count", actionsWithIssue.length);
      return actionsWithIssue;
    },
  },
  methods: {
    parseNode(actionsArray) {
      actionsArray.forEach((action) => {
        this.LineNumber++;
        if (action.commandName == "try" && action.packageName == "ErrorHandler")
          this.ErrorHandlingPresent = true;
        if (action.commandName == "Comment" && action.packageName == "Comment")
          this.CommentsPresent = true;
        if (action.commandName == "step" && action.packageName == "Step")
          this.StepsPresent = true;
        if (action.children) this.parseNode(action.children);
        if (action.branches) this.parseNode(action.branches);
      });
    },
  },
};
</script>