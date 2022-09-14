const { ipcRenderer } = require('electron');

// Settings
interface SettingsTemplate {
    customTheme: boolean;
    docassets: boolean;
}
let settings: SettingsTemplate = {
    customTheme: true,
    docassets: false
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
        }
    });
    observer.observe(document.querySelector(".modals-container")!, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });

    // Evolution tree
    /*
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
    treeIcon.remove();
    sidePaneTop.appendChild(treeButtonContainer);

    // Evolution tree modal
    const treeStyle = document.createElement("style");
    document.head.appendChild(treeStyle);
    treeStyle.innerHTML = `.tree-content { border-radius: .75rem;--tw-shadow-color: 0,0,0;--tw-shadow: 0 25px 50px -12pxrgba(var(--tw-shadow-color), 0.25);-webkit-box-shadow: var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);box-shadow: var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);padding-top: .5rem;padding-bottom: .5rem;padding-left: .75rem;padding-right: .75rem;--tw-bg-opacity: 1;background-color: rgba(255,255,255,var(--tw-bg-opacity));--tw-border-opacity: 1;border-color: rgba(243,244,246,var(--tw-border-opacity));position: relative;display: flex;flex-direction: column;max-height: 90%;margin: 0 1rem;border: 1px solid;min-width: 20rem; }`;
    const treeDiv = document.createElement("div");
    document.getElementById("app")!.appendChild(treeDiv);
    treeDiv.outerHTML = `<div id="treeModal" style="z-index:1000" class="w-screen h-screen"></div>`;
    const treeModal = document.getElementById("treeModal") as HTMLDivElement;
    const treeContentDiv = document.createElement("div");
    treeModal.appendChild(treeContentDiv);
    treeContentDiv.outerHTML = `<div id="treeContent" class="modal-content"><img src="https://deeeep-reef-client.netlify.app/assets/evolution_tree.png" alt="Deeeep.io v4 beta evolution tree"></img></div>`;
    const treeContent = document.getElementById("treeContent") as HTMLDivElement;
*/
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

