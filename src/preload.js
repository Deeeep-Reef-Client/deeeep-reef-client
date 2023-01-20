"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { ipcRenderer, app, contextBridge } = require('electron');
const Filter = require('bad-words');
const cssjs = require('jotform-css.js');
const fs = require('fs');
// Maintain compatibility when update
let API_URL = "";
if (window.location.hostname.startsWith("beta")) {
    API_URL = "https://apibeta.deeeep.io";
}
else {
    API_URL = "https://api.deeeep.io";
}
// expose IPC to main world
contextBridge.exposeInMainWorld('electronAPI', {
    ipcRenderer
});
let settings = {
    customTheme: true,
    docassets: false,
    v3ui: true,
    assetSwapper: true,
    assetSwapperConfig: [],
    lightTheme: false,
    userTheme: true,
    userThemeData: [],
    pluginsData: [],
    adBlocker: true,
    viewingGhosts: true,
    advancedProfanityFilter: true,
    gameName: "",
    gameAccounts: [],
    developer: false
};
ipcRenderer.on("settings", (_event, s) => {
    Object.assign(settings, s);
});
function saveSettings() {
    console.log(settings);
    console.log("Settings saved!");
    ipcRenderer.send("saveSettings", settings);
}
// Prevent starting RPC when game already started
let gameStarted = false;
// expose needed APIs
// profanity filter
const profanityFilter = new Filter();
profanityFilter.addWords("test");
// IDK what happened but this is to prevent a bug from happening
let reloadCustomTheme = () => { };
window.addEventListener("DOMContentLoaded", () => {
    var _a;
    // DRC
    const clientVersion = document.querySelector(".client-version");
    /// @REMIND Update client version
    clientVersion.innerText = clientVersion.innerText + ", DRC v0.9.1b";
    // devtools
    window.addEventListener("keydown", (key) => {
        if (key.code == "F12") {
            ipcRenderer.send("openDevTools");
        }
    });
    // warn if code updated
    const indexScriptTag = document.querySelector("script[src^=\\/assets\\/index\\.]");
    fetch("https://deeeep-reef-client.github.io/modded-assets/misc/" +
        ((_a = indexScriptTag === null || indexScriptTag === void 0 ? void 0 : indexScriptTag.getAttribute("src")) !== null && _a !== void 0 ? _a : "/assets/index.js").replace("/assets/", ""))
        .then(response => {
        if (!response.ok)
            throw new Error();
        else
            console.log("Index.js OK");
    })
        .catch(e => {
        new Notification("Some features temporarily not available", {
            body: "Due to Deeeep.io's code being updated (which is outside our control), some features may not work until the Client is updated to reflect these changes."
        });
    });
    // Custom stylesheet
    const customTheme = document.createElement("link");
    customTheme.rel = "stylesheet";
    customTheme.type = "text/css";
    customTheme.setAttribute("id", "customThemeStyle");
    customTheme.href = settings.customTheme ? "https://deeeep-reef-client.netlify.app/assets/customtheme.css" : '';
    document.head.appendChild(customTheme);
    const userTheme = document.createElement("style");
    userTheme.setAttribute("id", "userThemeStyle");
    document.head.appendChild(userTheme);
    reloadCustomTheme = () => {
        function loadActiveCustomTheme() {
            customTheme.href = "";
            userTheme.innerHTML = "";
            if (settings.userThemeData.length == 0)
                return;
            let userStyle = "";
            for (let i in settings.userThemeData) {
                if (settings.userThemeData[i].active) {
                    userStyle = settings.userThemeData[i].src;
                    break;
                }
            }
            userTheme.innerHTML = userStyle;
        }
        if (settings.customTheme) {
            if (settings.userTheme) {
                let hasActive;
                for (let i in settings.userThemeData) {
                    if (settings.userThemeData[i].active) {
                        hasActive = true;
                        break;
                    }
                }
                if (hasActive) {
                    document.getElementById("customThemeStyle").setAttribute("href", "");
                    loadActiveCustomTheme();
                }
                else {
                    userTheme.innerHTML = "";
                    document.getElementById("customThemeStyle").setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/customtheme.css");
                }
            }
            else {
                userTheme.innerHTML = "";
                document.getElementById("customThemeStyle").setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/customtheme.css");
            }
        }
        else {
            document.getElementById("customThemeStyle").setAttribute("href", "");
            if (settings.userTheme)
                loadActiveCustomTheme();
            else {
                userTheme.innerHTML = "";
            }
            ;
        }
        ;
    };
    reloadCustomTheme();
    // Light Theme
    if (settings.lightTheme) {
        document.getElementsByTagName("html")[0].classList.remove("dark");
        document.getElementsByTagName("html")[0].classList.add("light");
    }
    else {
        document.getElementsByTagName("html")[0].classList.add("dark");
        document.getElementsByTagName("html")[0].classList.remove("light");
    }
    // V3 UI
    const v3uiStyle = document.createElement("link");
    v3uiStyle.rel = "stylesheet";
    v3uiStyle.type = "text/css";
    v3uiStyle.setAttribute("id", "v3uiStyle");
    v3uiStyle.href = settings.v3ui ? "https://deeeep-reef-client.netlify.app/assets/v3ui.css" : '';
    document.head.appendChild(v3uiStyle);
    // Custom Settings
    // Watch for settings pane opened
    const observer = new MutationObserver((mutations) => {
        if (document.contains(document.getElementById("customThemeName")))
            return;
        if (document.contains(document.querySelector(".vfm__content, .modal-content"))) {
            const graphicsPane = document.querySelector("#pane-0 > .el-form");
            const chatPane = document.querySelector("#pane-1 > .el-form");
            const generalPane = document.querySelector("#pane-2 > .el-form");
            // Graphics Settings
            // Custom Theme
            const customThemeSetting = graphicsPane.childNodes[2].cloneNode(true);
            const customThemeName = customThemeSetting.querySelector(".el-form-item__label");
            const customThemeDesc = customThemeSetting.querySelector(".notes");
            const customThemeCheckbox = customThemeSetting.querySelector(".el-checkbox__input > input");
            customThemeName.setAttribute("id", "customThemeName");
            customThemeName.innerText = "Reef Theme";
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
                }
                else {
                    settings.customTheme = true;
                    customThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
                reloadCustomTheme();
            });
            graphicsPane.appendChild(customThemeSetting);
            // Custom Theme
            const userThemeSetting = graphicsPane.childNodes[2].cloneNode(true);
            const userThemeName = userThemeSetting.querySelector(".el-form-item__label");
            const userThemeDesc = userThemeSetting.querySelector(".notes");
            const userThemeCheckbox = userThemeSetting.querySelector(".el-checkbox__input > input");
            userThemeName.setAttribute("id", "userThemeName");
            userThemeName.innerText = "Custom Theme";
            userThemeDesc.innerText = "Custom user themes. Overrides the Reef Theme";
            if (settings.userTheme) {
                userThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                userThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            userThemeCheckbox.addEventListener("click", () => {
                if (settings.userTheme) {
                    settings.userTheme = false;
                    userThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                }
                else {
                    settings.userTheme = true;
                    userThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
                reloadCustomTheme();
            });
            graphicsPane.appendChild(userThemeSetting);
            // Light Theme
            const lightThemeSetting = graphicsPane.childNodes[2].cloneNode(true);
            const lightThemeName = lightThemeSetting.querySelector(".el-form-item__label");
            const lightThemeDesc = lightThemeSetting.querySelector(".notes");
            const lightThemeCheckbox = lightThemeSetting.querySelector(".el-checkbox__input > input");
            lightThemeName.setAttribute("id", "lightThemeName");
            lightThemeName.innerText = "Light Theme";
            lightThemeDesc.innerText = "Toggles light theme";
            if (settings.lightTheme) {
                lightThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                lightThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            lightThemeCheckbox.addEventListener("click", () => {
                if (settings.lightTheme) {
                    settings.lightTheme = false;
                    lightThemeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    document.getElementsByTagName("html")[0].classList.add("dark");
                    document.getElementsByTagName("html")[0].classList.remove("light");
                }
                else {
                    settings.lightTheme = true;
                    lightThemeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                    document.getElementsByTagName("html")[0].classList.remove("dark");
                    document.getElementsByTagName("html")[0].classList.add("light");
                }
                ;
                saveSettings();
            });
            graphicsPane.appendChild(lightThemeSetting);
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
            // V3 UI
            const v3uiSetting = graphicsPane.childNodes[2].cloneNode(true);
            const v3uiName = v3uiSetting.querySelector(".el-form-item__label");
            const v3uiDesc = v3uiSetting.querySelector(".notes");
            const v3uiCheckbox = v3uiSetting.querySelector(".el-checkbox__input > input");
            v3uiName.setAttribute("id", "v3uiName");
            v3uiName.innerText = "V3 UI";
            v3uiDesc.innerText = "Brings back the v3 boost and XP bar";
            if (settings.v3ui) {
                v3uiSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                v3uiSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            v3uiCheckbox.addEventListener("click", () => {
                if (settings.v3ui) {
                    settings.v3ui = false;
                    v3uiSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    document.getElementById("v3uiStyle").setAttribute("href", '');
                }
                else {
                    settings.v3ui = true;
                    v3uiSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                    document.getElementById("v3uiStyle").setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/v3ui.css");
                }
                ;
                saveSettings();
            });
            graphicsPane.appendChild(v3uiSetting);
            // Adblocker
            const adBlockerSetting = graphicsPane.childNodes[2].cloneNode(true);
            const adBlockerName = adBlockerSetting.querySelector(".el-form-item__label");
            const adBlockerDesc = adBlockerSetting.querySelector(".notes");
            const adBlockerCheckbox = adBlockerSetting.querySelector(".el-checkbox__input > input");
            adBlockerName.setAttribute("id", "adBlockerName");
            adBlockerName.innerText = "Adblocker";
            adBlockerDesc.innerText = "Blocks advertisements";
            if (settings.adBlocker) {
                adBlockerSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                adBlockerSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            adBlockerCheckbox.addEventListener("click", () => {
                new Notification("Settings updated!", {
                    body: "Please restart the client for your changes to take effect."
                });
                if (settings.adBlocker) {
                    settings.adBlocker = false;
                    adBlockerSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                }
                else {
                    settings.adBlocker = true;
                    adBlockerSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
                reloadCustomTheme();
            });
            graphicsPane.appendChild(adBlockerSetting);
            // Viewing Ghosts
            const viewingGhostsSetting = graphicsPane.childNodes[2].cloneNode(true);
            const viewingGhostsName = viewingGhostsSetting.querySelector(".el-form-item__label");
            const viewingGhostsDesc = viewingGhostsSetting.querySelector(".notes");
            const viewingGhostsCheckbox = viewingGhostsSetting.querySelector(".el-checkbox__input > input");
            viewingGhostsName.setAttribute("id", "viewingGhostsName");
            viewingGhostsName.innerText = "Viewing Ghosts";
            viewingGhostsDesc.innerText = "Toggles whether you see Ghosts (spectators)";
            if (settings.viewingGhosts) {
                viewingGhostsSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                viewingGhostsSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            viewingGhostsCheckbox.addEventListener("click", () => {
                if (settings.viewingGhosts) {
                    settings.viewingGhosts = false;
                    viewingGhostsSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                }
                else {
                    settings.viewingGhosts = true;
                    viewingGhostsSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                if (gameStarted) {
                    ipcRenderer.send("evalInBrowserContext", `
                        game.currentScene.viewingGhosts = ${settings.viewingGhosts};
                    `);
                }
                saveSettings();
            });
            graphicsPane.appendChild(viewingGhostsSetting);
            // Chat Settings
            // Advanced Profanity Filter
            const advancedProfanityFilterSetting = chatPane.childNodes[1].cloneNode(true);
            const advancedProfanityFilterName = advancedProfanityFilterSetting.querySelector(".el-form-item__label");
            const advancedProfanityFilterCheckbox = advancedProfanityFilterSetting.querySelector(".el-checkbox__input > input");
            advancedProfanityFilterName.setAttribute("id", "advancedProfanityFilterName");
            advancedProfanityFilterName.innerText = "Advanced Profanity Filter";
            if (settings.advancedProfanityFilter) {
                advancedProfanityFilterSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                advancedProfanityFilterSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            advancedProfanityFilterCheckbox.addEventListener("click", () => {
                if (settings.advancedProfanityFilter) {
                    settings.advancedProfanityFilter = false;
                    advancedProfanityFilterSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                }
                else {
                    settings.advancedProfanityFilter = true;
                    advancedProfanityFilterSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
            });
            chatPane.appendChild(advancedProfanityFilterSetting);
            // General Settings
            // Developer Mode
            const developerModeSetting = graphicsPane.childNodes[2].cloneNode(true);
            const developerModeName = developerModeSetting.querySelector(".el-form-item__label");
            const developerModeDesc = developerModeSetting.querySelector(".notes");
            const developerModeCheckbox = developerModeSetting.querySelector(".el-checkbox__input > input");
            developerModeName.setAttribute("id", "developerModeName");
            developerModeName.innerText = "Developer";
            developerModeDesc.innerText = "Toggles Developer Mode";
            if (settings.developer) {
                developerModeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                developerModeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            developerModeCheckbox.addEventListener("click", () => {
                if (settings.developer) {
                    settings.developer = false;
                    developerModeSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                }
                else {
                    settings.developer = true;
                    developerModeSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
            });
            generalPane.appendChild(developerModeSetting);
        }
    });
    observer.observe(document.querySelector(".modals-container"), {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    // Save name
    document.querySelector("div.name-input > div.el-input__wrapper > input.el-input__inner").addEventListener("change", (e) => {
        settings.gameName = e.target.value;
        saveSettings();
    });
    if (settings.gameName === undefined) {
        settings.gameName = "";
        saveSettings();
    }
    document.querySelector("div.name-input > div.el-input__wrapper > input.el-input__inner").value = settings.gameName;
    // misc styles
    const miscStyles = document.createElement("style");
    miscStyles.innerHTML = `
    .spacer {
        width: 10px;
        height: 10px;
    }
    .hw-spacer{
        width: 5px;
        height: 10px;
    }
    `;
    document.head.appendChild(miscStyles);
    // Account swapper modal
    const accountsDiv = document.createElement("div");
    document.getElementById("app").appendChild(accountsDiv);
    accountsDiv.outerHTML = `
    <div id="accountsModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div id="accountsContainer" class="drc-modal-container">
        <div id="accountsModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Accounts</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <p>Logged in accounts are automatically saved.</p>
                <div class="spacer"></div>
                <div id="accountsList"></div>
            </div>
            <button id="accountsCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
    `;
    const accountsList = document.getElementById("accountsList");
    function updateAccountsList() {
        accountsList.innerHTML = "";
        for (let i in settings.gameAccounts) {
            const username = settings.gameAccounts[i].username;
            const password = settings.gameAccounts[i].password;
            const mainElem = document.createElement("div");
            mainElem.classList.add("assetswapper-list-rule");
            // login button
            const autoLoginElem = document.createElement("button");
            autoLoginElem.classList.add("assetswapper-new-button");
            autoLoginElem.innerText = "Login";
            autoLoginElem.addEventListener("click", () => {
                const usernameField = document.querySelector("div.modal__content > div.text-center > form.el-form > div.el-form-item input.el-input__inner[type='text']");
                const passwordField = document.querySelector("div.modal__content > div.text-center > form.el-form > div.el-form-item input.el-input__inner[type='password']");
                accountsModalContainer.classList.toggle("drc-modal-hidden");
                usernameField.value = username.slice(0, -1);
                usernameField.focus();
                ipcRenderer.send("sendKeyPress", username.slice(-1));
                usernameField.addEventListener("keyup", () => {
                    passwordField.value = password.slice(0, -1);
                    passwordField.focus();
                    ipcRenderer.send("sendKeyPress", password.slice(-1));
                    passwordField.addEventListener("keyup", () => {
                        document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.green").dispatchEvent(new MouseEvent("click"));
                    });
                });
            });
            mainElem.appendChild(autoLoginElem);
            // username
            const usernameElem = document.createElement("p");
            usernameElem.innerText = settings.gameAccounts[i].username;
            mainElem.appendChild(usernameElem);
            const spacer1 = document.createElement("div");
            spacer1.classList.add("spacer");
            mainElem.appendChild(spacer1);
            // password
            const passwordElem = document.createElement("p");
            passwordElem.innerText = settings.gameAccounts[i].password[0] + "****";
            mainElem.appendChild(passwordElem);
            const spacer3 = document.createElement("div");
            spacer3.classList.add("spacer");
            mainElem.appendChild(spacer3);
            // Delete button
            const deleteElem = document.createElement("button");
            deleteElem.classList.add("assetswapper-new-button");
            deleteElem.innerText = "Remove";
            deleteElem.addEventListener("click", () => {
                settings.gameAccounts = settings.gameAccounts.filter(acc => acc != settings.gameAccounts[i]);
                saveSettings();
                updateAccountsList();
            });
            mainElem.appendChild(deleteElem);
            accountsList.appendChild(mainElem);
            const spacer4 = document.createElement("div");
            spacer4.classList.add("spacer");
            accountsList.appendChild(spacer4);
        }
    }
    updateAccountsList();
    const accountsModalContainer = document.getElementById("accountsModalContainer");
    const accountsCloseButton = document.getElementById("accountsCloseButton");
    accountsCloseButton.addEventListener("click", () => {
        accountsModalContainer.classList.toggle("drc-modal-hidden");
    });
    // Account swapper
    const userWidget = document.querySelector("div.user-widget");
    function accountOnLogin() {
        const loginObserver = new MutationObserver((mutations) => {
            if (!document.contains(document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.gray")))
                return;
            loginObserver.disconnect();
            const routeModalActions = document.getElementById("routeModalActions");
            // switch account button
            const swapAccountButton = document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.gray").cloneNode(true);
            swapAccountButton.querySelector("span[class] > span.inner").innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
      <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
    </svg>
                `;
            routeModalActions.insertBefore(swapAccountButton, routeModalActions.childNodes[2]);
            swapAccountButton.addEventListener("click", () => {
                accountsModalContainer.classList.toggle("drc-modal-hidden");
            });
            function saveAccount() {
                const username = document.querySelector("div.modal__content > div.text-center > form.el-form > div.el-form-item input.el-input__inner[type='text']").value || undefined;
                const password = document.querySelector("div.modal__content > div.text-center > form.el-form > div.el-form-item input.el-input__inner[type='password']").value || undefined;
                if (username == undefined || password == undefined)
                    return;
                settings.gameAccounts = settings.gameAccounts.filter((acc) => {
                    return acc.username.toLowerCase() != username.toLowerCase();
                });
                settings.gameAccounts.push({
                    username, password
                });
                saveSettings();
                updateAccountsList();
            }
            document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.green").addEventListener("click", saveAccount);
            window.addEventListener("keydown", (key) => {
                if (key.key != "Enter")
                    return;
                saveAccount();
            });
        });
        loginObserver.observe(document.getElementById("app"), {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    }
    const userWidgetObserver = new MutationObserver((mutations) => {
        if (!document.contains(userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon")))
            return;
        userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon").addEventListener("click", accountOnLogin);
    });
    userWidgetObserver.observe(userWidget, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    if (document.contains(userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon"))) {
        userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon").addEventListener("click", accountOnLogin);
    }
    /*
    setInterval(() => {
        userWidget?.querySelector("button.el-button.btn.nice-button.blue.has-icon")!.addEventListener("click", accountOnLogin);
    }, 300);
    */
    // Forum Notifications
    let badgeCount = 0;
    let forumNotificationCount = 0;
    let friendRequestCount = 0;
    function checkForumNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', "https://apibeta.deeeep.io/forumNotifications/count");
            xhr.withCredentials = true;
            xhr.addEventListener("load", (_event) => {
                const forumNotifications = JSON.parse(xhr.response);
                if (forumNotifications.statusCode !== undefined && forumNotifications.statusCode === 403)
                    return;
                if (forumNotifications.count !== forumNotificationCount) {
                    new Notification("New forum notification", {
                        body: "You received a new Forum notification."
                    });
                }
                forumNotificationCount = forumNotifications.count;
                badgeCount = friendRequestCount + forumNotificationCount;
                ipcRenderer.send("update-badge", badgeCount || null);
            });
            xhr.send();
        });
    }
    checkForumNotifications();
    setInterval(checkForumNotifications, 60000);
    // Friend requests
    function checkFriendRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', "https://apibeta.deeeep.io/friendRequests/count");
            xhr.withCredentials = true;
            xhr.addEventListener("load", (_event) => {
                const friendRequests = JSON.parse(xhr.response);
                if (friendRequests.statusCode !== undefined && friendRequests.statusCode === 403)
                    return;
                if (friendRequests.count !== friendRequestCount) {
                    new Notification("New friend request", {
                        body: "You received a new friend request."
                    });
                }
                friendRequestCount = friendRequests.count;
                badgeCount = friendRequestCount + forumNotificationCount;
                ipcRenderer.send("update-badge", badgeCount || null);
            });
            xhr.send();
        });
    }
    checkFriendRequests();
    setInterval(checkFriendRequests, 60000);
    // Evolution tree button
    const sidePaneTop = document.querySelector("div.p-2.sidebar.right.space-y-2 > .container > div.el-row.justify-center");
    const treeButtonContainer = sidePaneTop.querySelector("div").cloneNode(true);
    const treeButton = treeButtonContainer.firstElementChild;
    const treeName = treeButton.querySelector("span > span.inner");
    const treeIcon = treeButton.querySelector("span > svg");
    treeButton.classList.remove("pink");
    treeButton.classList.add("blue");
    treeName.innerText = "Tree";
    treeIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-diagram-3-fill" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1z"/>
  </svg>`;
    sidePaneTop.appendChild(treeButtonContainer);
    // Evolution tree modal
    const treeStyle = document.createElement("style");
    treeStyle.innerHTML = `.drc-modal-title {
        margin-bottom: .5rem;
        margin-right: 1rem;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 1.3rem;
        line-height: 1.2em;
        font-weight: 300;
        z-index: 1;
    }
    
    .dark .drc-modal-title {
        color: rgba(229, 231, 235, 1);
    }
    
    .light .drc-modal-title {
        color: rgba(31, 41, 55, 1);
    }
    
    .drc-modal-content {
        flex-grow: 1;
        overflow-y: auto;
        height: 100%;
        text-align: center;
    }
    
    .drc-modal-close {
        position: absolute;
        top: .3rem;
        right: .5rem;
    }
    
    .drc-modal-container {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .drc-modal-modal-content {
        border-radius: .75rem;
        --tw-shadow-color: 0, 0, 0;
        --tw-shadow: 0 25px 50px -12px rgba(var(--tw-shadow-color), 0.25);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        padding-top: .5rem;
        padding-bottom: .5rem;
        padding-left: .75rem;
        padding-right: .75rem;
        --tw-bg-opacity: 1;
        --tw-border-opacity: 1;
        border-color: rgba(243, 244, 246, var(--tw-border-opacity));
        position: relative;
        display: flex;
        flex-direction: column;
        max-height: 90%;
        margin: 0 1rem;
        border: 1px solid;
        min-width: 20rem;
    }
    
    .dark .drc-modal-modal-content {
        background-color: rgba(31, 41, 55, 1);
    }
    
    .light .drc-modal-modal-content {
        background-color: rgba(255, 255, 255, 1);
    }
    
    .drc-modal-hidden {
        display: none;
    }
    
    .drc-modal-modal-container {
        z-index: 10000;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 900px;
        height: 600px;
        min-width:  20rem;
        min-height: auto;
    }
    
    .drc-modal-overlay {
        background-color: rgba(0,0,0,.5);
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        position: absolute;
        width: 100vw;
        height: 100vh;
        backdrop-filter: blur(5px);
    }
    
    .tree-modal-content {
        display: flex;
        justify-content: center;
    }

    .drc-hotkey {
        border-color: rgba(107, 114, 128, 1);
        border-width: 1px;
        display: inline-block;
        border-radius: 0.375rem;
        border-radius: 0.375rem;
        padding-left: 0.25rem;
        padding-right: 0.25rem;
        padding-top: 0.3em;
        padding-bottom: 0.2em;
        line-height: 1em;
        pointer-events: none;
        position: absolute;
        bottom: -0.175rem;
        right: -0.175rem;
        font-size: .8em;
    }

    .drc-hotkey--dark {
        background-color: rgba(0, 0, 0, 0.3);
    }
    
    `;
    document.head.appendChild(treeStyle);
    const treeDiv = document.createElement("div");
    document.getElementById("app").appendChild(treeDiv);
    treeDiv.outerHTML = `
    <div id="treeModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div class="drc-modal-overlay vfm--overlay"></div>
    <div id="treeContainer" class="drc-modal-container">
        <div id="treeModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Evolution Tree</div>
                <div></div>
            </span>
            <div class="drc-modal-content tree-modal-content">
                <img src="https://deeeep-reef-client.netlify.app/assets/evolution_tree.png"
                    alt="Deeeep.io v4 beta evolution tree">
            </div>
            <button id="treeCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24"
                    class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    const treeModalContainer = document.getElementById("treeModalContainer");
    const treeCloseButton = document.getElementById("treeCloseButton");
    // Tree button onclick
    treeButton.addEventListener("click", () => {
        treeModalContainer.classList.toggle("drc-modal-hidden");
    });
    treeCloseButton.addEventListener("click", () => {
        treeModalContainer.classList.toggle("drc-modal-hidden");
    });
    // hotkey V for toggling evolution tree
    window.addEventListener("keydown", (key) => {
        if (key.code != "KeyV" || !gameStarted)
            return;
        treeModalContainer.classList.remove("drc-modal-hidden");
    });
    window.addEventListener("keyup", (key) => {
        if (key.code != "KeyV")
            return;
        treeModalContainer.classList.add("drc-modal-hidden");
    });
    // Asset swapper
    // Asset swapper button
    const topRightNav = document.querySelector("div.el-row.top-right-nav.items-center");
    const settingsButtonWrapper = topRightNav.querySelector("div > button.el-button.el-button--small.btn.nice-button.gray.has-icon.square.only-icon").parentElement;
    const assetSwapperButtonWrapper = settingsButtonWrapper.cloneNode(true);
    const assetSwapperButton = assetSwapperButtonWrapper.firstElementChild;
    assetSwapperButtonWrapper.setAttribute("id", "assetSwapperButtonWrapper");
    assetSwapperButton.setAttribute("id", "assetSwapperButton");
    assetSwapperButton.querySelector("span[class]").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16">
    <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Zm3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/>
  </svg>`;
    topRightNav.insertBefore(assetSwapperButtonWrapper, settingsButtonWrapper);
    // Asset swapper modal
    const assetSwapperStyle = document.createElement("style");
    assetSwapperStyle.innerHTML = `.assetswapper-new-button {
        display: flex;
        align-items: center;
    }
    .assetswapper-select-rule {
        display: flex;
    }
    
    .assetswapper-add-button {
        background-color: rgba(59, 130, 246, 1);
        border-color: rgba(37, 99, 235, 1);
        color: rgba(255, 255, 255, 1);
        border-radius: 9999px;
        padding: 6px 10px 6px 10px;
        margin-top: 10px;
}
.assetswapper-new-button {
    background-color: rgba(59, 130, 246, 1);
    border-color: rgba(37, 99, 235, 1);
    color: rgba(255, 255, 255, 1);
    border-radius: 9999px;
    padding: 6px 10px 6px 10px;
    display: flex;
    align-items: center;
}

.assetswapper-list-rule {
    display: flex;
    align-items: center;
}`;
    document.head.appendChild(assetSwapperStyle);
    const assetSwapperDiv = document.createElement("div");
    document.getElementById("app").appendChild(assetSwapperDiv);
    assetSwapperDiv.outerHTML = `
    <div id="assetSwapperModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div class="drc-modal-overlay vfm--overlay"></div>
    <div id="assetSwapperContainer" class="drc-modal-container">
        <div id="assetSwapperModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Asset Swapper</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <button id="assetSwapperNewButton" class="assetswapper-new-button assetswapper-add-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        class="bi bi-plus" viewBox="0 0 16 16">
                        <path
                            d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                    </svg>New</button>
                <div id="assetSwapperRuleList"></div>
            </div>
            <button id="assetSwapperCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    // create new swap rule
    const assetSwapperNewDiv = document.createElement("div");
    document.getElementById("app").appendChild(assetSwapperNewDiv);
    assetSwapperNewDiv.outerHTML = `
    <div id="assetSwapperNewModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div id="assetSwapperNewContainer" class="drc-modal-container">
        <div id="assetSwapperNewModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">New Swap</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <div class="assetswapper-select-rule">
                    <select id="assetSwapperLetterDropdown">
                        <option value="ab">A-B</option>
                        <option value="cd">C-D</option>
                        <option value="ef">E-F</option>
                        <option value="gh">G-H</option>
                        <option value="ij">I-J</option>
                        <option value="kl">K-L</option>
                        <option value="mn">M-N</option>
                        <option value="op">O-P</option>
                        <option value="qr">Q-R</option>
                        <option value="st">S-T</option>
                        <option value="uv">U-V</option>
                        <option value="wx">W-X</option>
                        <option value="yz">Y-Z</option>
                    </select>
                    <div class="spacer"></div>
                    <select id="assetSwapperTargetDropdown"></select>
                    <div class="spacer"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        class="bi bi-arrow-right" viewBox="0 0 16 16">
                        <path fill-rule="evenodd"
                            d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                    </svg>
                    <div class="spacer"></div>
                    <select id="assetSwapperSkinDropdown"></select>
                </div>
                <button id="assetSwapperAddButton" class="assetswapper-add-button">Add</button>
            </div>
            <button id="assetSwapperNewCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    const assetSwapperLetterDropdown = document.getElementById("assetSwapperLetterDropdown");
    const assetSwapperTargetDropdown = document.getElementById("assetSwapperTargetDropdown");
    const assetSwapperSkinDropdown = document.getElementById("assetSwapperSkinDropdown");
    const assetSwapperRuleList = document.getElementById("assetSwapperRuleList");
    let assetSwapperLetter = assetSwapperLetterDropdown.value;
    let assetSwapperTarget = '';
    let assetSwapperTargetSkins = [];
    // former prelude that was moved
    // modified api/animals json that excludes nonplayable animals
    let animals = JSON.parse(`[{"id":0,"name":"fish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":1,"name":"crab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":2,"name":"jellyfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":3,"name":"squid","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":4,"name":"seagull","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":5,"name":"ray","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":6,"name":"beaver","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":7,"name":"penguin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":8,"name":"tshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":9,"name":"dolphin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":10,"name":"shark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":11,"name":"killerwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":12,"name":"whale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":13,"name":"worm","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":14,"name":"anglerfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":15,"name":"leopardseal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":16,"name":"blobfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":17,"name":"kingcrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":19,"name":"seaturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":20,"name":"oarfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":21,"name":"octopus","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":22,"name":"giantsquid","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":23,"name":"narwhal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":24,"name":"cachalot","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":25,"name":"polarbear","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":26,"name":"lamprey","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":27,"name":"pelican","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":28,"name":"whaleshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":29,"name":"remora","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":30,"name":"marlin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":31,"name":"sunfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":32,"name":"stonefish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":33,"name":"ghost","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":34,"name":"crocodile","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":35,"name":"electriceel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":36,"name":"frog","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":37,"name":"hippo","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":38,"name":"manatee","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":39,"name":"snappingturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":40,"name":"piranha","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":41,"name":"snake","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":42,"name":"baldeagle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":43,"name":"lionfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":45,"name":"mantaray","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":46,"name":"elephantseal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":47,"name":"lanternfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":48,"name":"sleepershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":49,"name":"gulpereel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":50,"name":"giantisopod","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":51,"name":"giantisopodclosed","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":53,"name":"seal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":54,"name":"icefish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":55,"name":"barreleye","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":56,"name":"dragonfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":57,"name":"humboldtsquid","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":58,"name":"sealion","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":59,"name":"flyingfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":60,"name":"duck","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":61,"name":"goblinshark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":62,"name":"catfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":63,"name":"littleauk","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":64,"name":"pufferfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":65,"name":"pufferfishfilled","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":66,"name":"tigershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":68,"name":"anaconda","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":69,"name":"bobbitworm","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":70,"name":"mahimahi","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":71,"name":"walrus","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":72,"name":"frilledshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":73,"name":"sawfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":74,"name":"mantisshrimp","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":75,"name":"axolotl","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":76,"name":"bat","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":78,"name":"blindcavefish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":79,"name":"crayfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":80,"name":"goliathbullfrog","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":81,"name":"giantsalamander","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":82,"name":"alligatorsnappingturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":83,"name":"giantsoftshellturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":84,"name":"giantsoftshellturtleclosed","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":85,"name":"olm","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":86,"name":"alligatorgar","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":87,"name":"humpbackwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":89,"name":"horseshoecrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":90,"name":"baskingshark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":91,"name":"colossalsquid","asset_count":4,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":92,"name":"climbingcavefish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":93,"name":"archerfish","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":94,"name":"seaotter","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":95,"name":"lobster","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":96,"name":"barracuda","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":97,"name":"frogfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":98,"name":"morayeel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":99,"name":"wobbegongshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":100,"name":"leatherbackturtle","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":101,"name":"threshershark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":102,"name":"atlantictorpedo","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":103,"name":"coconutcrab","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":104,"name":"bullshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":105,"name":"hermitcrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":106,"name":"giantpacificoctopus","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-13T16:26:42.000Z","updated_at":"2021-08-13T03:00:00.000Z"},{"id":107,"name":"beakedwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-16T16:35:10.000Z","updated_at":"2021-08-16T03:00:00.000Z"},{"id":108,"name":"megamouthshark","asset_count":3,"active":true,"beta":false,"created_at":"2021-08-18T16:45:07.000Z","updated_at":"2021-08-18T03:00:00.000Z"},{"id":109,"name":"belugawhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T02:00:24.000Z","updated_at":"2021-08-18T03:00:00.000Z"},{"id":110,"name":"vampiresquid","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-19T15:21:21.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":111,"name":"halibut","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T16:33:25.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":112,"name":"bowheadwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T21:38:39.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":113,"name":"japanesespidercrab","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-20T04:23:37.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":114,"name":"cookiecuttershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-20T21:02:22.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":115,"name":"sarcasticfringehead","asset_count":3,"active":true,"beta":false,"created_at":"2021-08-20T23:19:56.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":116,"name":"parrotfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-21T04:09:09.000Z","updated_at":"2021-08-21T03:00:00.000Z"},{"id":117,"name":"wolfeel","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-21T04:57:29.000Z","updated_at":"2021-08-21T03:00:00.000Z"},{"id":119,"name":"coelacanth","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-24T15:31:45.000Z","updated_at":"2021-08-24T03:00:00.000Z"},{"id":120,"name":"napoleonwrasse","asset_count":1,"active":true,"beta":false,"created_at":"2022-07-11T15:54:00.000Z","updated_at":"2022-07-11T15:54:00.000Z"}]`);
    let translations = {};
    let animalList = [];
    function updateAssetSwapperTargetDropdown() {
        assetSwapperLetter = assetSwapperLetterDropdown.value;
        assetSwapperTargetDropdown.innerHTML = "";
        for (let i in animalList) {
            if (!(animalList[i].name.charAt(0).toLowerCase() == assetSwapperLetter.charAt(0)))
                continue;
            const elem = document.createElement("option");
            elem.setAttribute("value", animalList[i].id);
            elem.innerText = animalList[i].name;
            assetSwapperTargetDropdown.appendChild(elem);
        }
        for (let i in animalList) {
            if (!(animalList[i].name.charAt(0).toLowerCase() == assetSwapperLetter.charAt(1)))
                continue;
            const elem = document.createElement("option");
            elem.setAttribute("value", animalList[i].id);
            elem.innerText = animalList[i].name;
            assetSwapperTargetDropdown.appendChild(elem);
        }
        updateAssetSwapperSkinDropdown();
    }
    ;
    function updateAssetSwapperSkinDropdown() {
        assetSwapperTarget = assetSwapperTargetDropdown.value;
        assetSwapperSkinDropdown.innerHTML = "";
        assetSwapperTargetSkins = [];
        fetch(API_URL + "/skins?animalId=" + assetSwapperTarget)
            .then(res => res.json())
            .then(data => assetSwapperTargetSkins = data)
            .then(() => {
            for (let i in assetSwapperTargetSkins) {
                const elem = document.createElement("option");
                elem.setAttribute("value", assetSwapperTargetSkins[i].id);
                elem.innerText = assetSwapperTargetSkins[i].name;
                assetSwapperSkinDropdown.appendChild(elem);
            }
        });
    }
    ;
    function updateAssetSwapperList() {
        return __awaiter(this, void 0, void 0, function* () {
            let assetSwapperRuleSkins = [];
            let assetSwapperRuleAnimalName = "";
            let assetSwapperRuleSkinName = "";
            assetSwapperRuleList.innerHTML = "";
            for (let i in settings.assetSwapperConfig) {
                for (let j in animalList) {
                    if (animalList[j].id == settings.assetSwapperConfig[i].animal) {
                        assetSwapperRuleAnimalName = animalList[j].name;
                        break;
                    }
                }
                yield fetch(API_URL + "/skins?animalId=" + settings.assetSwapperConfig[i].animal)
                    .then(res => res.json())
                    .then(data => assetSwapperRuleSkins = data)
                    .then(() => {
                    for (let j in assetSwapperRuleSkins) {
                        if (assetSwapperRuleSkins[j].id == settings.assetSwapperConfig[i].skin) {
                            assetSwapperRuleSkinName = assetSwapperRuleSkins[j].name;
                            break;
                        }
                    }
                });
                const mainElem = document.createElement("div");
                mainElem.classList.add("assetswapper-list-rule");
                // animal name
                const animalElem = document.createElement("p");
                animalElem.innerText = assetSwapperRuleAnimalName;
                mainElem.appendChild(animalElem);
                const spacer1 = document.createElement("div");
                spacer1.classList.add("spacer");
                mainElem.appendChild(spacer1);
                // => icon
                const iconElem = document.createElement("div");
                mainElem.appendChild(iconElem);
                iconElem.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
            class="bi bi-arrow-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
                d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
        </svg>`;
                const spacer2 = document.createElement("div");
                spacer2.classList.add("spacer");
                mainElem.appendChild(spacer2);
                // Skin name
                const skinElem = document.createElement("p");
                skinElem.innerText = assetSwapperRuleSkinName;
                mainElem.appendChild(skinElem);
                const spacer3 = document.createElement("div");
                spacer3.classList.add("spacer");
                mainElem.appendChild(spacer3);
                // Delete button
                const deleteElem = document.createElement("button");
                deleteElem.classList.add("assetswapper-new-button");
                deleteElem.innerText = "Delete";
                deleteElem.addEventListener("click", () => {
                    settings.assetSwapperConfig = settings.assetSwapperConfig.filter(item => item != settings.assetSwapperConfig[i]);
                    saveSettings();
                    updateAssetSwapperList();
                });
                mainElem.appendChild(deleteElem);
                assetSwapperRuleList.appendChild(mainElem);
            }
        });
    }
    fetch("https://api.crowdl.io/deeeep/cdn/en.json")
        .then(res => res.json())
        .then(data => translations = data).then(() => {
        var _a;
        for (let i in animals) {
            animalList.push({
                name: (_a = translations[animals[i].name + "-name"]) !== null && _a !== void 0 ? _a : animals[i].name,
                stringId: animals[i].name,
                id: animals[i].id
            });
        }
        // init dropdown
        updateAssetSwapperTargetDropdown();
        updateAssetSwapperSkinDropdown();
        updateAssetSwapperList();
    });
    assetSwapperLetterDropdown.addEventListener("change", updateAssetSwapperTargetDropdown);
    assetSwapperTargetDropdown.addEventListener("change", updateAssetSwapperSkinDropdown);
    const assetSwapperAddButton = document.getElementById("assetSwapperAddButton");
    assetSwapperAddButton.addEventListener("click", () => {
        settings.assetSwapperConfig.push({
            animal: assetSwapperTargetDropdown.value,
            skin: assetSwapperSkinDropdown.value
        });
        saveSettings();
        updateAssetSwapperList();
        assetSwapperNewModalContainer.classList.toggle("drc-modal-hidden");
    });
    const assetSwapperNewButton = document.getElementById("assetSwapperNewButton");
    const assetSwapperNewModalContainer = document.getElementById("assetSwapperNewModalContainer");
    const assetSwapperNewCloseButton = document.getElementById("assetSwapperNewCloseButton");
    assetSwapperNewButton.addEventListener("click", () => {
        assetSwapperNewModalContainer.classList.toggle("drc-modal-hidden");
    });
    assetSwapperNewCloseButton.addEventListener("click", () => {
        assetSwapperNewModalContainer.classList.toggle("drc-modal-hidden");
    });
    const assetSwapperModalContainer = document.getElementById("assetSwapperModalContainer");
    const assetSwapperCloseButton = document.getElementById("assetSwapperCloseButton");
    assetSwapperButton.addEventListener("click", () => {
        assetSwapperModalContainer.classList.toggle("drc-modal-hidden");
    });
    assetSwapperCloseButton.addEventListener("click", () => {
        assetSwapperModalContainer.classList.toggle("drc-modal-hidden");
    });
    // Custom theme
    let themeMakerEditTheme = false;
    // Custom theme button
    const customThemeButtonWrapper = settingsButtonWrapper.cloneNode(true);
    const customThemeButton = customThemeButtonWrapper.firstElementChild;
    customThemeButtonWrapper.setAttribute("id", "customThemeButtonWrapper");
    customThemeButton.setAttribute("id", "customThemeButton");
    customThemeButton.querySelector("span[class]").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16">
    <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
  </svg>`;
    topRightNav.insertBefore(customThemeButtonWrapper, settingsButtonWrapper);
    // Custom Theme Modal
    const customThemeDiv = document.createElement("div");
    document.getElementById("app").appendChild(customThemeDiv);
    customThemeDiv.outerHTML = `
    <div id="customThemeModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div class="drc-modal-overlay vfm--overlay"></div>
    <div id="customThemeContainer" class="drc-modal-container">
        <div id="customThemeModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Themes</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <button id="themeMakerButton" class="assetswapper-new-button assetswapper-add-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-plus" viewBox="0 0 16 16">
                    <path
                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>Theme Maker</button>
                <button id="themeMakerImportExportButton" class="assetswapper-new-button assetswapper-add-button">Import/Export</button>
                <button id="clearUserThemes" class="assetswapper-new-button assetswapper-add-button">Clear Selected</button>
                <div class="spacer"></div>
                <div id="themeMakerThemeList"></div>
            </div>
            <button id="customThemeCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24"
                    class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    const themeMakerThemeList = document.getElementById("themeMakerThemeList");
    const themeMakerImportExportButton = document.getElementById("themeMakerImportExportButton");
    const clearSelectedUserTheme = document.getElementById("clearUserThemes");
    // Theme maker modal
    // create new swap rule
    const themeMakerDiv = document.createElement("div");
    document.getElementById("app").appendChild(themeMakerDiv);
    themeMakerDiv.outerHTML = `
    <div id="themeMakerModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div id="themeMakerContainer" class="drc-modal-container">
        <div id="themeMakerModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Theme Maker</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Name: </p>
                        <div class="spacer"></div>
                        <input type="text" id="themeMakerOptionsName" placeholder="Theme Name" value="Theme 0">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Background Image: </p>
                        <div class="spacer"></div>
                        <input type="url" id="themeMakerOptionsBgImage" placeholder="URL to image">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Modal Colour: </p>
                        <div class="spacer"></div>
                        <input type="color" id="themeMakerOptionsModalBgColour" value="#FFFFFF">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Modal Transparency: </p>
                        <div class="spacer"></div>
                        <input type="range" id="themeMakerOptionsModalTransparency" min="1" max="10">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Text Colour: </p>
                        <div class="spacer"></div>
                        <input type="color" id="themeMakerOptionsModalTextColour" value="#000000">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Loading Background Image: </p>
                        <div class="spacer"></div>
                        <input type="url" id="themeMakerOptionsLoadingBgImage" placeholder="URL to image">
                    </div>
                </div>
                <button id="themeMakerAddButton" class="assetswapper-add-button">Save</button>
            </div>
            <button id="themeMakerCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    const themeMakerOptionsName = document.getElementById("themeMakerOptionsName");
    const themeMakerOptionsBgImage = document.getElementById("themeMakerOptionsBgImage");
    const themeMakerOptionsModalBgColour = document.getElementById("themeMakerOptionsModalBgColour");
    const themeMakerOptionsModalTextColour = document.getElementById("themeMakerOptionsModalTextColour");
    const themeMakerOptionsLoadingBgImage = document.getElementById("themeMakerOptionsLoadingBgImage");
    const themeMakerOptionsModalTransparency = document.getElementById("themeMakerOptionsModalTransparency");
    const themeMakerModalContainer = document.getElementById("themeMakerModalContainer");
    const themeMakerAddButton = document.getElementById("themeMakerAddButton");
    // Moved to here bc vars must be initialised
    const themeMakerButton = document.getElementById("themeMakerButton");
    themeMakerButton.addEventListener("click", () => {
        themeMakerEditTheme = false;
        // changes depending on amount of themes :)
        themeMakerOptionsName.value = "Theme " + settings.userThemeData.length;
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    function formatThemeMakerCSS() {
        let homeBg, loadingBg = "";
        if (themeMakerOptionsBgImage.value != "") {
            homeBg = `
            .home-page .home-bg {
                background-image: url(${themeMakerOptionsBgImage.value}) !important;
            }
            `;
        }
        if (themeMakerOptionsLoadingBgImage.value != "") {
            loadingBg = `
            .loading-container {
                background-image: url(${themeMakerOptionsLoadingBgImage.value}) !important;
            }
            `;
        }
        let bgColour = themeMakerOptionsModalBgColour.value;
        let alpha = "";
        switch (themeMakerOptionsModalTransparency.value) {
            case "10":
                alpha = "00";
                break;
            case "9":
                alpha = "1A";
                break;
            case "8":
                alpha = "33";
                break;
            case "7":
                alpha = "4D";
                break;
            case "6":
                alpha = "66";
                break;
            case "5":
                alpha = "80";
                break;
            case "4":
                alpha = "99";
                break;
            case "3":
                alpha = "B3";
                break;
            case "2":
                alpha = "CC";
                break;
            case "1":
                alpha = "E6";
                break;
            case "0":
                alpha = "FF";
                break;
        }
        bgColour += alpha;
        let bgOpacity = (10 - Number(themeMakerOptionsModalTransparency.value)) / 10;
        return `
        div.modal-content {
            background-color: ${bgColour} !important;
        }
        span.modal__title {
            color: ${themeMakerOptionsModalTextColour.value} !important;
        }
        div.modal__content {
            color: ${themeMakerOptionsModalTextColour.value} !important;
        }
        span.drc-modal-title {
            color: ${themeMakerOptionsModalTextColour.value} !important;
        }
        div.drc-modal-modal-content {
            background-color: ${bgColour} !important;
        }
        body .el-input__wrapper, body .el-textarea__wrapper {
            background-color: ${bgColour} !important;
        }
        .animals-container .animals .animal {
            --tw-bg-opacity: ${bgOpacity} !important
        }
        .dark .forum-page {
            --tw-bg-opacity: ${bgOpacity} !important
        }
        .dark .forum-page .inner .forum-posts .post-summary .forum-post-summary {
            background-color: ${bgColour} !important
        }
        .dark .forum-page .inner .forum-posts .post-summary .forum-post-summary:hover {
            background-color: ${bgColour} !important
        }
        .dark .forum-post-page .inner {
            background-color: ${bgColour} !important
        }
        ${homeBg}
        ${loadingBg}
        `;
    }
    themeMakerAddButton.addEventListener("click", () => {
        settings.userThemeData.push({
            name: themeMakerOptionsName.value,
            src: formatThemeMakerCSS(),
            active: true
        });
        for (let i in settings.userThemeData) {
            settings.userThemeData[i].active = false;
        }
        settings.userThemeData[settings.userThemeData.length - 1].active = true;
        updateThemeList();
        saveSettings();
        reloadCustomTheme();
        // reset all values
        themeMakerOptionsName.value = "";
        themeMakerOptionsBgImage.value = "";
        themeMakerOptionsLoadingBgImage.value = "";
        themeMakerOptionsModalBgColour.value = "#FFFFFF";
        themeMakerOptionsModalTextColour.value = "#000000";
        themeMakerOptionsModalTransparency.value = "0";
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    const themeMakerCloseButton = document.getElementById("themeMakerCloseButton");
    themeMakerCloseButton.addEventListener("click", () => {
        themeMakerEditTheme = false;
        // reset all values
        themeMakerOptionsName.value = "";
        themeMakerOptionsBgImage.value = "";
        themeMakerOptionsLoadingBgImage.value = "";
        themeMakerOptionsModalBgColour.value = "#FFFFFF";
        themeMakerOptionsModalTextColour.value = "#000000";
        themeMakerOptionsModalTransparency.value = "0";
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    clearSelectedUserTheme === null || clearSelectedUserTheme === void 0 ? void 0 : clearSelectedUserTheme.addEventListener("click", () => {
        const elems = document.querySelectorAll("input[name=userThemeList]");
        for (let e in elems) {
            if (typeof (elems[e]) != "object")
                continue;
            elems[e].checked = false;
        }
        for (let j in settings.userThemeData) {
            settings.userThemeData[j].active = false;
        }
        saveSettings();
        reloadCustomTheme();
    });
    function updateThemeList() {
        themeMakerThemeList.innerHTML = "";
        for (let i in settings.userThemeData) {
            const mainElem = document.createElement("div");
            mainElem.setAttribute("id", settings.userThemeData[i].name);
            mainElem.classList.add("assetswapper-list-rule");
            const selectElem = document.createElement("input");
            selectElem.type = "radio";
            selectElem.name = "userThemeList";
            selectElem.addEventListener("click", () => {
                // clear active
                for (let j in settings.userThemeData) {
                    settings.userThemeData[j].active = false;
                }
                settings.userThemeData[i].active = true;
                saveSettings();
                reloadCustomTheme();
            });
            mainElem.appendChild(selectElem);
            if (settings.userThemeData[i].active) {
                selectElem.checked = true;
            }
            const spacer0 = document.createElement("div");
            spacer0.classList.add("spacer");
            mainElem.appendChild(spacer0);
            // theme name
            const nameElem = document.createElement("p");
            nameElem.innerText = settings.userThemeData[i].name;
            mainElem.appendChild(nameElem);
            const spacer1 = document.createElement("div");
            spacer1.classList.add("spacer");
            mainElem.appendChild(spacer1);
            // Edit button
            const editElem = document.createElement("button");
            editElem.classList.add("assetswapper-new-button");
            editElem.innerText = "Edit";
            editElem.addEventListener("click", () => {
                themeMakerEditTheme = true;
                const cssParser = new cssjs.cssjs();
                const parsed = cssParser.parseCSS(settings.userThemeData[i].src);
                let bgImageRule = parsed.filter((r) => r.selector === ".home-page .home-bg");
                let loadingBgImageRule = parsed.filter((r) => r.selector === ".loading-container");
                let modalBgRule = parsed.filter((r) => r.selector === "div.modal-content");
                let modalTextRule = parsed.filter((r) => r.selector === "span.modal__title");
                let modalTransparencyRule = parsed.filter((r) => r.selector === "div.modal-content");
                themeMakerOptionsName.value = settings.userThemeData[i].name;
                themeMakerOptionsBgImage.value = bgImageRule.length ?
                    bgImageRule[0].rules.filter((r) => r.directive === "background-image")[0].value
                        .replace("!important", "")
                        .replace("url(", "")
                        .replace(")", "")
                        .trim() :
                    "";
                themeMakerOptionsLoadingBgImage.value = loadingBgImageRule.length ?
                    loadingBgImageRule[0].rules.filter((r) => r.directive === "background-image")[0].value
                        .replace("!important", "")
                        .replace("url(", "")
                        .replace(")", "")
                        .trim() :
                    "";
                themeMakerOptionsModalBgColour.value = modalBgRule.length ?
                    modalBgRule[0].rules.filter((r) => r.directive === "background-color")[0].value
                        .replace("!important", "")
                        .trim()
                        .slice(0, -2) :
                    "";
                themeMakerOptionsModalTextColour.value = modalTextRule.length ?
                    modalTextRule[0].rules.filter((r) => r.directive === "color")[0].value
                        .replace("!important", "")
                        .trim() :
                    "";
                themeMakerOptionsModalTransparency.value = modalTransparencyRule.length ?
                    modalTransparencyRule[0].rules.filter((r) => r.directive === "background-color")[0].value
                        .replace("!important", "")
                        .trim()
                        .slice(-2) :
                    "";
                themeMakerModalContainer.classList.toggle("drc-modal-hidden");
            });
            mainElem.appendChild(editElem);
            // Delete button
            const deleteElem = document.createElement("button");
            deleteElem.classList.add("assetswapper-new-button");
            deleteElem.innerText = "Delete";
            deleteElem.addEventListener("click", () => {
                settings.userThemeData = settings.userThemeData.filter(item => item != settings.userThemeData[i]);
                saveSettings();
                updateThemeList();
                reloadCustomTheme();
            });
            mainElem.appendChild(deleteElem);
            themeMakerThemeList.appendChild(mainElem);
        }
    }
    const customThemeModalContainer = document.getElementById("customThemeModalContainer");
    const customThemeCloseButton = document.getElementById("customThemeCloseButton");
    // Custom Theme button onclick
    customThemeButton.addEventListener("click", () => {
        customThemeModalContainer.classList.toggle("drc-modal-hidden");
        updateThemeList();
    });
    customThemeCloseButton.addEventListener("click", () => {
        customThemeModalContainer.classList.toggle("drc-modal-hidden");
    });
    // Import/export theme
    const themeMakerImportExportDiv = document.createElement("div");
    document.getElementById("app").appendChild(themeMakerImportExportDiv);
    themeMakerImportExportDiv.outerHTML = `
    <div id="themeMakerImportExportModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div id="themeMakerImportExportContainer" class="drc-modal-container">
        <div id="themeMakerImportExportModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Import / Export</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <div class="spacer"></div>
                <div style="display:flex">
                    <select id="exportThemeDropdown"></select>
                    <div class="spacer"></div>
                    <button id="themeMakerExportButton"
                        class="assetswapper-new-button">Export</button>
                </div>
                <div class="spacer"></div>
                <div style="display:flex">
                    <input type="file" accept=".json" id="importThemeFile">
                    <div class="spacer"></div>
                    <button id="themeMakerImportButton"
                        class="assetswapper-new-button">Import</button>
                </div>
            </div>
            <button id="themeMakerImportExportCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
`;
    const themeMakerImportExportModalContainer = document.getElementById("themeMakerImportExportModalContainer");
    const themeMakerImportExportCloseButton = document.getElementById("themeMakerImportExportCloseButton");
    const exportThemeDropdown = document.getElementById("exportThemeDropdown");
    const importThemeFile = document.getElementById("importThemeFile");
    const themeMakerExportButton = document.getElementById("themeMakerExportButton");
    const themeMakerImportButton = document.getElementById("themeMakerImportButton");
    function reloadExportThemeDropdown() {
        exportThemeDropdown.innerHTML = "";
        for (let i in settings.userThemeData) {
            const elem = document.createElement("option");
            elem.setAttribute("value", JSON.stringify(settings.userThemeData[i]));
            elem.innerText = settings.userThemeData[i].name;
            exportThemeDropdown.appendChild(elem);
        }
    }
    // button onclick
    themeMakerImportExportButton.addEventListener("click", () => {
        themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
        reloadExportThemeDropdown();
    });
    themeMakerImportExportCloseButton.addEventListener("click", () => {
        themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
    });
    // export
    themeMakerExportButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        const exportedTheme = JSON.parse(exportThemeDropdown.value);
        themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
        const content = JSON.stringify({
            name: exportedTheme.name,
            src: exportedTheme.src
        });
        const path = yield ipcRenderer.invoke("getPath", "downloads");
        try {
            fs.writeFileSync(path + `/${exportedTheme.name.replace(/[^a-zA-Z0-9]/g, '')}.drctheme.json`, content);
            new Notification("Theme exported!", {
                body: `Your theme has been exported to ${exportedTheme.name.replace(/[^a-zA-Z0-9]/g, '')}.drctheme.json in your Downloads folder. `
            });
            // file written successfully
        }
        catch (err) {
            console.error(err);
            new Notification("Something went wrong", {
                body: `An error occurred while exporting your theme.`
            });
        }
    }));
    // import
    themeMakerImportButton.addEventListener("click", () => {
        // @ts-ignore I KNOW BETTER
        if (importThemeFile.files.length == 0)
            return;
        // @ts-ignore I KNOW BETTER
        const theme = importThemeFile.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            let parsedTheme = {};
            try {
                // @ts-ignore I KNOW BETTER
                parsedTheme = JSON.parse(atob(event.target.result.split(new RegExp(","))[1]));
            }
            catch (e) {
                new Notification("Something went wrong", {
                    body: "Something went wrong while importing your theme. Check that it is not corrupted."
                });
            }
            settings.userThemeData.push({
                name: parsedTheme.name,
                src: parsedTheme.src,
                active: true
            });
            themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
            for (let i in settings.userThemeData) {
                settings.userThemeData[i].active = false;
            }
            settings.userThemeData[settings.userThemeData.length - 1].active = true;
            updateThemeList();
            reloadCustomTheme();
            saveSettings();
        });
        reader.readAsDataURL(theme);
    });
    // Plugins button
    let pluginList = {};
    let filteredPluginList = {};
    fetch("https://deeeep-reef-client.github.io/plugins-api/registry.json")
        .then(res => res.json())
        .then(data => {
        pluginList = data;
        filteredPluginList = data;
    });
    const pluginsButtonWrapper = settingsButtonWrapper.cloneNode(true);
    const pluginsButton = pluginsButtonWrapper.firstElementChild;
    pluginsButtonWrapper.setAttribute("id", "pluginsButtonWrapper");
    pluginsButton.setAttribute("id", "pluginsButton");
    pluginsButton.querySelector("span[class]").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-wrench" viewBox="0 0 16 16">
       <path d="M.102 2.223A3.004 3.004 0 0 0 3.78 5.897l6.341 6.252A3.003 3.003 0 0 0 13 16a3 3 0 1 0-.851-5.878L5.897 3.781A3.004 3.004 0 0 0 2.223.1l2.141 2.142L4 4l-1.757.364L.102 2.223zm13.37 9.019.528.026.287.445.445.287.026.529L15 13l-.242.471-.026.529-.445.287-.287.445-.529.026L13 15l-.471-.242-.529-.026-.287-.445-.445-.287-.026-.529L11 13l.242-.471.026-.529.445-.287.287-.445.529-.026L13 11l.471.242z"/>
     </svg>`;
    topRightNav.insertBefore(pluginsButtonWrapper, settingsButtonWrapper);
    const pluginsStyle = document.createElement("style");
    pluginsStyle.innerHTML = `
        .plugins-search-bar {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `;
    document.head.appendChild(pluginsStyle);
    const pluginsDiv = document.createElement("div");
    document.getElementById("app").appendChild(pluginsDiv);
    pluginsDiv.outerHTML = `
    <div id="pluginsModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div class="drc-modal-overlay vfm--overlay"></div>
    <div id="pluginsContainer" class="drc-modal-container">
        <div id="pluginsModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Plugins</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <button id="searchPluginsButton" class="assetswapper-new-button assetswapper-add-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-plus" viewBox="0 0 16 16">
                    <path
                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>Search</button>
                <div id="installedPluginsList"></div>
            </div>
            <button id="pluginsCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em" viewBox="0 0 24 24"
                    class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
   `;
    const pluginsModalContainer = document.getElementById("pluginsModalContainer");
    const pluginsCloseButton = document.getElementById("pluginsCloseButton");
    const searchPluginsButton = document.getElementById("searchPluginsButton");
    const installedPluginsList = document.getElementById("installedPluginsList");
    function updateInstalledPluginsList() {
        installedPluginsList.innerHTML = "";
        for (let i in settings.pluginsData) {
            const mainElem = document.createElement("div");
            mainElem.setAttribute("id", settings.pluginsData[i].id);
            mainElem.classList.add("assetswapper-list-rule");
            // plugin name
            const nameElem = document.createElement("p");
            nameElem.innerText = settings.pluginsData[i].name;
            mainElem.appendChild(nameElem);
            const spacer11 = document.createElement("div");
            spacer11.classList.add("hw-spacer");
            mainElem.appendChild(spacer11);
            const hyphen1 = document.createElement("p");
            hyphen1.innerText = "-";
            mainElem.appendChild(hyphen1);
            const spacer12 = document.createElement("div");
            spacer12.classList.add("hw-spacer");
            mainElem.appendChild(spacer12);
            // plugin description
            const descElem = document.createElement("p");
            descElem.innerText = settings.pluginsData[i].description;
            mainElem.appendChild(descElem);
            const spacer21 = document.createElement("div");
            spacer21.classList.add("hw-spacer");
            mainElem.appendChild(spacer21);
            const hyphen2 = document.createElement("p");
            hyphen2.innerText = "-";
            mainElem.appendChild(hyphen2);
            const spacer22 = document.createElement("div");
            spacer22.classList.add("hw-spacer");
            mainElem.appendChild(spacer22);
            // plugin author
            const authorElem = document.createElement("p");
            authorElem.innerText = settings.pluginsData[i].author;
            mainElem.appendChild(authorElem);
            const spacer3 = document.createElement("div");
            spacer3.classList.add("spacer");
            mainElem.appendChild(spacer3);
            // delete button
            const uninstallElem = document.createElement("button");
            uninstallElem.classList.add("assetswapper-new-button");
            uninstallElem.innerText = "Uninstall";
            uninstallElem.addEventListener("click", () => {
                settings.pluginsData = settings.pluginsData.filter(item => item != settings.pluginsData[i]);
                saveSettings();
                updateInstalledPluginsList();
            });
            mainElem.appendChild(uninstallElem);
            installedPluginsList.appendChild(mainElem);
        }
    }
    // Plugins button onclick
    pluginsButton.addEventListener("click", () => {
        updateInstalledPluginsList();
        pluginsModalContainer.classList.toggle("drc-modal-hidden");
    });
    pluginsCloseButton.addEventListener("click", () => {
        pluginsModalContainer.classList.toggle("drc-modal-hidden");
    });
    const searchPluginsDiv = document.createElement("div");
    document.getElementById("app").appendChild(searchPluginsDiv);
    searchPluginsDiv.outerHTML = `
    <div id="searchPluginsModalContainer" class="drc-modal-modal-container drc-modal-hidden">
    <div id="searchPluginsContainer" class="drc-modal-container">
        <div id="searchPluginsModal" class="modal-content drc-modal-modal-content">
            <span class="drc-modal-title">
                <div></div>
                <div class="justify-self-center">Search Plugins / Themes</div>
                <div></div>
            </span>
            <div class="drc-modal-content">
                <div class="plugins-search-bar">
                    <input id="pluginsSearchQuery" placeholder="Find plugin">
                    <div class="spacer"></div>
                    <button id="pluginsSearchButton" class="assetswapper-new-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                            class="bi bi-search" viewBox="0 0 16 16">
                            <path
                                d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>Search</button>
                </div>
                <div id="searchPluginsList"></div>
            </div>
            <button id="searchPluginsCloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                    viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                    <path
                        d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                    </path>
                </svg></button>
        </div>
    </div>
</div>
   `;
    const searchPluginsModalContainer = document.getElementById("searchPluginsModalContainer");
    const searchPluginsCloseButton = document.getElementById("searchPluginsCloseButton");
    const searchPluginsList = document.getElementById("searchPluginsList");
    const pluginsSearchQuery = document.getElementById("pluginsSearchQuery");
    const pluginsSearchButton = document.getElementById("pluginsSearchButton");
    pluginsSearchButton === null || pluginsSearchButton === void 0 ? void 0 : pluginsSearchButton.addEventListener("click", () => {
        updateFilteredPlugins();
    });
    function updateSearchPluginsList() {
        searchPluginsList.innerHTML = "";
        for (let i in filteredPluginList.list) {
            const mainElem = document.createElement("div");
            mainElem.setAttribute("id", filteredPluginList.list[i].id);
            mainElem.classList.add("assetswapper-list-rule");
            // plugin name
            const nameElem = document.createElement("p");
            nameElem.innerText = filteredPluginList.list[i].name;
            mainElem.appendChild(nameElem);
            const spacer11 = document.createElement("div");
            spacer11.classList.add("hw-spacer");
            mainElem.appendChild(spacer11);
            const hyphen1 = document.createElement("p");
            hyphen1.innerText = "-";
            mainElem.appendChild(hyphen1);
            const spacer12 = document.createElement("div");
            spacer12.classList.add("hw-spacer");
            mainElem.appendChild(spacer12);
            // plugin description
            const descElem = document.createElement("p");
            descElem.innerText = filteredPluginList.list[i].description;
            mainElem.appendChild(descElem);
            const spacer21 = document.createElement("div");
            spacer21.classList.add("hw-spacer");
            mainElem.appendChild(spacer21);
            const hyphen2 = document.createElement("p");
            hyphen2.innerText = "-";
            mainElem.appendChild(hyphen2);
            const spacer22 = document.createElement("div");
            spacer22.classList.add("hw-spacer");
            mainElem.appendChild(spacer22);
            // plugin type
            const typeElem = document.createElement("p");
            typeElem.innerText = filteredPluginList.list[i].type;
            mainElem.appendChild(typeElem);
            const spacer31 = document.createElement("div");
            spacer31.classList.add("hw-spacer");
            mainElem.appendChild(spacer31);
            const hyphen3 = document.createElement("p");
            hyphen3.innerText = "-";
            mainElem.appendChild(hyphen3);
            const spacer32 = document.createElement("div");
            spacer32.classList.add("hw-spacer");
            mainElem.appendChild(spacer32);
            // plugin author
            const authorElem = document.createElement("p");
            authorElem.innerText = filteredPluginList.list[i].author;
            mainElem.appendChild(authorElem);
            const spacer4 = document.createElement("div");
            spacer4.classList.add("spacer");
            mainElem.appendChild(spacer4);
            // Install button
            const installElem = document.createElement("button");
            installElem.classList.add("assetswapper-new-button");
            installElem.innerText = "Install";
            installElem.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                /*
                for (const i in settings.pluginsData) {
                    if (settings.pluginsData[i].id == filteredPluginList.list[i].id) {
                        new Notification("This plugin is already installed", {
                            body: "You have already installed this plugin."
                        });
                        return;
                    }
                }*/
                // fetch plugin src from plugin.json
                let errorDownloading = false;
                const pluginSrc = yield fetch(`https://deeeep-reef-client.github.io/plugins-api/plugins/${filteredPluginList.list[i].id}/plugin.json`)
                    .then(res => res.json())
                    .catch((err) => {
                    new Notification("Something went wrong", {
                        body: `An error occurred while downloading your plugin`
                    });
                    console.error(err);
                    errorDownloading = true;
                });
                if (errorDownloading)
                    return;
                if (filteredPluginList.list[i].type == "plugin") {
                    // Plugin
                    settings.pluginsData.push({
                        name: pluginSrc.name,
                        id: pluginSrc.id,
                        description: pluginSrc.description,
                        author: pluginSrc.author,
                        src: pluginSrc.src
                    });
                    updateInstalledPluginsList();
                }
                else {
                    // Theme
                    settings.userThemeData.push({
                        name: pluginSrc.name,
                        src: pluginSrc.src,
                        active: true
                    });
                    for (let i in settings.userThemeData) {
                        settings.userThemeData[i].active = false;
                    }
                    settings.userThemeData[settings.userThemeData.length - 1].active = true;
                    reloadCustomTheme();
                }
                ;
                new Notification("Plugin installed!", {
                    body: `The ${filteredPluginList.list[i].type} ${filteredPluginList.list[i].name} has been installed. Please restart the client for your changes to take effect.`
                });
                saveSettings();
                searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
                window.removeEventListener("keydown", searchPluginsEnterListener);
            }));
            mainElem.appendChild(installElem);
            searchPluginsList.appendChild(mainElem);
        }
    }
    ;
    function updateFilteredPlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            const search = pluginsSearchQuery.value.split(new RegExp(" "));
            yield fetch("https://deeeep-reef-client.github.io/plugins-api/registry.json")
                .then(res => res.json())
                .then(data => {
                pluginList = data;
                filteredPluginList = data;
            });
            filteredPluginList.list = filteredPluginList.list.filter((p) => {
                let result = false;
                for (const i in search) {
                    if (p.name.toLowerCase().includes(search[i].toLowerCase()) ||
                        p.description.toLowerCase().includes(search[i].toLowerCase())) {
                        result = true;
                        break;
                    }
                }
                return result;
            });
            updateSearchPluginsList();
        });
    }
    ;
    // Plugins button onclick
    function searchPluginsEnterListener(key) {
        if (key.code == "Enter")
            updateFilteredPlugins();
    }
    ;
    searchPluginsButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
        pluginsSearchQuery.value = "";
        yield fetch("https://deeeep-reef-client.github.io/plugins-api/registry.json")
            .then(res => res.json())
            .then(data => {
            pluginList = data;
            filteredPluginList = data;
        });
        updateSearchPluginsList();
        window.addEventListener("keydown", searchPluginsEnterListener);
    }));
    searchPluginsCloseButton.addEventListener("click", () => {
        searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
        window.removeEventListener("keydown", searchPluginsEnterListener);
    });
    // Watch for match start
    const btn = document.querySelector(".play");
    btn.addEventListener("click", () => {
        if (gameStarted)
            return;
        const element = document.getElementById("app");
        // Wait until game finished loading to log URL for RPC
        let gamemode = "";
        const openObserver = new MutationObserver((mutations) => {
            if (document.contains(document.querySelector(".playing"))) {
                gameStarted = true;
                openObserver.disconnect();
                gamemode = document.querySelector('.block, .modes').querySelector('.selected').querySelector('.name').innerText;
                ipcRenderer.send("gameInfo", {
                    gamemode,
                    url: window.location.href
                });
                function ghostSuicide(key) {
                    if (key.code != "KeyX")
                        return;
                    ipcRenderer.send("evalInBrowserContext", `
                    if (game.currentScene.myAnimal._visibleFishLevel == 33) {
                        game.inputManager.handleGhostSuicide();
                    }
                    `);
                }
                ;
                function cancelBoost(key) {
                    if (key.code != "KeyC")
                        return;
                    ipcRenderer.send("evalInBrowserContext", `
                    game.inputManager.pressElapsed = 0
                    game.inputManager.pointerDown = false;
                    `);
                }
                ;
                // tree button
                try {
                    const gameOverlay = document.querySelector("div.overlay.gm-1");
                    const topRightGameOverlay = gameOverlay.querySelector("div.top-right");
                    const topRightButtonsGameOverlay = topRightGameOverlay.querySelector("div.buttons.button-bar > div.inner");
                    const mapButton = topRightGameOverlay.querySelector("button.el-button.el-button--small.button.btn.nice-button.black.depressed.has-icon.square.only-icon.button");
                    const gameTreeButton = mapButton.cloneNode(true);
                    topRightButtonsGameOverlay.insertBefore(gameTreeButton, mapButton);
                    gameTreeButton.querySelector("span[class]").innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-diagram-3-fill" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1z"/>
  </svg>
                <div class="drc-hotkey hotkey drc-hotkey--dark hotkey--dark hotkey">V</div>
                `;
                    gameTreeButton.addEventListener("click", () => {
                        treeModalContainer.classList.toggle("drc-modal-hidden");
                    });
                }
                catch (e) {
                    console.error(e);
                }
                ;
                // ghosts
                if (settings.viewingGhosts) {
                    ipcRenderer.send("evalInBrowserContext", `
                        game.currentScene.viewingGhosts = true;
                    `);
                }
                else {
                    ipcRenderer.send("evalInBrowserContext", `
                        game.currentScene.viewingGhosts = false;
                    `);
                }
                window.addEventListener("keydown", ghostSuicide);
                window.addEventListener("keydown", cancelBoost);
                let advancedProfanityFilter = setInterval(() => {
                    ipcRenderer.send("evalInBrowserContext", `
                        var data = [];
                        for (let i in game.currentScene.chatMessages) {
                            data.push({
                                text: {
                                    _text: game.currentScene.chatMessages[i].text._text
                                }
                            });
                        }
                        window.electronAPI.ipcRenderer.send("ipcProxy", {
                            channel: "gameChatMessages",
                            data
                        });
                    `);
                    ipcRenderer.once("gameChatMessages", (_event, chatMessages) => {
                        for (let i in chatMessages) {
                            const message = chatMessages[i].text._text;
                            if (profanityFilter.isProfane(message)) {
                                const cleaned = profanityFilter.clean(message);
                                console.log(cleaned);
                                ipcRenderer.send("evalInBrowserContext", `
                                console.log(game.currentScene.chatMessages[${i}])
                                console.log(game.currentScene.chatMessages[${i}].setText)
                                
                                    game.currentScene.chatMessages[${i}].setText(
                                        "${cleaned}"
                                    );
                                `);
                            }
                        }
                    });
                }, 200);
                // plugins
                for (const i in settings.pluginsData) {
                    if (settings.pluginsData[i].src.length == 0)
                        continue;
                    for (const j in settings.pluginsData[i].src) {
                        if (settings.pluginsData[i].src[j].type == "game") {
                            ipcRenderer.send("evalInBrowserContext", settings.pluginsData[i].src[j].src);
                        }
                    }
                }
                // watch for game start
                const evolveObserver = new MutationObserver((mutations) => {
                    for (let i in settings.assetSwapperConfig) {
                        ipcRenderer.send("evalInBrowserContext", `
                        if (${settings.assetSwapperConfig[i].animal} == game.currentScene.myAnimal.visibleFishLevel) {
                            game.currentScene.myAnimal.setSkin(${settings.assetSwapperConfig[i].skin});
                        };
                        `);
                    }
                });
                const startObserver = new MutationObserver((mutations) => {
                    if (document.contains(document.querySelector("div.stats > div.animal-data > div.detailed-info > h4.name"))) {
                        // Asset swapper (do stuff on evolve)
                        const animalNameElement = document.querySelector("div.stats > div.animal-data > div.detailed-info > h4.name");
                        evolveObserver.observe(animalNameElement, { childList: true });
                        for (let i in settings.assetSwapperConfig) {
                            ipcRenderer.send("evalInBrowserContext", `
                            if (${settings.assetSwapperConfig[i].animal} == game.currentScene.myAnimal.visibleFishLevel) {
                                game.currentScene.myAnimal.setSkin(${settings.assetSwapperConfig[i].skin});
                            };
                            `);
                        }
                    }
                });
                startObserver.observe(element, {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                });
                // Function to be caled when game ends
                function onGameEnd() {
                    gameStarted = false;
                    closeObserver.disconnect();
                    evolveObserver.disconnect();
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                    window.removeEventListener("keydown", ghostSuicide);
                    window.removeEventListener("keydown", cancelBoost);
                    clearInterval(advancedProfanityFilter);
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
    // plugins
    for (const i in settings.pluginsData) {
        if (settings.pluginsData[i].src.length == 0)
            continue;
        for (const j in settings.pluginsData[i].src) {
            if (settings.pluginsData[i].src[j].type == "domloaded") {
                eval(settings.pluginsData[i].src[j].src);
            }
        }
    }
});
window.addEventListener("load", () => {
    // reload custom theme when everything loaded to prevent bug
    reloadCustomTheme();
});
// plugins
for (const i in settings.pluginsData) {
    if (settings.pluginsData[i].src.length == 0)
        continue;
    for (const j in settings.pluginsData[i].src) {
        if (settings.pluginsData[i].src[j].type == "preload") {
            eval(settings.pluginsData[i].src[j].src);
        }
    }
}
