const { ipcRenderer } = require('electron');

// Settings
interface SettingsTemplate {
    customTheme: boolean;
    docassets: boolean;
    v3ui: boolean;
}
let settings: SettingsTemplate = {
    customTheme: true,
    docassets: false,
    v3ui: false
};
ipcRenderer.on("settings", (_event: Event, s: SettingsTemplate) => {
    settings = s;
})

function saveSettings() {
    console.log("Settings saved!");
    ipcRenderer.send("saveSettings", settings);
}

// Prevent starting RPC when game already started
let gameStarted = false;

window.addEventListener("DOMContentLoaded", () => {

    // Custom stylesheet
    const customTheme = document.createElement("link");
    customTheme.rel = "stylesheet";
    customTheme.type = "text/css";
    customTheme.setAttribute("id", "customThemeStyle");
    customTheme.href = settings.customTheme ? "https://deeeep-reef-client.netlify.app/assets/customtheme.css" : '';
    document.head.appendChild(customTheme);

    // V3 UI
    const v3uiStyle = document.createElement("link");
    v3uiStyle.rel = "stylesheet";
    v3uiStyle.type = "text/css";
    v3uiStyle.setAttribute("id", "v3uiStyle");
    v3uiStyle.href = settings.v3ui ? "https://deeeep-reef-client.netlify.app/assets/v3ui.css" : '';
    document.head.appendChild(v3uiStyle);

    // Custom Settings
    // Watch for settings pane opened
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
        if (document.contains(document.getElementById("customThemeName"))) return;
        if (document.contains(document.querySelector(".vfm__content, .modal-content"))) {

            const graphicsPane = document.querySelector("#pane-0 > .el-form");

            // Custom Theme
            const customThemeSetting = graphicsPane!.childNodes[2].cloneNode(true) as HTMLDivElement;
            const customThemeName = customThemeSetting.querySelector(".el-form-item__label") as HTMLDivElement;
            const customThemeDesc = customThemeSetting.querySelector(".notes") as HTMLSpanElement;
            const customThemeCheckbox = customThemeSetting.querySelector(".el-checkbox__input > input") as HTMLInputElement;
            customThemeName!.setAttribute("id", "customThemeName");
            customThemeName!.innerText = "Theme";
            customThemeDesc!.innerText = "Custom reef theme";
            if (settings.customTheme) {
                customThemeSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
            } else {
                customThemeSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
            }
            customThemeCheckbox.addEventListener("click", () => {
                if (settings.customTheme) {
                    settings.customTheme = false;
                    customThemeSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
                    document.getElementById("customThemeStyle")!.setAttribute("href", '');
                } else {
                    settings.customTheme = true;
                    customThemeSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
                    document.getElementById("customThemeStyle")!.setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/customtheme.css");
                };
                saveSettings();
            });
            graphicsPane!.appendChild(customThemeSetting);

            // Docassets
            const docassetsSetting = graphicsPane!.childNodes[2].cloneNode(true) as HTMLDivElement;
            const docassetsName = docassetsSetting.querySelector(".el-form-item__label") as HTMLDivElement;
            const docassetsDesc = docassetsSetting.querySelector(".notes") as HTMLSpanElement;
            const docassetsCheckbox = docassetsSetting.querySelector(".el-checkbox__input > input") as HTMLInputElement;
            docassetsName!.setAttribute("id", "docassetsName");
            docassetsName!.innerText = "Docassets";
            docassetsDesc!.innerText = "An asset pack made by Doctorpus";
            if (settings.docassets) {
                docassetsSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
            } else {
                docassetsSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
            }
            docassetsCheckbox.addEventListener("click", () => {
                if (settings.docassets) {
                    settings.docassets = false;
                    docassetsSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
                    new Notification("Settings updated!", {
                        body: "Please restart the client for your changes to take effect."
                    });
                } else {
                    settings.docassets = true;
                    docassetsSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
                    new Notification("Settings updated!", {
                        body: "Please restart the client for your changes to take effect."
                    });
                };
                saveSettings();
            });
            graphicsPane!.appendChild(docassetsSetting);

            // V3 UI
            const v3uiSetting = graphicsPane!.childNodes[2].cloneNode(true) as HTMLDivElement;
            const v3uiName = v3uiSetting.querySelector(".el-form-item__label") as HTMLDivElement;
            const v3uiDesc = v3uiSetting.querySelector(".notes") as HTMLSpanElement;
            const v3uiCheckbox = v3uiSetting.querySelector(".el-checkbox__input > input") as HTMLInputElement;
            v3uiName!.setAttribute("id", "v3uiName");
            v3uiName!.innerText = "V3 UI";
            v3uiDesc!.innerText = "Brings back the v3 boost and XP bar";
            if (settings.v3ui) {
                v3uiSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
            } else {
                v3uiSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
            }
            v3uiCheckbox.addEventListener("click", () => {
                if (settings.v3ui) {
                    settings.v3ui = false;
                    v3uiSetting.querySelector(".el-checkbox__input")!.classList.remove("is-checked");
                    document.getElementById("v3uiStyle")!.setAttribute("href", '');
                } else {
                    settings.v3ui = true;
                    v3uiSetting.querySelector(".el-checkbox__input")!.classList.add("is-checked");
                    document.getElementById("v3uiStyle")!.setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/v3ui.css");
                };
                saveSettings();
            });
            graphicsPane!.appendChild(v3uiSetting);
        }
    });
    observer.observe(document.querySelector(".modals-container")!, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });

    // Evolution tree button
    const sidePaneTop = document.querySelector("div.p-2.sidebar.right.space-y-2 > .container > div.el-row.justify-center") as HTMLDivElement;
    const treeButtonContainer = sidePaneTop!.querySelector("div")!.cloneNode(true) as HTMLDivElement;
    const treeButton = treeButtonContainer.firstElementChild as HTMLButtonElement;
    const treeName = treeButton!.querySelector("span > span.inner") as HTMLSpanElement;
    const treeIcon = treeButton!.querySelector("span > svg") as HTMLElement;
    treeButton!.classList.remove("pink");
    treeButton!.classList.add("black");
    treeName!.innerText = "Tree";
    treeIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-diagram-3-fill" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1z"/>
  </svg>`;
    sidePaneTop.appendChild(treeButtonContainer);

    // Evolution tree modal
    const treeStyle = document.createElement("style");
    treeStyle.innerHTML = `.tree-title{margin-bottom:.5rem;margin-right:1rem;text-align:center;display:flex;align-items:center;justify-content:space-between;font-size:1.3rem;line-height:1.2em;font-weight:300;z-index:1}.dark .tree-title{color:rgba(229,231,235,1)}.tree-content{flex-grow:1;overflow-y:auto;height:100%;display:flex;justify-content:center}.tree-close{position:absolute;top:.3rem;right:.5rem}`;
    document.head.appendChild(treeStyle);
    const treeDiv = document.createElement("div");
    document.getElementById("app")!.appendChild(treeDiv);
    treeDiv.outerHTML = `<div id="treeModal" style="z-index:10000" class="vfm__content modal-content">
    <span class="tree-title">
        <div></div>
        <div class="justify-self-center">Evolution Tree</div>
        <div></div>
    </span>
    <div class="tree-content">
        <img src="https://deeeep-reef-client.netlify.app/assets/evolution_tree.png"
            alt="Deeeep.io v4 beta evolution tree">
    </div>
    <button id="treeCloseButton" class="tree-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24"
            class="svg-icon" color="gray"
            style="--sx:1; --sy:1; --r:0deg;">
            <path
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
            ></path>
        </svg></button>
</div>
`;
    const treeModal = document.getElementById("treeModal");
    const treeCloseButton = document.getElementById("treeCloseButton");
    // Tree button onclick
    treeButton.addEventListener("click", () => {
        treeModal!.classList.toggle("tree-hidden");
    });
    treeCloseButton!.addEventListener("click", () => {
        treeModal!.classList.toggle("tree-hidden");
    });

    // Watch for match start
    const btn = document.querySelector(".play");
    btn!.addEventListener("click", () => {
        if (gameStarted) return;
        const element = document.getElementById("app");

        // Wait until game finished loading to log URL for RPC
        const openObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (document.contains(document.querySelector(".playing"))) {
                gameStarted = true;
                openObserver.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: (document.querySelector('.block, .modes')!.querySelector('.selected')!.querySelector('.name') as HTMLElement)!.innerText,
                    url: window.location.href
                });

                // Function to be caled when game ends
                function onGameEnd() {
                    gameStarted = false;
                    closeObserver.disconnect();
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                }

                // Watch for game end
                const closeObserver = new MutationObserver((mutations: MutationRecord[]) => {
                    if (document.contains(document.querySelector(".death-reason"))) onGameEnd();
                    mutations.forEach((mutation: MutationRecord) => {
                        mutation.removedNodes.forEach((removedNode: Node) => {
                            if ((removedNode as HTMLElement)!.className == "game") onGameEnd();
                        });
                    });
                });
                closeObserver.observe(element!, {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                });

            }
        });
        openObserver.observe(element!, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    })
})

