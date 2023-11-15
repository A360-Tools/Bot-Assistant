<template>
    <div class="assistant__list__group-container">
        <button type="button" class="assistant__list__group" tabindex="0" @click="updatePackageVersions()" :class="{
            'btn-disable': selectedEditableTaskFiles.length == 0,
        }">
            <div class="assistant__list__group__icon">
                <span class="icon icon--image aa-icon-color icon--animate-none"></span>
                <img class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/update.svg"
                    style="width: 32px; height: 24px; font-size: 16px" title="Click to expand" />
            </div>
            <div class="assistant__list__group__label">
                Update Package Version [{{ checkedItemsId.length }}]
            </div>
        </button>
        <div v-if="!updateInProgress">
            <button type="button" class="assistant__list__group" tabindex="0" @click="showFileList = !showFileList">
                <div class="assistant__list__group__icon">
                    <span class="icon icon--image aa-icon-color icon--animate-none"></span>
                    <img v-if="showFileList" class="taskbotnodeicon taskbotnodeicon--theme-default"
                        src="../assets/collapse.svg" style="width: 16px; height: 16px; font-size: 16px"
                        title="Click to collapse" />
                    <img v-else class="taskbotnodeicon taskbotnodeicon--theme-default" src="../assets/expand.svg"
                        style="width: 16px; height: 16px; font-size: 16px" title="Click to expand" />
                </div>

                <div class="assistant__list__group__label">Editable Task Bots</div>

                <div class="assistant__list__group__count">
                    &nbsp;({{ selectedEditableTaskFiles.length }})
                </div>
            </button>
            <div class="assistant__list__group_children" v-show="showFileList">
                <button v-for="file in selectedEditableTaskFiles" :key="file" type="button" class="
              assistant__list__option
              assistant__list__option--icon
            ">
                    <span class="assistant__list__option__label text-overflow" :title="file.path">{{ file.name }}
                    </span>
                </button>
            </div>
        </div>
        <div v-else>
            <h3>Updating Packages...</h3>
            <LoadingPage />
        </div>
        <div id="snackbar" :class="{ show: showToast }">{{ saveMessage }}</div>
    </div>
</template>
  
<script>
import LoadingPage from "./Loading-Page.vue";
export default {
    components: {
        LoadingPage,
    },
    props: {
        folderContentJSON: {
            type: Object,
            default: () => { },
        },
    },
    data() {
        return {
            showFileList: true,
            checkedItemsId: [],
            updateInProgress: false,
            showToast: false,
            saveMessage: null,
        };
    },
    mounted() {
        let vm = this;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const port = chrome.tabs.connect(tabs[0].id, {
                name: "frame",
            });
            port.onMessage.addListener((msg) => {
                if (msg.type === "DATA_ROW_CHANGE" && msg.data != undefined) {
                    vm.checkedItemsId = msg.data;
                }
                if (msg.type === "SET_ROW_ITEMS" && msg.data != undefined) {
                    vm.checkedItemsId = msg.data;
                }
            });

            port.postMessage({
                type: "GET_ROW_ITEMS",
            });

        });
    },
    methods: {
        reloadPage() {
            window.location.reload();
        },

        updatePackageVersions() {
            let vm = this;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const port = chrome.tabs.connect(tabs[0].id, {
                    name: "frame",
                });

                const fileIDs = vm.selectedEditableTaskFiles.map(file => file.id);
                port.postMessage({
                    type: "UPDATE_PACKAGES",
                    fileIds: fileIDs
                });
                vm.updateInProgress = true;
                port.onMessage.addListener((msg) => {
                    if (msg.type === "PACKAGES_UPDATED") {
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
        },

    },
    computed: {
        selectedEditableTaskFiles() {
            const taskBotMIMEType = "application/vnd.aa.taskbot";
            let vm = this;
            let files = vm.folderContentJSON["list"].filter(function (item) {
                return (
                    vm.checkedItemsId.includes(item.id)
                    && item.type == taskBotMIMEType
                    && (item.botStatus == "CHECKED_OUT" || item.botStatus == "NEW")
                );
            });
            return files;
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