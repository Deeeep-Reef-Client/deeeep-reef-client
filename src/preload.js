"use strict";
const { ipcRenderer } = require('electron');
let settings = {
    customTheme: true,
    docassets: false
};
ipcRenderer.on("settings", (_event, s) => {
    settings = s;
});
function saveSettings() {
    // console.log(settings);
    console.log("Settings saved!");
    ipcRenderer.send("saveSettings", settings);
}
// Prevent starting RPC when game already started
let gameStarted = false;
window.addEventListener("load", () => {
    // Custom stylesheet
    const customTheme = document.createElement("link");
    customTheme.rel = "stylesheet";
    customTheme.type = "text/css";
    customTheme.setAttribute("id", "customThemeStyle");
    customTheme.href = settings.customTheme ? "https://deeeep-reef-client.netlify.app/assets/customtheme.css" : '';
    document.head.appendChild(customTheme);
    // Custom Settings
    // Watch for settings pane opened
    const observer = new MutationObserver((mutations) => {
        if (document.contains(document.querySelector(".vfm__content, .modal-content"))) {
            observer.disconnect();
            const graphicsPane = document.querySelector("#pane-0 > .el-form");
            // Custom Theme
            const customThemeSetting = graphicsPane.childNodes[2].cloneNode(true);
            const customThemeName = customThemeSetting.querySelector(".el-form-item__label");
            const customThemeDesc = customThemeSetting.querySelector(".notes");
            const customThemeCheckbox = customThemeSetting.querySelector(".el-checkbox__input > input");
            customThemeName.setAttribute("id", "customThemeName");
            customThemeName.innerText = "Theme";
            customThemeDesc.innerText = "Custom reef theme";
            if (settings.customTheme) {
                customThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                customThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            customThemeCheckbox.addEventListener("click", () => {
                if (settings.customTheme) {
                    settings.customTheme = false;
                    customThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    document.getElementById("customThemeStyle").setAttribute("href", '');
                }
                else {
                    settings.customTheme = true;
                    customThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                    document.getElementById("customThemeStyle").setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/customtheme.css");
                }
                ;
                saveSettings();
            });
            graphicsPane.appendChild(customThemeSetting);
            // Docassets
            const docassetsSetting = graphicsPane.childNodes[2].cloneNode(true);
            const docassetsName = docassetsSetting.querySelector(".el-form-item__label");
            const docassetsDesc = docassetsSetting.querySelector(".notes");
            const docassetsCheckbox = docassetsSetting.querySelector(".el-checkbox__input > input");
            docassetsName.setAttribute("id", "docassetsName");
            docassetsName.innerText = "Docassets";
            docassetsDesc.innerText = "An asset pack made by Doctorpus";
            if (settings.docassets) {
                docassetsSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                docassetsSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            docassetsCheckbox.addEventListener("click", () => {
                if (settings.docassets) {
                    settings.docassets = false;
                    docassetsSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    new Notification("Settings updated!", {
                        body: "Please restart the client for your changes to take effect."
                    });
                }
                else {
                    settings.docassets = true;
                    docassetsSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                    new Notification("Settings updated!", {
                        body: "Please restart the client for your changes to take effect."
                    });
                }
                ;
                saveSettings();
            });
            graphicsPane.appendChild(docassetsSetting);
        }
    });
    observer.observe(document.querySelector(".modals-container"), {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    // Watch for match start
    const btn = document.querySelector(".play");
    btn.addEventListener("click", () => {
        if (gameStarted)
            return;
        const element = document.getElementById("app");
        // Wait until game finished loading to log URL for RPC
        const openObserver = new MutationObserver((mutations) => {
            if (document.contains(document.querySelector(".playing"))) {
                gameStarted = true;
                openObserver.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: document.querySelector('.block, .modes').querySelector('.selected').querySelector('.name').innerText,
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
                const closeObserver = new MutationObserver((mutations) => {
                    if (document.contains(document.querySelector(".death-reason")))
                        onGameEnd();
                    mutations.forEach((mutation) => {
                        mutation.removedNodes.forEach((removedNode) => {
                            if (removedNode.className == "game")
                                onGameEnd();
                        });
                    });
                });
                closeObserver.observe(element, {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                });
            }
        });
        openObserver.observe(element, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    });
});
