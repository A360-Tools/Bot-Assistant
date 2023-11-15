# [Automation Anywhere A360 Assistant 🤖](https://chrome.google.com/webstore/detail/bot-assistant/bdnogmeijaanbgpnmbhlhmkfcbaoejcp)
<B>Bot Assistant helps ensure best practices are being followed for A360 bots by quickly providing an overview of issues in real-time.</B>

- Allows developers to proactively make changes before review. 💻
- Allows reviewers to quickly get a list of issues without going line by line. 👀
- Allows quick download of control room files without export for quick edit (e.g., .xlsx config files | select items > copy > click on the file name).
- Update bot content without export (also allows bot copying across control rooms, copy bot to/from the community edition without export).
- Bulk update package versions from the private workspace using Tools tab (select items > Update Package Version).
- Bulk copy files and folders in private workspace.
- Auto-refresh assistant on code save.
- Dynamic options based on active page.

## How to Use extension:
- Download from [chrome webstore](https://chrome.google.com/webstore/detail/bot-assistant/bdnogmeijaanbgpnmbhlhmkfcbaoejcp)
- Navigate to the A360 bot page (🔗public/private) and click the extension icon 🤖.
- Extension icon can be clicked to toggle bot assistant🤖, 📌pin extension, or assign a shortcut key for quick toggle.
- Bot assistant can also be dragged and collapsed/expanded 🌂.


## Extension Configuration ⚙️:
By default, all the checks are enabled with default values, these can be customized:

### Best Practices:
- Error Handling ⛔
- Comment 🗒️
- Step 🧱
- Runtime timeout ⌚
- Automation priority 🏎️
- Lines of code per task 🔢
- Number of variables per task 🔢

### Bot Actions:
- Empty Containers (Step, Try, Catch, If, Else, etc.) 🧱
- Disabled action 🔕
- Command outside Try-Catch ⛔
- Message Box 📟
- Debug breakpoint 🦽
- Hardcoded delay 🚧
- Code break (Pause task, Stop task) 🛑

### Bot Variables:
- Nonconstant variable with a hardcoded value 🔠
- Constant variable with a lowercase letter in the name 🔤
- Variable name minimum length 📏
- Input type variable Regex pattern 🔠🔢
- Output type variable name Regex pattern 🔠🔢
- Input + Output type variable name Regex pattern 🔠🔢
- Regular (Not Input + Not Output) type variable name Regex pattern 🔠🔢


## Project development setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
