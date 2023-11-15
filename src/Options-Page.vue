<template>
  <section id="options" class="section">
    <h1 class="title is-1 has-text-centered" v-text="form.formName"></h1>
    <form class="box" header-image>
      <div class="columns">
        <div class="column">
          <div class="field">
            <label class="label is-large">Best Practices</label>
          </div>
          <div class="field">
            <div class="control">
              <label>
                <input type="checkbox" v-model="form.bestPractices.tryCatch" />
                Error Handling mandatory.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.bestPractices.comment" />
                Comment mandatory.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.bestPractices.step" />
                Step mandatory.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.bestPractices.timeoutZero" />
                Runtime time out set to 0 mandatory
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.bestPractices.priorityMedium" />
                Automation priority set to medium mandatory
              </label>
            </div>
          </div>
          <div class="field">
            <label>Maximum Lines of code per task</label>
            <div class="control">
              <input title="Value of 0 removes validation" class="input" type="number"
                v-model="form.bestPractices.maxLineOfCode" />
            </div>
          </div>
          <div class="field">
            <label>Maximum number of variables per task</label>
            <div class="control">
              <input title="Value of 0 removes validation" class="input" type="number"
                v-model="form.bestPractices.maxVariableCount" />
            </div>
          </div>
          <div class="field">
            <label>Minimum Bot compatibility version</label>
            <div class="control">
              <input title="Value of 0 removes validation" class="input" type="number"
                v-model="form.bestPractices.botCodeVersion" />
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label is-large">Actions</label>
          </div>
          <div class="field">
            <div class="control">
              <label>
                <input type="checkbox" v-model="form.actions.emptyContainersDisallowed" />
                Empty Containers disallowed (Step, Try, Catch, If, Else etc.).
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.disabledActionsDisallowed" />
                Disabled action disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.outOfErrHandlingDisallowed" />
                Command outside Try-Catch disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.msgBoxDisallowed" />
                Message Box disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.debugDisallowed" />
                Debug breakpoint disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.delayDisallowed" />
                Hard coded delay disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.actions.codeBreakDisallowed" />
                Code break disallowed (Pause task, Stop task).
              </label>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label is-large">Variables</label>
          </div>
          <div class="field">
            <div class="control">
              <label>
                <input type="checkbox" v-model="form.variables.hardCodedNotConstant" />
                Non constant variable with hardcoded value disallowed.
              </label>
              <br />
              <label>
                <input type="checkbox" v-model="form.variables.constantNotCapital" />
                Constant variable with lowercase letter in name disallowed
              </label>
              <br />

              <label>
                Variable name length should be more than:
                <input class="input" type="number" v-model="form.variables.variableMinSize" />
              </label>
              <br />
              <label>
                Input type variable name should match RegEx pattern:
                <input class="input" title="empty value will match every name" type="text"
                  v-model="form.variables.inputPattern" />
              </label>
              <br />
              <label>
                Output type variable name should match RegEx pattern:
                <input class="input" title="empty value will match every name" type="text"
                  v-model="form.variables.outputPattern" />
              </label>
              <br />
              <label>
                Input+Output type variable name should match RegEx pattern:
                <input class="input" title="empty value will match every name" type="text"
                  v-model="form.variables.inputOutputPattern" />
              </label>
              <br />
              <label>
                Regular(Not Input + Not Output) type variable name should match RegEx
                pattern:
                <input title="empty value will match every name" class="input" type="text"
                  v-model="form.variables.variablePattern" />
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="has-text-centered">
        <button class="button is-dark margin-bottom" type="submit" @click.prevent="validateData">
          Save
        </button>
      </div>
    </form>
  </section>
  <div id="snackbar" :class="{ show: showToast }">{{ saveMessage }}</div>
</template>

<script>
export default {
  data() {
    return {
      form: {
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
      showToast: false,
      saveMessage: null,
    };
  },
  mounted() {
    let vm = this;
    chrome.storage.sync.get(["preferences"], function (value) {
      if (value["preferences"] != undefined) vm.form = value["preferences"];
    });
  },
  computed: {},
  methods: {
    validateData() {
      console.log("validating data", this.form);
      if (!this.isvalidRegex(this.form.variables.inputPattern)) {
        this.saveMessage = "Invalid RegEx for input variable";
        this.showToast = true;
      } else if (!this.isvalidRegex(this.form.variables.outputPattern)) {
        this.saveMessage = "Invalid RegEx for output variable";
        this.showToast = true;
      } else if (!this.isvalidRegex(this.form.variables.inputOutputPattern)) {
        this.saveMessage = "Invalid RegEx for input+output variable";
        this.showToast = true;
      } else if (!this.isvalidRegex(this.form.variables.variablePattern)) {
        this.saveMessage = "Invalid RegEx for regular variable";
        this.showToast = true;
      } else if (this.form.bestPractices.maxLineOfCode<0) {
        this.saveMessage = "Invalid value for maximum line of code";
        this.showToast = true;
      } else if (this.form.bestPractices.maxVariableCount<0) {
        this.saveMessage = "Invalid value maximum count of variable";
        this.showToast = true;
      } else if (this.form.bestPractices.botCodeVersion<0) {
        this.saveMessage = "Invalid value for minimum bot compatibility version";
        this.showToast = true;
      }
      else {
        this.saveToLocalStorage();
      }
      if (this.showToast) {
        setTimeout(() => {
          this.showToast = false;
        }, 3600);
      }
    },
    saveToLocalStorage() {
      let vm = this;
      chrome.storage.sync.set({ preferences: vm.form }, function () {
        console.log("data saved", vm.form);
        vm.saveMessage = "Saved Successfully";
        vm.showToast = true;
        setTimeout(() => {
          vm.showToast = false;
        }, 3600);
      });
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

<style scoped>
@font-face {
  font-family: "Museo Sans";
  font-display: auto;
  src: local("Museo Sans"), url(./assets/MuseoSans_500.woff2) format("woff2");
}

/* The snackbar - position it at the bottom and in the middle of the screen */
#snackbar {
  font-family: "Museo Sans";
  visibility: hidden;
  /* Hidden by default. Visible on click */
  min-width: 200px;
  /* Set a default minimum width */
  margin-left: -100px;
  /* Divide value of min-width by 2 */
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
  left: 50%;
  /* Center the snackbar */
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

button {
  padding: 12px 20px;
  font-size: 20px;
  outline: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}

button:hover {
  background-color: #3d6ef55e;
}

.toast.active~button {
  pointer-events: none;
}

.input {
  -moz-appearance: none;
  -webkit-appearance: none;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  box-shadow: none;
  display: inline-flex;
  font-size: 1rem;
  height: 2em;
  justify-content: flex-start;
  line-height: 1.5;
  padding-bottom: calc(0.5em - 1px);
  padding-left: calc(0.75em - 1px);
  padding-right: calc(0.75em - 1px);
  padding-top: calc(0.5em - 1px);
  position: relative;
  vertical-align: top;
}

.input:focus {
  outline: 0;
}

.button[disabled],
.input[disabled] {
  cursor: not-allowed;
}

.button {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.box:not(:last-child),
.message:not(:last-child),
.title:not(:last-child) {
  margin-bottom: 0.7rem;
}

body,
h1,
h2,
h3,
h4,
h5,
h6,
html,
p {
  margin: 0;
  padding: 0;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: 100%;
  font-weight: 400;
}

button,
input {
  margin: 0;
}

html {
  box-sizing: border-box;
}

*,
::after,
::before {
  box-sizing: inherit;
}

html {
  background-color: #fff;
  font-size: 16px;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  min-width: 300px;
  overflow-x: hidden;
  overflow-y: scroll;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

article,
header,
section {
  display: block;
}

body,
button,
input {
  font-family: Museo Sans, -apple-system, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
}

code {
  -moz-osx-font-smoothing: auto;
  -webkit-font-smoothing: auto;
  font-family: monospace;
}

body {
  color: #4a4a4a;
  font-size: 1em;
  font-weight: 300;
  line-height: 1.6;
}

code {
  background-color: #f5f5f5;
  color: #da1039;
  font-size: 0.875em;
  font-weight: 400;
  padding: 0.25em 0.5em 0.25em;
}

input[type="checkbox"],
input[type="radio"] {
  vertical-align: baseline;
}

@-webkit-keyframes spinAround {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(359deg);
  }
}

@keyframes spinAround {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(359deg);
  }
}

.box {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2.9em 1.2em -0.125em rgb(21 20 10 / 21%),
    0 0 0 4px rgba(55, 109, 194, 0.8);
  display: block;
  padding: 1.25rem;
}

.button:hover {
  border-color: #b5b5b5;
  color: #363636;
}

.button:focus {
  border-color: #485fc7;
  color: #363636;
}

.button:focus:not(:active) {
  box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
}

.button:active {
  border-color: #4a4a4a;
  color: #363636;
}

.button.is-text {
  background-color: transparent;
  border-color: transparent;
  color: #4a4a4a;
  text-decoration: underline;
}

.button.is-text:focus,
.button.is-text:hover {
  background-color: #f5f5f5;
  color: #363636;
}

.button.is-text:active {
  background-color: #e8e8e8;
  color: #363636;
}

.button.is-text[disabled] {
  background-color: transparent;
  border-color: transparent;
  box-shadow: none;
}

.button.is-dark {
  background-color: #363636;
  border-color: transparent;
  color: #fff;
}

.button.is-dark:hover {
  background-color: #2f2f2f;
  border-color: transparent;
  color: #fff;
}

.button.is-dark:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-dark:focus:not(:active) {
  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
}

.button.is-dark:active {
  background-color: #292929;
  border-color: transparent;
  color: #fff;
}

.button.is-dark[disabled] {
  background-color: #363636;
  border-color: transparent;
  box-shadow: none;
}

.button.is-primary {
  background-color: #00d1b2;
  border-color: transparent;
  color: #fff;
}

.button.is-primary:hover {
  background-color: #00c4a7;
  border-color: transparent;
  color: #fff;
}

.button.is-primary:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-primary:focus:not(:active) {
  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
}

.button.is-primary:active {
  background-color: #00b89c;
  border-color: transparent;
  color: #fff;
}

.button.is-primary[disabled] {
  background-color: #00d1b2;
  border-color: transparent;
  box-shadow: none;
}

.button.is-large {
  font-size: 1.5rem;
}

.button[disabled] {
  background-color: #fff;
  border-color: #dbdbdb;
  box-shadow: none;
  opacity: 0.5;
}

.image {
  display: block;
  position: relative;
}

@-webkit-keyframes moveIndeterminate {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@keyframes moveIndeterminate {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

.title {
  word-break: break-word;
}

.title {
  color: #363636;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.125;
}

.title.is-1 {
  font-size: 3rem;
}

.title.is-2 {
  font-size: 2.5rem;
}

.title.is-3 {
  font-size: 2rem;
}

.title.is-4 {
  font-size: 1.5rem;
}

.title.is-5 {
  font-size: 1.25rem;
}

.title.is-6 {
  font-size: 1rem;
}

.title.is-7 {
  font-size: 0.75rem;
}

.number {
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 9999px;
  display: inline-flex;
  font-size: 1.25rem;
  height: 2em;
  justify-content: center;
  margin-right: 1.5rem;
  min-width: 2.5em;
  padding: 0.25rem 0.5rem;
  text-align: center;
  vertical-align: top;
}

.input {
  background-color: #fff;
  border-color: #dbdbdb;
  border-radius: 6px;
  color: #363636;
}

.input::-moz-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input::-webkit-input-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:-moz-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:-ms-input-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:hover {
  border-color: #b5b5b5;
}

.input:active,
.input:focus {
  border-color: #485fc7;
  box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
}

.input[disabled] {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  box-shadow: none;
  color: #7a7a7a;
}

.input[disabled]::-moz-placeholder {
  color: rgba(122, 122, 122, 0.3);
}

.input[disabled]::-webkit-input-placeholder {
  color: rgba(122, 122, 122, 0.3);
}

.input[disabled]:-moz-placeholder {
  color: rgba(122, 122, 122, 0.3);
}

.input[disabled]:-ms-input-placeholder {
  color: rgba(122, 122, 122, 0.3);
}

.input {
  box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
  max-width: 100%;
  width: 100%;
}

.input[readonly] {
  box-shadow: none;
}

.is-dark.input {
  border-color: #363636;
}

.is-dark.input:active,
.is-dark.input:focus {
  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
}

.is-primary.input {
  border-color: #00d1b2;
}

.is-primary.input:active,
.is-primary.input:focus {
  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
}

.is-large.input {
  font-size: 1.5rem;
}

.checkbox {
  cursor: pointer;
  display: inline-block;
  line-height: 1.25;
  position: relative;
}

.checkbox input {
  cursor: pointer;
}

.checkbox:hover {
  color: #363636;
}

.checkbox input[disabled],
.checkbox[disabled] {
  color: #7a7a7a;
  cursor: not-allowed;
}

.label {
  color: #363636;
  display: block;
  font-size: 1rem;
  font-weight: 700;
}

.label:not(:last-child) {
  margin-bottom: 0.5em;
}

.label.is-large {
  font-size: 1.5rem;
}

.field:not(:last-child) {
  margin-bottom: 0.75rem;
}

.field-label .label {
  font-size: inherit;
}

@media screen and (max-width: 768px) {
  .field-label {
    margin-bottom: 0.5rem;
  }
}

@media screen and (min-width: 769px),
print {
  .field-label {
    flex-basis: 0;
    flex-grow: 1;
    flex-shrink: 0;
    margin-right: 1.5rem;
    text-align: right;
  }

  .field-label.is-large {
    font-size: 1.5rem;
    padding-top: 0.375em;
  }
}

.field-body .field .field {
  margin-bottom: 0;
}

@media screen and (min-width: 769px),
print {
  .field-body {
    display: flex;
    flex-basis: 0;
    flex-grow: 5;
    flex-shrink: 1;
  }

  .field-body .field {
    margin-bottom: 0;
  }

  .field-body>.field {
    flex-shrink: 1;
  }

  .field-body>.field:not(.is-narrow) {
    flex-grow: 1;
  }

  .field-body>.field:not(:last-child) {
    margin-right: 0.75rem;
  }
}

.control {
  box-sizing: border-box;
  clear: both;
  font-size: 1rem;
  position: relative;
  text-align: inherit;
}

.message {
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 1rem;
}

.message.is-large {
  font-size: 1.5rem;
}

.message.is-dark {
  background-color: #fafafa;
}

.message.is-dark .message-header {
  background-color: #363636;
  color: #fff;
}

.message.is-dark .message-body {
  border-color: #363636;
}

.message.is-primary {
  background-color: #ebfffc;
}

.message.is-primary .message-header {
  background-color: #00d1b2;
  color: #fff;
}

.message.is-primary .message-body {
  border-color: #00d1b2;
  color: #00947e;
}

.message-header {
  align-items: center;
  background-color: #4a4a4a;
  border-radius: 4px 4px 0 0;
  color: #fff;
  display: flex;
  font-weight: 700;
  justify-content: space-between;
  line-height: 1.25;
  padding: 0.75em 1em;
  position: relative;
}

.message-header+.message-body {
  border-width: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.message-body {
  border-color: #dbdbdb;
  border-radius: 4px;
  border-style: solid;
  border-width: 0 0 0 4px;
  color: #4a4a4a;
  padding: 1.25em 1.5em;
}

.message-body code {
  background-color: #fff;
}

.column {
  display: block;
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
  padding: 0.75rem;
}

@media screen and (min-width: 769px),
print {
  .column.is-0 {
    flex: none;
    width: 0%;
  }

  .column.is-1 {
    flex: none;
    width: 8.33333%;
  }

  .column.is-2 {
    flex: none;
    width: 16.66667%;
  }

  .column.is-3 {
    flex: none;
    width: 25%;
  }

  .column.is-4 {
    flex: none;
    width: 33.33333%;
  }

  .column.is-5 {
    flex: none;
    width: 41.66667%;
  }

  .column.is-6 {
    flex: none;
    width: 50%;
  }

  .column.is-7 {
    flex: none;
    width: 58.33333%;
  }

  .column.is-8 {
    flex: none;
    width: 66.66667%;
  }

  .column.is-9 {
    flex: none;
    width: 75%;
  }

  .column.is-10 {
    flex: none;
    width: 83.33333%;
  }

  .column.is-11 {
    flex: none;
    width: 91.66667%;
  }

  .column.is-12 {
    flex: none;
    width: 100%;
  }
}

.columns {
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  margin-top: -0.75rem;
}

.columns:last-child {
  margin-bottom: -0.75rem;
}

.columns:not(:last-child) {
  margin-bottom: calc(1.5rem - 0.75rem);
}

.columns.is-centered {
  justify-content: center;
}

@media screen and (min-width: 769px),
print {
  .columns:not(.is-desktop) {
    display: flex;
  }
}

.columns.is-variable {
  --columnGap: 0.75rem;
  margin-left: calc(-1 * var(--columnGap));
  margin-right: calc(-1 * var(--columnGap));
}

.columns.is-variable>.column {
  padding-left: var(--columnGap);
  padding-right: var(--columnGap);
}

.columns.is-variable.is-0 {
  --columnGap: 0rem;
}

.columns.is-variable.is-1 {
  --columnGap: 0.25rem;
}

.columns.is-variable.is-2 {
  --columnGap: 0.5rem;
}

.columns.is-variable.is-3 {
  --columnGap: 0.75rem;
}

.columns.is-variable.is-4 {
  --columnGap: 1rem;
}

.columns.is-variable.is-5 {
  --columnGap: 1.25rem;
}

.columns.is-variable.is-6 {
  --columnGap: 1.5rem;
}

.columns.is-variable.is-7 {
  --columnGap: 1.75rem;
}

.columns.is-variable.is-8 {
  --columnGap: 2rem;
}

.has-text-dark {
  color: #363636 !important;
}

.has-text-primary {
  color: #00d1b2 !important;
}

.has-text-primary-dark {
  color: #00947e !important;
}

.p-0 {
  padding: 0 !important;
}

.p-1 {
  padding: 0.25rem !important;
}

.p-2 {
  padding: 0.5rem !important;
}

.p-3 {
  padding: 0.75rem !important;
}

.p-4 {
  padding: 1rem !important;
}

.p-5 {
  padding: 1.5rem !important;
}

.p-6 {
  padding: 3rem !important;
}

.has-text-centered {
  text-align: center !important;
}

.is-lowercase {
  text-transform: lowercase !important;
}

.section {
  padding: 0.2rem 1.5rem;
}

@media screen and (min-width: 1024px) {
  .section {
    padding: 0.2rem 3rem;
  }

  .section.is-large {
    padding: 0.2rem 4rem;
  }
}</style>