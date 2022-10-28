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
const { ipcRenderer } = require('electron');
// Maintain compatibility when update
let API_URL = "";
if (window.location.hostname.startsWith("beta")) {
    API_URL = "https://apibeta.deeeep.io";
}
else {
    API_URL = "https://api.deeeep.io";
}
let settings = {
    customTheme: true,
    docassets: false,
    v3ui: false,
    assetSwapper: true,
    assetSwapperConfig: []
};
ipcRenderer.on("settings", (_event, s) => {
    settings = s;
});
function saveSettings() {
    console.log("Settings saved!");
    ipcRenderer.send("saveSettings", settings);
}
// Prevent starting RPC when game already started
let gameStarted = false;
window.addEventListener("DOMContentLoaded", () => {
    // DRC
    const clientVersion = document.querySelector(".client-version");
    /// @REMIND Update client version
    clientVersion.innerText = clientVersion.innerText + ", DRC v0.4.2b";
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
    const observer = new MutationObserver((mutations) => {
        if (document.contains(document.getElementById("customThemeName")))
            return;
        if (document.contains(document.querySelector(".vfm__content, .modal-content"))) {
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
        }
    });
    observer.observe(document.querySelector(".modals-container"), {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    // misc styles
    const miscStyles = document.createElement("style");
    miscStyles.innerHTML = `
    .spacer {
        width: 10px;
        height: 10px;
    }
    `;
    document.head.appendChild(miscStyles);
    // Evolution tree button
    const sidePaneTop = document.querySelector("div.p-2.sidebar.right.space-y-2 > .container > div.el-row.justify-center");
    const treeButtonContainer = sidePaneTop.querySelector("div").cloneNode(true);
    const treeButton = treeButtonContainer.firstElementChild;
    const treeName = treeButton.querySelector("span > span.inner");
    const treeIcon = treeButton.querySelector("span > svg");
    treeButton.classList.remove("pink");
    treeButton.classList.add("black");
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
        background-color: rgba(31, 41, 55, 1);
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
    }
    
    .tree-modal-content {
        display: flex;
        justify-content: center;
    }`;
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
