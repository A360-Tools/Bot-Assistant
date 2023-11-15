<template>
  <div class="assistant__list__group-container">
    <button
      type="button"
      class="assistant__list__group"
      tabindex="0"
      @click="showList = !showList"
    >
      <div class="assistant__list__group__icon">
        <span class="icon icon--image aa-icon-color icon--animate-none"></span>
        <img
          v-if="showList"
          class="taskbotnodeicon taskbotnodeicon--theme-default"
          src="../assets/collapse.svg"
          style="width: 16px; height: 16px; font-size: 16px"
          title="Click to collapse"
        />
        <img
          v-else
          class="taskbotnodeicon taskbotnodeicon--theme-default"
          src="../assets/expand.svg"
          style="width: 16px; height: 16px; font-size: 16px"
          title="Click to expand"
        />
      </div>

      <div class="assistant__list__group__label">
        {{ ItemType }}
      </div>

      <div class="assistant__list__group__count">
        &nbsp;({{ variablesWithIssue.length }})
      </div>
    </button>
    <div class="assistant__list__group_children" v-show="showList">
      <button
        v-for="variable in variablesWithIssue"
        :key="variable"
        type="button"
        class="
          assistant__list__option
          assistant__list__option--icon
          assistant__list__option--clickable
        "
        tabindex="0"
        @click="openVariableByName(variable.name), setActiveVariable(variable)"
        :class="{
          'assistant__list__option--active':
            JSON.stringify(activeVariable) == JSON.stringify(variable),
        }"
      >
        <span class="assistant__list__option__label" title=""
          >{{ variable.name }}
        </span>
        <span class="font-museo-sans-200"> {{ variable.IssueDetail }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    variablesArray: {
      type: Array,
      default: () => [],
    },
    preferences: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      ItemType: "Variables",
      showList: true,
      activeVariable: {},
    };
  },
  computed: {
    variablesWithIssue() {
      let variablesWithIssueCopy = structuredClone(this.variablesArray)
      let variablesWithIssue = [];
      let inputOutputRegex = this.preferences?.variables.inputOutputPattern;
      let inputRegex = this.preferences?.variables.inputPattern;
      let outputRegex = this.preferences?.variables.outputPattern;
      let variableRegex = this.preferences?.variables.variablePattern;
      variablesWithIssueCopy.forEach((botVariable) => {
        if (
          this.preferences?.variables.hardCodedNotConstant &&
          Object.hasOwn(botVariable, "defaultValue") &&
          botVariable.readOnly == false
        ) {
          if (
            botVariable.type == "STRING" &&
            botVariable.defaultValue.string != ""
          ) {
            botVariable["IssueDetail"] =
              "Hardcoded value assigned to non-constant variable";
          } else if (
            botVariable.type == "NUMBER" &&
            botVariable.defaultValue.number != 0
          ) {
            botVariable["IssueDetail"] =
              "Hardcoded value assigned to non-constant variable";
          }
        }

        if (
          this.preferences?.variables.constantNotCapital &&
          botVariable.readOnly &&
          botVariable.name !== botVariable.name.toString().toUpperCase()
        ) {
          botVariable["IssueDetail"] = "Constant variable name not capitalized";
        }
        if (
          this.isvalidRegex(inputOutputRegex) &&
          botVariable.input &&
          botVariable.output &&
          !new RegExp(inputOutputRegex).test(botVariable.name.toString())
        ) {
          botVariable["IssueDetail"] =
            "Input+Output type variable name mismatch regex " +
            inputOutputRegex;
        }
        if (
          this.isvalidRegex(inputRegex) &&
          botVariable.input &&
          !botVariable.output &&
          !new RegExp(inputRegex).test(botVariable.name.toString())
        ) {
          botVariable["IssueDetail"] =
            "Input type variable  name mismatch regex " + inputRegex;
        }

        if (
          this.isvalidRegex(outputRegex) &&
          !botVariable.input &&
          botVariable.output &&
          !new RegExp(outputRegex).test(botVariable.name.toString())
        ) {
          botVariable["IssueDetail"] =
            "Output type variable name mismatch regex " + outputRegex;
        }

        if (
          this.isvalidRegex(variableRegex) &&
          !botVariable.input &&
          !botVariable.output &&
          !new RegExp(variableRegex).test(botVariable.name.toString())
        ) {
          botVariable["IssueDetail"] =
            "Regular type variable name mismatch regex " + variableRegex;
        }

        if (
          this.preferences?.variables.variableMinSize &&
          botVariable.name.toString().length <
            this.preferences?.variables.variableMinSize
        ) {
          botVariable["IssueDetail"] =
            "Variable name length less than allowed minimum length of " +
            this.preferences.variables.variableMinSize;
        }

        if (Object.hasOwn(botVariable, "IssueDetail")) {
          variablesWithIssue.push(botVariable);
        }
      });
      this.$emit("handle-variable-count", variablesWithIssue.length);
      return variablesWithIssue;
    },
  },
  methods: {
    
    openVariableByName(variableName) {
      if (variableName) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            const port = chrome.tabs.connect(tabs[0].id, {
              name: "frame",
            });
            port.postMessage({
              type: "OPEN_VAR",
              varName: variableName,
            });
          }
        );
      }
    },
    setActiveVariable(variable) {
      this.activeVariable = variable;
    },
    isvalidRegex(inputRegex) {
      try {
        new RegExp(inputRegex);
        return true;
      } catch (e) {
        return false;
      }
    },
  },
};
</script>