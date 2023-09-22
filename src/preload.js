"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { ipcRenderer, app, contextBridge } = require('electron');
const Filter = require('bad-words');
const cssjs = require('jotform-css.js');
const fs = require('node:fs');
const tippy_js_1 = __importDefault(require("tippy.js"));
// The DRC API
const DRC = {
    // Client info
    Client: {
        name: "Deeeep.io Reef Client",
        version: "1.1.1",
        versionTag: "v1.1.1"
    },
    // Utility functions
    Utils: {
        habitatToArray: function (num) {
            class Habitat {
                constructor(num) {
                    this.NAMES = ['Cold', 'Warm', 'Shallow', 'Deep', 'Fresh', 'Salt', 'Reef'];
                    this.MAX = Math.pow(2, this.NAMES.length) - 1;
                    this.habitatNum = num;
                }
                convertToBase(num, base) {
                    let conversion = [];
                    let power, quotient, remainder = 0;
                    if (num === 0) {
                        conversion = [0];
                    }
                    else {
                        power = Math.floor(Math.log(num) / Math.log(base));
                        while (power >= 0) {
                            quotient = Math.floor(num / Math.pow(base, power));
                            remainder = num % Math.pow(base, power);
                            conversion.unshift(quotient);
                            num = remainder;
                            power--;
                        }
                    }
                    return conversion;
                }
                convertToList() {
                    const conversion = this.convertToBase(Math.floor(this.habitatNum), 2);
                    const length = conversion.length;
                    let partialDisplay = [];
                    for (let index = 0; index < length; index += 2) {
                        let str = "";
                        let nextFlag = false;
                        let nextName = "";
                        let nextIndex = index + 1;
                        let currentFlag = conversion[index];
                        let currentName = currentFlag ? this.NAMES[index] : false;
                        if (nextIndex >= length) {
                            nextFlag = false;
                        }
                        else
                            nextFlag = conversion[nextIndex];
                        nextName = nextFlag ? this.NAMES[nextIndex] : false;
                        if (currentName && nextName) {
                            str = `${currentName}/${nextName}`;
                        }
                        else
                            str = currentName || nextName;
                        if (str) {
                            partialDisplay.push(str);
                        }
                    }
                    return partialDisplay;
                }
                hasReef() {
                    return this.habitatNum >= Math.pow(2, this.NAMES.length - 1);
                }
            }
            return (new Habitat(num)).convertToList();
        }
    },
    Modal: {
        buildModal: function (id, title, content, noOverlay) {
            const modalId = id.replaceAll(' ', "");
            const modalDiv = document.createElement("div");
            document.getElementById("app").appendChild(modalDiv);
            modalDiv.outerHTML = `<div id="${modalId}ModalContainer" class="drc-modal-modal-container drc-modal-hidden">
            <div id="${modalId}Container" class="drc-modal-container">
                ${noOverlay ? "" : "<div class=\"drc-modal-overlay vfm--overlay\"></div>"}
                <div id="${modalId}Modal" class="modal-content drc-modal-modal-content">
                    <span class="drc-modal-title">
                        <div></div>
                        <div class="justify-self-center" id=${modalId}ModalTitle>${title}</div>
                        <div></div>
                    </span>
                    <div class="drc-modal-content">
                        ${content}
                    </div>
                    <button id="${modalId}CloseButton" class="drc-modal-close"><svg width="1.125em" height="1.125em"
                            viewBox="0 0 24 24" class="svg-icon" color="gray" style="--sx:1; --sy:1; --r:0deg;">
                            <path
                                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">
                            </path>
                        </svg></button>
                </div>
            </div>
        </div>`;
            const modal = document.getElementById(`${modalId}ModalContainer`);
            document.getElementById(`${modalId}CloseButton`)?.addEventListener("click", () => {
                modal?.classList.add("drc-modal-hidden");
            });
            return modal;
        },
        buildTab: function (id, content, parent) {
            const modalId = id.replaceAll(' ', "");
            let tabs = "";
            let panes = "";
            for (let i in content) {
                tabs += `<div class="drc-tabs-item drc-is-left ${Number(i) === 0 ? "drc-is-active" : ""}" id="${modalId}Tab${i}">${content[i].name}</div>`;
                panes += `<div class="drc-pr-4 drc-pl-2 ${Number(i) === 0 ? "" : "drc-modal-hidden"}" id="${modalId}Pane${i}">${content[i].content}</div>`;
            }
            const modal = document.createElement("div");
            parent.appendChild(modal);
            modal.outerHTML = `<div class="drc-tabs drc-tabs-left" style="min-height: 200px;" id="${modalId}TabsContainer">
        <div class="drc-tabs-header drc-is-left">
            <div class="drc-tabs-nav-wrap drc-is-left">
                <div class="drc-tabs-nav-scroll">
                    <div class="drc-tabs-nav drc-is-left" role="tablist" style="transform: translateY(0px);">
                        <div class="drc-tabs-active-bar drc-is-left" style="transform: translateY(0px); height: 40px;" id="${modalId}ActiveBar"></div>
                        ${tabs}
                    </div>
                </div>
            </div>
        </div>
        <div class="drc-tabs-content">
        ${panes}
        </div>
    </div>
    `;
            const activeBar = document.getElementById(modalId + "ActiveBar");
            for (let i in content) {
                const tab = document.getElementById(modalId + "Tab" + i);
                const pane = document.getElementById(modalId + "Pane" + i);
                tab?.addEventListener("click", () => {
                    for (let j in content) {
                        document.getElementById(modalId + "Tab" + j).classList.remove("drc-is-active");
                        document.getElementById(modalId + "Pane" + j).classList.add("drc-modal-hidden");
                    }
                    tab.classList.add("drc-is-active");
                    pane?.classList.remove("drc-modal-hidden");
                    activeBar.setAttribute("style", "transform: translateY(" + Number(i) * 40 + "px); height: 40px;");
                });
            }
            const modalContainer = document.getElementById(modalId + "TabsContainer");
            return modalContainer;
        }
    },
    Preload: {
        evalInBrowserContext: function (str) {
            ipcRenderer.send("evalInBrowserContext", str);
        }
    },
    // Events
    EventObject: document.createElement("div"),
    Events: {
        DomContentLoaded: "DRC.DomContentLoaded",
        DocumentLoaded: "DRC.DocumentLoaded",
        GameStarted: "DRC.GameStarted",
        GameEnded: "DRC.GameEnded",
        GameEvolved: "DRC.GameEvolved",
        SettingsOpened: "DRC.SettingsOpened",
        EventList: {
            DomContentLoaded: new CustomEvent("DRC.DomContentLoaded"),
            DocumentLoaded: new CustomEvent("DRC.DocumentLoaded"),
            GameStarted: new CustomEvent("DRC.GameStarted"),
            GameEnded: new CustomEvent("DRC.GameEnded"),
            GameEvolved: new CustomEvent("DRC.GameEvolved"),
            SettingsOpened: new CustomEvent("DRC.SettingsOpened"),
        }
    },
    // Internal messaging
    InternalMessaging: {
        sendColourblindNames: function (colourblindNames) {
            for (let i in colourblindNames) {
                if (!colourblindNames[i].text.startsWith("<GRE>"))
                    continue;
                DRC.Preload.evalInBrowserContext(`
                game.currentScene.entityManager.animalsList[${i}].nameObject.text = "${colourblindNames[i].text.replace("<GRE>", "<BLU>").replaceAll('"', "&drcquot;")}".replaceAll("&drcquot;", '"')
                `);
            }
        },
        sendColourblindChatMessages: function (chatMessages) {
            for (let i in chatMessages) {
                const message = chatMessages[i].text._text;
                /*
                "<desc><TEAM></desc> <GRE>test</GRE> DRC <id>636</id> : test"
                "<GRE>test</GRE> DRC <id>636</id> : test"
                */
                if (message.match(/^(<desc>(<TEAM>|\[TEAM\]|<ALL>|\[ALL\])<\/desc> )?<GRE>/)) {
                    DRC.Preload.evalInBrowserContext(`
                        game.currentScene.chatMessages[${i}].setText(
                            "${message.replace("<GRE>", "<BLU>").replace("</GRE>", "</BLU>").replaceAll('"', "&drcquot;")}".replaceAll("&drcquot;", '"')
                        );
                    `);
                }
            }
        },
        sendGameChatMessages: function (chatMessages) {
            for (let i in chatMessages) {
                // Patch leetspeak
                const message = chatMessages[i].text._text
                    .replaceAll('1', 'i')
                    .replaceAll('2', 'z')
                    .replaceAll('3', 'e')
                    .replaceAll('4', 'a')
                    .replaceAll('5', 's')
                    .replaceAll('6', 'g')
                    .replaceAll('7', 't')
                    .replaceAll('8', 'b')
                    .replaceAll('9', 'g')
                    .replaceAll('0', 'o');
                if (profanityFilter.isProfane(message)) {
                    const cleaned = profanityFilter.clean(message);
                    console.log(cleaned);
                    DRC.Preload.evalInBrowserContext(`
                        game.currentScene.chatMessages[${i}].setText(
                            "${cleaned.replaceAll('"', "&drcquot;")}".replaceAll("&drcquot;", '"')
                        );
                    `);
                }
            }
        }
    }
};
Object.freeze(DRC); // Don't touch my api
// Maintain compatibility when update
let API_URL = "";
if (window.location.hostname.startsWith("beta")) {
    API_URL = "https://apibeta.deeeep.io";
}
else {
    API_URL = "https://api.deeeep.io";
}
// expose IPC to main world
contextBridge.exposeInMainWorld("DRC_API", {
    DRC
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
    pluginUserData: {},
    adBlocker: true,
    viewingGhosts: true,
    advancedProfanityFilter: true,
    gameName: "",
    gameAccounts: [],
    colourblind: false,
    discordRichPresence: true,
    developer: false,
    previousVersion: "",
    keybinds: {
        cancelCharge: "KeyC",
        evolutionTree: "KeyT",
        screenshot: "KeyV",
        ghostQuit: "KeyX",
        copyUrl: "KeyC",
        joinGame: "KeyJ"
    }
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
profanityFilter.addWords("drctest");
//stats
const animalStatData = JSON.parse(`[{"name":"fish","size":{"x":48,"y":68},"mass":1,"boosts":1,"level":0,"fishLevel":0,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":0.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":1,"healthMultiplier":1.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"crab","mass":1,"boosts":1,"level":1,"fishLevel":1,"oxygenTime":0,"oxygenTimeMs":0,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.5,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":2.5,"healthMultiplier":1.5,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"jellyfish","mass":1,"boosts":1,"level":2,"fishLevel":2,"oxygenTime":0,"oxygenTimeMs":0,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":2,"healthMultiplier":2,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":127,"biomes":[37,38,22,41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"squid","mass":1,"boosts":2,"level":3,"fishLevel":3,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":111,"biomes":[37,38,41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"seagull","mass":1,"boosts":2,"level":4,"fishLevel":4,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.05,"walkSpeedMultiplier":1.05,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":4.5,"healthMultiplier":4,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"ray","mass":1,"boosts":2,"level":5,"fishLevel":5,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.5,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":127,"biomes":[37,38,22,41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"beaver","mass":1,"boosts":2,"level":6,"fishLevel":6,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"penguin","mass":1,"boosts":2,"level":6,"fishLevel":7,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.15,"walkSpeedMultiplier":1.15,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":5.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"tshark","mass":1,"boosts":3,"level":8,"fishLevel":8,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":7.5,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"dolphin","mass":1,"boosts":3,"level":8,"fishLevel":9,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":38,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"shark","mass":1,"boosts":3,"level":9,"fishLevel":10,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":9,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":38,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"killerwhale","mass":1,"boosts":3,"level":9,"fishLevel":11,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":8,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"whale","mass":1,"boosts":3,"level":9,"fishLevel":12,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.05,"walkSpeedMultiplier":1.05,"jumpForceMultiplier":1,"sizeMultiplier":2.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":15,"damageBlock":0,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"worm","mass":1,"boosts":0,"level":0,"fishLevel":13,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":0.9,"sizeScale":{"x":0.8,"y":1},"damageMultiplier":1,"healthMultiplier":1,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":127,"biomes":[37,38,22,41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":true,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"anglerfish","mass":1,"boosts":2,"level":6,"fishLevel":14,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"leopardseal","mass":1,"boosts":2,"level":8,"fishLevel":15,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.15,"walkSpeedMultiplier":1.15,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"blobfish","mass":1,"boosts":1,"level":0,"fishLevel":16,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":1,"healthMultiplier":2,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"kingcrab","mass":1,"boosts":1,"level":1,"fishLevel":17,"oxygenTime":0,"oxygenTimeMs":0,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.5,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":2.5,"healthMultiplier":1.5,"damageBlock":0.5,"damageReflection":0.3,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"pollock","mass":1,"boosts":0,"level":0,"fishLevel":18,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.75,"walkSpeedMultiplier":0.75,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":1,"y":1},"damageMultiplier":0,"healthMultiplier":0.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"seaturtle","mass":1,"boosts":2,"level":8,"fishLevel":19,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"oarfish","mass":1,"boosts":2,"level":8,"fishLevel":20,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":60,"pressureTimeMs":60000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":0.76,"y":1.03},"damageMultiplier":6.5,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"octopus","mass":1,"boosts":2,"level":7,"fishLevel":21,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.4,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":111,"biomes":[37,38,41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1000,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantsquid","mass":1,"boosts":3,"level":9,"fishLevel":22,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":15,"pressureTimeMs":15000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":8,"healthMultiplier":8.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":600,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"narwhal","mass":1,"boosts":2,"level":8,"fishLevel":23,"oxygenTime":90,"oxygenTimeMs":90000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":90,"pressureTimeMs":90000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.95,"walkSpeedMultiplier":0.95,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":7.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":1,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"cachalot","mass":1,"boosts":3,"level":9,"fishLevel":24,"oxygenTime":90,"oxygenTimeMs":90000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":2.1,"sizeScale":{"x":1,"y":1.15},"damageMultiplier":8,"healthMultiplier":12,"damageBlock":0,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":47,"biomes":[37,38,41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"polarbear","mass":1,"boosts":3,"level":9,"fishLevel":25,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":40,"temperatureTimeMs":40000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":8,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"lamprey","mass":1,"boosts":2,"level":1,"fishLevel":26,"oxygenTime":5,"oxygenTimeMs":5000,"temperatureTime":5,"temperatureTimeMs":5000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":0.6,"sizeScale":{"x":1,"y":1.35},"damageMultiplier":2,"healthMultiplier":1.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":127,"biomes":[37,38,22,41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"pelican","mass":1,"boosts":2,"level":5,"fishLevel":27,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":118,"biomes":[38,22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"whaleshark","mass":1,"boosts":4,"level":9,"fishLevel":28,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":12,"damageBlock":0,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"remora","mass":1,"boosts":0,"level":0,"fishLevel":29,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.4,"walkSpeedMultiplier":1.4,"jumpForceMultiplier":1,"sizeMultiplier":0.5,"sizeScale":{"x":0.5,"y":1},"damageMultiplier":5,"healthMultiplier":1.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":true,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"marlin","mass":1,"boosts":2,"level":9,"fishLevel":30,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.2,"walkSpeedMultiplier":1.2,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.85,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":1,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":38,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sunfish","mass":1,"boosts":3,"level":9,"fishLevel":31,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":30,"temperatureTimeMs":30000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":3,"healthMultiplier":9,"damageBlock":0.3,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":46,"biomes":[38,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"stonefish","mass":1,"boosts":3,"level":9,"fishLevel":32,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":true,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"ghost","mass":1,"boosts":0,"level":0,"fishLevel":33,"oxygenTime":0,"oxygenTimeMs":0,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":1,"y":1},"damageMultiplier":0,"healthMultiplier":1.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":63,"biomes":[37,38,22,41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"crocodile","mass":1,"boosts":2,"level":9,"fishLevel":34,"oxygenTime":90,"oxygenTimeMs":90000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":7,"damageBlock":0.3,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"electriceel","mass":1,"boosts":2,"level":8,"fishLevel":35,"oxygenTime":75,"oxygenTimeMs":75000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.57,"y":1},"damageMultiplier":6,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"frog","mass":1,"boosts":2,"level":2,"fishLevel":36,"oxygenTime":75,"oxygenTimeMs":75000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":2,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":2,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"hippo","mass":1,"boosts":3,"level":9,"fishLevel":37,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.85,"walkSpeedMultiplier":0.85,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":8,"healthMultiplier":9,"damageBlock":0.3,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"manatee","mass":1,"boosts":2,"level":8,"fishLevel":38,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":4,"healthMultiplier":8,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"snappingturtle","mass":1,"boosts":2,"level":7,"fishLevel":39,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":5,"damageBlock":0.4,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"piranha","mass":1,"boosts":1,"level":0,"fishLevel":40,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":0.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":1.5,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1000,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"snake","mass":1,"boosts":2,"level":6,"fishLevel":41,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":0.62,"y":1},"damageMultiplier":5.5,"healthMultiplier":6.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":true,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"baldeagle","mass":1,"boosts":3,"level":9,"fishLevel":42,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":60,"temperatureTimeMs":60000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":7.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":55,"biomes":[37,38,22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":300,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"lionfish","mass":1,"boosts":2,"level":8,"fishLevel":43,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":0.85},"damageMultiplier":5,"healthMultiplier":6.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"dragonfly","mass":1,"boosts":0,"level":0,"fishLevel":44,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":0.5,"sizeScale":{"x":1,"y":1},"damageMultiplier":0,"healthMultiplier":0.1,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":6173,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"mantaray","mass":1,"boosts":2,"level":9,"fishLevel":45,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":30,"salinityTimeMs":30000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"elephantseal","mass":1,"boosts":3,"level":9,"fishLevel":46,"oxygenTime":120,"oxygenTimeMs":120000,"temperatureTime":30,"temperatureTimeMs":30000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":6,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"lanternfish","mass":1,"boosts":0,"level":0,"fishLevel":47,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.75,"walkSpeedMultiplier":0.75,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":0.86,"y":1},"damageMultiplier":0,"healthMultiplier":0.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":59,"biomes":[41,42,26],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sleepershark","mass":1,"boosts":3,"level":9,"fishLevel":48,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":15,"temperatureTimeMs":15000,"pressureTime":45,"pressureTimeMs":45000,"salinityTime":60,"salinityTimeMs":60000,"speedMultiplier":0.8,"walkSpeedMultiplier":0.8,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1.02},"damageMultiplier":8,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"gulpereel","mass":1,"boosts":2,"level":6,"fishLevel":49,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantisopod","mass":1,"boosts":2,"level":3,"fishLevel":50,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.8,"walkSpeedMultiplier":0.8,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantisopodclosed","mass":1,"boosts":2,"level":3,"fishLevel":51,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0,"walkSpeedMultiplier":0,"jumpForceMultiplier":1,"sizeMultiplier":0.9,"sizeScale":{"x":1,"y":0.7},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":1,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"babypenguin","mass":1,"boosts":1,"level":0,"fishLevel":52,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":1,"y":1},"damageMultiplier":0,"healthMultiplier":0.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"seal","mass":1,"boosts":2,"level":4,"fishLevel":53,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.15,"walkSpeedMultiplier":1.15,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":0.92},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0.4,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"icefish","mass":1,"boosts":1,"level":0,"fishLevel":54,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":5,"temperatureTimeMs":5000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":1,"y":1},"damageMultiplier":1,"healthMultiplier":2,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"barreleye","mass":1,"boosts":2,"level":4,"fishLevel":55,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":5,"temperatureTimeMs":5000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":1.07},"damageMultiplier":3.5,"healthMultiplier":4,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"dragonfish","mass":1,"boosts":2,"level":7,"fishLevel":56,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":30,"temperatureTimeMs":30000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1.29},"damageMultiplier":6.25,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"humboldtsquid","mass":1,"boosts":2,"level":8,"fishLevel":57,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.83,"y":1},"damageMultiplier":4,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sealion","mass":1,"boosts":2,"level":7,"fishLevel":58,"oxygenTime":50,"oxygenTimeMs":50000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.1,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":1.03},"damageMultiplier":6,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"flyingfish","mass":1,"boosts":2,"level":2,"fishLevel":59,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.1,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":0.7,"y":1},"damageMultiplier":2,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"duck","mass":1,"boosts":2,"level":4,"fishLevel":60,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":4,"healthMultiplier":4.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"goblinshark","mass":1,"boosts":3,"level":9,"fishLevel":61,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":7.5,"healthMultiplier":7.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":400,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"catfish","mass":1,"boosts":1,"level":3,"fishLevel":62,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":2000,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"littleauk","mass":1,"boosts":2,"level":3,"fishLevel":63,"oxygenTime":25,"oxygenTimeMs":25000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.05,"walkSpeedMultiplier":1.05,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":0.89},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"pufferfish","mass":1,"boosts":2,"level":5,"fishLevel":64,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"pufferfishfilled","mass":1,"boosts":2,"level":5,"fishLevel":65,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1.17,"y":1},"damageMultiplier":1,"healthMultiplier":5,"damageBlock":0.6,"damageReflection":0.7,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"tigershark","mass":1,"boosts":3,"level":9,"fishLevel":66,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1.14},"damageMultiplier":8,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"lionmanejellyfish","mass":1,"boosts":3,"level":8,"fishLevel":67,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.5,"walkSpeedMultiplier":0.5,"jumpForceMultiplier":1,"sizeMultiplier":5,"sizeScale":{"x":1,"y":0.55},"damageMultiplier":4,"healthMultiplier":20,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":true,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"anaconda","mass":1,"boosts":2,"level":9,"fishLevel":68,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":0.49,"y":1},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":true,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"bobbitworm","mass":1,"boosts":2,"level":5,"fishLevel":69,"oxygenTime":5,"oxygenTimeMs":5000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.85,"walkSpeedMultiplier":0.85,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":0.66,"y":1},"damageMultiplier":3.5,"healthMultiplier":4,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.25,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":111,"biomes":[37,38,41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":true,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"mahimahi","mass":1,"boosts":2,"level":7,"fishLevel":70,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.93,"y":1},"damageMultiplier":5,"healthMultiplier":6,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":250,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"walrus","mass":1,"boosts":3,"level":9,"fishLevel":71,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"frilledshark","mass":1,"boosts":3,"level":8,"fishLevel":72,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.8,"walkSpeedMultiplier":0.8,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":0.53,"y":1},"damageMultiplier":4.5,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sawfish","mass":1,"boosts":3,"level":9,"fishLevel":73,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":120,"salinityTimeMs":120000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":6.5,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":54,"biomes":[38,22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1000,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"mantisshrimp","mass":1,"boosts":2,"level":8,"fishLevel":74,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":0.85,"y":1},"damageMultiplier":5,"healthMultiplier":6.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.75,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"axolotl","mass":1,"boosts":2,"level":3,"fishLevel":75,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":3,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"bat","mass":1,"boosts":2,"level":4,"fishLevel":76,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.15,"walkSpeedMultiplier":1.15,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":4.5,"healthMultiplier":3.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":200,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"firefly","mass":1,"boosts":0,"level":0,"fishLevel":77,"oxygenTime":5,"oxygenTimeMs":5000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":0.8,"sizeScale":{"x":1,"y":0.9},"damageMultiplier":0,"healthMultiplier":0.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":true,"canSwim":false,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"blindcavefish","mass":1,"boosts":1,"level":0,"fishLevel":78,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":0.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":1,"healthMultiplier":1.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"crayfish","mass":1,"boosts":1,"level":1,"fishLevel":79,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":1,"y":1},"damageMultiplier":2,"healthMultiplier":1.5,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"goliathbullfrog","mass":1,"boosts":2,"level":5,"fishLevel":80,"oxygenTime":75,"oxygenTimeMs":75000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":2,"sizeMultiplier":1.5,"sizeScale":{"x":1,"y":0.81},"damageMultiplier":5,"healthMultiplier":5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":350,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantsalamander","mass":1,"boosts":3,"level":8,"fishLevel":81,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":0.88},"damageMultiplier":5,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"alligatorsnappingturtle","mass":1,"boosts":3,"level":9,"fishLevel":82,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":7,"damageBlock":0.35,"damageReflection":0.25,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1500,"hasScalingBoost":true,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantsoftshellturtle","mass":1,"boosts":2,"level":9,"fishLevel":83,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":0.82},"damageMultiplier":4,"healthMultiplier":9,"damageBlock":0.3,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantsoftshellturtleclosed","mass":1,"boosts":2,"level":9,"fishLevel":84,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0,"walkSpeedMultiplier":0,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":0.79},"damageMultiplier":3,"healthMultiplier":9,"damageBlock":0.9,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"olm","mass":1,"boosts":2,"level":2,"fishLevel":85,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.2,"sizeScale":{"x":0.77,"y":1},"damageMultiplier":2,"healthMultiplier":3,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"alligatorgar","mass":1,"boosts":3,"level":9,"fishLevel":86,"oxygenTime":90,"oxygenTimeMs":90000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":60,"salinityTimeMs":60000,"speedMultiplier":1.05,"walkSpeedMultiplier":1.05,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1.2},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0.1,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.4,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1000,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"humpbackwhale","mass":1,"boosts":3,"level":9,"fishLevel":87,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2.2,"sizeScale":{"x":1,"y":1.06},"damageMultiplier":5,"healthMultiplier":12,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":150,"hasScalingBoost":false,"ungrabbable":true,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sardine","mass":1,"boosts":0,"level":0,"fishLevel":88,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.75,"walkSpeedMultiplier":0.75,"jumpForceMultiplier":1,"sizeMultiplier":1,"sizeScale":{"x":1,"y":1},"damageMultiplier":0,"healthMultiplier":0.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":38,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"horseshoecrab","mass":1,"boosts":2,"level":2,"fishLevel":89,"oxygenTime":0,"oxygenTimeMs":0,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":0.75},"damageMultiplier":2,"healthMultiplier":3,"damageBlock":0.5,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":38,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"baskingshark","mass":1,"boosts":3,"level":9,"fishLevel":90,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":25,"pressureTimeMs":25000,"salinityTime":15,"salinityTimeMs":15000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2.1,"sizeScale":{"x":1,"y":1.04},"damageMultiplier":7,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":true,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"colossalsquid","mass":1,"boosts":3,"level":9,"fishLevel":91,"oxygenTime":10,"oxygenTimeMs":10000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.9,"walkSpeedMultiplier":0.9,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":800,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"climbingcavefish","mass":1,"boosts":1,"level":1,"fishLevel":92,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":1,"y":1},"damageMultiplier":2,"healthMultiplier":2,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":31,"biomes":[22,26],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":300,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"archerfish","mass":1,"boosts":3,"level":5,"fishLevel":93,"oxygenTime":25,"oxygenTimeMs":25000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.1,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":4,"healthMultiplier":4.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":23,"biomes":[22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"seaotter","mass":1,"boosts":2,"level":6,"fishLevel":94,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":0.93},"damageMultiplier":5,"healthMultiplier":5.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":39,"biomes":[37,38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"lobster","mass":1,"boosts":2,"level":5,"fishLevel":95,"oxygenTime":45,"oxygenTimeMs":45000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":4,"healthMultiplier":4,"damageBlock":0.35,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"barracuda","mass":1,"boosts":2,"level":7,"fishLevel":96,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.75,"y":1},"damageMultiplier":6,"healthMultiplier":6.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"frogfish","mass":1,"boosts":2,"level":6,"fishLevel":97,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.5,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.6,"sizeScale":{"x":1,"y":0.82},"damageMultiplier":5,"healthMultiplier":5.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":true,"walkingAbilityLoadTime":250},{"name":"morayeel","mass":1,"boosts":3,"level":9,"fishLevel":98,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1.1,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":0.55,"y":1},"damageMultiplier":7.5,"healthMultiplier":7.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"wobbegongshark","mass":1,"boosts":3,"level":8,"fishLevel":99,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":1,"y":1.03},"damageMultiplier":6.5,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.4,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":400,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"leatherbackturtle","mass":1,"boosts":3,"level":9,"fishLevel":100,"oxygenTime":110,"oxygenTimeMs":110000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":6.5,"healthMultiplier":8.5,"damageBlock":0.3,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":110,"biomes":[38,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"threshershark","mass":1,"boosts":3,"level":9,"fishLevel":101,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"atlantictorpedo","mass":1,"boosts":2,"level":9,"fishLevel":102,"oxygenTime":80,"oxygenTimeMs":80000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":0.93},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":1000,"hasScalingBoost":true,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"coconutcrab","mass":1,"boosts":3,"level":9,"fishLevel":103,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.6,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.6,"sizeScale":{"x":1.4,"y":0.79},"damageMultiplier":7,"healthMultiplier":7,"damageBlock":0.35,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":true,"canClimb":true,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":true,"walkingAbilityLoadTime":250},{"name":"bullshark","mass":1,"boosts":3,"level":9,"fishLevel":104,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":0.99},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.4,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":54,"biomes":[38,22],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"hermitcrab","mass":1,"boosts":2,"level":3,"fishLevel":105,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1.1,"jumpForceMultiplier":1,"sizeMultiplier":1.1,"sizeScale":{"x":1,"y":0.86},"damageMultiplier":2.5,"healthMultiplier":2.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":true,"poisonResistant":false,"habitat":110,"biomes":[38,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":true,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":true,"walkingAbilityLoadTime":250},{"name":"giantpacificoctopus","mass":1,"boosts":3,"level":9,"fishLevel":106,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":60,"temperatureTimeMs":60000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":1,"y":1},"damageMultiplier":9,"healthMultiplier":7.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.25,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"beakedwhale","mass":1,"boosts":3,"level":9,"fishLevel":107,"oxygenTime":140,"oxygenTimeMs":140000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":9,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":47,"biomes":[37,38,41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":750,"hasScalingBoost":true,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"megamouthshark","mass":1,"boosts":3,"level":9,"fishLevel":108,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":10,"salinityTimeMs":10000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"belugawhale","mass":1,"boosts":3,"level":8,"fishLevel":109,"oxygenTime":60,"oxygenTimeMs":60000,"temperatureTime":30,"temperatureTimeMs":30000,"pressureTime":60,"pressureTimeMs":60000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":600,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"vampiresquid","mass":1,"boosts":2,"level":4,"fishLevel":110,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":20,"pressureTimeMs":20000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":1},"damageMultiplier":4,"healthMultiplier":3.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"halibut","mass":1,"boosts":3,"level":9,"fishLevel":111,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":1},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":600,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"bowheadwhale","mass":1,"boosts":3,"level":9,"fishLevel":112,"oxygenTime":75,"oxygenTimeMs":75000,"temperatureTime":20,"temperatureTimeMs":20000,"pressureTime":10,"pressureTimeMs":10000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":2.2,"sizeScale":{"x":1,"y":0.95},"damageMultiplier":5,"healthMultiplier":11,"damageBlock":0,"damageReflection":0,"bleedReduction":0.5,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":true,"canClimb":false,"poisonResistant":false,"habitat":37,"biomes":[37],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":true,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"japanesespidercrab","mass":1,"boosts":3,"level":9,"fishLevel":113,"oxygenTime":30,"oxygenTimeMs":30000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.6,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.6,"sizeScale":{"x":1.1,"y":0.73},"damageMultiplier":6,"healthMultiplier":8,"damageBlock":0.25,"damageReflection":0.15,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":true,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":true,"hasWalkingAbility":true,"walkingAbilityLoadTime":250},{"name":"cookiecuttershark","mass":1,"boosts":2,"level":5,"fishLevel":114,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":60,"pressureTimeMs":60000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":0.8,"y":1},"damageMultiplier":4,"healthMultiplier":4.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":300,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"sarcasticfringehead","mass":1,"boosts":2,"level":5,"fishLevel":115,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":15,"salinityTimeMs":15000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.4,"sizeScale":{"x":1,"y":1},"damageMultiplier":5,"healthMultiplier":4.5,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"parrotfish","mass":1,"boosts":2,"level":4,"fishLevel":116,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":15,"salinityTimeMs":15000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.3,"sizeScale":{"x":1,"y":0.97},"damageMultiplier":3.5,"healthMultiplier":4,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.5,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"wolfeel","mass":1,"boosts":2,"level":8,"fishLevel":117,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":30,"temperatureTimeMs":30000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.7,"sizeScale":{"x":0.64,"y":1},"damageMultiplier":7,"healthMultiplier":7,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.3,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":45,"biomes":[37,41],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":600,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"giantsiphonophore","mass":1,"boosts":2,"level":8,"fishLevel":118,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":0.55,"walkSpeedMultiplier":0.55,"jumpForceMultiplier":1,"sizeMultiplier":2.1,"sizeScale":{"x":1.25,"y":1},"damageMultiplier":0,"healthMultiplier":10,"damageBlock":0,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":41,"biomes":[41],"collisionCategory":1,"collisionMask":7935,"chooseable":false,"hasSecondaryAbility":false,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":true,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"coelacanth","mass":1,"boosts":3,"level":9,"fishLevel":119,"oxygenTime":20,"oxygenTimeMs":20000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":30,"pressureTimeMs":30000,"salinityTime":20,"salinityTimeMs":20000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.8,"sizeScale":{"x":0.94,"y":1},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0.2,"damageReflection":0,"bleedReduction":0,"armorPenetration":0,"poisonResistance":0,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":43,"biomes":[41,42],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":250,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250},{"name":"napoleonwrasse","mass":1,"boosts":3,"level":9,"fishLevel":120,"oxygenTime":15,"oxygenTimeMs":15000,"temperatureTime":10,"temperatureTimeMs":10000,"pressureTime":5,"pressureTimeMs":5000,"salinityTime":30,"salinityTimeMs":30000,"speedMultiplier":1,"walkSpeedMultiplier":1,"jumpForceMultiplier":1,"sizeMultiplier":1.9,"sizeScale":{"x":1,"y":0.9},"damageMultiplier":7,"healthMultiplier":8,"damageBlock":0.15,"damageReflection":0,"bleedReduction":0,"armorPenetration":0.15,"poisonResistance":0.2,"permanentEffects":0,"canFly":false,"canSwim":true,"canStand":false,"needsAir":false,"canClimb":false,"poisonResistant":false,"habitat":102,"biomes":[38],"collisionCategory":1,"collisionMask":7935,"chooseable":true,"hasSecondaryAbility":true,"secondaryAbilityLoadTime":500,"hasScalingBoost":false,"ungrabbable":false,"canDig":false,"canWalkUnderwater":false,"hasWalkingAbility":false,"walkingAbilityLoadTime":250}]`);
// IDK what happened but this is to prevent a bug from happening
let reloadCustomTheme = () => { };
window.addEventListener("DOMContentLoaded", () => {
    // DRC
    document.body.appendChild(DRC.EventObject);
    DRC.EventObject.dispatchEvent(DRC.Events.EventList.DomContentLoaded);
    // DRC
    const clientVersion = document.querySelector(".client-version");
    /// @REMIND Update client version
    clientVersion.innerText = clientVersion.innerText + ", DRC " + DRC.Client.versionTag;
    // Top right nav
    const topRightNav = document.querySelector("div.el-row.top-right-nav.items-center");
    // Seamless title bar
    const windowControlsStyle = document.createElement("style");
    windowControlsStyle.innerHTML = `
        @media (-webkit-device-pixel-ratio: 1.5), (device-pixel-ratio: 1.5),
        (-webkit-device-pixel-ratio: 2), (device-pixel-ratio: 2),
        (-webkit-device-pixel-ratio: 3), (device-pixel-ratio: 3) {
        #windowControls .icon {
            width: 10px;
            height: 10px;
        }
        }

        #windowControls {
            display: grid;
            grid-template-columns: repeat(3, 46px);
            position: absolute;
            top: 0;
            right: 0;
            height: 35px;
            background-color: #2f3342;
            border-radius: 0px 0px 0px 15px;
            z-index: 99999;
        }
        
        #windowControls .button {
            grid-row: 1 / span 1;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
        #windowMinButton {
            grid-column: 1;
        }
        #windowMaxButton, #windowRestoreButton {
            grid-column: 2;
        }
        #windowCloseButton {
            grid-column: 3;
        }
        #windowControls {
            -webkit-app-region: no-drag;
            pointer-events: auto;
        }
        
        #windowControls .button {
            user-select: none;
        }
        #windowControls .button:hover {
            background: rgba(255,255,255,0.1);
        }
        #windowControls .button:active {
            background: rgba(255,255,255,0.2);
        }
        
        #windowControls.win > #windowCloseButton:hover {
            background: #E81123 !important;
        }
        #windowControls.win > #windowCloseButton:active {
            background: #F1707A !important;
        }
        #windowControls.win > #windowCloseButton:active .icon {
            filter: invert(1);
        }
        
        #windowRestoreButton {
            display: none;
        }

        #windowMinButton {
            border-radius: 0px 0px 0px 15px;
        }

        #windowControls.mac > #windowMinButton > img {
            background-color: green;
            border-radius: 50%;
            width: 15px;
            height: 15px;
        }

        #windowControls.mac > #windowMaxButton > img, #windowControls.mac > #windowRestoreButton > img {
            background-color: yellow;
            border-radius: 50%;
            width: 15px;
            height: 15px;
        }

        #windowControls.mac > #windowCloseButton > img {
            background-color: red;
            border-radius: 50%;
            width: 15px;
            height: 15px;
        }

        .windowDragRegion {
            -webkit-app-region: drag;
            pointer-events: none;
            width: 100%;
        }
    `;
    document.head.appendChild(windowControlsStyle);
    const windowControls = document.createElement("div");
    windowControls.innerHTML = `
        <div class="windowDragRegion" style="height:0.5rem;">
        <div id="windowControls">

            <div class="button" id="windowMinButton">
                <img class="icon" srcset="
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGOmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEzOjAwOjMyWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMzowMDozMloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEzOjAwOjMyWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4NWQwZWRiMC1mZDAwLWI2NGYtOWVmYi1hMmI0NTg3MDVhOGEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDphMzAwMWUxYS0yOTE5LWU0NDktYjk0Yy1jMjEyMjQ4YTlmOGEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ODdmNzk5Yy00YjExLWU1NGEtYjIwZC02ODYxN2VkOWM1ZTIiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo3ODdmNzk5Yy00YjExLWU1NGEtYjIwZC02ODYxN2VkOWM1ZTIiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6MDA6MzJaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjg1ZDBlZGIwLWZkMDAtYjY0Zi05ZWZiLWEyYjQ1ODcwNWE4YSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzowMDozMloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSLupKEiIHBob3Rvc2hvcDpMYXllclRleHQ9Iu6koSIvPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOlRleHRMYXllcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+FwvRXAAAABdJREFUGNNj/P//PwMxgHGIKPw/XDwDAOr1HuzlELLnAAAAAElFTkSuQmCC 1x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAJE2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMC0wMi0xN1QxMzo0MDoyNVoiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjAtMDItMTdUMTM6NDA6NDBaIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wMi0xN1QxMzo0MDo0MFoiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmM4YWI2OTdkLWJiY2UtYzA0ZS04MTU0LTJlMzU5ZTMyZmI4ZCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmZkNzJjZWY3LTIxNjYtMWY0NC04OWY3LWNmZTc3YzhjM2Y1MSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjc2Y2NlNjA1LTZmZmItNGM0Yi1iYjVhLTE5MWU3Y2U1NjFlZCIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NzZjY2U2MDUtNmZmYi00YzRiLWJiNWEtMTkxZTdjZTU2MWVkIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTE3VDEzOjQwOjI1WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpmZWYwNmIyYS1kYjg2LTUyNDctOWYyZC1jOThjYzA2ZDlkNGYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6NDA6NDBaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM4YWI2OTdkLWJiY2UtYzA0ZS04MTU0LTJlMzU5ZTMyZmI4ZCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzo0MDo0MFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZmVmMDZiMmEtZGI4Ni01MjQ3LTlmMmQtYzk4Y2MwNmQ5ZDRmIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjc2Y2NlNjA1LTZmZmItNGM0Yi1iYjVhLTE5MWU3Y2U1NjFlZCIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjc2Y2NlNjA1LTZmZmItNGM0Yi1iYjVhLTE5MWU3Y2U1NjFlZCIvPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6OTczZWUzMGQtYzgyOC0xMDRlLTk1OTYtMDY3Mjc4MTg4NWYzPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+ZL9kGwAAABlJREFUKM9j/P//PwMpgHGYaPg/Ej1NWw0Auwgk6PqXFCMAAAAASUVORK5CYII= 1.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ4OjM3WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0ODozN1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ4OjM3WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1OTUyNzc0Mi0wY2NiLTU3NGItOGQ2Yi1hYTQyNjY0OWVlZTAiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkZDZmYzZkNi1mOTA0LTJjNDktYjEyYS0wYjBlYWNhNGMyNzQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4NmQ5MDY3Mi1hNWJjLTEwNDEtYjUxMi0zOTczODI3MGU4ZWYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4NmQ5MDY3Mi1hNWJjLTEwNDEtYjUxMi0zOTczODI3MGU4ZWYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDg6MzdaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU5NTI3NzQyLTBjY2ItNTc0Yi04ZDZiLWFhNDI2NjQ5ZWVlMCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0ODozN1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7rsqrOAAAAG0lEQVQoz2P8//8/A7mAcVQznTX/Hw2wYa8ZAB/yLeL/seQqAAAAAElFTkSuQmCC 1.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ4OjM3WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0ODozN1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ4OjM3WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1OTUyNzc0Mi0wY2NiLTU3NGItOGQ2Yi1hYTQyNjY0OWVlZTAiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkZDZmYzZkNi1mOTA0LTJjNDktYjEyYS0wYjBlYWNhNGMyNzQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4NmQ5MDY3Mi1hNWJjLTEwNDEtYjUxMi0zOTczODI3MGU4ZWYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4NmQ5MDY3Mi1hNWJjLTEwNDEtYjUxMi0zOTczODI3MGU4ZWYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDg6MzdaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU5NTI3NzQyLTBjY2ItNTc0Yi04ZDZiLWFhNDI2NjQ5ZWVlMCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0ODozN1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7rsqrOAAAAG0lEQVQoz2P8//8/A7mAcVQznTX/Hw2wYa8ZAB/yLeL/seQqAAAAAElFTkSuQmCC 1.75x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxNDozNVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozZmExNWQ3Zi02MzdjLTk3NDAtYTU1Zi1mOTZmNWNkNWMwZTQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkYTVlNmE2ZC1hNTdlLTY2NGQtOWZlOC1iNWFlMTkyZTkwNjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4ZjczYTUyZS02ZTAyLWFhNDktYTM4NS03ZWIyMjk2NjFmYjEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjhmNzNhNTJlLTZlMDItYWE0OS1hMzg1LTdlYjIyOTY2MWZiMSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxNDozNVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6M2ZhMTVkN2YtNjM3Yy05NzQwLWE1NWYtZjk2ZjVjZDVjMGU0IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuSjhtoAAAAjSURBVDjLY/z//z8DNQHjqIGjBg4SA/8PegNHY3nUwGFnIAACTj3XAGVWvgAAAABJRU5ErkJggg== 2x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxNDozNVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozZmExNWQ3Zi02MzdjLTk3NDAtYTU1Zi1mOTZmNWNkNWMwZTQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkYTVlNmE2ZC1hNTdlLTY2NGQtOWZlOC1iNWFlMTkyZTkwNjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4ZjczYTUyZS02ZTAyLWFhNDktYTM4NS03ZWIyMjk2NjFmYjEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjhmNzNhNTJlLTZlMDItYWE0OS1hMzg1LTdlYjIyOTY2MWZiMSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxNDozNVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6M2ZhMTVkN2YtNjM3Yy05NzQwLWE1NWYtZjk2ZjVjZDVjMGU0IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjE0OjM1WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuSjhtoAAAAjSURBVDjLY/z//z8DNQHjqIGjBg4SA/8PegNHY3nUwGFnIAACTj3XAGVWvgAAAABJRU5ErkJggg== 2.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAACTpAAAk6QFQJOf4AAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjM4OjI3WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjozODoyN1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjM4OjI3WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyMGVjMDQzZi01OWVhLTkzNGEtYWRiMy1mMDg3ZWI1NzkzZGUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4NDU3NjJhMi0yYThjLWVmNGQtOTIxYi00YjhiNzgwYzU5NWEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiN2Q3MjdjZS0wOWMxLTM1NDItOTdhNy1kZDg2YTdhNzg5NTEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmI3ZDcyN2NlLTA5YzEtMzU0Mi05N2E3LWRkODZhN2E3ODk1MSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjozODoyN1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MjBlYzA0M2YtNTllYS05MzRhLWFkYjMtZjA4N2ViNTc5M2RlIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjM4OjI3WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgQA91kAAAApSURBVEgNY/j//z8DLTHDqAWjFoxaMEwsoCmgiwWjkTxqwagFoxYQwACqUOlrohqodAAAAABJRU5ErkJggg== 2.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMzowMToxNloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1YzEwNjAyNC03ZGM4LTZmNDMtYWM2Yi1lMjY4MGViM2M3MTUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0Mjc4YzNmYi03YjQ4LTcyNDMtYTIxZS1kZmJmNjAxNDNiNjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NWNiMmRjYi05N2EyLWVlNGUtYjJkNC03ODMwM2YyYTg0MjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU1Y2IyZGNiLTk3YTItZWU0ZS1iMmQ0LTc4MzAzZjJhODQyMyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMzowMToxNloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NWMxMDYwMjQtN2RjOC02ZjQzLWFjNmItZTI2ODBlYjNjNzE1IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiOGtO8AAAAtSURBVEjH7dIxAQAACMMw5l/0cMDLkxrI07SdjwIGg8Fg8AUXbC4wGAwGv8ILSdFcwiT/QOMAAAAASUVORK5CYII= 3x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMzowMToxNloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1YzEwNjAyNC03ZGM4LTZmNDMtYWM2Yi1lMjY4MGViM2M3MTUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0Mjc4YzNmYi03YjQ4LTcyNDMtYTIxZS1kZmJmNjAxNDNiNjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NWNiMmRjYi05N2EyLWVlNGUtYjJkNC03ODMwM2YyYTg0MjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU1Y2IyZGNiLTk3YTItZWU0ZS1iMmQ0LTc4MzAzZjJhODQyMyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMzowMToxNloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NWMxMDYwMjQtN2RjOC02ZjQzLWFjNmItZTI2ODBlYjNjNzE1IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIzOjAxOjE2WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiOGtO8AAAAtSURBVEjH7dIxAQAACMMw5l/0cMDLkxrI07SdjwIGg8Fg8AUXbC4wGAwGv8ILSdFcwiT/QOMAAAAASUVORK5CYII= 3.5x
                " draggable="false" />
            </div>

            <div class="button" id="windowMaxButton">
                <img class="icon" srcset="
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGOmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEyOjU1OjM3WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMjo1NTozN1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEyOjU1OjM3WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2OTMzMjljYS1jZDY3LTM2NGYtODM1NS02OTdmZmMyNGQ3ZWQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDplOTk5YzY1Zi00OGE5LTA2NDItYjYxOS1mYmVhMTEyZTE4ZmIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo4MmY0MGJlNy0xNGMyLWY3NDYtYWZhNS1kMWJiMTcwMjIzODgiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MmY0MGJlNy0xNGMyLWY3NDYtYWZhNS1kMWJiMTcwMjIzODgiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTI6NTU6MzdaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5MzMyOWNhLWNkNjctMzY0Zi04MzU1LTY5N2ZmYzI0ZDdlZCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMjo1NTozN1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSLupKIiIHBob3Rvc2hvcDpMYXllclRleHQ9Iu6koiIvPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOlRleHRMYXllcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+TTNTgQAAABZJREFUGJVj+E8kYAATBMCoQuIUEgMA5PiPcSWMrJ0AAAAASUVORK5CYII=1x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGVmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEzOjM3OjE0WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMzozNzoxNFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEzOjM3OjE0WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphY2Y5ZWE4MS1lYmZjLTlmNDctOGQxNi05NmRkZmYyM2VmYjUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1MjJhNjAxYS1jOTdlLTlkNDItYmVhMy1jMDIyODI0N2UyZGYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphOWE0MDM3Yi0wNDViLWUxNGUtYjQwNS1jMzIzMDhhOGMwOWQiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphOWE0MDM3Yi0wNDViLWUxNGUtYjQwNS1jMzIzMDhhOGMwOWQiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6Mzc6MTRaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmFjZjllYTgxLWViZmMtOWY0Ny04ZDE2LTk2ZGRmZjIzZWZiNSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzozNzoxNFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk3M2VlMzBkLWM4MjgtMTA0ZS05NTk2LTA2NzI3ODE4ODVmMzwvcmRmOmxpPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PhK7Oe0AAAAXSURBVCiRY/hPImBAoonBoxqGugaiAQA8/do0e9R3nwAAAABJRU5ErkJggg== 1.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ2OjA0WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0NjowNFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ2OjA0WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NzA2ZWNmMC1mMjlmLWIyNGItYjA3OS05M2VlZTI5NjdkMDYiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1ZTk4MWNlMi0zMzRjLTdjNGQtOGZmOC0wOGZkZTg2NGQ3ZGIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphNzI1M2YwZC1mZGU5LTY0NDMtYjZiMi1lNzRkYWExMjU0OTMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphNzI1M2YwZC1mZGU5LTY0NDMtYjZiMi1lNzRkYWExMjU0OTMiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDY6MDRaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY3MDZlY2YwLWYyOWYtYjI0Yi1iMDc5LTkzZWVlMjk2N2QwNiIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0NjowNFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4tQC9mAAAAGUlEQVQoFWP4TwFgQKJJxaOaRzUPe81kAQCSf9hEmzjdHQAAAABJRU5ErkJggg== 1.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ2OjA0WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0NjowNFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ2OjA0WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NzA2ZWNmMC1mMjlmLWIyNGItYjA3OS05M2VlZTI5NjdkMDYiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1ZTk4MWNlMi0zMzRjLTdjNGQtOGZmOC0wOGZkZTg2NGQ3ZGIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphNzI1M2YwZC1mZGU5LTY0NDMtYjZiMi1lNzRkYWExMjU0OTMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphNzI1M2YwZC1mZGU5LTY0NDMtYjZiMi1lNzRkYWExMjU0OTMiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDY6MDRaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY3MDZlY2YwLWYyOWYtYjI0Yi1iMDc5LTkzZWVlMjk2N2QwNiIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0NjowNFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4tQC9mAAAAGUlEQVQoFWP4TwFgQKJJxaOaRzUPe81kAQCSf9hEmzjdHQAAAABJRU5ErkJggg== 1.75x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxNTo1NloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmZjA2ZmExNC02NDc3LWVjNGQtYmU3NS1lZTAzYjZhMjlmNzciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjMDVlNDdhMi1lYjkyLTRmNDYtOWE5OS03ZTIwN2NjMThmMDciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5Nzk5NjA3Mi1hMzE2LWJlNGEtYjU0OC03ZmZiNGE2MDVlYTQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk3OTk2MDcyLWEzMTYtYmU0YS1iNTQ4LTdmZmI0YTYwNWVhNCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxNTo1NloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmYwNmZhMTQtNjQ3Ny1lYzRkLWJlNzUtZWUwM2I2YTI5Zjc3IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiQbBrUAAAAiSURBVDgRY/hPZcBASwMZKMSjBo4aOGrgqIHDxcDBWWIDAGCmOww2UR/NAAAAAElFTkSuQmCC 2x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxNTo1NloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmZjA2ZmExNC02NDc3LWVjNGQtYmU3NS1lZTAzYjZhMjlmNzciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjMDVlNDdhMi1lYjkyLTRmNDYtOWE5OS03ZTIwN2NjMThmMDciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5Nzk5NjA3Mi1hMzE2LWJlNGEtYjU0OC03ZmZiNGE2MDVlYTQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk3OTk2MDcyLWEzMTYtYmU0YS1iNTQ4LTdmZmI0YTYwNWVhNCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxNTo1NloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmYwNmZhMTQtNjQ3Ny1lYzRkLWJlNzUtZWUwM2I2YTI5Zjc3IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjE1OjU2WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiQbBrUAAAAiSURBVDgRY/hPZcBASwMZKMSjBo4aOGrgqIHDxcDBWWIDAGCmOww2UR/NAAAAAElFTkSuQmCC 2.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAACTpAAAk6QFQJOf4AAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjM5OjM0WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjozOTozNFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjM5OjM0WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0YzUyYzYzYy1kN2EwLTBhNGMtOTQwZC0yMDZlYWQ1ZWUwNWEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NTc0Yjk2YS01N2ZjLTBjNGUtYjM0ZC1iMTkyNzJiOTE0YzUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3M2E1Mjg0MS0yYjQwLTVlNGYtOTM3ZS1jMjNmM2YxMzY1YzUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjczYTUyODQxLTJiNDAtNWU0Zi05MzdlLWMyM2YzZjEzNjVjNSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjozOTozNFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NGM1MmM2M2MtZDdhMC0wYTRjLTk0MGQtMjA2ZWFkNWVlMDVhIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjM5OjM0WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjafOncAAAAoSURBVEgNY/hPY8BATwsYqIxHLRi1YNSCUQtGLRi1YNQC8iwYmq0KAMb9aPpeUhaGAAAAAElFTkSuQmCC 2.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMzowMjo0OFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmZDIzZGYyYy1hNWIwLTgzNGMtOThlZi00ZTc2ZThjZTZkZmMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0MmFhOGNmYi03NmM2LWZiNDAtOTA5Mi1mNTRiZWQ0N2Q3YzMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowY2JjNzQ3OS05MjI0LTM4NGQtOTdjOS1kOTAwMjllNWFhZDkiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjBjYmM3NDc5LTkyMjQtMzg0ZC05N2M5LWQ5MDAyOWU1YWFkOSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMzowMjo0OFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmQyM2RmMmMtYTViMC04MzRjLTk4ZWYtNGU3NmU4Y2U2ZGZjIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsXQbYkAAAAuSURBVEjH7dexDQAACAJB9l9apyAW3ifUV5M5Ku/hlAcGg8FgMBgMBn+AXZhaCz7qxNZttUrgAAAAAElFTkSuQmCC 3x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMzowMjo0OFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmZDIzZGYyYy1hNWIwLTgzNGMtOThlZi00ZTc2ZThjZTZkZmMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0MmFhOGNmYi03NmM2LWZiNDAtOTA5Mi1mNTRiZWQ0N2Q3YzMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowY2JjNzQ3OS05MjI0LTM4NGQtOTdjOS1kOTAwMjllNWFhZDkiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjBjYmM3NDc5LTkyMjQtMzg0ZC05N2M5LWQ5MDAyOWU1YWFkOSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMzowMjo0OFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmQyM2RmMmMtYTViMC04MzRjLTk4ZWYtNGU3NmU4Y2U2ZGZjIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIzOjAyOjQ4WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsXQbYkAAAAuSURBVEjH7dexDQAACAJB9l9apyAW3ifUV5M5Ku/hlAcGg8FgMBgMBn+AXZhaCz7qxNZttUrgAAAAAElFTkSuQmCC 3.5x
                " draggable="false" />
            </div>

            <div class="button" id="windowRestoreButton">
                <img class="icon" srcset="
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEzOjQ1OjUyWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMzo0NTo1MloiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEzOjQ1OjUyWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphMjNkOTkzNC02YTkxLWNlNDYtOWIxYi01ZjdiOGEwZmFiY2EiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZmU2YjQ5Mi0xNzA1LWRmNDQtYjMyNi05MjVjNWZiZTI4YzQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3MjEwNjkwYy1mODVhLTk5NGItOWVlNC1hOTJiYzY3NTBlZmEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo3MjEwNjkwYy1mODVhLTk5NGItOWVlNC1hOTJiYzY3NTBlZmEiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6NDU6NTJaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmEyM2Q5OTM0LTZhOTEtY2U0Ni05YjFiLTVmN2I4YTBmYWJjYSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzo0NTo1MloiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5xtiYDAAAAKElEQVQYGWP4//8/AxTjBQxoChlwYMImoSvEadIQUfifFBMZiA0eBgBhb1e31+yUuwAAAABJRU5ErkJggg== 1x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGVmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEzOjM0OjM5WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMzozNDozOVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEzOjM0OjM5WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpkYjBlN2E5NS0yNjExLTIzNDUtOWY0MC00MmE1NWUxM2IxOGMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1MGExOWNmNi05OTZhLTk5NDUtOGU0Ni1mZDBlODU3ZDhmNmMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2MDlkMDQ3YS00ZmM5LWUzNDQtODk1ZS01OGMyMjUxZmQ0MGIiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2MDlkMDQ3YS00ZmM5LWUzNDQtODk1ZS01OGMyMjUxZmQ0MGIiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6MzQ6MzlaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmRiMGU3YTk1LTI2MTEtMjM0NS05ZjQwLTQyYTU1ZTEzYjE4YyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzozNDozOVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk3M2VlMzBkLWM4MjgtMTA0ZS05NTk2LTA2NzI3ODE4ODVmMzwvcmRmOmxpPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Po9KeMkAAAAqSURBVCgVY/j//z8DFBMFGNA0MBDAxJuMroGgyaMaiNTwnxwbGEiNOAYAU/HnJ+6dkdYAAAAASUVORK5CYII= 1.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ0OjEzWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0NDoxM1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ0OjEzWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MDk5MmU5NS1kZmJiLWFlNDktOTYyOS1lYmRmMjc4Y2VkNGUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2MzAwNDY4Yi05NDZmLWNkNGUtODMyMS1mMjdhNTgwNTJjOTYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2MDA4Yjg2My0zZTVkLTMzNDMtOWMwMi01ODNhOWVkOWI1MmYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2MDA4Yjg2My0zZTVkLTMzNDMtOWMwMi01ODNhOWVkOWI1MmYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDQ6MTNaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjUwOTkyZTk1LWRmYmItYWU0OS05NjI5LWViZGYyNzhjZWQ0ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0NDoxM1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4iBHHQAAAALklEQVQoFWP4//8/AxImCTBg0cxAJKZcM7muJd22Uc1DSTNKhJNrMwNVNJOVmQBKpec1wl74qQAAAABJRU5ErkJggg== 1.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQ0OjEzWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0NDoxM1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQ0OjEzWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MDk5MmU5NS1kZmJiLWFlNDktOTYyOS1lYmRmMjc4Y2VkNGUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2MzAwNDY4Yi05NDZmLWNkNGUtODMyMS1mMjdhNTgwNTJjOTYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2MDA4Yjg2My0zZTVkLTMzNDMtOWMwMi01ODNhOWVkOWI1MmYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2MDA4Yjg2My0zZTVkLTMzNDMtOWMwMi01ODNhOWVkOWI1MmYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDQ6MTNaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjUwOTkyZTk1LWRmYmItYWU0OS05NjI5LWViZGYyNzhjZWQ0ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0NDoxM1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4iBHHQAAAALklEQVQoFWP4//8/AxImCTBg0cxAJKZcM7muJd22Uc1DSTNKhJNrMwNVNJOVmQBKpec1wl74qQAAAABJRU5ErkJggg== 1.75x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMTo1ODo0M1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpkZGE3NTEzNS1hYmEyLWJmNDgtYTJhNS00ZTcwMTgyOGVmM2YiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozOTY2MDdkNi05ZDcyLTIwNGQtOGRlNy0xMDdhOThmNzYxZjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozMzM3ODNjNi1kZDJlLTJmNGYtYmYyZi04YjdiMDczNWM4NGUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjMzMzc4M2M2LWRkMmUtMmY0Zi1iZjJmLThiN2IwNzM1Yzg0ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMTo1ODo0M1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZGRhNzUxMzUtYWJhMi1iZjQ4LWEyYTUtNGU3MDE4MjhlZjNmIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Puv6NxYAAAA5SURBVDgRY/j//z8DGqYIMNDTQAYSMe0MpJYvaW8gWV4cNXDUwEFiIEYqH3QGoojT1ECqlKlUNxAAn0Fe6BFPyocAAAAASUVORK5CYII= 2x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMTo1ODo0M1oiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpkZGE3NTEzNS1hYmEyLWJmNDgtYTJhNS00ZTcwMTgyOGVmM2YiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozOTY2MDdkNi05ZDcyLTIwNGQtOGRlNy0xMDdhOThmNzYxZjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozMzM3ODNjNi1kZDJlLTJmNGYtYmYyZi04YjdiMDczNWM4NGUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjMzMzc4M2M2LWRkMmUtMmY0Zi1iZjJmLThiN2IwNzM1Yzg0ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMTo1ODo0M1oiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZGRhNzUxMzUtYWJhMi1iZjQ4LWEyYTUtNGU3MDE4MjhlZjNmIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIxOjU4OjQzWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Puv6NxYAAAA5SURBVDgRY/j//z8DGqYIMNDTQAYSMe0MpJYvaW8gWV4cNXDUwEFiIEYqH3QGoojT1ECqlKlUNxAAn0Fe6BFPyocAAAAASUVORK5CYII= 2.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAACTpAAAk6QFQJOf4AAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjM2OjM1WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjozNjozNVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjM2OjM1WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphZjM5MjZkNC03ZThmLTYwNDktOThlOS1kNjBiNDRmNTIyYWEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoyYWQ4ZTQ1NS0zYWRkLWVmNGMtYjY2My0xYzc5MTRmYzg5ZjEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NmI4MzY5Yy04Yzg5LTdmNGEtODA3NS0yZTA1NWFlMGI5MzAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU2YjgzNjljLThjODktN2Y0YS04MDc1LTJlMDU1YWUwYjkzMCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjozNjozNVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YWYzOTI2ZDQtN2U4Zi02MDQ5LTk4ZTktZDYwYjQ0ZjUyMmFhIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjM2OjM1WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjQwjMIAAAA9SURBVEiJY/j//z8DGqYqQDecrhZgkyMF088CaoOBs4AqQTJqwagFoxaMWjBILEABQ9ICFHG6WkAtQF8LAPuVnMYZZsiRAAAAAElFTkSuQmCC 2.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjo1OTowMVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2YThlMzQ4Yy0wMDdiLWNlNDItODAyYi0xZWZjM2RiNWI4NzYiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjMzQ0NGEwYy0zMWIzLTk5NDgtODMyZS1jMzBkZGZjZjk4NjEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZWE2YzNjYi1iMWQ0LTk0NDEtOTljNy03N2JkOTVkOTllOGUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjdlYTZjM2NiLWIxZDQtOTQ0MS05OWM3LTc3YmQ5NWQ5OWU4ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjo1OTowMVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmE4ZTM0OGMtMDA3Yi1jZTQyLTgwMmItMWVmYzNkYjViODc2IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PosfnREAAABBSURBVEjH7dYhDgAwDEJR7n9p5uZwo8nS3wT9BILKtkKqJ+AA61GWw5N1Ave6BAYGBgb+Ao7LAdzs+AZ47HffBx+eWBWU3xhA6gAAAABJRU5ErkJggg== 3x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjo1OTowMVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2YThlMzQ4Yy0wMDdiLWNlNDItODAyYi0xZWZjM2RiNWI4NzYiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjMzQ0NGEwYy0zMWIzLTk5NDgtODMyZS1jMzBkZGZjZjk4NjEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZWE2YzNjYi1iMWQ0LTk0NDEtOTljNy03N2JkOTVkOTllOGUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjdlYTZjM2NiLWIxZDQtOTQ0MS05OWM3LTc3YmQ5NWQ5OWU4ZSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjo1OTowMVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmE4ZTM0OGMtMDA3Yi1jZTQyLTgwMmItMWVmYzNkYjViODc2IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjU5OjAxWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PosfnREAAABBSURBVEjH7dYhDgAwDEJR7n9p5uZwo8nS3wT9BILKtkKqJ+AA61GWw5N1Ave6BAYGBgb+Ao7LAdzs+AZ47HffBx+eWBWU3xhA6gAAAABJRU5ErkJggg== 3.5x
                " draggable="false" />
            </div>

            <div class="button" id="windowCloseButton">
                <img class="icon" srcset="
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGOmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEyOjQ0OjUwWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMjo0NDo1MFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEyOjQ0OjUwWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4MTJkNDhkYS02NmNkLTgxNGEtOWJlMy0zNDczNDJmOWFkYjkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo5NzNlZTMwZC1jODI4LTEwNGUtOTU5Ni0wNjcyNzgxODg1ZjMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5MDk1NjY4Zi01NmJhLWU3NDYtYTJkZC0yODI2NzdjYjFiNGEiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5MDk1NjY4Zi01NmJhLWU3NDYtYTJkZC0yODI2NzdjYjFiNGEiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTI6NDQ6NTBaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjgxMmQ0OGRhLTY2Y2QtODE0YS05YmUzLTM0NzM0MmY5YWRiOSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMjo0NDo1MFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOkJhZz4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSLuorsiIHBob3Rvc2hvcDpMYXllclRleHQ9Iu6iuyIvPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOlRleHRMYXllcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+oK/97wAAADhJREFUGJVj+P///24gNmbAAUByIDUwxjtsijHksCnGaQCyBD5b0BXjVkS0QqKsJsozRAcPsQEOAP27s5He4AShAAAAAElFTkSuQmCC 1x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGVmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDEzOjI5OjE1WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxMzoyOToxNVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDEzOjI5OjE1WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxNzY5MTcyMS0wZTJkLWMxNDgtODg1ZS1lMGJmZTA3MzJiYTEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDplNThlNDI1My1hZmIwLThjNDUtOTA3OC04ODg2MDY4MGQ5YTQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NDJkYWM2Yi0zNjZmLTBmNGItYTA1My05OTIxZGJlZmI4ZTEiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NDJkYWM2Yi0zNjZmLTBmNGItYTA1My05OTIxZGJlZmI4ZTEiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTM6Mjk6MTVaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjE3NjkxNzIxLTBlMmQtYzE0OC04ODVlLWUwYmZlMDczMmJhMSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxMzoyOToxNVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk3M2VlMzBkLWM4MjgtMTA0ZS05NTk2LTA2NzI3ODE4ODVmMzwvcmRmOmxpPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pg09whAAAAA8SURBVCgVY/gPAcZAzEAAg9QgGAQ0wdUwEKEJRQ6nBC4xfKZhtRWfe7E6kWINJDmJJE+TFKwkRxxJSQMAk+HOQEjzKKoAAAAASUVORK5CYII= 1.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQzOjE5WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0MzoxOVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQzOjE5WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5OGFiZjFiMS1jNGU4LTA3NDItOTBiYi1iMzAyZGY0OTcxMDciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4YWQ4MjJhNy0zYzg5LTRmNGUtOTQ4Yi03YzJjNTNlMjZkNzYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiZTJmZTFiZS0zNDRlLTM1NGMtYjEzNy0wOGUxZDRjMWZjMDYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZTJmZTFiZS0zNDRlLTM1NGMtYjEzNy0wOGUxZDRjMWZjMDYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDM6MTlaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk4YWJmMWIxLWM0ZTgtMDc0Mi05MGJiLWIzMDJkZjQ5NzEwNyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0MzoxOVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6M6OjtAAAATElEQVQoFWP4DwHGQMxAAgapRzBIMACunoFEA1DU4ZQgpBFdMz4DsIoTYwNOFxHjN5xeITpwSNFMts1k+5ns0CY7nslOYRSlbbJzFQAcxMe7dGKJGwAAAABJRU5ErkJggg== 1.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTE3VDE2OjQzOjE5WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0xN1QxNjo0MzoxOVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTE3VDE2OjQzOjE5WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5OGFiZjFiMS1jNGU4LTA3NDItOTBiYi1iMzAyZGY0OTcxMDciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4YWQ4MjJhNy0zYzg5LTRmNGUtOTQ4Yi03YzJjNTNlMjZkNzYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiZTJmZTFiZS0zNDRlLTM1NGMtYjEzNy0wOGUxZDRjMWZjMDYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZTJmZTFiZS0zNDRlLTM1NGMtYjEzNy0wOGUxZDRjMWZjMDYiIHN0RXZ0OndoZW49IjIwMjAtMDItMTdUMTY6NDM6MTlaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk4YWJmMWIxLWM0ZTgtMDc0Mi05MGJiLWIzMDJkZjQ5NzEwNyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0xN1QxNjo0MzoxOVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6M6OjtAAAATElEQVQoFWP4DwHGQMxAAgapRzBIMACunoFEA1DU4ZQgpBFdMz4DsIoTYwNOFxHjN5xeITpwSNFMts1k+5ns0CY7nslOYRSlbbJzFQAcxMe7dGKJGwAAAABJRU5ErkJggg== 1.75x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxMTo1MFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMjdhODA0My0xZDVmLTExNGEtODM0Ny1lNzdmNzYxOTk0N2MiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxNjg2NDNmOS00NjVlLWExNGMtYWM0Yy05NGMwZGY2NDQyN2UiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjOTAxOTEyOC1jYTYwLWZlNDgtODk4NC1kYTcyZDQ5MTMzNzQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM5MDE5MTI4LWNhNjAtZmU0OC04OTg0LWRhNzJkNDkxMzM3NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxMTo1MFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDI3YTgwNDMtMWQ1Zi0xMTRhLTgzNDctZTc3Zjc2MTk5NDdjIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvzHdS0AAABxSURBVDgRY/j//z8/EE+D0gxkYrgZDFAGCBwh01B+qF4QmIYuQKqhGHpxSpBjGEicoAJSDEM3kFhD8aphIFEDQQtJ8RJRQUJKoBMVvqTEJFEpgK4GUtXLVI0UqiYbqiZsqmY9qhYOVC++aFLAUq0KAAC6MAkkTO8u8gAAAABJRU5ErkJggg== 2x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAB2HAAAdhwGP5fFlAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoxMTo1MFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMjdhODA0My0xZDVmLTExNGEtODM0Ny1lNzdmNzYxOTk0N2MiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxNjg2NDNmOS00NjVlLWExNGMtYWM0Yy05NGMwZGY2NDQyN2UiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjOTAxOTEyOC1jYTYwLWZlNDgtODk4NC1kYTcyZDQ5MTMzNzQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM5MDE5MTI4LWNhNjAtZmU0OC04OTg0LWRhNzJkNDkxMzM3NCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoxMTo1MFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDI3YTgwNDMtMWQ1Zi0xMTRhLTgzNDctZTc3Zjc2MTk5NDdjIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjExOjUwWiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvzHdS0AAABxSURBVDgRY/j//z8/EE+D0gxkYrgZDFAGCBwh01B+qF4QmIYuQKqhGHpxSpBjGEicoAJSDEM3kFhD8aphIFEDQQtJ8RJRQUJKoBMVvqTEJFEpgK4GUtXLVI0UqiYbqiZsqmY9qhYOVC++aFLAUq0KAAC6MAkkTO8u8gAAAABJRU5ErkJggg== 2.25x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAACTpAAAk6QFQJOf4AAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjI4OjE1WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjoyODoxNVoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjI4OjE1WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpiZDVhOTQ3NS02N2YzLTRiNGQtYTFmMi1lZjMzZDQ4NTE3ZmQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxMjM2ZmRlNS0zYTdmLTY2NDEtODM3My0wNDUyZTIzODhkNTkiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3NTQ5ZDhiZS0yYWRjLWNkNDctYjJmZi1lYTMyOWFlMDNlYzAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc1NDlkOGJlLTJhZGMtY2Q0Ny1iMmZmLWVhMzI5YWUwM2VjMCIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjoyODoxNVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YmQ1YTk0NzUtNjdmMy00YjRkLWExZjItZWYzM2Q0ODUxN2ZkIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjI4OjE1WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlVAgS8AAACGSURBVEgNY/j//78eEG8FYn4gZqAS5oeaqccAZYDAESpZwg81CwS2ogtQagmGWTglqGE4SJygAkoMR7eAXEvw6iFZA6lqydZIrEPI9TrRviQnfEmKJ3JSCEmJgJxkSFIyHhQW0DSIaBrJNE2mNM1oNC0qaFrY0bS4pmmFQ/Mqk+aVPk2bLQAD+y3OiukgtgAAAABJRU5ErkJggg== 2.5x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjo1NjoyOFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NjZlNGY0Ny03YmE3LWRkNDctYWM0Yi0xODM1Nzk3MmE2NjQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozNjhmOWI5YS1hZGZmLWJkNDEtYTJiZC01OTMwNjExYmJkYWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmYjQyYTY1Mi1iMzU1LTE5NDYtODU4NS03OGMzNDhkMmM0ZDUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmZiNDJhNjUyLWIzNTUtMTk0Ni04NTg1LTc4YzM0OGQyYzRkNSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjo1NjoyOFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjY2ZTRmNDctN2JhNy1kZDQ3LWFjNGItMTgzNTc5NzJhNjY0IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiXXtdEAAAClSURBVEjH1ZfdCcAgDISdyDXdIAs6yPVBA32oreaHo4FCQc0nMYlnAVAAVABt/md+bbKKQjuGSSJUJqMDqLqLu0kiVK2tBiQRKhrqTPjS5/bESOgTOAr+6cO80AN9A1vh22vCHJ1uNCp0x9GJODdTPngz1ZyE3jIxl11EYzDV+m/AlFBTkotSTpQGQmmZlEuCci1ShABF+lDEHkXe0gQ97QlDebRdSfZe8vo2zcEAAAAASUVORK5CYII= 3x, 
                    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAACxLAAAsSwGlPZapAAAF4WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wMi0yMVQyMjo1NjoyOFoiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NjZlNGY0Ny03YmE3LWRkNDctYWM0Yi0xODM1Nzk3MmE2NjQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozNjhmOWI5YS1hZGZmLWJkNDEtYTJiZC01OTMwNjExYmJkYWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmYjQyYTY1Mi1iMzU1LTE5NDYtODU4NS03OGMzNDhkMmM0ZDUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmZiNDJhNjUyLWIzNTUtMTk0Ni04NTg1LTc4YzM0OGQyYzRkNSIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yMVQyMjo1NjoyOFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjY2ZTRmNDctN2JhNy1kZDQ3LWFjNGItMTgzNTc5NzJhNjY0IiBzdEV2dDp3aGVuPSIyMDIwLTAyLTIxVDIyOjU2OjI4WiIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiXXtdEAAAClSURBVEjH1ZfdCcAgDISdyDXdIAs6yPVBA32oreaHo4FCQc0nMYlnAVAAVABt/md+bbKKQjuGSSJUJqMDqLqLu0kiVK2tBiQRKhrqTPjS5/bESOgTOAr+6cO80AN9A1vh22vCHJ1uNCp0x9GJODdTPngz1ZyE3jIxl11EYzDV+m/AlFBTkotSTpQGQmmZlEuCci1ShABF+lDEHkXe0gQ97QlDebRdSfZe8vo2zcEAAAAASUVORK5CYII= 3.5x
                " draggable="false" />
            </div>

        </div>
        </div>
    `;
    document.body.appendChild(windowControls);
    if (process.platform === "win32") {
        document.getElementById("windowControls").classList.add("win");
    }
    else if (process.platform === "darwin") {
        document.getElementById("windowControls").classList.add("mac");
    }
    const sideWindowDragRegion = document.createElement("div");
    sideWindowDragRegion.classList.add("windowDragRegion");
    DRC.EventObject.addEventListener(DRC.Events.DocumentLoaded, () => {
        document.querySelector("div.el-row.header.justify-between.flex-nowrap")?.insertBefore(sideWindowDragRegion, document.querySelector("div.el-row.header.justify-between.flex-nowrap > div.el-col.el-col-24.auto-col.left")?.nextSibling ?? null);
    });
    const windowMinimiseButton = document.getElementById("windowMinButton");
    const windowMaximiseButton = document.getElementById("windowMaxButton");
    const windowRestoreButton = document.getElementById("windowRestoreButton");
    const windowCloseButton = document.getElementById("windowCloseButton");
    windowMinimiseButton.addEventListener("click", () => {
        ipcRenderer.send("windowMinimise");
    });
    windowMaximiseButton.addEventListener("click", () => {
        windowMaximiseButton.setAttribute("style", "display:none;");
        windowRestoreButton.setAttribute("style", "");
        ipcRenderer.send("windowMaximise");
    });
    windowRestoreButton.addEventListener("click", () => {
        windowMaximiseButton.setAttribute("style", "");
        windowRestoreButton.setAttribute("style", "display:none;");
        ipcRenderer.send("windowRestore");
    });
    const windowCloseStyle = document.createElement("style");
    windowCloseStyle.innerHTML = `
    .drc-close-modal-content {
        font-size: 1rem;
        padding: 1rem;
    }

    .drc-close-modal-action {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
    }

    .drc-close-button {
        border-radius: 1rem;
        padding: 0.75rem 1.25rem;
        margin-top: 10px;
        border-width: 0px;
        border-bottom-width: 4px;
        font-family: Quicksand;
    }

    .drc-close-button.cancel {
        background-color: rgba(107, 114, 128, 1);
        border-color: rgba(75, 85, 99, 1);
        color: rgba(255, 255, 255, 1);
    }

    .drc-close-button.cancel:hover {
        background-color: rgba(75, 85, 99, 1);
        border-color: rgba(55, 65, 81, 1);
    }

    .drc-close-button.confirm {
        background-color: rgba(16, 185, 129, 1);
        border-color: rgba(5, 150, 105, 1);
        color: rgba(255, 255, 255, 1);
        margin-left: 12px;
    }

    .drc-close-button.confirm:hover {
        background-color: rgba(5, 150, 105, 1)
        border-color: rgba(4, 120, 87, 1);
    }
    `;
    document.head.appendChild(windowCloseStyle);
    const windowCloseConfirmationModal = DRC.Modal.buildModal("windowCloseConfirmation", "Exit Confirmation", `
    <div class="drc-close-modal-content">
        <p>Are you sure you want to quit? You have an ongoing game.</p>
    </div>

    <div class="drc-close-modal-action">
        <button id="windowCloseConfirmation_cancelButton" class="drc-close-button cancel">Cancel</button>
        <button id="windowCloseConfirmation_exitButton" class="drc-close-button confirm">Exit</button>
    </div>
    `, true);
    const windowCloseConfirmation_cancelButton = document.getElementById("windowCloseConfirmation_cancelButton");
    const windowCloseConfirmation_exitButton = document.getElementById("windowCloseConfirmation_exitButton");
    const windowCloseConfirmation_closeButton = document.getElementById("windowCloseConfirmationCloseButton");
    windowCloseConfirmationModal.classList.add("drc-modal-hidden");
    windowCloseConfirmation_exitButton.addEventListener("click", () => {
        ipcRenderer.send("windowClose");
    });
    windowCloseConfirmation_cancelButton.addEventListener("click", () => {
        windowCloseConfirmationModal.classList.add("drc-modal-hidden");
    });
    windowCloseConfirmationModal.addEventListener("keydown", (key) => {
        if (key.code === "Enter")
            windowCloseConfirmation_exitButton.click();
    });
    windowCloseButton.addEventListener("click", () => {
        if (gameStarted) {
            windowCloseConfirmationModal.classList.remove("drc-modal-hidden");
            windowCloseConfirmation_exitButton.focus();
        }
        else
            ipcRenderer.send("windowClose");
    });
    ipcRenderer.on("windowMaximise", () => {
        windowMaximiseButton.setAttribute("style", "display:none;");
        windowRestoreButton.setAttribute("style", "");
    });
    ipcRenderer.on("windowRestore", () => {
        windowMaximiseButton.setAttribute("style", "");
        windowRestoreButton.setAttribute("style", "display:none;");
    });
    const windowNavSpacer = document.createElement("div"); // WIll be appended at the end of the function
    windowNavSpacer.setAttribute("style", "width:138px;");
    const windowLeaderboardSpacer = document.createElement("div"); // WIll be appended every time game starts
    windowLeaderboardSpacer.setAttribute("style", "height:28px;");
    DRC.EventObject.addEventListener(DRC.Events.GameStarted, () => {
        const topRightOverlay = document.querySelector("div.overlay.gm-1 > div.top-right > div.flex.flex-col");
        const leaderboardObserver = new MutationObserver((mutations) => {
            if (!document.contains(document.querySelector("div.leaderboard.ranking")) || document.contains(windowLeaderboardSpacer))
                return;
            topRightOverlay.insertBefore(windowLeaderboardSpacer, document.querySelector("div.leaderboard.ranking"));
        });
        leaderboardObserver.observe(topRightOverlay, {
            childList: true,
            subtree: true
        });
    });
    // devtools
    window.addEventListener("keydown", (key) => {
        if (key.code == "F12") {
            ipcRenderer.send("openDevTools");
        }
    });
    // warn if code updated
    const indexScriptTag = document.querySelector("script[src^=\\/assets\\/index\\.]");
    fetch("https://deeeep-reef-client.github.io/modded-assets/misc/" +
        (indexScriptTag?.getAttribute("src") ?? "/assets/index.js").replace("/assets/", ""))
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
    const joinGameModal = DRC.Modal.buildModal("joinGame", "Join Game", `
    <input id="joinGameCodeInput" placeholder="Server code or link">
    <button id="joinGameButton" class="assetswapper-add-button" style="margin-left:0.5rem">Join</button>
    `);
    const joinGameConfirmationModal = DRC.Modal.buildModal("joinGameConfirmation", "Exit Confirmation", `
    <div class="drc-close-modal-content">
        <p>Are you sure you want to join another game? You have an ongoing game.</p>
    </div>

    <div class="drc-close-modal-action">
        <button id="joinGameConfirmation_cancelButton" class="drc-close-button cancel">Cancel</button>
        <button id="joinGameConfirmation_exitButton" class="drc-close-button confirm">Join</button>
    </div>
    `, true);
    const joinGameConfirmation_cancelButton = document.getElementById("joinGameConfirmation_cancelButton");
    const joinGameConfirmation_exitButton = document.getElementById("joinGameConfirmation_exitButton");
    const joinGameConfirmationCloseButton = document.getElementById("joinGameConfirmationCloseButton");
    const joinGameCodeInput = document.getElementById("joinGameCodeInput");
    const joinGameButton = document.getElementById("joinGameButton");
    function joinGameSwitch() {
        let code = joinGameCodeInput.value;
        const codeMatch = code.match(/^(https?:\/\/)?(beta\.)?deeeep\.io\/\?host=(?<code>\w{6})$/);
        if (codeMatch) {
            window.location.href = "?host=" + codeMatch.groups.code;
        }
        else if (code.match(/^\w{6}$/)) {
            window.location.href = "?host=" + code;
        }
        else
            new Notification("Invalid code or URL", {
                body: "Your server code or URL does not seem to be valid."
            });
        joinGameCodeInput.value = "";
    }
    joinGameConfirmation_exitButton.addEventListener("click", () => {
        joinGameSwitch();
        joinGameConfirmationModal.classList.add("drc-modal-hidden");
    });
    joinGameConfirmation_cancelButton.addEventListener("click", () => {
        joinGameConfirmationModal.classList.add("drc-modal-hidden");
        joinGameCodeInput.value = "";
    });
    joinGameConfirmationCloseButton.addEventListener("click", () => {
        joinGameCodeInput.value = "";
    });
    joinGameConfirmationModal.addEventListener("keydown", (key) => {
        if (key.code === "Enter")
            joinGameConfirmation_exitButton.click();
    });
    function joinGame() {
        joinGameModal.classList.add("drc-modal-hidden");
        if (!joinGameCodeInput.value.match(/^((https?:\/\/)?(beta\.)?deeeep\.io\/\?host=(?<code>\w{6}))|(\w{6})$/))
            new Notification("Invalid code or URL", {
                body: "Your server code or URL does not seem to be valid."
            });
        if (gameStarted) {
            joinGameConfirmationModal.classList.remove("drc-modal-hidden");
            joinGameConfirmation_exitButton.focus();
        }
        else
            joinGameSwitch();
    }
    joinGameButton.addEventListener("click", joinGame);
    joinGameModal.addEventListener("keydown", key => {
        if (key.code === "Enter")
            joinGame();
    });
    window.addEventListener("keydown", (key) => {
        // Alt + C copy link
        if (key.altKey && key.code == settings.keybinds.copyUrl) {
            navigator.clipboard.writeText(window.location.href);
            new Notification("Link copied", {
                body: "The current URL has been copied to your clipboard."
            });
            // Alt + C join game
        }
        else if (key.altKey && key.code == settings.keybinds.joinGame) {
            joinGameModal.classList.remove("drc-modal-hidden");
            joinGameCodeInput.focus();
        }
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
    // Colourblind Mode
    const colourblindTheme = document.createElement("link");
    colourblindTheme.rel = "stylesheet";
    colourblindTheme.type = "text/css";
    colourblindTheme.setAttribute("id", "colourblindThemeStyle");
    colourblindTheme.href = settings.colourblind ? "https://deeeep-reef-client.netlify.app/assets/colourblind.css" : '';
    document.head.appendChild(colourblindTheme);
    // Keybinds
    const keybindsModal = DRC.Modal.buildModal("keybinds", "Edit Keybinds", `
    <div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Cancel Change:<br/>
            <div class="spacer"></div>
            <p id="keybindsDisplayCancelCharge"></p>
            <div class="spacer"></div>
            <button id="keybindsEditCancelCharge" class="assetswapper-new-button">Change</button>
        </div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Evolution Tree:<br/>
            <div class="spacer"></div>
            <p id="keybindsDisplayEvolutionTree"></p>
            <div class="spacer"></div>
            <button id="keybindsEditEvolutionTree" class="assetswapper-new-button">Change</button>
        </div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Screenshot:<br/>
            <div class="spacer"></div>
            <p id="keybindsDisplayScreenshot"></p>
            <div class="spacer"></div>
            <button id="keybindsEditScreenshot" class="assetswapper-new-button">Change</button>
        </div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Ghost Quit:<br/>
            <div class="spacer"></div>
            <p id="keybindsDisplayGhostQuit"></p>
            <div class="spacer"></div>
            <button id="keybindsEditGhostQuit" class="assetswapper-new-button">Change</button>
        </div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Copy URL:<br/>
            <div class="spacer"></div>
            <p>Alt + <span id="keybindsDisplayCopyUrl"></span></p>
            <div class="spacer"></div>
            <button id="keybindsEditCopyUrl" class="assetswapper-new-button">Change</button>
        </div>
        <div class="spacer"></div>
        <div class="assetswapper-list-rule">
            <p>Join Game:<br/>
            <div class="spacer"></div>
            <p>Alt + <span id="keybindsDisplayJoinGame"></span></p>
            <div class="spacer"></div>
            <button id="keybindsEditJoinGame" class="assetswapper-new-button">Change</button>
        </div>

        <button id="keybindsResetButton" class="assetswapper-add-button">Reset</button>
    </div>
    `, true);
    const keybindsDisplayCancelCharge = document.getElementById("keybindsDisplayCancelCharge");
    const keybindsDisplayEvolutionTree = document.getElementById("keybindsDisplayEvolutionTree");
    const keybindsDisplayScreenshot = document.getElementById("keybindsDisplayScreenshot");
    const keybindsDisplayGhostQuit = document.getElementById("keybindsDisplayGhostQuit");
    const keybindsDisplayCopyUrl = document.getElementById("keybindsDisplayCopyUrl");
    const keybindsDisplayJoinGame = document.getElementById("keybindsDisplayJoinGame");
    const keybindsEditCancelCharge = document.getElementById("keybindsEditCancelCharge");
    const keybindsEditEvolutionTree = document.getElementById("keybindsEditEvolutionTree");
    const keybindsEditScreenshot = document.getElementById("keybindsEditScreenshot");
    const keybindsEditGhostQuit = document.getElementById("keybindsEditGhostQuit");
    const keybindsEditCopyUrl = document.getElementById("keybindsEditCopyUrl");
    const keybindsEditJoinGame = document.getElementById("keybindsEditJoinGame");
    const keybindsResetButton = document.getElementById("keybindsResetButton");
    function updateKeybindsDisplay() {
        keybindsDisplayCancelCharge.innerText = settings.keybinds.cancelCharge;
        keybindsDisplayEvolutionTree.innerText = settings.keybinds.evolutionTree;
        keybindsDisplayScreenshot.innerText = settings.keybinds.screenshot;
        keybindsDisplayGhostQuit.innerText = settings.keybinds.ghostQuit;
        keybindsDisplayCopyUrl.innerText = settings.keybinds.copyUrl;
        keybindsDisplayJoinGame.innerText = settings.keybinds.joinGame;
        const treeHotkeyElem = document.getElementById("treeOpenHotkey");
        if (gameStarted && document.contains(treeHotkeyElem)) {
            let gameTreeHotkey;
            if (settings.keybinds.evolutionTree.startsWith("Key")) {
                gameTreeHotkey = settings.keybinds.evolutionTree.slice(3);
            }
            else if (settings.keybinds.evolutionTree.startsWith("Digit")) {
                gameTreeHotkey = settings.keybinds.evolutionTree.slice(5);
            }
            else {
                gameTreeHotkey = settings.keybinds.evolutionTree.slice(0, 1);
            }
            treeHotkeyElem.innerText = gameTreeHotkey;
        }
    }
    function changeKeybind(button, keybind) {
        return function () {
            button.innerText = "Press a key";
            window.addEventListener("keydown", (e) => {
                button.innerText = "Change";
                settings.keybinds[keybind] = e.code;
                updateKeybindsDisplay();
                saveSettings();
            }, { once: true });
        };
    }
    keybindsEditCancelCharge.addEventListener("click", changeKeybind(keybindsEditCancelCharge, "cancelCharge"));
    keybindsEditEvolutionTree.addEventListener("click", changeKeybind(keybindsEditEvolutionTree, "evolutionTree"));
    keybindsEditScreenshot.addEventListener("click", changeKeybind(keybindsEditScreenshot, "screenshot"));
    keybindsEditGhostQuit.addEventListener("click", changeKeybind(keybindsEditGhostQuit, "ghostQuit"));
    keybindsEditCopyUrl.addEventListener("click", changeKeybind(keybindsEditCopyUrl, "copyUrl"));
    keybindsEditJoinGame.addEventListener("click", changeKeybind(keybindsEditJoinGame, "joinGame"));
    keybindsResetButton.addEventListener("click", () => {
        settings.keybinds.cancelCharge = "KeyC";
        settings.keybinds.evolutionTree = "KeyT";
        settings.keybinds.screenshot = "KeyV";
        settings.keybinds.ghostQuit = "KeyX";
        settings.keybinds.copyUrl = "KeyC";
        settings.keybinds.joinGame = "KeyJ";
        saveSettings();
        updateKeybindsDisplay();
    });
    updateKeybindsDisplay();
    // Custom Settings
    // Watch for settings pane opened
    const observer = new MutationObserver((mutations) => {
        if (document.contains(document.getElementById("customThemeName")))
            return;
        if (document.contains(document.querySelector(".vfm__content, .modal-content"))) {
            // DRC API
            DRC.EventObject.dispatchEvent(DRC.Events.EventList.SettingsOpened);
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
                    DRC.Preload.evalInBrowserContext(`game.currentScene.viewingGhosts = ${settings.viewingGhosts};`);
                }
                saveSettings();
            });
            graphicsPane.appendChild(viewingGhostsSetting);
            // Colourblind Mode
            const colourblindSetting = graphicsPane.childNodes[2].cloneNode(true);
            const colourblindName = colourblindSetting.querySelector(".el-form-item__label");
            const colourblindDesc = colourblindSetting.querySelector(".notes");
            const colourblindCheckbox = colourblindSetting.querySelector(".el-checkbox__input > input");
            colourblindName.setAttribute("id", "colourblindName");
            colourblindName.innerText = "Colourblind Mode";
            colourblindDesc.innerText = "Toggles colourblind colour changes";
            if (settings.colourblind) {
                colourblindSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                colourblindSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            colourblindCheckbox.addEventListener("click", () => {
                if (settings.colourblind) {
                    settings.colourblind = false;
                    colourblindSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    colourblindTheme.setAttribute("href", "");
                }
                else {
                    settings.colourblind = true;
                    colourblindSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                    colourblindTheme.setAttribute("href", "https://deeeep-reef-client.netlify.app/assets/colourblind.css");
                }
                ;
                saveSettings();
            });
            graphicsPane.appendChild(colourblindSetting);
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
            // Keybinds
            const keybindsSetting = graphicsPane.childNodes[2].cloneNode(true);
            const keybindsName = keybindsSetting.querySelector(".el-form-item__label");
            const keybindsDesc = keybindsSetting.querySelector(".notes");
            const keybindsCheckbox = keybindsSetting.querySelector("label.el-checkbox");
            keybindsName.setAttribute("id", "keybindsName");
            keybindsName.innerText = "DRC Keybinds";
            keybindsDesc.innerText = "Deeeep.io Reef Client keybinds";
            keybindsCheckbox.innerHTML = "";
            const keybindsOpenButton = document.createElement("span");
            keybindsOpenButton.setAttribute("id", "keybindsOpenButton");
            keybindsOpenButton.setAttribute("style", "color:#409eff;");
            keybindsOpenButton.innerHTML = "<u>Edit</u>";
            keybindsOpenButton.addEventListener("click", () => {
                keybindsModal.classList.remove("drc-modal-hidden");
            });
            keybindsCheckbox.appendChild(keybindsOpenButton);
            generalPane.appendChild(keybindsSetting);
            // Discord RPC
            const discordRichPresenceSetting = graphicsPane.childNodes[2].cloneNode(true);
            const discordRichPresenceName = discordRichPresenceSetting.querySelector(".el-form-item__label");
            const discordRichPresenceDesc = discordRichPresenceSetting.querySelector(".notes");
            const discordRichPresenceCheckbox = discordRichPresenceSetting.querySelector(".el-checkbox__input > input");
            discordRichPresenceName.setAttribute("id", "discordRichPresenceName");
            discordRichPresenceName.innerText = "Discord Rich Presence";
            discordRichPresenceDesc.innerText = "Toggles Discord Rich Presence";
            if (settings.discordRichPresence) {
                discordRichPresenceSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
            }
            else {
                discordRichPresenceSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
            }
            discordRichPresenceCheckbox.addEventListener("click", () => {
                if (settings.discordRichPresence) {
                    settings.discordRichPresence = false;
                    discordRichPresenceSetting.querySelector(".el-checkbox__input").classList.remove("is-checked");
                    new Notification("Discord Rich Presence disabled", {
                        body: "It may take a few seconds for your changes to take effect."
                    });
                }
                else {
                    settings.discordRichPresence = true;
                    discordRichPresenceSetting.querySelector(".el-checkbox__input").classList.add("is-checked");
                }
                ;
                saveSettings();
                ipcRenderer.send("reloadDiscordRpc");
            });
            generalPane.appendChild(discordRichPresenceSetting);
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
                    new Notification("Developer Mode enabled", {
                        body: "Only enable this setting if you know what you are doing."
                    });
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
    const gameNameField = document.querySelector("div.name-input > div.el-input__wrapper > input.el-input__inner");
    gameNameField.addEventListener("input", (e) => {
        settings.gameName = e.target.value;
        saveSettings();
    });
    if (settings.gameName === undefined) {
        settings.gameName = "";
        saveSettings();
    }
    gameNameField.value = settings.gameName;
    gameNameField.dispatchEvent(new Event("input"));
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
                usernameField.value = username;
                usernameField.dispatchEvent(new Event("input"));
                passwordField.value = password;
                passwordField.dispatchEvent(new Event("input"));
                document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.green").dispatchEvent(new MouseEvent("click"));
            });
            mainElem.appendChild(autoLoginElem);
            const spacer = document.createElement("div");
            spacer.classList.add("spacer");
            mainElem.appendChild(spacer);
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
            if (!document.contains(document.querySelector("div.modal__action > div#routeModalActions > button.el-button.btn.nice-button.gray"))
                || document.contains(document.getElementById("swapAccountButton")))
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
            swapAccountButton.setAttribute("id", "swapAccountButton");
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
            }, { once: true });
        });
        loginObserver.observe(document.querySelector("div.vfm.vfm--inset.vfm--fixed.modal"), {
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
        userWidget.querySelector("img.el-image__inner").addEventListener("click", accountOnLogin);
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
    async function checkForumNotifications() {
        if (document.contains(userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon")))
            return;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', "https://apibeta.deeeep.io/forumNotifications/count");
        xhr.withCredentials = true;
        xhr.addEventListener("load", (_event) => {
            const forumNotifications = JSON.parse(xhr.response);
            if (forumNotifications.statusCode !== undefined && forumNotifications.statusCode === 403)
                return;
            if (forumNotifications.count > forumNotificationCount) {
                new Notification("New forum notification", {
                    body: "You received a new Forum notification."
                });
            }
            forumNotificationCount = forumNotifications.count;
            badgeCount = friendRequestCount + forumNotificationCount;
            ipcRenderer.send("update-badge", badgeCount || null);
        });
        xhr.send();
    }
    checkForumNotifications();
    setInterval(checkForumNotifications, 30000);
    // Friend requests
    async function checkFriendRequests() {
        if (document.contains(userWidget.querySelector("button.el-button.btn.nice-button.blue.has-icon")))
            return;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', "https://apibeta.deeeep.io/friendRequests/count");
        xhr.withCredentials = true;
        xhr.addEventListener("load", (_event) => {
            const friendRequests = JSON.parse(xhr.response);
            if (friendRequests.statusCode !== undefined && friendRequests.statusCode === 403)
                return;
            if (friendRequests.count > friendRequestCount) {
                new Notification("New friend request", {
                    body: "You received a new friend request."
                });
            }
            friendRequestCount = friendRequests.count;
            badgeCount = friendRequestCount + forumNotificationCount;
            ipcRenderer.send("update-badge", badgeCount || null);
        });
        xhr.send();
    }
    checkFriendRequests();
    setInterval(checkFriendRequests, 30000);
    // Evolution tree button
    // 31, 15
    // 30px2 * 41pxh
    const treeAnimalRelations = [
        // Tier 1
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "lamprey"
                ]
            },
            {
                stringId: "worm",
                evolvesTo: [
                    "crayfish",
                    "lamprey"
                ]
            },
            {
                stringId: "blindcavefish",
                evolvesTo: [
                    "climbingcavefish",
                    "crayfish"
                ]
            },
            {
                stringId: "blobfish",
                evolvesTo: [
                    "kingcrab"
                ]
            },
            {
                stringId: "icefish",
                evolvesTo: [
                    "kingcrab"
                ]
            },
            {
                stringId: "fish",
                evolvesTo: [
                    "crab"
                ]
            },
        ],
        // Tier 2
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "lamprey",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "crayfish",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "climbingcavefish",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "kingcrab",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "crab",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
        ],
        // Tier 3
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "frog",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "olm",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "horseshoecrab",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "flyingfish",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "jellyfish",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
        ],
        // Tier 4
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "catfish",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "axolotl",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "giantisopod",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "squid",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "littleauk",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "hermitcrab",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
        ],
        // Tier 5
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "duck",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "bat",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "barreleye",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "vampiresquid",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "parrotfish",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "seal",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "seagull",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
        ],
        // Tier 6
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "goliathbullfrog",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "archerfish",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "bobbitworm",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "cookiecuttershark",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "pufferfish",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "sarcasticfringehead",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "ray",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "pelican",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "lobster",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
        ],
        // Tier 7
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "seal"
                ]
            },
            {
                stringId: "snake",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "beaver",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "anglerfish",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "seaotter",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "gulpereel",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "penguin",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "frogfish",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
        ],
        // Tier 8
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "manatee"
                ]
            },
            {
                stringId: "snappingturtle",
                evolvesTo: [
                    "manatee",
                    "giantsalamander",
                    "electriceel"
                ]
            },
            {
                stringId: "dragonfish",
                evolvesTo: [
                    "frilledshark",
                    "oarfish",
                    "wolfeel"
                ]
            },
            {
                stringId: "barracuda",
                evolvesTo: [
                    "lionfish",
                    "tshark",
                    "wobbegongshark"
                ]
            },
            {
                stringId: "octopus",
                evolvesTo: [
                    "humboldtsquid",
                    "mantisshrimp"
                ]
            },
            {
                stringId: "mahimahi",
                evolvesTo: [
                    "dolphin",
                    "seaturtle"
                ]
            },
            {
                stringId: "sealion",
                evolvesTo: [
                    "narwhal",
                    "leopardseal",
                    "belugawhale"
                ]
            }
        ],
        // Tier 9
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha"
                ]
            },
            {
                stringId: "manatee",
                evolvesTo: [
                    "hippo",
                    "crocodile",
                    "baldeagle"
                ]
            },
            {
                stringId: "giantsalamander",
                evolvesTo: [
                    "giantsoftshellturtle",
                    "alligatorsnappingturtle",
                    "anaconda"
                ]
            },
            {
                stringId: "electriceel",
                evolvesTo: [
                    "sawfish",
                    "alligatorgar"
                ]
            },
            {
                stringId: "frilledshark",
                evolvesTo: [
                    "megamouthshark",
                    "sleepershark",
                    "goblinshark"
                ]
            },
            {
                stringId: "oarfish",
                evolvesTo: [
                    "sunfish",
                    "mantaray"
                ]
            },
            {
                stringId: "wolfeel",
                evolvesTo: [
                    "coelacanth",
                    "halibut"
                ]
            },
            {
                stringId: "lionfish",
                evolvesTo: [
                    "atlantictorpedo",
                    "stonefish",
                    "morayeel"
                ]
            },
            {
                stringId: "tshark",
                evolvesTo: [
                    "bullshark",
                    "threshershark",
                    "shark"
                ]
            },
            {
                stringId: "wobbegongshark",
                evolvesTo: [
                    "tigershark",
                    "baskingshark",
                    "whaleshark"
                ]
            },
            {
                stringId: "humboldtsquid",
                evolvesTo: [
                    "giantpacificoctopus",
                    "colossalsquid",
                    "giantsquid",
                ]
            },
            {
                stringId: "mantisshrimp",
                evolvesTo: [
                    "japanesespidercrab",
                    "coconutcrab"
                ]
            },
            {
                stringId: "dolphin",
                evolvesTo: [
                    "killerwhale",
                    "marlin"
                ]
            },
            {
                stringId: "seaturtle",
                evolvesTo: [
                    "leatherbackturtle",
                    "napoleonwrasse"
                ]
            },
            {
                stringId: "narwhal",
                evolvesTo: [
                    "beakedwhale",
                    "cachalot"
                ]
            },
            {
                stringId: "leopardseal",
                evolvesTo: [
                    "polarbear",
                    "elephantseal",
                    "walrus"
                ]
            },
            {
                stringId: "belugawhale",
                evolvesTo: [
                    "humpbackwhale",
                    "whale",
                    "bowheadwhale"
                ]
            }
        ],
        // Tier 10
        [
            {
                stringId: "piranha",
                evolvesTo: []
            },
            {
                stringId: "hippo",
                evolvesTo: []
            },
            {
                stringId: "crocodile",
                evolvesTo: []
            },
            {
                stringId: "baldeagle",
                evolvesTo: []
            },
            {
                stringId: "giantsoftshellturtle",
                evolvesTo: []
            },
            {
                stringId: "alligatorsnappingturtle",
                evolvesTo: []
            },
            {
                stringId: "anaconda",
                evolvesTo: []
            },
            {
                stringId: "sawfish",
                evolvesTo: []
            },
            {
                stringId: "alligatorgar",
                evolvesTo: []
            },
            {
                stringId: "megamouthshark",
                evolvesTo: []
            },
            {
                stringId: "sleepershark",
                evolvesTo: []
            },
            {
                stringId: "goblinshark",
                evolvesTo: []
            },
            {
                stringId: "sunfish",
                evolvesTo: []
            },
            {
                stringId: "mantaray",
                evolvesTo: []
            },
            {
                stringId: "coelacanth",
                evolvesTo: []
            },
            {
                stringId: "halibut",
                evolvesTo: []
            },
            {
                stringId: "atlantictorpedo",
                evolvesTo: []
            },
            {
                stringId: "stonefish",
                evolvesTo: []
            },
            {
                stringId: "morayeel",
                evolvesTo: []
            },
            {
                stringId: "bullshark",
                evolvesTo: []
            },
            {
                stringId: "threshershark",
                evolvesTo: []
            },
            {
                stringId: "shark",
                evolvesTo: []
            },
            {
                stringId: "tigershark",
                evolvesTo: []
            },
            {
                stringId: "baskingshark",
                evolvesTo: []
            },
            {
                stringId: "whaleshark",
                evolvesTo: []
            },
            {
                stringId: "giantpacificoctopus",
                evolvesTo: []
            },
            {
                stringId: "colossalsquid",
                evolvesTo: []
            },
            {
                stringId: "giantsquid",
                evolvesTo: []
            },
            {
                stringId: "japanesespidercrab",
                evolvesTo: []
            },
            {
                stringId: "coconutcrab",
                evolvesTo: []
            },
            {
                stringId: "killerwhale",
                evolvesTo: []
            },
            {
                stringId: "marlin",
                evolvesTo: []
            },
            {
                stringId: "leatherbackturtle",
                evolvesTo: []
            },
            {
                stringId: "napoleonwrasse",
                evolvesTo: []
            },
            {
                stringId: "beakedwhale",
                evolvesTo: []
            },
            {
                stringId: "cachalot",
                evolvesTo: []
            },
            {
                stringId: "polarbear",
                evolvesTo: []
            },
            {
                stringId: "elephantseal",
                evolvesTo: []
            },
            {
                stringId: "walrus",
                evolvesTo: []
            },
            {
                stringId: "humpbackwhale",
                evolvesTo: []
            },
            {
                stringId: "whale",
                evolvesTo: []
            },
            {
                stringId: "bowheadwhale",
                evolvesTo: []
            },
        ]
    ];
    const treeAnimalRelationsProcessed = [
        // Tier 1
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "lamprey"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "worm",
                evolvesTo: [
                    "crayfish",
                    "lamprey"
                ]
            },
            {
                stringId: "blindcavefish",
                evolvesTo: [
                    "climbingcavefish",
                    "crayfish"
                ]
            },
            {
                stringId: "blobfish",
                evolvesTo: [
                    "kingcrab"
                ]
            },
            {
                stringId: "icefish",
                evolvesTo: [
                    "kingcrab"
                ]
            },
            {
                stringId: "fish",
                evolvesTo: [
                    "crab"
                ]
            },
        ],
        // Tier 2
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "lamprey",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "crayfish",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "climbingcavefish",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "kingcrab",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "crab",
                evolvesTo: [
                    "frog",
                    "olm",
                    "horseshoecrab",
                    "flyingfish",
                    "jellyfish"
                ]
            },
        ],
        // Tier 3
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "frog",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "olm",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "horseshoecrab",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "flyingfish",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
            {
                stringId: "jellyfish",
                evolvesTo: [
                    "catfish",
                    "axolotl",
                    "giantisopod",
                    "squid",
                    "littleauk",
                    "hermitcrab"
                ]
            },
        ],
        // Tier 4
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "catfish",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "axolotl",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "giantisopod",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "squid",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "littleauk",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
            {
                stringId: "hermitcrab",
                evolvesTo: [
                    "duck",
                    "bat",
                    "barreleye",
                    "vampiresquid",
                    "parrotfish",
                    "seal",
                    "seagull"
                ]
            },
        ],
        // Tier 5
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "duck",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "bat",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "barreleye",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "vampiresquid",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "parrotfish",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "seal",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
            {
                stringId: "seagull",
                evolvesTo: [
                    "goliathbullfrog",
                    "archerfish",
                    "bobbitworm",
                    "cookiecuttershark",
                    "pufferfish",
                    "sarcasticfringehead",
                    "ray",
                    "pelican",
                    "lobster"
                ]
            },
        ],
        // Tier 6
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "goliathbullfrog",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "archerfish",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "bobbitworm",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "cookiecuttershark",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "pufferfish",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "sarcasticfringehead",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "ray",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "pelican",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
            {
                stringId: "lobster",
                evolvesTo: [
                    "snake",
                    "beaver",
                    "anglerfish",
                    "otter",
                    "gulpereel",
                    "penguin",
                    "frogfish"
                ]
            },
        ],
        // Tier 7
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "snake",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "beaver",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "anglerfish",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "seaotter",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "gulpereel",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "penguin",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
            {
                stringId: "frogfish",
                evolvesTo: [
                    "snappingturtle",
                    "dragonfish",
                    "barracuda",
                    "octopus",
                    "mahimahi",
                    "sealion"
                ]
            },
        ],
        // Tier 8
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha",
                    "manatee"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "snappingturtle",
                evolvesTo: [
                    "manatee",
                    "giantsalamander",
                    "electriceel"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "dragonfish",
                evolvesTo: [
                    "frilledshark",
                    "oarfish",
                    "wolfeel"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "barracuda",
                evolvesTo: [
                    "lionfish",
                    "tshark",
                    "wobbegongshark"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "octopus",
                evolvesTo: [
                    "humboldtsquid",
                    "mantisshrimp"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "mahimahi",
                evolvesTo: [
                    "dolphin",
                    "seaturtle"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "sealion",
                evolvesTo: [
                    "narwhal",
                    "leopardseal",
                    "beluga"
                ]
            },
            {
                stringId: "void",
                evolvesTo: []
            },
        ],
        // Tier 9
        [
            {
                stringId: "piranha",
                evolvesTo: [
                    "piranha"
                ]
            },
            {
                stringId: "manatee",
                evolvesTo: [
                    "hippo",
                    "crocodile",
                    "eagle"
                ]
            },
            {
                stringId: "giantsalamander",
                evolvesTo: [
                    "giantsoftshellturtle",
                    "alligatorsnappingturtle",
                    "anaconda"
                ]
            },
            {
                stringId: "electriceel",
                evolvesTo: [
                    "sawfish",
                    "alligatorgar"
                ]
            },
            {
                stringId: "frilledshark",
                evolvesTo: [
                    "megamouthshark",
                    "sleepershark",
                    "goblinshark"
                ]
            },
            {
                stringId: "oarfish",
                evolvesTo: [
                    "sunfish",
                    "mantaray"
                ]
            },
            {
                stringId: "wolfeel",
                evolvesTo: [
                    "coelacanth",
                    "halibut"
                ]
            },
            {
                stringId: "lionfish",
                evolvesTo: [
                    "atlantictorpedo",
                    "stonefish",
                    "morayeel"
                ]
            },
            {
                stringId: "tshark",
                evolvesTo: [
                    "bullshark",
                    "threshershark",
                    "shark"
                ]
            },
            {
                stringId: "wobbegongshark",
                evolvesTo: [
                    "tigershark",
                    "baskingshark",
                    "whaleshark"
                ]
            },
            {
                stringId: "humboldtsquid",
                evolvesTo: [
                    "giantpacificoctopus",
                    "colossalsquid",
                    "giantsquid",
                ]
            },
            {
                stringId: "mantisshrimp",
                evolvesTo: [
                    "japanesespidercrab",
                    "coconutcrab"
                ]
            },
            {
                stringId: "dolphin",
                evolvesTo: [
                    "killerwhale",
                    "marlin"
                ]
            },
            {
                stringId: "seaturtle",
                evolvesTo: [
                    "leatherbackturtle",
                    "napoleonwrasse"
                ]
            },
            {
                stringId: "narwhal",
                evolvesTo: [
                    "beakedwhale",
                    "cachalot"
                ]
            },
            {
                stringId: "leopardseal",
                evolvesTo: [
                    "polarbear",
                    "elephantseal",
                    "walrus"
                ]
            },
            {
                stringId: "belugawhale",
                evolvesTo: [
                    "humpbackwhale",
                    "whale",
                    "bowheadwhale"
                ]
            }
        ],
        // Tier 10 1
        [
            {
                stringId: "piranha",
                evolvesTo: []
            },
            {
                stringId: "hippo",
                evolvesTo: []
            },
            {
                stringId: "giantsoftshellturtle",
                evolvesTo: []
            },
            {
                stringId: "sawfish",
                evolvesTo: []
            },
            {
                stringId: "megamouthshark",
                evolvesTo: []
            },
            {
                stringId: "sunfish",
                evolvesTo: []
            },
            {
                stringId: "coelacanth",
                evolvesTo: []
            },
            {
                stringId: "atlantictorpedo",
                evolvesTo: []
            },
            {
                stringId: "bullshark",
                evolvesTo: []
            },
            {
                stringId: "tigershark",
                evolvesTo: []
            },
            {
                stringId: "giantpacificoctopus",
                evolvesTo: []
            },
            {
                stringId: "japanesespidercrab",
                evolvesTo: []
            },
            {
                stringId: "killerwhale",
                evolvesTo: []
            },
            {
                stringId: "leatherbackturtle",
                evolvesTo: []
            },
            {
                stringId: "beakedwhale",
                evolvesTo: []
            },
            {
                stringId: "polarbear",
                evolvesTo: []
            },
            {
                stringId: "humpbackwhale",
                evolvesTo: []
            },
        ],
        // Tier 10 2
        [
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "crocodile",
                evolvesTo: []
            },
            {
                stringId: "alligatorsnappingturtle",
                evolvesTo: []
            },
            {
                stringId: "alligatorgar",
                evolvesTo: []
            },
            {
                stringId: "sleepershark",
                evolvesTo: []
            },
            {
                stringId: "mantaray",
                evolvesTo: []
            },
            {
                stringId: "halibut",
                evolvesTo: []
            },
            {
                stringId: "stonefish",
                evolvesTo: []
            },
            {
                stringId: "threshershark",
                evolvesTo: []
            },
            {
                stringId: "baskingshark",
                evolvesTo: []
            },
            {
                stringId: "colossalsquid",
                evolvesTo: []
            },
            {
                stringId: "coconutcrab",
                evolvesTo: []
            },
            {
                stringId: "marlin",
                evolvesTo: []
            },
            {
                stringId: "napoleonwrasse",
                evolvesTo: []
            },
            {
                stringId: "cachalot",
                evolvesTo: []
            },
            {
                stringId: "elephantseal",
                evolvesTo: []
            },
            {
                stringId: "whale",
                evolvesTo: []
            },
        ],
        // Tier 10 3
        [
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "baldeagle",
                evolvesTo: []
            },
            {
                stringId: "anaconda",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "goblinshark",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "morayeel",
                evolvesTo: []
            },
            {
                stringId: "shark",
                evolvesTo: []
            },
            {
                stringId: "whaleshark",
                evolvesTo: []
            },
            {
                stringId: "giantsquid",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "void",
                evolvesTo: []
            },
            {
                stringId: "walrus",
                evolvesTo: []
            },
            {
                stringId: "bowheadwhale",
                evolvesTo: []
            },
        ],
    ];
    const treeAnimalLines = [
        // Tier 1
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "hcwfm-left-top",
                "hcw-left",
                "hcwfm-left-top",
                "hcw-left",
                "left",
                "left-top",
                "left"
            ],
            [
                "left-right",
                "left",
                "left",
                "left",
                "void",
                "left"
            ],
        ],
        // Tier 2
        [
            [
                "hcw-left-right",
                "hcwfm-left-top",
                "left-top",
                "left-top",
                "left-top",
                "top",
                "left-top"
            ],
            [
                "right",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 3
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "top"
            ],
            [
                "right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 4
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "top"
            ],
            [
                "right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 5
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "top",
                "top"
            ],
            [
                "right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 6
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top"
            ],
            [
                "right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 7
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "left-top",
                "top",
                "top",
                "top",
                "top",
                "top",
                "top",
                "top",
            ],
            [
                "right",
                "left",
                "void",
                "void",
                "left",
                "void",
                "void",
                "left",
                "void",
                "left",
                "void",
                "left",
                "void",
                "void",
                "left"
            ],
        ],
        // Tier 8
        [
            [
                "hcw-left-right",
                "hcwfm-top",
                "left-top",
                "top",
                "void",
                "left-top",
                "top",
                "void",
                "left-top",
                "top",
                "left",
                "top",
                "left",
                "top",
                "void",
                "left-top",
                "top"
            ],
            [
                "left-right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
        // Tier 9
        [
            [
                "left-right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
            [
                "left-right",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left",
                "left"
            ],
        ],
    ];
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
    
    .drc-tree-choice {
        --drc-bg-opacity: 0.1;
        background-color: rgba(255, 255, 255, var(--drc-bg-opacity));
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: pointer;
        text-align: center;
        /*width: 5rem;
        height: 5rem;*/
        width: 30px;
        height: 41px;
        line-height: 5rem;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }
    
    .drc-tree-choice:hover {
        --drc-bg-opacity: 0.3
    }

    .drc-tree-choice-semiselected {
        --drc-bg-opacity: 0.2
    }

    .drc-tree-choice-t10 {
        margin-top: 0.75rem;
    }
    
    .drc-tree-image {
        position: relative;
        display: inline-block;
        overflow: hidden;
        width: 80%;
        height: 80%;
        pointer-events: none;
    }
    
    .drc-tree-image-inner {
        object-fit: contain;
        vertical-align: top;
        width: 100%;
        height: 100%;
    }
    
    .drc-tree-row {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: right;
        max-height: 100%;
        overflow: auto;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        max-width: 100%;
    }
    
    .drc-tree-tier {
        font-size: 3rem;
    }
    
    .drc-tree-void {
        overflow: hidden;
        width: 30px;
        height: 41px;
        line-height: 5rem;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }
    
    .drc-tree-vertical-line-wrapper {
        overflow: hidden;
        width: 5rem;
        height: 0.75rem;
        line-height: 5rem;
        display: flex;
        justify-content: center;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }
    .drc-tree-vertical-line {
        background-color: white;
        height: 0.75rem;
        width: 0.4rem;
    }
    .drc-tree-horizontal-void {
    
    }
    .drc-animal-info {
        background-color: rgba(0, 0, 0, var(--tw-bg-opacity));
        --tw-bg-opacity: 0.4;
        border-radius: 0.5rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        pointer-events: none;
        position: absolute;
        line-height: 1.3em;
        width: max-content;
        position: absolute;
        top: 0;
        left: 0;
    }
    
    .drc-animal-title {
        text-transform: capitalize;
    }
    
    .drc-animal-stats {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-left: -0.25rem;
        margin-right: -0.25rem;
    }
    
    .drc-animal-stat {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-left: 0.25rem;
        margin-right: 0.25rem;
        font-size: 0.9em;
    }
    
    .drc-animal-image-icon {
        overflow: hidden;
        width: 1em;
        margin-right: 0.25rem;
        height: 1em;
        position: relative;
        display: inline-block;
    }
    
    .drc-animal-image-inner {
        vertical-align: top;
    }
    
    .drc-animal-value {
        font-weight: 300;
        margin-right: 0.25rem;
    }
    
    .drc-text-green {
        --tw-text-opacity: 1;
        color: rgba(110, 231, 183, var(--tw-text-opacity));
    }
    
    .drc-text-red {
        --tw-text-opacity: 1;
        color: rgba(252, 165, 165, var(--tw-text-opacity));
    }
    
    .drc-text-cyan {
        --tw-text-opacity: 1;
        color: rgba(103, 232, 249, var(--tw-text-opacity));
    }
    
    .drc-animal-font-normal {
        margin-top: 0.25rem;
        font-weight: 400;
    }
    
    .drc-animal-habitat {
        font-size: 0.9em;
        display: block;
        font-weight: 300;
        white-space: nowrap;
    }
    
    .drc-animal-summary {
        display: block;
        font-weight: 300;
        font-style: italic;
        white-space: nowrap;
        font-size: 0.9rem;
    }

    .drc-tree-line-begin {
        overflow: hidden;
        height: 0.75rem;
        line-height: 5rem;
        display: flex;
        justify-content: center;
        width: calc(15px + 0.5rem);
    }

    .drc-tree-line {
        overflow: hidden;
        height: 0.75rem;
        line-height: 5rem;
        display: flex;
        justify-content: center;
        width: calc(30px + 1rem);
        border: 3px solid azure;
    }

    .drc-tree-line-left {
        border-bottom: none !important;
        border-right: none !important;
        border-top: none !important;
    }

    .drc-tree-line-right {
        border-bottom: none !important;
        border-left: none !important;
        border-top: none !important;
    }

    .drc-tree-line-top {
        border-bottom: none !important;
        border-right: none !important;
        border-left: none !important;
    }

    .drc-tree-line-left-right {
        border-bottom: none !important;
        border-top: none !important;
    }

    .drc-tree-line-left-top {
        border-bottom: none !important;
        border-right: none !important;
    }

    .drc-tree-line-left-top-right {
        border-bottom: none !important;
    }

    .drc-tree-line-void {
        border-bottom: none !important;
        border-right: none !important;
        border-top: none !important;
        border-left: none !important;
    }

    .drc-tree-line-hcw-left {
        width: 15px !important;
        border-bottom: none !important;
        border-right: none !important;
        border-top: none !important;
    }

    .drc-tree-line-hcw-left-right {
        width: 15px !important;
        border-bottom: none !important;
        border-top: none !important;
    }

    .drc-tree-line-hcwfm-top {
        width: calc(15px + 1rem) !important;
        border-bottom: none !important;
        border-right: none !important;
        border-left: none !important;
    }

    .drc-tree-line-hcwfm-left-top {
        width: calc(15px + 1rem) !important;
        border-bottom: none !important;
        border-right: none !important;
    }

    .drc-tree-line-hcwfm-top-right {
        width: calc(15px + 1rem) !important;
        border-bottom: none !important;
        border-left: none !important;
    }

    .drc-tree-tier {
        text-align: center;
        width: 30px;
        height: 44px;
        margin-right: 0.5rem;
        margin-left: 0.5rem;
        margin-top: 1.25rem;
    }

    .drc-tabs {
        --el-tabs-header-height: 40px;
    }

    .drc-tabs-left {
        overflow: hidden;
    }

    .drc-tabs-header.drc-is-left {
        float: left;
        margin-bottom: 0;
        margin-right: 10px;
    }

    .drc-tabs-nav-wrap.drc-is-left {
        margin-right: -1px;
    }

    .drc-tabs-nav-scroll {
        height: 100%;
        overflow: hidden;
    }

    .drc-tabs-nav {
        --el-transition-duration: 0.3s;
        --el-index-normal: 1;
        white-space: nowrap;
        position: relative;
        transition: transform var(--el-transition-duration);
        float: left;
        z-index: calc(var(--el-index-normal) + 1);
    }

    .drc-tabs-nav.drc-is-left {
        float: none;
    }

    .drc-tabs-active-bar {
        --el-color-primary: #409eff;
        --el-transition-duration: 0.3s;
        --el-transition-function-ease-in-out-bezier: cubic-bezier(0.645, 0.045, 0.355, 1);
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background-color: var(--el-color-primary);
        z-index: 1;
        transition: width var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier),transform var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
        list-style: none;
    }

    .drc-tabs-active-bar.drc-is-left {
        right: 0;
        left: auto;
        top: 0;
        bottom: auto;
        width: 2px;
        height: auto;
    }

    .dark body .drc-tabs-item {
        --tw-text-opacity: 1;
        color: rgba(156,163,175,var(--tw-text-opacity));
    }

    .drc-tabs-item {
        --el-tabs-header-height: 40px;
        --el-font-size-base: 14px;
        --el-text-color-primary: #E5EAF3;

        padding: 0 20px;
        height: var(--el-tabs-header-height);
        box-sizing: border-box;
        line-height: var(--el-tabs-header-height);
        display: inline-block;
        list-style: none;
        font-size: var(--el-font-size-base);
        font-weight: 500;
        color: var(--el-text-color-primary);
        position: relative;
    }

    .drc-tabs-item.drc-is-left {
        text-align: right;
        display: block;
        border-right: 2px solid #344850;
    }

    .drc-tabs-item.drc-is-active {
        --tw-text-opacity: 1;
        color: rgba(96,165,250,var(--tw-text-opacity));
    }
    .drc-tabs-content {
        overflow: hidden;
        position: relative;
    }
    .drc-pr-4 {
        padding-right: 1rem;
    }
    
    .drc-pl-2 {
        padding-left: 0.5rem;
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
                <div style="display:flex">
                    <div id="treeModalMain">
                        <div></div>
                    </div>
                    <div style="font-size: 3em;">
                        <div style="height: calc(58px + 3.5rem);width: 2em;"></div>
                        <h1 class="drc-tree-tier">X</h1>
                        <h1 class="drc-tree-tier">IX</h1>
                        <h1 class="drc-tree-tier">VIII</h1>
                        <h1 class="drc-tree-tier">VII</h1>
                        <h1 class="drc-tree-tier">VI</h1>
                        <h1 class="drc-tree-tier">V</h1>
                        <h1 class="drc-tree-tier">IV</h1>
                        <h1 class="drc-tree-tier">III</h1>
                        <h1 class="drc-tree-tier">II</h1>
                        <h1 class="drc-tree-tier">I</h1>
                    </div>
                </div>

                <!--<img src="https://deeeep-reef-client.netlify.app/assets/evolution_tree.png"
                    alt="Deeeep.io v4 beta evolution tree">-->
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
    const treeModalMain = document.getElementById("treeModalMain");
    const treeAnimalRelationsLongest = treeAnimalRelationsProcessed.reduce(function (a, b) {
        return a.length > b.length ? a : b;
    }).length;
    (async () => {
        class Habitat {
            constructor(num) {
                this.NAMES = ['Cold', 'Warm', 'Shallow', 'Deep', 'Fresh', 'Salt', 'Reef'];
                this.MAX = Math.pow(2, this.NAMES.length) - 1;
                this.habitatNum = num;
            }
            convertToBase(num, base) {
                let conversion = [];
                let power, quotient, remainder = 0;
                if (num === 0) {
                    conversion = [0];
                }
                else {
                    power = Math.floor(Math.log(num) / Math.log(base));
                    while (power >= 0) {
                        quotient = Math.floor(num / Math.pow(base, power));
                        remainder = num % Math.pow(base, power);
                        conversion.unshift(quotient);
                        num = remainder;
                        power--;
                    }
                }
                return conversion;
            }
            convertToList() {
                const conversion = this.convertToBase(Math.floor(this.habitatNum), 2);
                const length = conversion.length;
                let partialDisplay = [];
                for (let index = 0; index < length; index += 2) {
                    let str = "";
                    let nextFlag = false;
                    let nextName = "";
                    let nextIndex = index + 1;
                    let currentFlag = conversion[index];
                    let currentName = currentFlag ? this.NAMES[index] : false;
                    if (nextIndex >= length) {
                        nextFlag = false;
                    }
                    else
                        nextFlag = conversion[nextIndex];
                    nextName = nextFlag ? this.NAMES[nextIndex] : false;
                    if (currentName && nextName) {
                        str = `${currentName}/${nextName}`;
                    }
                    else
                        str = currentName || nextName;
                    if (str) {
                        partialDisplay.push(str);
                    }
                }
                return partialDisplay;
            }
            hasReef() {
                return this.habitatNum >= Math.pow(2, this.NAMES.length - 1);
            }
        }
        const translations = await fetch("https://api.crowdl.io/deeeep/cdn/en.json")
            .then(res => res.json());
        for (let i in treeAnimalRelationsProcessed) {
            const row = document.createElement("div");
            row.classList.add("drc-tree-row");
            const placeholder = document.createElement("div");
            row.appendChild(placeholder);
            for (let j = 0; j < treeAnimalRelationsLongest; j++) {
                if (j >= treeAnimalRelationsProcessed[i].length) {
                    const animalElem = document.createElement("div");
                    animalElem.classList.add("drc-tree-void");
                    row.insertBefore(animalElem, row.firstElementChild);
                    //row.appendChild(animalElem);
                    continue;
                }
                if (treeAnimalRelationsProcessed[i][j].stringId === "void") {
                    const animalElem = document.createElement("div");
                    animalElem.classList.add("drc-tree-void");
                    row.insertBefore(animalElem, row.firstElementChild);
                    //row.appendChild(animalElem);
                    continue;
                }
                const animalId = treeAnimalRelationsProcessed[i][j].stringId;
                const animalStat = animalStatData.filter((stat) => stat.name === animalId)[0];
                const animalHabitat = new Habitat(animalStat.habitat);
                const animalElem = document.createElement("div");
                animalElem.classList.add("drc-tree-choice");
                animalElem.setAttribute("data-drc-tree", "drc-tree-animal-" + animalId);
                if (Number(i) > 8) {
                    animalElem.classList.add("drc-tree-choice-t10");
                }
                const imageWrapperElem = document.createElement("div");
                imageWrapperElem.classList.add("drc-tree-image");
                const imageElem = document.createElement("img");
                imageElem.classList.add("drc-tree-image-inner");
                imageElem.setAttribute("src", "https://beta.deeeep.io/assets/characters/" + animalId + ".png");
                imageWrapperElem.appendChild(imageElem);
                animalElem.appendChild(imageWrapperElem);
                row.insertBefore(animalElem, row.firstElementChild);
                //row.appendChild(animalElem);
                if (Number(i) > 6) {
                    let evolvesTo = [];
                    // Evolves to 
                    if (Number(i) < 9) {
                        let nextTier = [];
                        treeAnimalRelationsProcessed[i][j].evolvesTo.forEach(str => {
                            const a = treeAnimalRelations[Number(i) + 1]
                                .filter((animal) => {
                                return animal.stringId === str;
                            });
                            evolvesTo.push(a[0] ?? treeAnimalRelations[0][0]);
                            nextTier.push(a[0] ?? treeAnimalRelations[0][0]);
                        });
                        if (Number(i) === 7) {
                            for (let y in nextTier) {
                                nextTier[y].evolvesTo.forEach((str) => {
                                    const a = treeAnimalRelations[Number(i) + 2]
                                        .filter((animal) => {
                                        return animal.stringId === str;
                                    });
                                    evolvesTo.push(a[0] ?? treeAnimalRelations[0][0]);
                                    nextTier.push(a[0] ?? treeAnimalRelations[0][0]);
                                });
                            }
                        }
                    }
                    // Evolves into
                    if (Number(i) > 7) {
                        let nextTier = [];
                        treeAnimalRelations[Number(i) > 8 ? 8 : 7].forEach(animal => {
                            if (!animal.evolvesTo.includes(animalId))
                                return;
                            evolvesTo.push(animal);
                            nextTier.push(animal.stringId);
                        });
                        if (Number(i) > 8) {
                            for (let y in nextTier) {
                                treeAnimalRelations[7].forEach((animal) => {
                                    if (!animal.evolvesTo.includes(nextTier[y]))
                                        return;
                                    evolvesTo.push(animal);
                                    nextTier.push(animal);
                                });
                            }
                        }
                    }
                    animalElem.addEventListener("mouseover", () => {
                        for (let x in evolvesTo) {
                            document.querySelectorAll("div[data-drc-tree=" + "drc-tree-animal-" + evolvesTo[x].stringId + "]")
                                .forEach(elem => {
                                elem?.classList.add("drc-tree-choice-semiselected");
                            });
                        }
                    });
                    animalElem.addEventListener("mouseleave", () => {
                        for (let x in evolvesTo) {
                            document.querySelectorAll("div[data-drc-tree=" + "drc-tree-animal-" + evolvesTo[x].stringId + "]")
                                .forEach(elem => {
                                elem?.classList.remove("drc-tree-choice-semiselected");
                            });
                        }
                    });
                }
                const tooltip = `
    <div class="drc-animal-info">
    <h4 class="drc-animal-title" style="margin: 0;">${translations[animalId + "-name"]}</h4>
    <div class="drc-animal-stats">
        <div class="drc-animal-stat">
            <div class="drc-animal-image-icon">
                <img src="https://beta.deeeep.io/img/stats/health.png" class="drc-animal-image-inner"
                    style="object-fit: contain;">
                </div>
                <span class="drc-animal-value drc-text-green">${animalStat.healthMultiplier * 100}</span>
        </div>
        <div class="drc-animal-stat">
            <div class="drc-animal-image-icon">
                <img src="https://beta.deeeep.io/img/stats/damage.png" class="drc-animal-image-inner"
                    style="object-fit: contain;">
                </div>
                <span class="drc-animal-value drc-text-red">${animalStat.damageMultiplier * 20}</span>
        </div>
        <div class="drc-animal-stat">
            <div class="drc-animal-image-icon">
                <img src="https://beta.deeeep.io/img/stats/speed.png" class="drc-animal-image-inner"
                    style="object-fit: contain;">
                </div>
                <span class="drc-animal-value drc-text-cyan">${Math.ceil(animalStat.speedMultiplier * 100)}</span>
        </div>
        <div class="drc-animal-stat">
            <div class="drc-animal-image-icon">
                <img src="https://beta.deeeep.io/img/stats/shieldstat.png" class="drc-animal-image-inner"
                    style="object-fit: contain;">
                </div>
                <span class="drc-animal-value">${animalStat.damageBlock * 100}</span>
        </div>
    </div>
    <div class="drc-animal-font-normal">Habitat</div>
    <span class="drc-animal-habitat">${animalHabitat.convertToList().toString().replaceAll(',', ", ")}</span>
    <div class="drc-animal-font-normal">Summary</div>
    <span class="drc-animal-summary">"Coming soon"</span>
</div>
    `;
                (0, tippy_js_1.default)(animalElem, {
                    content: tooltip,
                    allowHTML: true,
                    zIndex: 99999,
                    duration: [0, 0],
                    offset: [0, 15]
                });
            }
            treeModalMain?.insertBefore(row, treeModalMain.firstElementChild);
            if (Number(i) > treeAnimalLines.length - 1)
                continue;
            for (let j in treeAnimalLines[i]) {
                const lineRow = document.createElement("div");
                lineRow.classList.add("drc-tree-row");
                const linePlaceholder = document.createElement("div");
                lineRow.appendChild(linePlaceholder);
                const beginLineElem = document.createElement("div");
                beginLineElem.classList.add("drc-tree-line-begin");
                lineRow.insertBefore(beginLineElem, lineRow.firstElementChild);
                for (let x in treeAnimalLines[i][j]) {
                    const lineElem = document.createElement("div");
                    lineElem.classList.add("drc-tree-line");
                    lineElem.classList.add("drc-tree-line-" + treeAnimalLines[i][j][x]);
                    lineRow.insertBefore(lineElem, lineRow.firstElementChild);
                }
                treeModalMain?.insertBefore(lineRow, treeModalMain.firstElementChild);
            }
            //treeModalMain?.appendChild(row);
        }
    })();
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
        if (key.code != settings.keybinds.evolutionTree
            || !gameStarted
            || !document.contains(document.querySelector("div.chat-input.horizontal-center[style='display: none;']"))
            || document.contains(document.querySelector("div.center > div.chat-container > div")))
            return;
        treeModalContainer.classList.remove("drc-modal-hidden");
    });
    window.addEventListener("keyup", (key) => {
        if (key.code != settings.keybinds.evolutionTree)
            return;
        treeModalContainer.classList.add("drc-modal-hidden");
    });
    // Asset swapper
    // Asset swapper button
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
                    <div class="spacer"></div>
                    <input id="assetSwapperIdInput" placeholder="Skin ID" class="drc-modal-hidden">
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
    const assetSwapperIdInput = document.getElementById("assetSwapperIdInput");
    const assetSwapperRuleList = document.getElementById("assetSwapperRuleList");
    let assetSwapperLetter = assetSwapperLetterDropdown.value;
    let assetSwapperTarget = '';
    let assetSwapperTargetSkins = [];
    let allSkins;
    let pendingSkins;
    // former prelude that was moved
    // modified api/animals json that excludes nonplayable animals
    let animals = JSON.parse(`[{"id":0,"name":"fish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":1,"name":"crab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":2,"name":"jellyfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":3,"name":"squid","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":4,"name":"seagull","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":5,"name":"ray","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":6,"name":"beaver","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":7,"name":"penguin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":8,"name":"tshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":9,"name":"dolphin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":10,"name":"shark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":11,"name":"killerwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":12,"name":"whale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":13,"name":"worm","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":14,"name":"anglerfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":15,"name":"leopardseal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":16,"name":"blobfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":17,"name":"kingcrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":19,"name":"seaturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":20,"name":"oarfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":21,"name":"octopus","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":22,"name":"giantsquid","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":23,"name":"narwhal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":24,"name":"cachalot","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":25,"name":"polarbear","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":26,"name":"lamprey","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":27,"name":"pelican","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":28,"name":"whaleshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":29,"name":"remora","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":30,"name":"marlin","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":31,"name":"sunfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":32,"name":"stonefish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":33,"name":"ghost","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":34,"name":"crocodile","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":35,"name":"electriceel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":36,"name":"frog","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":37,"name":"hippo","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":38,"name":"manatee","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":39,"name":"snappingturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":40,"name":"piranha","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":41,"name":"snake","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":42,"name":"baldeagle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":43,"name":"lionfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":45,"name":"mantaray","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":46,"name":"elephantseal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":47,"name":"lanternfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":48,"name":"sleepershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":49,"name":"gulpereel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":50,"name":"giantisopod","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":51,"name":"giantisopodclosed","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":53,"name":"seal","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":54,"name":"icefish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":55,"name":"barreleye","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":56,"name":"dragonfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":57,"name":"humboldtsquid","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":58,"name":"sealion","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":59,"name":"flyingfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":60,"name":"duck","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":61,"name":"goblinshark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":62,"name":"catfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":63,"name":"littleauk","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":64,"name":"pufferfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":65,"name":"pufferfishfilled","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":66,"name":"tigershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":68,"name":"anaconda","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":69,"name":"bobbitworm","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":70,"name":"mahimahi","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":71,"name":"walrus","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":72,"name":"frilledshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":73,"name":"sawfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":74,"name":"mantisshrimp","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":75,"name":"axolotl","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":76,"name":"bat","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":78,"name":"blindcavefish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":79,"name":"crayfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":80,"name":"goliathbullfrog","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":81,"name":"giantsalamander","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":82,"name":"alligatorsnappingturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":83,"name":"giantsoftshellturtle","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":84,"name":"giantsoftshellturtleclosed","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":85,"name":"olm","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":86,"name":"alligatorgar","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":87,"name":"humpbackwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":89,"name":"horseshoecrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":90,"name":"baskingshark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":91,"name":"colossalsquid","asset_count":4,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":92,"name":"climbingcavefish","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":93,"name":"archerfish","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":94,"name":"seaotter","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":95,"name":"lobster","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":96,"name":"barracuda","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":97,"name":"frogfish","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":98,"name":"morayeel","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":99,"name":"wobbegongshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":100,"name":"leatherbackturtle","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":101,"name":"threshershark","asset_count":2,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":102,"name":"atlantictorpedo","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":103,"name":"coconutcrab","asset_count":3,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":104,"name":"bullshark","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":105,"name":"hermitcrab","asset_count":1,"active":true,"beta":false,"created_at":"2021-04-18T21:33:24.000Z","updated_at":"2021-04-18T21:33:24.000Z"},{"id":106,"name":"giantpacificoctopus","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-13T16:26:42.000Z","updated_at":"2021-08-13T03:00:00.000Z"},{"id":107,"name":"beakedwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-16T16:35:10.000Z","updated_at":"2021-08-16T03:00:00.000Z"},{"id":108,"name":"megamouthshark","asset_count":3,"active":true,"beta":false,"created_at":"2021-08-18T16:45:07.000Z","updated_at":"2021-08-18T03:00:00.000Z"},{"id":109,"name":"belugawhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T02:00:24.000Z","updated_at":"2021-08-18T03:00:00.000Z"},{"id":110,"name":"vampiresquid","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-19T15:21:21.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":111,"name":"halibut","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T16:33:25.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":112,"name":"bowheadwhale","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-19T21:38:39.000Z","updated_at":"2021-08-19T03:00:00.000Z"},{"id":113,"name":"japanesespidercrab","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-20T04:23:37.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":114,"name":"cookiecuttershark","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-20T21:02:22.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":115,"name":"sarcasticfringehead","asset_count":3,"active":true,"beta":false,"created_at":"2021-08-20T23:19:56.000Z","updated_at":"2021-08-20T03:00:00.000Z"},{"id":116,"name":"parrotfish","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-21T04:09:09.000Z","updated_at":"2021-08-21T03:00:00.000Z"},{"id":117,"name":"wolfeel","asset_count":2,"active":true,"beta":false,"created_at":"2021-08-21T04:57:29.000Z","updated_at":"2021-08-21T03:00:00.000Z"},{"id":119,"name":"coelacanth","asset_count":1,"active":true,"beta":false,"created_at":"2021-08-24T15:31:45.000Z","updated_at":"2021-08-24T03:00:00.000Z"},{"id":120,"name":"napoleonwrasse","asset_count":1,"active":true,"beta":false,"created_at":"2022-07-11T15:54:00.000Z","updated_at":"2022-07-11T15:54:00.000Z"}]`);
    let translations = {};
    let animalList = [];
    function updateAssetSwapperTargetDropdown() {
        assetSwapperIdInput.classList.add("drc-modal-hidden");
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
    async function updateAssetSwapperSkinDropdown() {
        assetSwapperIdInput.classList.add("drc-modal-hidden");
        assetSwapperSkinDropdown.innerHTML = "";
        if (allSkins === undefined) {
            await fetch(API_URL + "/skins?cat=all")
                .then(res => res.json())
                .then(data => {
                assetSwapperTargetSkins = data.filter((s) => s.fish_level == assetSwapperTargetDropdown.value);
                allSkins = data;
            });
        }
        else
            assetSwapperTargetSkins = allSkins.filter((s) => s.fish_level == assetSwapperTargetDropdown.value);
        for (let i in assetSwapperTargetSkins) {
            const elem = document.createElement("option");
            elem.setAttribute("value", assetSwapperTargetSkins[i].id);
            elem.innerText = assetSwapperTargetSkins[i].name;
            assetSwapperSkinDropdown.appendChild(elem);
        }
        const otherElem = document.createElement("option");
        otherElem.setAttribute("value", "other");
        otherElem.innerText = "Other by ID";
        assetSwapperSkinDropdown.appendChild(otherElem);
    }
    ;
    assetSwapperSkinDropdown.addEventListener("change", () => {
        if (assetSwapperSkinDropdown.value === "other") {
            assetSwapperIdInput.value = "";
            assetSwapperIdInput.classList.remove("drc-modal-hidden");
        }
        else {
            assetSwapperIdInput.classList.add("drc-modal-hidden");
        }
    });
    async function updateAssetSwapperList() {
        let assetSwapperRuleSkins = [];
        let assetSwapperRuleAnimalName = "";
        let assetSwapperRuleSkinName = "";
        assetSwapperRuleList.innerHTML = "";
        for (let i in settings.assetSwapperConfig) {
            assetSwapperRuleSkinName = "";
            for (let j in animalList) {
                if (animalList[j].id == settings.assetSwapperConfig[i].animal) {
                    assetSwapperRuleAnimalName = animalList[j].name;
                    break;
                }
            }
            if (allSkins === undefined) {
                allSkins = await fetch(API_URL + "/skins?cat=all")
                    .then(res => res.json());
            }
            if (pendingSkins === undefined) {
                pendingSkins = await fetch(API_URL + "/skins/pending")
                    .then(res => res.json());
            }
            for (let j in allSkins) {
                if (allSkins[j].id == settings.assetSwapperConfig[i].skin) {
                    assetSwapperRuleSkinName = allSkins[j].name;
                    break;
                }
            }
            for (let j in pendingSkins) {
                if (pendingSkins[j].id == settings.assetSwapperConfig[i].skin) {
                    assetSwapperRuleSkinName = pendingSkins[j].name;
                    break;
                }
            }
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
            skinElem.innerText = assetSwapperRuleSkinName || "Unknown";
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
    }
    fetch("https://api.crowdl.io/deeeep/cdn/en.json")
        .then(res => res.json())
        .then(data => translations = data).then(() => {
        for (let i in animals) {
            animalList.push({
                name: translations[animals[i].name + "-name"] ?? animals[i].name,
                stringId: animals[i].name,
                id: animals[i].id
            });
        }
        // init dropdown
        updateAssetSwapperTargetDropdown();
        updateAssetSwapperList();
    });
    assetSwapperLetterDropdown.addEventListener("change", updateAssetSwapperTargetDropdown);
    assetSwapperTargetDropdown.addEventListener("change", updateAssetSwapperSkinDropdown);
    const assetSwapperAddButton = document.getElementById("assetSwapperAddButton");
    assetSwapperAddButton.addEventListener("click", () => {
        settings.assetSwapperConfig.push({
            animal: assetSwapperTargetDropdown.value,
            skin: assetSwapperSkinDropdown.value !== "other" ?
                assetSwapperSkinDropdown.value
                : assetSwapperIdInput.value
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
                        <input type="color" id="themeMakerOptionsModalBgColour" value="#1F2937">
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
                        <input type="color" id="themeMakerOptionsModalTextColour" value="#FFFFFF">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Loading Background Image: </p>
                        <div class="spacer"></div>
                        <input type="url" id="themeMakerOptionsLoadingBgImage" placeholder="URL to image">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Loading Icon Image: </p>
                        <div class="spacer"></div>
                        <input type="url" id="themeMakerOptionsLoadingIconImage" placeholder="URL to image">
                    </div>
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Loading Bar Colour: </p>
                        <div class="spacer"></div>
                        <input type="color" id="themeMakerOptionsLoadingBarColour" value="#7F1D1D">
                    </div>
                    <div id="themeMakerAdvancedThemeContainer" class="drc-modal-hidden">
                    <div class="spacer"></div>
                    <div class="assetswapper-list-rule">
                        <p>Advanced Theme: </p>
                        <div class="spacer"></div>
                        <input type="checkbox" id="themeMakerOptionsAdvancedTheme">
                    </div>
                    <div class="spacer"></div>
                    <div id="themeMakerWarningsAdvancedTheme" class="drc-modal-hidden" style="color:gray;">🛈 Make sure you trust the code. Pasting malicious code can compromise your machine.</div>
                    <div class="spacer"></div>
                    <div id="themeMakerWrapperOptionsAdvancedScript" class="drc-modal-hidden">
                        <div class="assetswapper-list-rule">
                            <p>Advanced Script: </p>
                            <div class="spacer"></div>
                            <textarea id="themeMakerOptionsAdvancedScript"></textarea>
                        </div>
                    </div>
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
    const themeMakerOptionsLoadingIconImage = document.getElementById("themeMakerOptionsLoadingIconImage");
    const themeMakerOptionsLoadingBarColour = document.getElementById("themeMakerOptionsLoadingBarColour");
    const themeMakerOptionsAdvancedTheme = document.getElementById("themeMakerOptionsAdvancedTheme");
    const themeMakerOptionsAdvancedScript = document.getElementById("themeMakerOptionsAdvancedScript");
    const themeMakerWarningsAdvancedTheme = document.getElementById("themeMakerWarningsAdvancedTheme");
    const themeMakerWrapperOptionsAdvancedScript = document.getElementById("themeMakerWrapperOptionsAdvancedScript");
    const themeMakerAdvancedThemeContainer = document.getElementById("themeMakerAdvancedThemeContainer");
    const themeMakerModalContainer = document.getElementById("themeMakerModalContainer");
    const themeMakerAddButton = document.getElementById("themeMakerAddButton");
    if (settings.developer) {
        themeMakerAdvancedThemeContainer.classList.remove("drc-modal-hidden");
    }
    themeMakerOptionsAdvancedTheme.addEventListener("click", () => {
        themeMakerWrapperOptionsAdvancedScript.classList.toggle("drc-modal-hidden");
        themeMakerWarningsAdvancedTheme.classList.toggle("drc-modal-hidden");
    });
    // Moved to here bc vars must be initialised
    const themeMakerButton = document.getElementById("themeMakerButton");
    themeMakerButton.addEventListener("click", () => {
        themeMakerEditTheme = false;
        // changes depending on amount of themes :)
        themeMakerOptionsName.value = "Theme " + settings.userThemeData.length;
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    function formatThemeMakerCSS() {
        return new Promise(async (resolve, reject) => {
            let homeBg, loadingBg, loadingBall;
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
            if (themeMakerOptionsLoadingIconImage.value != "") {
                const img = new Image();
                img.src = themeMakerOptionsLoadingIconImage.value;
                try {
                    await img.decode();
                    loadingBall = `
                        div.loading-bar > img.ball {
                            display: block !important;
                            box-sizing: border-box !important;
                            background: url(${themeMakerOptionsLoadingIconImage.value}) no-repeat !important;
                            width: ${img.naturalWidth}px !important;
                            height: ${img.naturalHeight}px !important;
                            padding-left: ${img.naturalWidth}px !important;
                        }
                        `;
                }
                catch (e) {
                    console.log("Could not load loading ball. Using defaults instead.");
                    // Just in case the request fails
                    loadingBall = `
                    div.loading-bar > img.ball {
                        display: block !important;
                        box-sizing: border-box !important;
                        background: url(${themeMakerOptionsLoadingIconImage.value}) no-repeat !important;
                        width: 128px !important;
                        height: 64px !important;
                        padding-left: 128px !important;
                    }
                    `;
                }
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
            resolve(`
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
        div.loading-bar > div {
            background-color: ${themeMakerOptionsLoadingBarColour.value} !important;
        }
        ${homeBg ?? ""}
        ${loadingBg ?? ""}
        ${loadingBall ?? ""}
        `);
        });
    }
    themeMakerAddButton.addEventListener("click", async () => {
        let theme = {
            name: themeMakerOptionsName.value,
            themedata: {
                bgImage: themeMakerOptionsBgImage.value,
                loadingBgImage: themeMakerOptionsLoadingBgImage.value,
                modalBgColour: themeMakerOptionsModalBgColour.value,
                modalTextColour: themeMakerOptionsModalTextColour.value,
                modalTransparency: themeMakerOptionsModalTransparency.value,
                loadingIconImage: themeMakerOptionsLoadingIconImage.value,
                loadingBarColour: themeMakerOptionsLoadingBarColour.value
            },
            src: await formatThemeMakerCSS(),
            active: true
        };
        if (themeMakerOptionsAdvancedTheme.checked) {
            theme.themetype = "advancedtheme";
            theme.script = themeMakerOptionsAdvancedScript.value;
            new Notification("Advanced Theme activated", {
                body: "You may need to restart the Client for your changes to take effect."
            });
        }
        if (settings.userThemeData.find(t => t.active)?.themetype === "advancedtheme") {
            new Notification("Advanced Theme deactivated", {
                body: "You may need to restart the Client for your changes to take effect."
            });
        }
        settings.userThemeData.push(theme);
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
        themeMakerOptionsModalBgColour.value = "#1F2937";
        themeMakerOptionsModalTextColour.value = "#FFFFFF";
        themeMakerOptionsModalTransparency.value = "0";
        themeMakerOptionsLoadingIconImage.value = "";
        themeMakerOptionsLoadingBarColour.value = "#7F1D1D";
        themeMakerOptionsAdvancedTheme.checked = false;
        themeMakerOptionsAdvancedScript.value = "";
        themeMakerWrapperOptionsAdvancedScript.classList.add("drc-modal-hidden");
        themeMakerWarningsAdvancedTheme.classList.add("drc-modal-hidden");
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    const themeMakerCloseButton = document.getElementById("themeMakerCloseButton");
    themeMakerCloseButton.addEventListener("click", () => {
        themeMakerEditTheme = false;
        // reset all values
        themeMakerOptionsName.value = "";
        themeMakerOptionsBgImage.value = "";
        themeMakerOptionsLoadingBgImage.value = "";
        themeMakerOptionsModalBgColour.value = "#1F2937";
        themeMakerOptionsModalTextColour.value = "#FFFFFF";
        themeMakerOptionsModalTransparency.value = "0";
        themeMakerOptionsLoadingIconImage.value = "";
        themeMakerOptionsLoadingBarColour.value = "#7F1D1D";
        themeMakerOptionsAdvancedTheme.checked = false;
        themeMakerOptionsAdvancedScript.value = "";
        themeMakerWrapperOptionsAdvancedScript.classList.add("drc-modal-hidden");
        themeMakerWarningsAdvancedTheme.classList.add("drc-modal-hidden");
        themeMakerModalContainer.classList.toggle("drc-modal-hidden");
    });
    clearSelectedUserTheme?.addEventListener("click", () => {
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
                // Notify if theme is off
                if (settings.userThemeData.find(t => t.active)?.themetype === "advancedtheme") {
                    new Notification("Advanced Theme deactivated", {
                        body: "You may need to restart the Client for your changes to take effect."
                    });
                }
                // clear active
                for (let j in settings.userThemeData) {
                    settings.userThemeData[j].active = false;
                }
                settings.userThemeData[i].active = true;
                if (settings.userThemeData[i].themetype === "advancedtheme") {
                    new Notification("Advanced Theme activated", {
                        body: "You may need to restart the Client for your changes to take effect."
                    });
                    DRC.Preload.evalInBrowserContext(settings.userThemeData[i].script);
                }
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
            if (settings.userThemeData[i].themetype === "advancedtheme") {
                // advanced theme
                const advancedElem = document.createElement("p");
                advancedElem.setAttribute("style", "color:gray;");
                advancedElem.innerText = "(Advanced)";
                mainElem.appendChild(advancedElem);
                const spacer_a = document.createElement("div");
                spacer_a.classList.add("spacer");
                mainElem.appendChild(spacer_a);
            }
            // Edit button
            const editElem = document.createElement("button");
            editElem.classList.add("assetswapper-new-button");
            editElem.innerText = "Edit";
            editElem.addEventListener("click", () => {
                themeMakerEditTheme = true;
                if (settings.userThemeData[i].themedata === undefined) {
                    // In case the theme was created without theme data
                    // I won't include loading icon/colour since the new themedata will be rolling in the same update anyway
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
                }
                else {
                    themeMakerOptionsName.value = settings.userThemeData[i].name;
                    themeMakerOptionsBgImage.value = settings.userThemeData[i].themedata["bgImage"] ?? "";
                    themeMakerOptionsLoadingBgImage.value = settings.userThemeData[i].themedata["loadingBgImage"] ?? "";
                    themeMakerOptionsModalBgColour.value = settings.userThemeData[i].themedata["modalBgColour"] ?? "#1F2937";
                    themeMakerOptionsModalTextColour.value = settings.userThemeData[i].themedata["modalTextColour"] ?? "#FFFFFF";
                    themeMakerOptionsModalTransparency.value = settings.userThemeData[i].themedata["modalTransparency"] ?? "0";
                    themeMakerOptionsLoadingIconImage.value = settings.userThemeData[i].themedata["loadingIconImage"] ?? "";
                    themeMakerOptionsLoadingBarColour.value = settings.userThemeData[i].themedata["loadingBarColour"] ?? "#7F1D1D";
                    themeMakerOptionsAdvancedTheme.checked = (settings.userThemeData[i].themetype !== undefined && settings.userThemeData[i].themetype === "advancedtheme") ? true : false;
                    themeMakerOptionsAdvancedScript.value = settings.userThemeData[i].script ?? "";
                    if (settings.userThemeData[i].themetype !== undefined && settings.userThemeData[i].themetype === "advancedtheme") {
                        themeMakerWrapperOptionsAdvancedScript.classList.remove("drc-modal-hidden");
                        themeMakerWarningsAdvancedTheme.classList.remove("drc-modal-hidden");
                    }
                    else {
                        themeMakerWrapperOptionsAdvancedScript.classList.add("drc-modal-hidden");
                        themeMakerWarningsAdvancedTheme.classList.add("drc-modal-hidden");
                    }
                }
                themeMakerModalContainer.classList.toggle("drc-modal-hidden");
            });
            mainElem.appendChild(editElem);
            const spacer2 = document.createElement("div");
            spacer2.classList.add("spacer");
            mainElem.appendChild(spacer2);
            // Delete button
            const deleteElem = document.createElement("button");
            deleteElem.classList.add("assetswapper-new-button");
            deleteElem.innerText = "Delete";
            deleteElem.addEventListener("click", () => {
                if (settings.userThemeData[i].themetype === "advancedtheme" && settings.userThemeData[i].active) {
                    new Notification("Active Advanced Theme deleted", {
                        body: "You may need to restart the Client for your changes to take effect."
                    });
                }
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
    themeMakerExportButton.addEventListener("click", async () => {
        const exportedTheme = JSON.parse(exportThemeDropdown.value);
        themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
        let theme = {
            name: exportedTheme.name,
            src: exportedTheme.src,
            themedata: exportedTheme.themedata
        };
        if (exportedTheme.themetype === "advancedtheme") {
            theme.themetype = "advancedtheme";
            theme.script = exportedTheme.script;
        }
        const content = JSON.stringify(theme);
        const path = await ipcRenderer.invoke("getPath", "downloads");
        const sub = exportedTheme.themetype === "advancedtheme" ? "drcadvancedtheme" : "drctheme";
        try {
            fs.writeFileSync(path + `/${exportedTheme.name.replace(/[^a-zA-Z0-9]/g, '')}.${sub}.json`, content);
            new Notification("Theme exported!", {
                body: `Your theme has been exported to ${exportedTheme.name.replace(/[^a-zA-Z0-9]/g, '')}.${sub}.json in your Downloads folder. `
            });
            // file written successfully
        }
        catch (err) {
            console.error(err);
            new Notification("Something went wrong", {
                body: `An error occurred while exporting your theme.`
            });
        }
    });
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
            themeMakerImportExportModalContainer.classList.toggle("drc-modal-hidden");
            // Prohibit importing advanced themes
            if (parsedTheme.themetype !== undefined && parsedTheme.themetype === "advancedtheme") {
                new Notification("Advanced Theme cannot be imported", {
                    body: "For security reasons, Advanced Themes can only be installed from the Plugins Registry."
                });
                return;
            }
            settings.userThemeData.push({
                name: parsedTheme.name,
                src: parsedTheme.src,
                active: true
            });
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
        pluginAutoUpdater();
    });
    function pluginLicenseTemplate(license, author) {
        let pluginLicense = license;
        switch (license) {
            case "<TEMPLATE_GPL-3.0>":
                // Copyright © 2007 Free Software Foundation, Inc. <https://fsf.org/>
                pluginLicense = `                    GNU GENERAL PUBLIC LICENSE
                        Version 3, 29 June 2007
 
  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
  Everyone is permitted to copy and distribute verbatim copies
  of this license document, but changing it is not allowed.
 
                             Preamble
 
   The GNU General Public License is a free, copyleft license for
 software and other kinds of works.
 
   The licenses for most software and other practical works are designed
 to take away your freedom to share and change the works.  By contrast,
 the GNU General Public License is intended to guarantee your freedom to
 share and change all versions of a program--to make sure it remains free
 software for all its users.  We, the Free Software Foundation, use the
 GNU General Public License for most of our software; it applies also to
 any other work released this way by its authors.  You can apply it to
 your programs, too.
 
   When we speak of free software, we are referring to freedom, not
 price.  Our General Public Licenses are designed to make sure that you
 have the freedom to distribute copies of free software (and charge for
 them if you wish), that you receive source code or can get it if you
 want it, that you can change the software or use pieces of it in new
 free programs, and that you know you can do these things.
 
   To protect your rights, we need to prevent others from denying you
 these rights or asking you to surrender the rights.  Therefore, you have
 certain responsibilities if you distribute copies of the software, or if
 you modify it: responsibilities to respect the freedom of others.
 
   For example, if you distribute copies of such a program, whether
 gratis or for a fee, you must pass on to the recipients the same
 freedoms that you received.  You must make sure that they, too, receive
 or can get the source code.  And you must show them these terms so they
 know their rights.
 
   Developers that use the GNU GPL protect your rights with two steps:
 (1) assert copyright on the software, and (2) offer you this License
 giving you legal permission to copy, distribute and/or modify it.
 
   For the developers' and authors' protection, the GPL clearly explains
 that there is no warranty for this free software.  For both users' and
 authors' sake, the GPL requires that modified versions be marked as
 changed, so that their problems will not be attributed erroneously to
 authors of previous versions.
 
   Some devices are designed to deny users access to install or run
 modified versions of the software inside them, although the manufacturer
 can do so.  This is fundamentally incompatible with the aim of
 protecting users' freedom to change the software.  The systematic
 pattern of such abuse occurs in the area of products for individuals to
 use, which is precisely where it is most unacceptable.  Therefore, we
 have designed this version of the GPL to prohibit the practice for those
 products.  If such problems arise substantially in other domains, we
 stand ready to extend this provision to those domains in future versions
 of the GPL, as needed to protect the freedom of users.
 
   Finally, every program is threatened constantly by software patents.
 States should not allow patents to restrict development and use of
 software on general-purpose computers, but in those that do, we wish to
 avoid the special danger that patents applied to a free program could
 make it effectively proprietary.  To prevent this, the GPL assures that
 patents cannot be used to render the program non-free.
 
   The precise terms and conditions for copying, distribution and
 modification follow.
 
                        TERMS AND CONDITIONS
 
   0. Definitions.
 
   "This License" refers to version 3 of the GNU General Public License.
 
   "Copyright" also means copyright-like laws that apply to other kinds of
 works, such as semiconductor masks.
 
   "The Program" refers to any copyrightable work licensed under this
 License.  Each licensee is addressed as "you".  "Licensees" and
 "recipients" may be individuals or organizations.
 
   To "modify" a work means to copy from or adapt all or part of the work
 in a fashion requiring copyright permission, other than the making of an
 exact copy.  The resulting work is called a "modified version" of the
 earlier work or a work "based on" the earlier work.
 
   A "covered work" means either the unmodified Program or a work based
 on the Program.
 
   To "propagate" a work means to do anything with it that, without
 permission, would make you directly or secondarily liable for
 infringement under applicable copyright law, except executing it on a
 computer or modifying a private copy.  Propagation includes copying,
 distribution (with or without modification), making available to the
 public, and in some countries other activities as well.
 
   To "convey" a work means any kind of propagation that enables other
 parties to make or receive copies.  Mere interaction with a user through
 a computer network, with no transfer of a copy, is not conveying.
 
   An interactive user interface displays "Appropriate Legal Notices"
 to the extent that it includes a convenient and prominently visible
 feature that (1) displays an appropriate copyright notice, and (2)
 tells the user that there is no warranty for the work (except to the
 extent that warranties are provided), that licensees may convey the
 work under this License, and how to view a copy of this License.  If
 the interface presents a list of user commands or options, such as a
 menu, a prominent item in the list meets this criterion.
 
   1. Source Code.
 
   The "source code" for a work means the preferred form of the work
 for making modifications to it.  "Object code" means any non-source
 form of a work.
 
   A "Standard Interface" means an interface that either is an official
 standard defined by a recognized standards body, or, in the case of
 interfaces specified for a particular programming language, one that
 is widely used among developers working in that language.
 
   The "System Libraries" of an executable work include anything, other
 than the work as a whole, that (a) is included in the normal form of
 packaging a Major Component, but which is not part of that Major
 Component, and (b) serves only to enable use of the work with that
 Major Component, or to implement a Standard Interface for which an
 implementation is available to the public in source code form.  A
 "Major Component", in this context, means a major essential component
 (kernel, window system, and so on) of the specific operating system
 (if any) on which the executable work runs, or a compiler used to
 produce the work, or an object code interpreter used to run it.
 
   The "Corresponding Source" for a work in object code form means all
 the source code needed to generate, install, and (for an executable
 work) run the object code and to modify the work, including scripts to
 control those activities.  However, it does not include the work's
 System Libraries, or general-purpose tools or generally available free
 programs which are used unmodified in performing those activities but
 which are not part of the work.  For example, Corresponding Source
 includes interface definition files associated with source files for
 the work, and the source code for shared libraries and dynamically
 linked subprograms that the work is specifically designed to require,
 such as by intimate data communication or control flow between those
 subprograms and other parts of the work.
 
   The Corresponding Source need not include anything that users
 can regenerate automatically from other parts of the Corresponding
 Source.
 
   The Corresponding Source for a work in source code form is that
 same work.
 
   2. Basic Permissions.
 
   All rights granted under this License are granted for the term of
 copyright on the Program, and are irrevocable provided the stated
 conditions are met.  This License explicitly affirms your unlimited
 permission to run the unmodified Program.  The output from running a
 covered work is covered by this License only if the output, given its
 content, constitutes a covered work.  This License acknowledges your
 rights of fair use or other equivalent, as provided by copyright law.
 
   You may make, run and propagate covered works that you do not
 convey, without conditions so long as your license otherwise remains
 in force.  You may convey covered works to others for the sole purpose
 of having them make modifications exclusively for you, or provide you
 with facilities for running those works, provided that you comply with
 the terms of this License in conveying all material for which you do
 not control copyright.  Those thus making or running the covered works
 for you must do so exclusively on your behalf, under your direction
 and control, on terms that prohibit them from making any copies of
 your copyrighted material outside their relationship with you.
 
   Conveying under any other circumstances is permitted solely under
 the conditions stated below.  Sublicensing is not allowed; section 10
 makes it unnecessary.
 
   3. Protecting Users' Legal Rights From Anti-Circumvention Law.
 
   No covered work shall be deemed part of an effective technological
 measure under any applicable law fulfilling obligations under article
 11 of the WIPO copyright treaty adopted on 20 December 1996, or
 similar laws prohibiting or restricting circumvention of such
 measures.
 
   When you convey a covered work, you waive any legal power to forbid
 circumvention of technological measures to the extent such circumvention
 is effected by exercising rights under this License with respect to
 the covered work, and you disclaim any intention to limit operation or
 modification of the work as a means of enforcing, against the work's
 users, your or third parties' legal rights to forbid circumvention of
 technological measures.
 
   4. Conveying Verbatim Copies.
 
   You may convey verbatim copies of the Program's source code as you
 receive it, in any medium, provided that you conspicuously and
 appropriately publish on each copy an appropriate copyright notice;
 keep intact all notices stating that this License and any
 non-permissive terms added in accord with section 7 apply to the code;
 keep intact all notices of the absence of any warranty; and give all
 recipients a copy of this License along with the Program.
 
   You may charge any price or no price for each copy that you convey,
 and you may offer support or warranty protection for a fee.
 
   5. Conveying Modified Source Versions.
 
   You may convey a work based on the Program, or the modifications to
 produce it from the Program, in the form of source code under the
 terms of section 4, provided that you also meet all of these conditions:
 
     a) The work must carry prominent notices stating that you modified
     it, and giving a relevant date.
 
     b) The work must carry prominent notices stating that it is
     released under this License and any conditions added under section
     7.  This requirement modifies the requirement in section 4 to
     "keep intact all notices".
 
     c) You must license the entire work, as a whole, under this
     License to anyone who comes into possession of a copy.  This
     License will therefore apply, along with any applicable section 7
     additional terms, to the whole of the work, and all its parts,
     regardless of how they are packaged.  This License gives no
     permission to license the work in any other way, but it does not
     invalidate such permission if you have separately received it.
 
     d) If the work has interactive user interfaces, each must display
     Appropriate Legal Notices; however, if the Program has interactive
     interfaces that do not display Appropriate Legal Notices, your
     work need not make them do so.
 
   A compilation of a covered work with other separate and independent
 works, which are not by their nature extensions of the covered work,
 and which are not combined with it such as to form a larger program,
 in or on a volume of a storage or distribution medium, is called an
 "aggregate" if the compilation and its resulting copyright are not
 used to limit the access or legal rights of the compilation's users
 beyond what the individual works permit.  Inclusion of a covered work
 in an aggregate does not cause this License to apply to the other
 parts of the aggregate.
 
   6. Conveying Non-Source Forms.
 
   You may convey a covered work in object code form under the terms
 of sections 4 and 5, provided that you also convey the
 machine-readable Corresponding Source under the terms of this License,
 in one of these ways:
 
     a) Convey the object code in, or embodied in, a physical product
     (including a physical distribution medium), accompanied by the
     Corresponding Source fixed on a durable physical medium
     customarily used for software interchange.
 
     b) Convey the object code in, or embodied in, a physical product
     (including a physical distribution medium), accompanied by a
     written offer, valid for at least three years and valid for as
     long as you offer spare parts or customer support for that product
     model, to give anyone who possesses the object code either (1) a
     copy of the Corresponding Source for all the software in the
     product that is covered by this License, on a durable physical
     medium customarily used for software interchange, for a price no
     more than your reasonable cost of physically performing this
     conveying of source, or (2) access to copy the
     Corresponding Source from a network server at no charge.
 
     c) Convey individual copies of the object code with a copy of the
     written offer to provide the Corresponding Source.  This
     alternative is allowed only occasionally and noncommercially, and
     only if you received the object code with such an offer, in accord
     with subsection 6b.
 
     d) Convey the object code by offering access from a designated
     place (gratis or for a charge), and offer equivalent access to the
     Corresponding Source in the same way through the same place at no
     further charge.  You need not require recipients to copy the
     Corresponding Source along with the object code.  If the place to
     copy the object code is a network server, the Corresponding Source
     may be on a different server (operated by you or a third party)
     that supports equivalent copying facilities, provided you maintain
     clear directions next to the object code saying where to find the
     Corresponding Source.  Regardless of what server hosts the
     Corresponding Source, you remain obligated to ensure that it is
     available for as long as needed to satisfy these requirements.
 
     e) Convey the object code using peer-to-peer transmission, provided
     you inform other peers where the object code and Corresponding
     Source of the work are being offered to the general public at no
     charge under subsection 6d.
 
   A separable portion of the object code, whose source code is excluded
 from the Corresponding Source as a System Library, need not be
 included in conveying the object code work.
 
   A "User Product" is either (1) a "consumer product", which means any
 tangible personal property which is normally used for personal, family,
 or household purposes, or (2) anything designed or sold for incorporation
 into a dwelling.  In determining whether a product is a consumer product,
 doubtful cases shall be resolved in favor of coverage.  For a particular
 product received by a particular user, "normally used" refers to a
 typical or common use of that class of product, regardless of the status
 of the particular user or of the way in which the particular user
 actually uses, or expects or is expected to use, the product.  A product
 is a consumer product regardless of whether the product has substantial
 commercial, industrial or non-consumer uses, unless such uses represent
 the only significant mode of use of the product.
 
   "Installation Information" for a User Product means any methods,
 procedures, authorization keys, or other information required to install
 and execute modified versions of a covered work in that User Product from
 a modified version of its Corresponding Source.  The information must
 suffice to ensure that the continued functioning of the modified object
 code is in no case prevented or interfered with solely because
 modification has been made.
 
   If you convey an object code work under this section in, or with, or
 specifically for use in, a User Product, and the conveying occurs as
 part of a transaction in which the right of possession and use of the
 User Product is transferred to the recipient in perpetuity or for a
 fixed term (regardless of how the transaction is characterized), the
 Corresponding Source conveyed under this section must be accompanied
 by the Installation Information.  But this requirement does not apply
 if neither you nor any third party retains the ability to install
 modified object code on the User Product (for example, the work has
 been installed in ROM).
 
   The requirement to provide Installation Information does not include a
 requirement to continue to provide support service, warranty, or updates
 for a work that has been modified or installed by the recipient, or for
 the User Product in which it has been modified or installed.  Access to a
 network may be denied when the modification itself materially and
 adversely affects the operation of the network or violates the rules and
 protocols for communication across the network.
 
   Corresponding Source conveyed, and Installation Information provided,
 in accord with this section must be in a format that is publicly
 documented (and with an implementation available to the public in
 source code form), and must require no special password or key for
 unpacking, reading or copying.
 
   7. Additional Terms.
 
   "Additional permissions" are terms that supplement the terms of this
 License by making exceptions from one or more of its conditions.
 Additional permissions that are applicable to the entire Program shall
 be treated as though they were included in this License, to the extent
 that they are valid under applicable law.  If additional permissions
 apply only to part of the Program, that part may be used separately
 under those permissions, but the entire Program remains governed by
 this License without regard to the additional permissions.
 
   When you convey a copy of a covered work, you may at your option
 remove any additional permissions from that copy, or from any part of
 it.  (Additional permissions may be written to require their own
 removal in certain cases when you modify the work.)  You may place
 additional permissions on material, added by you to a covered work,
 for which you have or can give appropriate copyright permission.
 
   Notwithstanding any other provision of this License, for material you
 add to a covered work, you may (if authorized by the copyright holders of
 that material) supplement the terms of this License with terms:
 
     a) Disclaiming warranty or limiting liability differently from the
     terms of sections 15 and 16 of this License; or
 
     b) Requiring preservation of specified reasonable legal notices or
     author attributions in that material or in the Appropriate Legal
     Notices displayed by works containing it; or
 
     c) Prohibiting misrepresentation of the origin of that material, or
     requiring that modified versions of such material be marked in
     reasonable ways as different from the original version; or
 
     d) Limiting the use for publicity purposes of names of licensors or
     authors of the material; or
 
     e) Declining to grant rights under trademark law for use of some
     trade names, trademarks, or service marks; or
 
     f) Requiring indemnification of licensors and authors of that
     material by anyone who conveys the material (or modified versions of
     it) with contractual assumptions of liability to the recipient, for
     any liability that these contractual assumptions directly impose on
     those licensors and authors.
 
   All other non-permissive additional terms are considered "further
 restrictions" within the meaning of section 10.  If the Program as you
 received it, or any part of it, contains a notice stating that it is
 governed by this License along with a term that is a further
 restriction, you may remove that term.  If a license document contains
 a further restriction but permits relicensing or conveying under this
 License, you may add to a covered work material governed by the terms
 of that license document, provided that the further restriction does
 not survive such relicensing or conveying.
 
   If you add terms to a covered work in accord with this section, you
 must place, in the relevant source files, a statement of the
 additional terms that apply to those files, or a notice indicating
 where to find the applicable terms.
 
   Additional terms, permissive or non-permissive, may be stated in the
 form of a separately written license, or stated as exceptions;
 the above requirements apply either way.
 
   8. Termination.
 
   You may not propagate or modify a covered work except as expressly
 provided under this License.  Any attempt otherwise to propagate or
 modify it is void, and will automatically terminate your rights under
 this License (including any patent licenses granted under the third
 paragraph of section 11).
 
   However, if you cease all violation of this License, then your
 license from a particular copyright holder is reinstated (a)
 provisionally, unless and until the copyright holder explicitly and
 finally terminates your license, and (b) permanently, if the copyright
 holder fails to notify you of the violation by some reasonable means
 prior to 60 days after the cessation.
 
   Moreover, your license from a particular copyright holder is
 reinstated permanently if the copyright holder notifies you of the
 violation by some reasonable means, this is the first time you have
 received notice of violation of this License (for any work) from that
 copyright holder, and you cure the violation prior to 30 days after
 your receipt of the notice.
 
   Termination of your rights under this section does not terminate the
 licenses of parties who have received copies or rights from you under
 this License.  If your rights have been terminated and not permanently
 reinstated, you do not qualify to receive new licenses for the same
 material under section 10.
 
   9. Acceptance Not Required for Having Copies.
 
   You are not required to accept this License in order to receive or
 run a copy of the Program.  Ancillary propagation of a covered work
 occurring solely as a consequence of using peer-to-peer transmission
 to receive a copy likewise does not require acceptance.  However,
 nothing other than this License grants you permission to propagate or
 modify any covered work.  These actions infringe copyright if you do
 not accept this License.  Therefore, by modifying or propagating a
 covered work, you indicate your acceptance of this License to do so.
 
   10. Automatic Licensing of Downstream Recipients.
 
   Each time you convey a covered work, the recipient automatically
 receives a license from the original licensors, to run, modify and
 propagate that work, subject to this License.  You are not responsible
 for enforcing compliance by third parties with this License.
 
   An "entity transaction" is a transaction transferring control of an
 organization, or substantially all assets of one, or subdividing an
 organization, or merging organizations.  If propagation of a covered
 work results from an entity transaction, each party to that
 transaction who receives a copy of the work also receives whatever
 licenses to the work the party's predecessor in interest had or could
 give under the previous paragraph, plus a right to possession of the
 Corresponding Source of the work from the predecessor in interest, if
 the predecessor has it or can get it with reasonable efforts.
 
   You may not impose any further restrictions on the exercise of the
 rights granted or affirmed under this License.  For example, you may
 not impose a license fee, royalty, or other charge for exercise of
 rights granted under this License, and you may not initiate litigation
 (including a cross-claim or counterclaim in a lawsuit) alleging that
 any patent claim is infringed by making, using, selling, offering for
 sale, or importing the Program or any portion of it.
 
   11. Patents.
 
   A "contributor" is a copyright holder who authorizes use under this
 License of the Program or a work on which the Program is based.  The
 work thus licensed is called the contributor's "contributor version".
 
   A contributor's "essential patent claims" are all patent claims
 owned or controlled by the contributor, whether already acquired or
 hereafter acquired, that would be infringed by some manner, permitted
 by this License, of making, using, or selling its contributor version,
 but do not include claims that would be infringed only as a
 consequence of further modification of the contributor version.  For
 purposes of this definition, "control" includes the right to grant
 patent sublicenses in a manner consistent with the requirements of
 this License.
 
   Each contributor grants you a non-exclusive, worldwide, royalty-free
 patent license under the contributor's essential patent claims, to
 make, use, sell, offer for sale, import and otherwise run, modify and
 propagate the contents of its contributor version.
 
   In the following three paragraphs, a "patent license" is any express
 agreement or commitment, however denominated, not to enforce a patent
 (such as an express permission to practice a patent or covenant not to
 sue for patent infringement).  To "grant" such a patent license to a
 party means to make such an agreement or commitment not to enforce a
 patent against the party.
 
   If you convey a covered work, knowingly relying on a patent license,
 and the Corresponding Source of the work is not available for anyone
 to copy, free of charge and under the terms of this License, through a
 publicly available network server or other readily accessible means,
 then you must either (1) cause the Corresponding Source to be so
 available, or (2) arrange to deprive yourself of the benefit of the
 patent license for this particular work, or (3) arrange, in a manner
 consistent with the requirements of this License, to extend the patent
 license to downstream recipients.  "Knowingly relying" means you have
 actual knowledge that, but for the patent license, your conveying the
 covered work in a country, or your recipient's use of the covered work
 in a country, would infringe one or more identifiable patents in that
 country that you have reason to believe are valid.
 
   If, pursuant to or in connection with a single transaction or
 arrangement, you convey, or propagate by procuring conveyance of, a
 covered work, and grant a patent license to some of the parties
 receiving the covered work authorizing them to use, propagate, modify
 or convey a specific copy of the covered work, then the patent license
 you grant is automatically extended to all recipients of the covered
 work and works based on it.
 
   A patent license is "discriminatory" if it does not include within
 the scope of its coverage, prohibits the exercise of, or is
 conditioned on the non-exercise of one or more of the rights that are
 specifically granted under this License.  You may not convey a covered
 work if you are a party to an arrangement with a third party that is
 in the business of distributing software, under which you make payment
 to the third party based on the extent of your activity of conveying
 the work, and under which the third party grants, to any of the
 parties who would receive the covered work from you, a discriminatory
 patent license (a) in connection with copies of the covered work
 conveyed by you (or copies made from those copies), or (b) primarily
 for and in connection with specific products or compilations that
 contain the covered work, unless you entered into that arrangement,
 or that patent license was granted, prior to 28 March 2007.
 
   Nothing in this License shall be construed as excluding or limiting
 any implied license or other defenses to infringement that may
 otherwise be available to you under applicable patent law.
 
   12. No Surrender of Others' Freedom.
 
   If conditions are imposed on you (whether by court order, agreement or
 otherwise) that contradict the conditions of this License, they do not
 excuse you from the conditions of this License.  If you cannot convey a
 covered work so as to satisfy simultaneously your obligations under this
 License and any other pertinent obligations, then as a consequence you may
 not convey it at all.  For example, if you agree to terms that obligate you
 to collect a royalty for further conveying from those to whom you convey
 the Program, the only way you could satisfy both those terms and this
 License would be to refrain entirely from conveying the Program.
 
   13. Use with the GNU Affero General Public License.
 
   Notwithstanding any other provision of this License, you have
 permission to link or combine any covered work with a work licensed
 under version 3 of the GNU Affero General Public License into a single
 combined work, and to convey the resulting work.  The terms of this
 License will continue to apply to the part which is the covered work,
 but the special requirements of the GNU Affero General Public License,
 section 13, concerning interaction through a network will apply to the
 combination as such.
 
   14. Revised Versions of this License.
 
   The Free Software Foundation may publish revised and/or new versions of
 the GNU General Public License from time to time.  Such new versions will
 be similar in spirit to the present version, but may differ in detail to
 address new problems or concerns.
 
   Each version is given a distinguishing version number.  If the
 Program specifies that a certain numbered version of the GNU General
 Public License "or any later version" applies to it, you have the
 option of following the terms and conditions either of that numbered
 version or of any later version published by the Free Software
 Foundation.  If the Program does not specify a version number of the
 GNU General Public License, you may choose any version ever published
 by the Free Software Foundation.
 
   If the Program specifies that a proxy can decide which future
 versions of the GNU General Public License can be used, that proxy's
 public statement of acceptance of a version permanently authorizes you
 to choose that version for the Program.
 
   Later license versions may give you additional or different
 permissions.  However, no additional obligations are imposed on any
 author or copyright holder as a result of your choosing to follow a
 later version.
 
   15. Disclaimer of Warranty.
 
   THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
 APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
 HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
 OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
 THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM
 IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 ALL NECESSARY SERVICING, REPAIR OR CORRECTION.
 
   16. Limitation of Liability.
 
   IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
 WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS
 THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY
 GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE
 USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF
 DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD
 PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),
 EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF
 SUCH DAMAGES.
 
   17. Interpretation of Sections 15 and 16.
 
   If the disclaimer of warranty and limitation of liability provided
 above cannot be given local legal effect according to their terms,
 reviewing courts shall apply local law that most closely approximates
 an absolute waiver of all civil liability in connection with the
 Program, unless a warranty or assumption of liability accompanies a
 copy of the Program in return for a fee.
 
                      END OF TERMS AND CONDITIONS
 
             How to Apply These Terms to Your New Programs
 
   If you develop a new program, and you want it to be of the greatest
 possible use to the public, the best way to achieve this is to make it
 free software which everyone can redistribute and change under these terms.
 
   To do so, attach the following notices to the program.  It is safest
 to attach them to the start of each source file to most effectively
 state the exclusion of warranty; and each file should have at least
 the "copyright" line and a pointer to where the full notice is found.
 
     <one line to give the program's name and a brief idea of what it does.>
     Copyright (C) <year>  <name of author>
 
     This program is free software: you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation, either version 3 of the License, or
     (at your option) any later version.
 
     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.
 
     You should have received a copy of the GNU General Public License
     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 
 Also add information on how to contact you by electronic and paper mail.
 
   If the program does terminal interaction, make it output a short
 notice like this when it starts in an interactive mode:
 
     <program>  Copyright (C) <year>  <name of author>
     This program comes with ABSOLUTELY NO WARRANTY; for details type \`show w'.
     This is free software, and you are welcome to redistribute it
     under certain conditions; type \`show c' for details.
 
 The hypothetical commands \`show w' and \`show c' should show the appropriate
 parts of the General Public License.  Of course, your program's commands
 might be different; for a GUI interface, you would use an "about box".
 
   You should also get your employer (if you work as a programmer) or school,
 if any, to sign a "copyright disclaimer" for the program, if necessary.
 For more information on this, and how to apply and follow the GNU GPL, see
 <https://www.gnu.org/licenses/>.
 
   The GNU General Public License does not permit incorporating your program
 into proprietary programs.  If your program is a subroutine library, you
 may consider it more useful to permit linking proprietary applications with
 the library.  If this is what you want to do, use the GNU Lesser General
 Public License instead of this License.  But first, please read
 <https://www.gnu.org/licenses/why-not-lgpl.html>.`;
                break;
            case "<TEMPLATE_LGPL-3.0>":
                // Copyright © 2007 Free Software Foundation, Inc. <https://fsf.org/>
                pluginLicense = `                   GNU LESSER GENERAL PUBLIC LICENSE
                        Version 3, 29 June 2007
 
  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
  Everyone is permitted to copy and distribute verbatim copies
  of this license document, but changing it is not allowed.
 
 
   This version of the GNU Lesser General Public License incorporates
 the terms and conditions of version 3 of the GNU General Public
 License, supplemented by the additional permissions listed below.
 
   0. Additional Definitions.
 
   As used herein, "this License" refers to version 3 of the GNU Lesser
 General Public License, and the "GNU GPL" refers to version 3 of the GNU
 General Public License.
 
   "The Library" refers to a covered work governed by this License,
 other than an Application or a Combined Work as defined below.
 
   An "Application" is any work that makes use of an interface provided
 by the Library, but which is not otherwise based on the Library.
 Defining a subclass of a class defined by the Library is deemed a mode
 of using an interface provided by the Library.
 
   A "Combined Work" is a work produced by combining or linking an
 Application with the Library.  The particular version of the Library
 with which the Combined Work was made is also called the "Linked
 Version".
 
   The "Minimal Corresponding Source" for a Combined Work means the
 Corresponding Source for the Combined Work, excluding any source code
 for portions of the Combined Work that, considered in isolation, are
 based on the Application, and not on the Linked Version.
 
   The "Corresponding Application Code" for a Combined Work means the
 object code and/or source code for the Application, including any data
 and utility programs needed for reproducing the Combined Work from the
 Application, but excluding the System Libraries of the Combined Work.
 
   1. Exception to Section 3 of the GNU GPL.
 
   You may convey a covered work under sections 3 and 4 of this License
 without being bound by section 3 of the GNU GPL.
 
   2. Conveying Modified Versions.
 
   If you modify a copy of the Library, and, in your modifications, a
 facility refers to a function or data to be supplied by an Application
 that uses the facility (other than as an argument passed when the
 facility is invoked), then you may convey a copy of the modified
 version:
 
    a) under this License, provided that you make a good faith effort to
    ensure that, in the event an Application does not supply the
    function or data, the facility still operates, and performs
    whatever part of its purpose remains meaningful, or
 
    b) under the GNU GPL, with none of the additional permissions of
    this License applicable to that copy.
 
   3. Object Code Incorporating Material from Library Header Files.
 
   The object code form of an Application may incorporate material from
 a header file that is part of the Library.  You may convey such object
 code under terms of your choice, provided that, if the incorporated
 material is not limited to numerical parameters, data structure
 layouts and accessors, or small macros, inline functions and templates
 (ten or fewer lines in length), you do both of the following:
 
    a) Give prominent notice with each copy of the object code that the
    Library is used in it and that the Library and its use are
    covered by this License.
 
    b) Accompany the object code with a copy of the GNU GPL and this license
    document.
 
   4. Combined Works.
 
   You may convey a Combined Work under terms of your choice that,
 taken together, effectively do not restrict modification of the
 portions of the Library contained in the Combined Work and reverse
 engineering for debugging such modifications, if you also do each of
 the following:
 
    a) Give prominent notice with each copy of the Combined Work that
    the Library is used in it and that the Library and its use are
    covered by this License.
 
    b) Accompany the Combined Work with a copy of the GNU GPL and this license
    document.
 
    c) For a Combined Work that displays copyright notices during
    execution, include the copyright notice for the Library among
    these notices, as well as a reference directing the user to the
    copies of the GNU GPL and this license document.
 
    d) Do one of the following:
 
        0) Convey the Minimal Corresponding Source under the terms of this
        License, and the Corresponding Application Code in a form
        suitable for, and under terms that permit, the user to
        recombine or relink the Application with a modified version of
        the Linked Version to produce a modified Combined Work, in the
        manner specified by section 6 of the GNU GPL for conveying
        Corresponding Source.
 
        1) Use a suitable shared library mechanism for linking with the
        Library.  A suitable mechanism is one that (a) uses at run time
        a copy of the Library already present on the user's computer
        system, and (b) will operate properly with a modified version
        of the Library that is interface-compatible with the Linked
        Version.
 
    e) Provide Installation Information, but only if you would otherwise
    be required to provide such information under section 6 of the
    GNU GPL, and only to the extent that such information is
    necessary to install and execute a modified version of the
    Combined Work produced by recombining or relinking the
    Application with a modified version of the Linked Version. (If
    you use option 4d0, the Installation Information must accompany
    the Minimal Corresponding Source and Corresponding Application
    Code. If you use option 4d1, you must provide the Installation
    Information in the manner specified by section 6 of the GNU GPL
    for conveying Corresponding Source.)
 
   5. Combined Libraries.
 
   You may place library facilities that are a work based on the
 Library side by side in a single library together with other library
 facilities that are not Applications and are not covered by this
 License, and convey such a combined library under terms of your
 choice, if you do both of the following:
 
    a) Accompany the combined library with a copy of the same work based
    on the Library, uncombined with any other library facilities,
    conveyed under the terms of this License.
 
    b) Give prominent notice with the combined library that part of it
    is a work based on the Library, and explaining where to find the
    accompanying uncombined form of the same work.
 
   6. Revised Versions of the GNU Lesser General Public License.
 
   The Free Software Foundation may publish revised and/or new versions
 of the GNU Lesser General Public License from time to time. Such new
 versions will be similar in spirit to the present version, but may
 differ in detail to address new problems or concerns.
 
   Each version is given a distinguishing version number. If the
 Library as you received it specifies that a certain numbered version
 of the GNU Lesser General Public License "or any later version"
 applies to it, you have the option of following the terms and
 conditions either of that published version or of any later version
 published by the Free Software Foundation. If the Library as you
 received it does not specify a version number of the GNU Lesser
 General Public License, you may choose any version of the GNU Lesser
 General Public License ever published by the Free Software Foundation.
 
   If the Library as you received it specifies that a proxy can decide
 whether future versions of the GNU Lesser General Public License shall
 apply, that proxy's public statement of acceptance of any version is
 permanent authorization for you to choose that version for the
 Library.`;
                break;
            case "<TEMPLATE_MIT>":
                /*
                MIT License

                Copyright (c) 2023 Massuchets Institute of Technology
                                    
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:

                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.

                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.*/
                pluginLicense = `MIT License

Copyright (c) ${(new Date()).getFullYear()} ${author}
                       
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
                break;
            case "<TEMPLATE_Apache-2.0>":
                /*
                         Apache License
                   Version 2.0, January 2004
                http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based on (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems,
and issue tracking systems that are managed by, or on behalf of, the
Licensor for the purpose of discussing and improving the Work, but
excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
copyright license to reproduce, prepare Derivative Works of,
publicly display, publicly perform, sublicense, and distribute the
Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
(except as stated in this section) patent license to make, have made,
use, offer to sell, sell, import, and otherwise transfer the Work,
where such license applies only to those patent claims licensable
by such Contributor that are necessarily infringed by their
Contribution(s) alone or by combination of their Contribution(s)
with the Work to which such Contribution(s) was submitted. If You
institute patent litigation against any entity (including a
cross-claim or counterclaim in a lawsuit) alleging that the Work
or a Contribution incorporated within the Work constitutes direct
or contributory patent infringement, then any patent licenses
granted to You under this License for that Work shall terminate
as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
Work or Derivative Works thereof in any medium, with or without
modifications, and in Source or Object form, provided that You
meet the following conditions:

(a) You must give any other recipients of the Work or
  Derivative Works a copy of this License; and

(b) You must cause any modified files to carry prominent notices
  stating that You changed the files; and

(c) You must retain, in the Source form of any Derivative Works
  that You distribute, all copyright, patent, trademark, and
  attribution notices from the Source form of the Work,
  excluding those notices that do not pertain to any part of
  the Derivative Works; and

(d) If the Work includes a "NOTICE" text file as part of its
  distribution, then any Derivative Works that You distribute must
  include a readable copy of the attribution notices contained
  within such NOTICE file, excluding those notices that do not
  pertain to any part of the Derivative Works, in at least one
  of the following places: within a NOTICE text file distributed
  as part of the Derivative Works; within the Source form or
  documentation, if provided along with the Derivative Works; or,
  within a display generated by the Derivative Works, if and
  wherever such third-party notices normally appear. The contents
  of the NOTICE file are for informational purposes only and
  do not modify the License. You may add Your own attribution
  notices within Derivative Works that You distribute, alongside
  or as an addendum to the NOTICE text from the Work, provided
  that such additional attribution notices cannot be construed
  as modifying the License.

You may add Your own copyright statement to Your modifications and
may provide additional or different license terms and conditions
for use, reproduction, or distribution of Your modifications, or
for any such Derivative Works as a whole, provided Your use,
reproduction, and distribution of the Work otherwise complies with
the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
any Contribution intentionally submitted for inclusion in the Work
by You to the Licensor shall be under the terms and conditions of
this License, without any additional terms or conditions.
Notwithstanding the above, nothing herein shall supersede or modify
the terms of any separate license agreement you may have executed
with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
names, trademarks, service marks, or product names of the Licensor,
except as required for reasonable and customary use in describing the
origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
agreed to in writing, Licensor provides the Work (and each
Contributor provides its Contributions) on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied, including, without limitation, any warranties or conditions
of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
PARTICULAR PURPOSE. You are solely responsible for determining the
appropriateness of using or redistributing the Work and assume any
risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
whether in tort (including negligence), contract, or otherwise,
unless required by applicable law (such as deliberate and grossly
negligent acts) or agreed to in writing, shall any Contributor be
liable to You for damages, including any direct, indirect, special,
incidental, or consequential damages of any character arising as a
result of this License or out of the use or inability to use the
Work (including but not limited to damages for loss of goodwill,
work stoppage, computer failure or malfunction, or any and all
other commercial damages or losses), even if such Contributor
has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
the Work or Derivative Works thereof, You may choose to offer,
and charge a fee for, acceptance of support, warranty, indemnity,
or other liability obligations and/or rights consistent with this
License. However, in accepting such obligations, You may act only
on Your own behalf and on Your sole responsibility, not on behalf
of any other Contributor, and only if You agree to indemnify,
defend, and hold each Contributor harmless for any liability
incurred by, or claims asserted against, such Contributor by reason
of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

To apply the Apache License to your work, attach the following
boilerplate notice, with the fields enclosed by brackets "[]"
replaced with your own identifying information. (Don't include
the brackets!)  The text should be enclosed in the appropriate
comment syntax for the file format. We also recommend that a
file or class name and description of purpose be included on the
same "printed page" as the copyright notice for easier
identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
                pluginLicense = `
                        Apache License
                  Version 2.0, January 2004
               http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based on (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems,
and issue tracking systems that are managed by, or on behalf of, the
Licensor for the purpose of discussing and improving the Work, but
excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
copyright license to reproduce, prepare Derivative Works of,
publicly display, publicly perform, sublicense, and distribute the
Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
(except as stated in this section) patent license to make, have made,
use, offer to sell, sell, import, and otherwise transfer the Work,
where such license applies only to those patent claims licensable
by such Contributor that are necessarily infringed by their
Contribution(s) alone or by combination of their Contribution(s)
with the Work to which such Contribution(s) was submitted. If You
institute patent litigation against any entity (including a
cross-claim or counterclaim in a lawsuit) alleging that the Work
or a Contribution incorporated within the Work constitutes direct
or contributory patent infringement, then any patent licenses
granted to You under this License for that Work shall terminate
as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
Work or Derivative Works thereof in any medium, with or without
modifications, and in Source or Object form, provided that You
meet the following conditions:

(a) You must give any other recipients of the Work or
 Derivative Works a copy of this License; and

(b) You must cause any modified files to carry prominent notices
 stating that You changed the files; and

(c) You must retain, in the Source form of any Derivative Works
 that You distribute, all copyright, patent, trademark, and
 attribution notices from the Source form of the Work,
 excluding those notices that do not pertain to any part of
 the Derivative Works; and

(d) If the Work includes a "NOTICE" text file as part of its
 distribution, then any Derivative Works that You distribute must
 include a readable copy of the attribution notices contained
 within such NOTICE file, excluding those notices that do not
 pertain to any part of the Derivative Works, in at least one
 of the following places: within a NOTICE text file distributed
 as part of the Derivative Works; within the Source form or
 documentation, if provided along with the Derivative Works; or,
 within a display generated by the Derivative Works, if and
 wherever such third-party notices normally appear. The contents
 of the NOTICE file are for informational purposes only and
 do not modify the License. You may add Your own attribution
 notices within Derivative Works that You distribute, alongside
 or as an addendum to the NOTICE text from the Work, provided
 that such additional attribution notices cannot be construed
 as modifying the License.

You may add Your own copyright statement to Your modifications and
may provide additional or different license terms and conditions
for use, reproduction, or distribution of Your modifications, or
for any such Derivative Works as a whole, provided Your use,
reproduction, and distribution of the Work otherwise complies with
the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
any Contribution intentionally submitted for inclusion in the Work
by You to the Licensor shall be under the terms and conditions of
this License, without any additional terms or conditions.
Notwithstanding the above, nothing herein shall supersede or modify
the terms of any separate license agreement you may have executed
with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
names, trademarks, service marks, or product names of the Licensor,
except as required for reasonable and customary use in describing the
origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
agreed to in writing, Licensor provides the Work (and each
Contributor provides its Contributions) on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied, including, without limitation, any warranties or conditions
of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
PARTICULAR PURPOSE. You are solely responsible for determining the
appropriateness of using or redistributing the Work and assume any
risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
whether in tort (including negligence), contract, or otherwise,
unless required by applicable law (such as deliberate and grossly
negligent acts) or agreed to in writing, shall any Contributor be
liable to You for damages, including any direct, indirect, special,
incidental, or consequential damages of any character arising as a
result of this License or out of the use or inability to use the
Work (including but not limited to damages for loss of goodwill,
work stoppage, computer failure or malfunction, or any and all
other commercial damages or losses), even if such Contributor
has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
the Work or Derivative Works thereof, You may choose to offer,
and charge a fee for, acceptance of support, warranty, indemnity,
or other liability obligations and/or rights consistent with this
License. However, in accepting such obligations, You may act only
on Your own behalf and on Your sole responsibility, not on behalf
of any other Contributor, and only if You agree to indemnify,
defend, and hold each Contributor harmless for any liability
incurred by, or claims asserted against, such Contributor by reason
of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

To apply the Apache License to your work, attach the following
boilerplate notice, with the fields enclosed by brackets "[]"
replaced with your own identifying information. (Don't include
the brackets!)  The text should be enclosed in the appropriate
comment syntax for the file format. We also recommend that a
file or class name and description of purpose be included on the
same "printed page" as the copyright notice for easier
identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;
                break;
            case "<TEMPLATE_BSD-3-Clause>":
                /*
                Copyright 2023 Berkely Software Distribution

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
                pluginLicense = `Copyright ${(new Date()).getFullYear()} ${author}

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;
                break;
            case "<TEMPLATE_BSD-2-Clause>":
                /*
                Copyright (c) 2023 Berkeley Software Distribution

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
                pluginLicense = `Copyright (c) ${(new Date()).getFullYear()} ${author}.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;
                break;
            case "<TEMPLATE_ISC>":
                /*
                Copyright 2023 Internet Systems Consortium
 
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 
THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
                pluginLicense = `Copyright ${(new Date()).getFullYear()} ${author}

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;
                break;
            case "<TEMPLATE_Unlicense>":
                pluginLicense = `This is free and unencumbered software released into the public domain.

                        Anyone is free to copy, modify, publish, use, compile, sell, or
                        distribute this software, either in source code form or as a compiled
                        binary, for any purpose, commercial or non-commercial, and by any
                        means.
                        
                        In jurisdictions that recognize copyright laws, the author or authors
                        of this software dedicate any and all copyright interest in the
                        software to the public domain. We make this dedication for the benefit
                        of the public at large and to the detriment of our heirs and
                        successors. We intend this dedication to be an overt act of
                        relinquishment in perpetuity of all present and future rights to this
                        software under copyright law.
                        
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
                        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
                        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                        IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
                        OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
                        ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
                        OTHER DEALINGS IN THE SOFTWARE.
                        
                        For more information, please refer to <http://unlicense.org/>`;
                break;
        }
        return pluginLicense;
    }
    async function pluginAutoUpdater() {
        if (settings.developer)
            return;
        let plugins = pluginList.list.filter((p) => p.type === "plugin");
        for (let i in plugins) {
            if (!settings.pluginsData.filter((p) => p.id === plugins[i].id).length
                || plugins[i].version === undefined
                || plugins[i].version === settings.pluginsData.find((p) => p.id === plugins[i].id)?.version)
                continue;
            new Notification("Plugin update detected", {
                body: `An update for the plugin ${plugins[i].name} will be automatically installed.`
            });
            // fetch plugin src from plugin.json
            let errorDownloading = false;
            const pluginSrc = await fetch(`https://deeeep-reef-client.github.io/plugins-api/plugins/${plugins[i].id}/plugin.json`)
                .then(res => res.json())
                .catch((err) => {
                new Notification("Something went wrong", {
                    body: `An error occurred while downloading an update for your plugin`
                });
                console.error(err);
                errorDownloading = true;
            });
            if (errorDownloading)
                return;
            let installedPlugin = {
                name: pluginSrc.name,
                id: pluginSrc.id,
                description: pluginSrc.description,
                author: pluginSrc.author,
                src: pluginSrc.src
            };
            if (plugins[i].version)
                installedPlugin.version = plugins[i].version;
            if (plugins[i].license)
                installedPlugin.license = pluginLicenseTemplate(plugins[i].license, pluginSrc.author);
            settings.pluginsData = settings.pluginsData.filter((p) => p.id !== plugins[i].id);
            settings.pluginsData.push(installedPlugin);
            updateInstalledPluginsList();
            new Notification("Plugin updated!", {
                body: `The plugin ${pluginSrc.name} has been updated. Please restart the client for any changes to take effect.`
            });
            saveSettings();
            // Update script
            pluginSrc.src.filter((s) => s.type === "update").forEach((s) => eval(s.src));
        }
    }
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
                settings.pluginsData.find(item => item == settings.pluginsData[i]).src.filter((s) => s.type === "uninstall").forEach((s) => eval(s.src));
                delete settings.pluginUserData[settings.pluginsData[i].id];
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
                    <select id="pluginsSearchType">
                        <option value="all">All</option>
                        <option value="plugin">Plugins</option>
                        <option value="theme">Themes</option>
                    </select>
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
    const pluginsSearchType = document.getElementById("pluginsSearchType");
    const pluginsSearchButton = document.getElementById("pluginsSearchButton");
    pluginsSearchButton?.addEventListener("click", () => {
        updateFilteredPlugins();
    });
    pluginsSearchType.addEventListener("change", () => {
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
            // Verified badge
            if (filteredPluginList.list[i].author === "Dev") {
                const verifiedELem = document.createElement("img");
                verifiedELem.setAttribute("src", "https://deeeep-reef-client.netlify.app/assets/verified.png");
                verifiedELem.setAttribute("height", "20px");
                verifiedELem.setAttribute("width", "20px");
                mainElem.appendChild(verifiedELem);
                const spacer4_1 = document.createElement("div");
                spacer4_1.classList.add("spacer");
                mainElem.appendChild(spacer4_1);
            }
            // Install button
            const installElem = document.createElement("button");
            installElem.classList.add("assetswapper-new-button");
            installElem.innerText = "Install";
            installElem.addEventListener("click", async () => {
                for (const i in settings.pluginsData) {
                    if (settings.pluginsData[i].id == filteredPluginList.list[i].id) {
                        new Notification("This plugin is already installed", {
                            body: "You have already installed this plugin."
                        });
                        return;
                    }
                }
                // fetch plugin src from plugin.json
                let errorDownloading = false;
                const pluginSrc = await fetch(`https://deeeep-reef-client.github.io/plugins-api/plugins/${filteredPluginList.list[i].id}/plugin.json`)
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
                    let installedPlugin = {
                        name: pluginSrc.name,
                        id: pluginSrc.id,
                        description: pluginSrc.description,
                        author: pluginSrc.author,
                        src: pluginSrc.src
                    };
                    if (filteredPluginList.list[i].version)
                        installedPlugin.version = filteredPluginList.list[i].version;
                    if (filteredPluginList.list[i].license)
                        installedPlugin.license = pluginLicenseTemplate(filteredPluginList.list[i].license, pluginSrc.author);
                    settings.pluginsData.push(installedPlugin);
                    updateInstalledPluginsList();
                }
                else {
                    // Theme
                    let theme = {
                        name: pluginSrc.name,
                        src: pluginSrc.src,
                        active: true
                    };
                    // Is advanced theme?
                    if (pluginSrc.themetype !== undefined && pluginSrc.themetype === "advancedtheme") {
                        theme.themetype = "advancedtheme";
                        theme.script = pluginSrc.script;
                    }
                    settings.userThemeData.push(theme);
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
                // Create its data
                settings.pluginUserData[pluginSrc.id] = {};
                // plugins
                pluginSrc.src.filter((s) => s.type === "install").forEach((s) => eval(s.src));
                searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
                window.removeEventListener("keydown", searchPluginsEnterListener);
            });
            mainElem.appendChild(installElem);
            searchPluginsList.appendChild(mainElem);
        }
    }
    ;
    async function updateFilteredPlugins() {
        const search = pluginsSearchQuery.value.split(new RegExp(" "));
        if (Object.keys(pluginList).length === 0) {
            await fetch("https://deeeep-reef-client.github.io/plugins-api/registry.json")
                .then(res => res.json())
                .then(data => {
                pluginList = data;
                filteredPluginList = data;
            });
        }
        else
            filteredPluginList = structuredClone(pluginList);
        filteredPluginList.list = filteredPluginList.list.filter((p) => {
            let result = false;
            for (const i in search) {
                if (p.name.toLowerCase().includes(search[i].toLowerCase()) ||
                    p.description.toLowerCase().includes(search[i].toLowerCase())) {
                    result = true;
                    break;
                }
            }
            return result
                && (pluginsSearchType.value === "all"
                    || (pluginsSearchType.value === "plugin" && p.type === "plugin")
                    || (pluginsSearchType.value === "theme" && p.type === "theme"));
        });
        updateSearchPluginsList();
    }
    ;
    // Plugins button onclick
    function searchPluginsEnterListener(key) {
        if (key.code == "Enter")
            updateFilteredPlugins();
    }
    ;
    searchPluginsButton.addEventListener("click", async () => {
        searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
        pluginsSearchQuery.value = "";
        pluginsSearchType.value = "all";
        if (Object.keys(pluginList).length === 0) {
            await fetch("https://deeeep-reef-client.github.io/plugins-api/registry.json")
                .then(res => res.json())
                .then(data => {
                pluginList = data;
                filteredPluginList = data;
            });
        }
        else
            filteredPluginList = structuredClone(pluginList);
        updateSearchPluginsList();
        window.addEventListener("keydown", searchPluginsEnterListener);
    });
    searchPluginsCloseButton.addEventListener("click", () => {
        searchPluginsModalContainer.classList.toggle("drc-modal-hidden");
        window.removeEventListener("keydown", searchPluginsEnterListener);
    });
    // DRC information
    const aboutDrcButtonWrapper = settingsButtonWrapper.cloneNode(true);
    const aboutDrcButton = aboutDrcButtonWrapper.firstElementChild;
    aboutDrcButtonWrapper.setAttribute("id", "aboutDrcButtonWrapper");
    aboutDrcButton.setAttribute("id", "aboutDrcButton");
    aboutDrcButton.querySelector("span[class]").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-lg" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14Z"/>
  </svg>`;
    topRightNav.insertBefore(aboutDrcButtonWrapper, settingsButtonWrapper);
    const aboutDrcModalMain = DRC.Modal.buildModal("aboutDrc", "About the Client", `
    <div class="drc-tabs drc-tabs-left" style="min-height: 200px;">
        <div class="drc-tabs-header drc-is-left">
            <div class="drc-tabs-nav-wrap drc-is-left">
                <div class="drc-tabs-nav-scroll">
                    <div class="drc-tabs-nav drc-is-left" role="tablist" style="transform: translateY(0px);">
                        <div class="drc-tabs-active-bar drc-is-left" style="transform: translateY(0px); height: 40px;" id="aboutDrcActiveBar"></div>
                        <div class="drc-tabs-item drc-is-left drc-is-active" id="aboutDrcTab0">About</div>
                        <div class="drc-tabs-item drc-is-left" id="aboutDrcTab1">Changelog</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="drc-tabs-content">
            <div class="drc-pr-4 drc-pl-2" id="aboutDrcPane0">
                <p>Deeeep.io Reef Client is a simple desktop client for Deeeep.io.</p>
                <div class="spacer"></div>
                <div style="display:flex">
                    <a href="https://discord.gg/s8mYRHKXZw"><button class="assetswapper-new-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-discord" viewBox="0 0 16 16">
                        <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                        </svg>
                    <div class="spacer"></div>
                    Discord</button></a>
                    <div class="spacer"></div>
                    <a href="https://github.com/deeeep-reef-client"><button class="assetswapper-new-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                    <div class="spacer"></div>
                    GitHub</button></a>
                </div>
            </div>
            <div class="drc-pr-4 drc-pl-2 drc-modal-hidden" id="aboutDrcPane1">
                <p>
                    You are running 
                    <b id="aboutDrcVersionTag">Unknown</b>
                    <span id="aboutDrcUpdateStatus">, unknown status.</span>
                </p>
                <br/>
                <div style="text-align:left;max-width:50vw;">
                    <p><b>v1.2.0 The Keybinds Update</b></p>
                    <ul>
                        <li>Keybinds can be changed</li>
                    </ul>
                    <br />
                    <p><b>v1.1.1 The Postrelease Patch</b></p>
                    <ul>
                        <li>Copy URL hotkey</li>
                        <li>Join game by code or URL</li>
                        <li>Loading spinner</li>
                        <li>Screenshot delay</li>
                        <li>Misc bug fixes</li>
                    </ul>
                    <br />
                    <p><b>v1.1.0 The Postrelease Update</b></p>
                    <ul>
                        <li>Discord Rich Presence is now togglable</li>
                        <li>Swap skin by ID</li>
                        <li>Misc bug fixes</li>
                    </ul>
                    <br />
                    <p><b>v1.0.0 The Full Release</b></p>
                    <ul>
                        <li>Evolution Tree </li>
                        <li>Custom Theme editing </li>
                        <li>Forum/Friend Notifications </li>
                        <li>Plugins expansion </li>
                        <li>Theme Maker expansion </li>
                        <li>Advanced Themes </li>
                        <li>Colourblind Mode </li>
                        <li>Exit confirmation dialog </li>
                        <li>Screenshotter </li>
                        <li>Seamless title bar </li>
                        <li>DRC info modal </li>
                        <li>DRC API </li>
                        <li>One-click installer </li>
                        <li>Support for GNU/Linux </li>
                        <li>Misc bug fixes </li>
                    </ul>
                    <br />
                    <p><b>v0.9.1 (beta) The Prerelease Patch</b></p>
                    <ul>
                        <li>Theme maker works on the Forum</li>
                        <li>Client does not crash when loading window is closed</li>
                        <li>Loading window works offline</li>
                        <li>More efficient account swapper</li>
                        <li>Blue evolution tree button</li>
                    </ul>
                    <br />
                    <p><b>v0.9.0 (beta) The Prerelease Update</b></p>
                    <ul>
                        <li>Added a loading screen</li>
                        <li>Added a "developer mode"</li>
                        <li>Auto fill name</li>
                        <li>Account save and swapper</li>
                        <li>Fixed Client not working in PD and 1v1</li>
                        <li>In-game button to open evolution tree</li>
                        <li>Setting to view ghosts</li>
                        <li>Press "X" while as ghost to end game</li>
                        <li>Press "C" to cancel boost (for touchpad)</li>
                    </ul>
                    <br />
                    <p><b>v0.8.0 (beta) The Adblocker Update</b></p>
                    <ul>
                        <li>A togglable Adblocker to block advertisements</li>
                        <li>Hotkey "V" does not open evolution tree if not in game</li>
                        <li>DRC modal overlays now have a blur</li>
                    </ul>
                    <br />
                    <p><b>v0.7.0 (beta) The Plugins Update</b></p>
                    <ul>
                        <li>A plugins system! Find and install plugins and themes from the registry!</li>
                    </ul>
                    <br />
                    <p><b>v0.6.1 (beta) The Misc Update</b></p>
                    <ul>
                        <li>Transparency slider is no longer an opacity slider (it goes left to right ascending
                            transparency instead of right to left)</li>
                        <li>Press "V" to toggle evolution tree</li>
                        <li>Press "F12" to open DevTools</li>
                    </ul>
                    <br />
                    <p><b>v0.6.0 (beta) The Theme Maker Update</b></p>
                    <ul>
                        <li>A theme maker! Create your own custom themes, use and share them!</li>
                    </ul>
                    <br />
                    <p><b>v0.5.0 (beta) The Light Theme Update</b></p>
                    <ul>
                        <li>Light theme :D</li>
                    </ul>
                    <br />
                    <p><b>v0.4.2 (beta) The Autoupdater Patch</b></p>
                    <ul>
                        <li>The auto updater actually works now</li>
                    </ul>
                    <br />
                    <p><b>v0.4.1 (beta) The QoL Update</b></p>
                    <ul>
                        <li>The icon now has rounded corners to avoid hurting your eyes</li>
                        <li>Client shows DRC version too</li>
                    </ul>
                    <br />
                    <p><b>v0.4.0 (beta) The Autoupdater Update</b></p>
                    <ul>
                        <li>An auto updater :)</li>
                    </ul>
                    <br />
                    <p><b>v0.3.2 (beta) The Asset Swapper Patch 2</b></p>
                    <ul>
                        <li>Fixed asset swapper for non-docassets users</li>
                    </ul>
                    <br />
                    <p><b>v0.3.1 (beta) The Asset Swapper Patch</b></p>
                    <ul>
                        <li>Installer is now patched and works with the new feature!</li>
                    </ul>
                    <br />
                    <p><b>v0.3.0 (beta) The Asset Swapper Update</b></p>
                    <ul>
                        <li>An asset swapper to swap your skins!</li>
                    </ul>
                    <br />
                    <p><b>v0.2.0 (alpha) The Evolution Update</b></p>
                    <ul>
                        <li>Evolution tree button</li>
                        <li>V3 game UI (still buggy)</li>
                        <li>New installer that actually works</li>
                    </ul>
                    <br />
                    <p><b>v0.1.0 (alpha) The Settings Update</b></p>
                    <ul>
                        <li>Settings are now locally stored, and custom theme and docassets are now togglable</li>
                        <li>Docassets now comes built in in the client</li>
                    </ul>
                    <br />
                    <p><b>v0.0.0 (alpha) Initial Release</b></p>
                    <ul>
                        <li>Initial alpha release</li>
                        <li>The journey begins.</li>
                    </ul>
                    <br />
                </div>
            </div>
        </div>
    </div>
    `);
    const aboutDrcUpdateStatus = document.getElementById("aboutDrcUpdateStatus");
    const aboutDrcVersionTag = document.getElementById("aboutDrcVersionTag");
    const aboutDrcTitle = document.getElementById("aboutDrcModalTitle");
    const aboutDrcTab0 = document.getElementById("aboutDrcTab0");
    const aboutDrcTab1 = document.getElementById("aboutDrcTab1");
    const aboutDrcPane0 = document.getElementById("aboutDrcPane0");
    const aboutDrcPane1 = document.getElementById("aboutDrcPane1");
    const aboutDrcActiveBar = document.getElementById("aboutDrcActiveBar");
    aboutDrcTab0.addEventListener("click", () => {
        aboutDrcTitle.innerText = "About the Client";
        aboutDrcTab0.classList.add("drc-is-active");
        aboutDrcTab1.classList.remove("drc-is-active");
        aboutDrcActiveBar.setAttribute("style", "transform: translateY(0px); height: 40px;");
        aboutDrcPane0.classList.remove("drc-modal-hidden");
        aboutDrcPane1.classList.add("drc-modal-hidden");
    });
    aboutDrcTab1.addEventListener("click", () => {
        aboutDrcTitle.innerText = "Changelog";
        aboutDrcTab1.classList.add("drc-is-active");
        aboutDrcTab0.classList.remove("drc-is-active");
        aboutDrcActiveBar.setAttribute("style", "transform: translateY(40px); height: 40px;");
        aboutDrcPane1.classList.remove("drc-modal-hidden");
        aboutDrcPane0.classList.add("drc-modal-hidden");
    });
    // Show changelog on new update
    if (settings.previousVersion !== DRC.Client.versionTag) {
        aboutDrcModalMain.classList.remove("drc-modal-hidden");
        aboutDrcPane0.classList.add("drc-modal-hidden");
        aboutDrcPane1.classList.remove("drc-modal-hidden");
        new Notification("Client updated!", {
            body: `The Deeeep.io Reef Client has been updated to version ${DRC.Client.versionTag}.`
        });
    }
    aboutDrcButton.addEventListener("click", () => aboutDrcModalMain.classList.toggle("drc-modal-hidden"));
    (async () => {
        aboutDrcVersionTag.innerText = DRC.Client.versionTag;
        const latestVersion = await ipcRenderer.invoke("getVersion");
        aboutDrcVersionTag.classList.add((DRC.Client.versionTag === latestVersion) ? "drc-text-green" : "drc-text-red");
        aboutDrcUpdateStatus.innerHTML = (DRC.Client.versionTag === latestVersion) ?
            ", the latest version." :
            ". A new update <b class=\"drc-text-cyan\">" + latestVersion + "</b> has been detected.";
    })();
    // Seamless titlebar void
    topRightNav.appendChild(windowNavSpacer);
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
                // DRC API
                DRC.EventObject.dispatchEvent(DRC.Events.EventList.GameStarted);
                gamemode = document.querySelector('.block, .modes').querySelector('.selected').querySelector('.name').innerText;
                ipcRenderer.send("gameInfo", {
                    gamemode,
                    url: window.location.href
                });
                function ghostSuicide(key) {
                    if (key.code != settings.keybinds.ghostQuit || !document.contains(document.querySelector("div.chat-input.horizontal-center[style='display: none;']")))
                        return;
                    DRC.Preload.evalInBrowserContext(`
                    if (game.currentScene.myAnimal._visibleFishLevel == 33) {
                        game.inputManager.handleGhostSuicide();
                    }
                    `);
                }
                ;
                function cancelBoost(key) {
                    if (key.code != settings.keybinds.cancelCharge || !document.contains(document.querySelector("div.chat-input.horizontal-center[style='display: none;']")))
                        return;
                    DRC.Preload.evalInBrowserContext(`
                    game.inputManager.pressElapsed = 0;
                    game.inputManager.pointerDown = false;
                    `);
                }
                ;
                async function takeScreenshot(key) {
                    if (key.code !== settings.keybinds.screenshot
                        || !document.contains(document.querySelector("#canvas-container > canvas"))
                        || !document.contains(document.querySelector("div.chat-input.horizontal-center[style='display: none;']"))
                        || !document.contains(document.querySelector("div.home-page[style='display: none;']")))
                        return;
                    ipcRenderer.send("captureScreenshot");
                    const overlayDiv = document.createElement("div");
                    overlayDiv.setAttribute("style", `
                    background-color: rgba(0, 0, 0, 0.4);
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    position: absolute;
                    width: 100vw;
                    height: 100vh;
                    pointer-events: none;
                    `);
                    document.getElementById("canvas-container")?.appendChild(overlayDiv);
                    setTimeout(() => overlayDiv.remove(), 200);
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
                    let gameTreeHotkey;
                    if (settings.keybinds.evolutionTree.startsWith("Key")) {
                        gameTreeHotkey = settings.keybinds.evolutionTree.slice(3);
                    }
                    else if (settings.keybinds.evolutionTree.startsWith("Digit")) {
                        gameTreeHotkey = settings.keybinds.evolutionTree.slice(5);
                    }
                    else {
                        gameTreeHotkey = settings.keybinds.evolutionTree.slice(0, 1);
                    }
                    gameTreeButton.querySelector("span[class]").innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-diagram-3-fill" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1z"/>
  </svg>
                <div id="treeOpenHotkey" class="drc-hotkey hotkey drc-hotkey--dark hotkey--dark hotkey">${gameTreeHotkey}</div>
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
                    DRC.Preload.evalInBrowserContext(`game.currentScene.viewingGhosts = true;`);
                }
                else {
                    DRC.Preload.evalInBrowserContext(`game.currentScene.viewingGhosts = false;`);
                }
                window.addEventListener("keydown", ghostSuicide);
                window.addEventListener("keydown", cancelBoost);
                window.addEventListener("keydown", takeScreenshot);
                let advancedProfanityFilter = setInterval(() => {
                    if (!settings.advancedProfanityFilter)
                        return;
                    DRC.Preload.evalInBrowserContext(`
                    (() => {
                        let data = [];
                        for (let i in game.currentScene.chatMessages) {
                            data.push({
                                text: {
                                    _text: game.currentScene.chatMessages[i].text._text
                                }
                            });
                        }
                        window.DRC_API.DRC.InternalMessaging.sendGameChatMessages(data);
                    })();
                    `);
                    // Everything handler by the DRC API
                    // ipcRenderer.once("gameChatMessages", (_event: Event, chatMessages: any) => {
                    //     for (let i in chatMessages) {
                    //         // Patch leetspeak
                    //         const message = chatMessages[i].text._text
                    //             .replaceAll('1', 'i')
                    //             .replaceAll('2', 'z')
                    //             .replaceAll('3', '3')
                    //             .replaceAll('4', 'a')
                    //             .replaceAll('5', 's')
                    //             .replaceAll('6', 'g')
                    //             .replaceAll('7', 't')
                    //             .replaceAll('8', 'b')
                    //             .replaceAll('9', 'g')
                    //             .replaceAll('0', 'o')
                    //         if (profanityFilter.isProfane(message)) {
                    //             const cleaned = profanityFilter.clean(message);
                    //             console.log(cleaned);
                    //             DRC.Preload.evalInBrowserContext(`
                    //                 game.currentScene.chatMessages[${i}].setText(
                    //                     "${cleaned}"
                    //                 );
                    //             `);
                    //         }
                    //     }
                    // });
                }, 200);
                let colourblindMode = setInterval(() => {
                    // Return if settings not opened or not in PD and TFFA
                    if (!settings.colourblind || (gamemode !== "PD" && gamemode !== "TFFA"))
                        return;
                    /*
                        '<GRE>[GRE] DRC</GRE>'
                        '<GRE>test</GRE> DRC'
                        #app > div.overlay.gm-2 > div.pd-overlay > div.pd-preparation

                    */
                    // Names
                    DRC.Preload.evalInBrowserContext(`
                    (() => {
                        let colourblindData = [];
                        for (let i in game.currentScene.entityManager.animalsList) {
                            colourblindData.push({
                                text: game.currentScene.entityManager.animalsList[i].nameObject.text
                            });
                        }
                        window.DRC_API.DRC.InternalMessaging.sendColourblindNames(colourblindData);
                    })();
                    `);
                    // Chat messages
                    DRC.Preload.evalInBrowserContext(`
                    (() => {
                        let colourblindData = [];
                        for (let i in game.currentScene.chatMessages) {
                            colourblindData.push({
                                text: {
                                    _text: game.currentScene.chatMessages[i].text._text
                                }
                            });
                        }
                        window.DRC_API.DRC.InternalMessaging.sendColourblindChatMessages(colourblindData);
                    })();
                    `);
                    // All the handling done by the DRC API
                    // ipcRenderer.once("gameColourblindNames", (_event: Event, colourblindNames: any) => {
                    //     for (let i in colourblindNames) {
                    //         if (!colourblindNames[i].text.startsWith("<GRE>")) continue;
                    //         DRC.Preload.evalInBrowserContext(`
                    //         game.currentScene.entityManager.animalsList[${i}].nameObject.text = "${colourblindNames[i].text.replace("<GRE>", "<BLU>")
                    //             }"
                    //         `);
                    //     }
                    // });
                }, 200);
                // if (gamemode === "PD") {
                //     const pdPreparationObserver = new MutationObserver(() => {
                //         if (document.contains(document.querySelector("div.pd-overlay > div > div.center > div.chat-container > div > div.messages-container > div"))) {
                //             const pdPreparationMessageContainer = document.querySelector("div.pd-overlay > div > div.center > div.chat-container > div > div.messages-container > div") as HTMLDivElement;
                //             const colourblindObserver = new MutationObserver(() => {
                //                 const pdPreparationMessages = pdPreparationMessageContainer.children;
                //                 for (let i = 0; i < pdPreparationMessages.length; i++) {
                //                     if (!pdPreparationMessages[i].querySelector("span")!.classList.contains("side-0")) continue;
                //                     pdPreparationMessages[i].querySelector("span")?.classList.remove("side-0");
                //                     pdPreparationMessages[i].querySelector("span")?.classList.add("drc-text-cyan");
                //                 }
                //             });
                //             colourblindObserver.observe(pdPreparationMessageContainer, {
                //                 subtree: true,
                //                 childList: true
                //             });
                //             pdPreparationObserver.disconnect();
                //         }
                //     });
                //     pdPreparationObserver.observe(document.querySelector("#app > div.overlay.gm-2 > div.pd-overlay")!, {
                //         childList: true,
                //         subtree: true
                //     });
                // }
                // plugins
                for (const i in settings.pluginsData) {
                    if (settings.pluginsData[i].src.length == 0)
                        continue;
                    for (const j in settings.pluginsData[i].src) {
                        if (settings.pluginsData[i].src[j].type == "game") {
                            DRC.Preload.evalInBrowserContext(settings.pluginsData[i].src[j].src);
                        }
                    }
                }
                // watch for game start
                const evolveObserver = new MutationObserver((mutations) => {
                    // DRC API
                    DRC.EventObject.dispatchEvent(DRC.Events.EventList.GameEvolved);
                    for (let i in settings.assetSwapperConfig) {
                        DRC.Preload.evalInBrowserContext(`
                        if (${settings.assetSwapperConfig[i].animal} == game.currentScene.myAnimal.visibleFishLevel) {
                            game.currentScene.myAnimal.setSkin(${settings.assetSwapperConfig[i].skin});
                        };
                        `);
                    }
                });
                const startObserver = new MutationObserver((mutations) => {
                    if (document.contains(document.querySelector("div.stats > div.animal-data > div.detailed-info > h4.name"))) {
                        startObserver.disconnect();
                        // DRC API
                        DRC.EventObject.dispatchEvent(DRC.Events.EventList.GameEvolved);
                        // Asset swapper (do stuff on evolve)
                        const animalNameElement = document.querySelector("div.stats > div.animal-data > div.detailed-info > h4.name");
                        evolveObserver.observe(animalNameElement, { childList: true });
                        for (let i in settings.assetSwapperConfig) {
                            DRC.Preload.evalInBrowserContext(`
                            if (${settings.assetSwapperConfig[i].animal} == game.currentScene.myAnimal.visibleFishLevel) {
                                game.currentScene.myAnimal.setSkin("${settings.assetSwapperConfig[i].skin}");
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
                    // DRC API
                    DRC.EventObject.dispatchEvent(DRC.Events.EventList.GameEnded);
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                    window.removeEventListener("keydown", ghostSuicide);
                    window.removeEventListener("keydown", cancelBoost);
                    window.removeEventListener("keydown", takeScreenshot);
                    clearInterval(advancedProfanityFilter);
                    clearInterval(colourblindMode);
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
    // Game started/ended
    DRC.EventObject.addEventListener(DRC.Events.GameStarted, () => {
        ipcRenderer.send("gameStarted");
    });
    DRC.EventObject.addEventListener(DRC.Events.GameEnded, () => {
        ipcRenderer.send("gameEnded");
    });
    // advanced theme
    for (const i in settings.userThemeData) {
        if (!settings.userThemeData[i].active || settings.userThemeData[i].themetype === undefined || settings.userThemeData[i].themetype != "advancedtheme")
            continue;
        DRC.Preload.evalInBrowserContext(settings.userThemeData[i].script);
    }
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
    // DRC API
    DRC.EventObject.dispatchEvent(DRC.Events.EventList.DocumentLoaded);
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
