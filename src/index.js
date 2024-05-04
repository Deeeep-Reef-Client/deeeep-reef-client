"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, BrowserWindow, Menu, ipcMain, shell, session, globalShortcut, Notification, dialog, clipboard } = require('electron');
const log = require('electron-log');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const electronDl = require('electron-dl');
const Badge = require('electron-windows-badge');
const enhanceWebRequest = require('electron-better-web-request').default;
const sudoPrompt = require('sudo-prompt');
const https = require('node:https');
const spawn = require('node:child_process').spawn;
const path = require('node:path');
const fs = require('node:fs');
log.info('DRC starting...');
// stuff
const development = true;
// Auto update
let newUpdate = false;
let instUrl = "";
const versionId = "v1.3.1";
let currentVersionId = "";
// DRC API
const assetswapperAlreadyChecked = new Set();
const assetswapperNotExists = new Set();
const DRC = {
    // Client info
    Client: {
        name: "Deeeep.io Reef Client",
        version: "1.3.1",
        versionTag: "v1.3.1"
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
        },
        habitatToObject: function (num) {
            const joined = DRC.Utils.habitatToArray(num).join('');
            return {
                cold: joined.includes("Cold"),
                warm: joined.includes("Warm"),
                shallow: joined.includes("Shallow"),
                deep: joined.includes("Deep"),
                fresh: joined.includes("Fresh"),
                salt: joined.includes("Salt"),
                reef: joined.includes("Reef")
            };
        }
    },
    Main: {
        defaultSession: new Object()
    },
    WebRequestHandlers: {
        genericAssetswapperHandler: function (redirectTemplate, regex, name, filenameKeys = ['filename']) {
            return (details, callback) => {
                let redirectUrl = details.url;
                const m = regex.exec(details.url);
                if (m) {
                    //@ts-ignore: I know better!
                    const filenameArray = filenameKeys.map(key => m?.groups[key] || '');
                    const filename = filenameArray.join('');
                    let newRedirectUrl = redirectTemplate + filename;
                    if (!assetswapperAlreadyChecked.has(newRedirectUrl)) {
                        const newRedirectUrlObject = new URL(newRedirectUrl);
                        https.request({
                            host: newRedirectUrlObject.hostname,
                            path: newRedirectUrlObject.pathname,
                            method: 'GET'
                        }, (res) => {
                            if (res.statusCode === 200) {
                                assetswapperAlreadyChecked.add(newRedirectUrl);
                                redirectUrl = newRedirectUrl;
                            }
                            else {
                                assetswapperAlreadyChecked.add(newRedirectUrl);
                                assetswapperNotExists.add(newRedirectUrl);
                            }
                            callback({ redirectURL: redirectUrl });
                        }).end();
                    }
                    else if (assetswapperNotExists.has(newRedirectUrl))
                        callback();
                    else
                        callback({ redirectURL: newRedirectUrl });
                }
                else
                    callback();
            };
        }
    }
};
const schema = {
    settings: {
        type: "object",
        properties: {
            customTheme: {
                type: "boolean",
                default: true
            },
            docassets: {
                type: "boolean",
                default: false
            },
            v3ui: {
                type: "boolean",
                default: false
            },
            assetSwapper: {
                type: "boolean",
                default: true
            },
            assetSwapperConfig: {
                type: "array",
                items: {
                    type: "object"
                }
            },
            lightTheme: {
                type: "boolean",
                default: false
            },
            userTheme: {
                type: "boolean",
                default: true
            },
            userThemeData: {
                type: "array",
                items: {
                    type: "object"
                }
            },
            pluginsData: {
                type: "array",
                items: {
                    type: "object"
                }
            },
            pluginsUserData: {
                type: "object"
            },
            adBlocker: {
                type: "boolean",
                default: true
            },
            viewingGhosts: {
                type: "boolean",
                default: true
            },
            advancedProfanityFilter: {
                type: "boolean",
                default: true
            },
            gameName: {
                type: "string",
                default: ""
            },
            gameAccounts: {
                type: "array",
                items: {
                    type: "object"
                }
            },
            colourblind: {
                type: "boolean",
                default: false
            },
            discordRichPresence: {
                type: "boolean",
                default: true
            },
            developer: {
                type: "boolean",
                default: false
            },
            previousVersion: {
                type: "string",
                default: ""
            },
            keybinds: {
                type: "object"
            }
        }
    }
};
const store = new Store({ schema });
// Fetch settings
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
        joinGame: "KeyJ",
        boost: "Space",
        zoomIn: "Equal",
        zoomOut: "Minus"
    }
};
const savedSettings = store.get("settings") ?? {};
for (let i of Object.keys(savedSettings)) {
    if (i === "keybinds") {
        for (let j of Object.keys(savedSettings.keybinds)) {
            //@ts-ignore
            settings.keybinds[j] = savedSettings.keybinds[j];
        }
    }
    else {
        // @ts-ignore
        settings[i] = savedSettings[i];
    }
}
if (settings === undefined) {
    settings = {
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
            joinGame: "KeyJ",
            boost: "Space",
            zoomIn: "Equal",
            zoomOut: "Minus"
        }
    };
    store.set("settings", settings);
}
// If this is a new install
settings.previousVersion = DRC.Client.versionTag;
store.set("settings", settings);
// Save settings
ipcMain.on("saveSettings", (_event, newSettings) => {
    settings = newSettings;
    store.set("settings", newSettings);
});
// Random data
let gameStarted = false;
// Create window
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false
        }
    });
    const window = mainWindow;
    // enhanceWebRequest(session.defaultSession);
    const badgeOptions = {
        font: '20px arial'
    };
    new Badge(mainWindow, badgeOptions);
    mainWindow.hide();
    mainWindow.webContents.setBackgroundThrottling(false);
    let finishedLoad = false;
    const loadingWindow = new BrowserWindow({
        width: 960,
        height: 540,
        frame: false,
        resizable: false
    });
    loadingWindow.loadFile("src/loading.html");
    loadingWindow.removeMenu();
    loadingWindow.on("close", () => {
        if (!finishedLoad)
            mainWindow.close();
    });
    mainWindow.on("focus", () => {
        mainWindow.webContents.send("windowFocus");
    });
    mainWindow.webContents.on("will-navigate", () => {
        mainWindow.hide();
        loadingWindow.show();
    });
    mainWindow.webContents.on("did-navigate", () => {
        mainWindow.webContents.send("settings", settings);
    });
    ipcMain.handle("getSettings", async () => {
        return settings;
    });
    mainWindow.webContents.on('did-finish-load', () => {
        finishedLoad = true;
        loadingWindow.hide();
        mainWindow.show();
    });
    let isCloudflare = false;
    ipcMain.on("isCloudflare", () => {
        log.info("Cloudflare verification loaded");
        isCloudflare = true;
    });
    mainWindow.webContents.on('did-fail-load', () => {
        if (isCloudflare) {
            isCloudflare = false;
            return;
        }
        loadingWindow.close();
        mainWindow.close();
        new Notification({
            title: "Failed to load the game",
            body: "Please check your internet and try again."
        }).show();
    });
    // Loads blocky fish game :)... probably not
    // window.loadURL("https://deeeep.io");
    if (settings.developer) {
        mainWindow.webContents.openDevTools();
        new Notification({
            title: "Developer Mode is active",
            body: "I hope you know what you are doing."
        }).show();
    }
    mainWindow.maximize();
    // Deletes menu and makes new menu
    mainWindow.removeMenu();
    /*
    const menu = Menu.buildFromTemplate([
        {
            label: "DEBUG",
            submenu: [
                {
                    label: "DevTools",
                    click() {
                        window.webContents.openDevTools();
                    }
                },
                {
                    label: "Reload",
                    click() {
                        window.reload();
                    }
                }
            ]
        },
        {
            label: "Settings"
        },
        {
            label: "Help"
        },
        // {
        //     label: "Asset Swappers",
        //     submenu: [
        //         {
        //             role: "Skin Swapper"
        //         },
        //         {
        //             role: "Asset Swapper"
        //         }
        //     ]
        // },
        {
            label: "Discord",
            click() {
                shell.openExternal("https://discord.gg/s8mYRHKXZw");
            }
        },
        {
            label: "Report a Bug",
            click() {
                shell.openExternal("https://github.com/Canned-Seagull23/deeeep-reef-client/issues");
            }
        },
        {
            label: "OPEN HACKS",
            click() {
                shell.openExternal("https://www.youtube.com/watch?v=klfT41uZniI");
            }
        }
    ]);
    */
    // Menu.setApplicationMenu(menu);
    // Menu bar
    ipcMain.on("windowMinimise", () => {
        mainWindow.minimize();
    });
    ipcMain.on("windowMaximise", () => {
        mainWindow.maximize(); //TODO: Fix bug
    });
    ipcMain.on("windowRestore", () => {
        mainWindow.unmaximize();
    });
    ipcMain.on("windowClose", () => {
        mainWindow.close();
        loadingWindow.close();
    });
    mainWindow.on("maximize", () => {
        mainWindow.webContents.send("windowMaximise");
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.send("windowRestore");
    });
    // Close confirmation
    // window.on("close", (e: any) => {
    //     // let response = dialog.showMessageBoxSync(window, {
    //     //     type: "question",
    //     //     buttons: ["Exit", "Cancel"],
    //     //     title: "Exit Confirmation",
    //     //     message: "Are you sure you want to quit? You have an ongoing game."
    //     // });
    //     e.preventDefault();
    // });
    // Loads doc assets
    let docassetsOn = settings.docassets;
    if (docassetsOn === undefined) {
        settings.docassets = false;
        store.set("settings", settings);
        docassetsOn = false;
    }
    ;
    // Loads Adblocker
    let adBlockerOn = settings.adBlocker;
    if (adBlockerOn === undefined) {
        settings.adBlocker = true;
        store.set("settings", settings);
        adBlockerOn = true;
    }
    ;
    (async () => {
        console.log(app.getAppPath());
        loadDrcAssetswapper();
        if (docassetsOn)
            loadDocassets();
        if (adBlockerOn)
            loadAdblocker();
        mainWindow.loadURL("https://deeeep.io");
        mainWindow.hide();
        /*
        if (docassetsOn) {
            window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/docassets").then(() => {
                if (adBlockerOn) {
                    window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/ublock").then(() => {
                        // loads DRC modified js
                        window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                            window.loadURL("https://deeeep.io");
                            window.hide();
                        });
                    });
                } else {
                    // loads DRC modified js
                    window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                        window.loadURL("https://deeeep.io");
                        window.hide();
                    });
                }
            });
        } else {
            window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-as-copy").then(() => {
                if (adBlockerOn) {
                    window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/ublock").then(() => {
                        // loads DRC modified js
                        window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                            window.loadURL("https://deeeep.io");
                            window.hide();
                        });
                    });
                } else {
                    // loads DRC modified js
                    window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                        window.loadURL("https://deeeep.io");
                        window.hide();
                    });
                }
            });
        };
        */
    })();
    // Opens URLs in browser
    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
    // init settings if undefined
    if (settings.customTheme === undefined) {
        settings.customTheme = true;
        store.set("settings", settings);
    }
    ;
    if (settings.gameName === undefined) {
        settings.gameName = "";
        store.set("settings", settings);
    }
    if (settings.gameAccounts === undefined) {
        settings.gameAccounts = [];
        store.set("settings", settings);
    }
    if (settings.viewingGhosts === undefined) {
        settings.viewingGhosts = true;
        store.set("settings", settings);
    }
    ;
    if (settings.advancedProfanityFilter === undefined) {
        settings.advancedProfanityFilter = true;
        store.set("settings", settings);
    }
    ;
    if (settings.assetSwapperConfig === undefined) {
        settings.assetSwapperConfig = [];
        store.set("settings", settings);
    }
    ;
    if (settings.userThemeData === undefined) {
        settings.userThemeData = [];
        store.set("settings", settings);
    }
    ;
    if (settings.pluginsData === undefined) {
        settings.pluginsData = [];
        store.set("settings", settings);
    }
    ;
    if (settings.colourblind === undefined) {
        settings.colourblind = false;
        store.set("settings", settings);
    }
    ;
    if (settings.discordRichPresence === undefined) {
        settings.discordRichPresence = true;
        store.set("settings", settings);
    }
    ;
    if (settings.keybinds === undefined) {
        settings.keybinds = {
            cancelCharge: "KeyC",
            evolutionTree: "KeyT",
            screenshot: "KeyV",
            ghostQuit: "KeyX",
            copyUrl: "KeyC",
            joinGame: "KeyJ",
            boost: "Space",
            zoomIn: "Equal",
            zoomOut: "Minus"
        };
        store.set("settings", settings);
    }
    ;
    // Loads settings
    mainWindow.webContents.send("settings", settings);
    ipcMain.on("evalInBrowserContext", (_event, code) => {
        mainWindow.webContents.executeJavaScript(code);
    });
    mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
        mainWindow.webContents.send("console-message", {
            level, message, line, sourceId
        });
    });
    ipcMain.on("ipcProxy", (_event, ipc) => {
        mainWindow.webContents.send(ipc.channel, ipc.data);
    });
    ipcMain.on("sendKeyPress", (_event, keyCode) => {
        mainWindow.webContents.sendInputEvent({ type: "keyDown", keyCode });
        mainWindow.webContents.sendInputEvent({ type: "char", keyCode });
        mainWindow.webContents.sendInputEvent({ type: "keyUp", keyCode });
    });
    // window.show();
    // listen for app path requests
    ipcMain.handle("getPath", async (_event, path) => {
        return app.getPath(path);
    });
    // toggle DevTools on request
    ipcMain.on("openDevTools", () => {
        mainWindow.webContents.openDevTools();
    });
    // forum notification badge
    ipcMain.on("setBadge", (_event, count) => {
        app.setBadgeCount([count]);
    });
    // current version tag
    ipcMain.handle("getVersion", async () => {
        return currentVersionId;
    });
    // Game started/ended
    ipcMain.on("gameStarted", () => {
        gameStarted = true;
    });
    ipcMain.on("gameEnded", () => {
        gameStarted = false;
    });
    // Take a screenshot
    let lastScreenshotTime = 0;
    ipcMain.on("captureScreenshot", () => {
        if (Date.now() - lastScreenshotTime < 500)
            return;
        lastScreenshotTime = Date.now();
        mainWindow.webContents.capturePage().then((image) => {
            try {
                const filename = Math.random().toString(36).slice(2, 8);
                fs.writeFileSync(`${app.getPath("downloads")}/drc_screenshot_${filename}.png`, image.toPNG());
                new Notification({
                    title: "Screenshot captured",
                    body: `Your screenshot has been saved to drc_screenshot_${filename}.png in your Downloads folder.`
                }).show();
                // file written successfully
            }
            catch (err) {
                console.error(err);
                new Notification({
                    title: "Something went wrong",
                    body: "An error occurred while taking a screenshot."
                }).show();
            }
            clipboard.writeImage(image);
        });
    });
    // DRC.Main.Session.AddOnBeforeRequestListener({
    //     urls: ["*://electron.github.io/*"],
    //     regex: [/https:\/\/electron\.github\.io\/?.*/]
    // }, (details: any, callback: Function) => {
    //     callback({ redirectURL: "https://example.com/ " });
    // });
    // session.defaultSession.webRequest.onBeforeRequest({
    //     urls: ["*://electron.github.io/*"]
    // }, (details: any, callback: Function) => {
    //     console.log(details);
    //     callback({ redirectURL: "https://example.com/ "});
    // });
    // plugins
    for (const i in settings.pluginsData) {
        if (settings.pluginsData[i].src.length == 0)
            continue;
        for (const j in settings.pluginsData[i].src) {
            if (settings.pluginsData[i].src[j].type == "appstart") {
                eval(settings.pluginsData[i].src[j].src);
            }
        }
    }
};
app.on('ready', () => {
    // Better WebRequest
    DRC.Main.defaultSession = enhanceWebRequest(session.defaultSession);
    // Check for updates
    log.info("Checking updates...");
    https.request({
        host: "deeeep-reef-client.github.io",
        path: "/website/api/versionid.txt"
    }, (res) => {
        res.on('data', (chunk) => {
            currentVersionId += chunk;
        });
        res.on('end', () => {
            log.info(`Current version: ${currentVersionId}`);
            if (versionId != currentVersionId) {
                if (process.platform === "win32" /* || process.platform === "darwin"*/) {
                    newUpdate = true;
                    new Notification({
                        title: "New update detected!",
                        body: "The update " + currentVersionId + " will be automatically downloaded when you quit"
                    }).show();
                }
                else {
                    new Notification({
                        title: "New update detected!",
                        body: "Please manually update the Client to the update " + currentVersionId
                    }).show();
                }
            }
        });
    }).end();
    let instUrlPath = "";
    // Windows
    if (process.platform === "win32") {
        instUrlPath = "/api/insturl-win.txt";
    }
    else if (process.platform === "linux") {
        instUrlPath = "/api/insturl-linux.txt";
    }
    else if (process.platform === "darwin") {
        instUrlPath = "/api/insturl-mac.txt";
    }
    else {
        // Not supported OS
        newUpdate = false;
        new Notification({
            title: "Failed to fetch installer URL",
            body: "Unsupported operating system."
        }).show();
    }
    if (instUrlPath !== "") {
        https.request({
            host: "deeeep-reef-client.github.io",
            path: "/website" + instUrlPath
        }, (res) => {
            res.on('data', (chunk) => {
                instUrl += chunk;
            });
            res.on('end', () => {
                log.info(`Installer URL: ${instUrl}`);
            });
        }).end();
    }
    // Create window
    createWindow();
});
function loadDrcAssetswapper() {
    const MISC_REDIRECT_TEMPLATE = 'https://deeeep-reef-client.github.io/modded-assets/misc/'; // redirect URLs are all from this
    const MISC_SCHEME = '*://*.deeeep.io/assets/index.*.js'; // these urls will be redirected like ui sprites
    const MISC_REGEX = /.+\/assets\/(?<filename>[^/?]+)(?:\?.*)?$/; // might it be a valid ui sprite? 
    const miscHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(MISC_REDIRECT_TEMPLATE, MISC_REGEX, 'misc');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [MISC_SCHEME]
    }, miscHandler);
}
function loadDocassets() {
    const ANIMATION_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/animations/';
    const ANIMATION_SCHEME = '*://*.deeeep.io/assets/animations/*';
    const ANIMATION_REGEX = /.+\/animations\/(?<filename>[^?]+)(?:\?.*)?$/;
    const animationHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(ANIMATION_REDIRECT_TEMPLATE, ANIMATION_REGEX, 'animation');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [ANIMATION_SCHEME]
    }, animationHandler);
    const CHAR_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/characters/'; // redirect URLs are all from this
    const CHAR_SCHEME = '*://*.deeeep.io/*assets/characters/*'; // these urls will be redirected like characters
    const CHAR_REGEX = /.+\/characters\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid character? 
    const charHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(CHAR_REDIRECT_TEMPLATE, CHAR_REGEX, 'character');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [CHAR_SCHEME]
    }, charHandler);
    const SPRITESHEET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/spritesheets/'; // redirect URLs are all from this
    const SPRITESHEET_SCHEME = '*://*.deeeep.io/assets/spritesheets/*'; // these urls will be redirected like spritesheets
    const SPRITESHEET_REGEX = /.+\/spritesheets\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid spritesheet? 
    const spritesheetHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(SPRITESHEET_REDIRECT_TEMPLATE, SPRITESHEET_REGEX, 'spritesheet');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [SPRITESHEET_SCHEME]
    }, spritesheetHandler);
    const MAP_SPRITESHEET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/mapmaker-asset-packs/'; // redirect URLs are all from this
    const MAP_SPRITESHEET_SCHEME = '*://*.deeeep.io/assets/packs/*'; // these urls will be redirected like map spritesheets
    const MAP_SPRITESHEET_REGEX = /.+\/packs\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid map spritesheet? 
    const mapSpritesheetHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(MAP_SPRITESHEET_REDIRECT_TEMPLATE, MAP_SPRITESHEET_REGEX, 'map spritesheet');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [MAP_SPRITESHEET_SCHEME]
    }, mapSpritesheetHandler);
    const IMG_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/img/'; // redirect URLs are all from this
    const IMG_SCHEME = '*://*.deeeep.io/img/*'; // these urls will be redirected like ui sprites
    const IMG_REGEX = /.+\/img\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid ui sprite? 
    const imgSpriteHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(IMG_REDIRECT_TEMPLATE, IMG_REGEX, 'img spritesheet');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [IMG_SCHEME]
    }, imgSpriteHandler);
    const PET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/custom/pets/';
    const PET_SCHEME = '*://*.deeeep.io/custom/pets/*';
    const PET_REGEX = /.+\/pets\/(?<filename>[^?]+)(?:\?.*)?$/;
    const petHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(PET_REDIRECT_TEMPLATE, PET_REGEX, 'pet');
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [PET_SCHEME]
    }, petHandler);
    const SKIN_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/skans/'; // redirect URLs are all from this
    const CDN_SKIN_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/skans/custom/'; // redirect URLs are all from this
    const SKIN_SCHEME = '*://*.deeeep.io/assets/skins/*'; // these urls will be redirected like skins
    const CDN_SKIN_SCHEME = '*://cdn.deeeep.io/custom/skins/*';
    const SKIN_REGEX = /.+\/skins\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid skin? 
    const CDN_REGEX = /skins\/(?:(?<skin_name>[A-Za-z]+)|(?:(?<skin_id>[0-9]+)(?<version>-[0-9]+)(?<post_version>(?<extra_asset_name>-[A-Za-z0-9-_]+)?)))(?<suffix>\.[a-zA-Z0-9]+)/;
    // skins submitted through Creators Center have a special scheme and must be stripped of their version number
    const nonCDNSkinHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(SKIN_REDIRECT_TEMPLATE, SKIN_REGEX, 'non-CDN skin');
    const CDNSkinHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(CDN_SKIN_REDIRECT_TEMPLATE, CDN_REGEX, 'CDN skin', ['skin_name', 'skin_id', 'post_version', 'suffix']);
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [SKIN_SCHEME]
    }, nonCDNSkinHandler);
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [CDN_SKIN_SCHEME]
    }, CDNSkinHandler);
}
function loadAdblocker() {
    DRC.Main.defaultSession.webRequest.onBeforeRequest({
        urls: [
            "*://*.doubleclick.net/*",
            "*://*.googlesyndication.com/*",
            "*://adservice.google.com/*",
            "*://*.googleadservices.com/*",
            "*://app-measurement.com/*",
            "*://analytics.google.com/*",
            "*://*.googleanalytics.com/*",
            "*://google-analytics.com/*",
            "*://*.google-analytics.com/*"
        ]
    }, (details, callback) => {
        callback({
            cancel: true
        });
    });
}
;
function quitApp() {
    log.info("App has been quit");
    app.quit();
}
app.on('window-all-closed', () => {
    log.info("Window all closed");
    settings.previousVersion = DRC.Client.versionTag;
    // Save settings 1 last time, just in case
    store.set("settings", settings);
    // Auto update
    // Don't try updating when in development
    if (settings.developer) {
        quitApp();
        return;
    }
    //delete updater
    if (fs.existsSync(app.getPath('downloads') + "\\drcupdater.exe")) {
        fs.unlink(app.getPath('downloads') + "\\drcupdater.exe", (err) => {
            if (err) {
                log.info("An error occurred while deleting the installer. Please manually delete `drcupdater.exe` from your Downloads folder");
                console.error(err);
                return;
            }
            console.log("Installer successfully deleted");
            log.info("Windows installer deleted");
        });
    }
    else if (fs.existsSync(app.getPath('downloads') + "/drcupdater.pkg")) {
        fs.unlink(app.getPath('downloads') + "/drcupdater.pkg", (err) => {
            if (err) {
                log.info("An error occurred while deleting the installer. Please manually delete `drcupdater.exe` from your Downloads folder");
                console.error(err);
                return;
            }
            console.log("Installer successfully deleted");
            log.info("macOS installer deleted");
        });
    }
    // download installer
    if (newUpdate) {
        log.info("Downloading update installer");
        new Notification({
            title: "Downloading update",
            body: `The new update ${currentVersionId} is being downloaded`
        }).show();
        let updaterFilename = "";
        if (process.platform === "win32") {
            updaterFilename = "drcupdater.exe";
        }
        else if (process.platform === "darwin") {
            updaterFilename = "drcupdater.pkg";
        }
        electronDl.download(new BrowserWindow({
            width: 0,
            height: 0,
            show: false,
        }), instUrl, {
            directory: app.getPath("downloads"),
            filename: updaterFilename,
            onCompleted: function (file) {
                if (this.errorTitle) {
                    new Notification({
                        title: "Error downloading update",
                        body: "Something went wrong while downloading the update"
                    }).show();
                    log.info("Error while downloading update");
                    console.error(this.errorMessage);
                    quitApp();
                    return;
                }
                if (process.platform === "win32") {
                    spawn(file.path, { detached: true });
                }
                else if (process.platform === "darwin") {
                    /*
                    hdiutil attach Deeeep.io-Reef-Client-1.0.1-mac.dmg

cd /Volumes/DarwinPorts-1.2/

sudo installer -pkg DarwinPorts-1.2.pkg -target "~"

hdiutil detach /Volumes/DarwinPorts-1.2/
*/
                    // sudoPrompt.exec("installer -pkg " + file.path + " -target \"~\"", {
                    //     name: "Deeeep.io Reef Client Updater",
                    //     icns: '/Applications/Deeeep.io Reef Client.app/Contents/Resources/icon.icns',
                    // },
                    //     (error: any, stdout: string, stderr: string) => {
                    //         if (error) new Notification({
                    //             title: "Failed to auto update the Client",
                    //             body: "Please manually update the Client to the update " + currentVersionId
                    //         }).show();;
                    //     }
                    // );
                    spawn("installer", ["-pkg", file.path, "-target", "\"~\""]);
                }
                quitApp();
            }
        });
    }
    else
        quitApp();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Discord rich presence
const startTimestamp = new Date();
// Set activity
let rpc = new RPC.Client({
    transport: 'ipc'
});
function setDiscordActivity(gameInfo) {
    let buttons = [{ label: "Join Game", url: gameInfo.url }];
    if (gameInfo.url == '')
        buttons = undefined;
    rpc.setActivity({
        details: "Playing Deeeep.io",
        largeImageKey: "favicon-big",
        largeImageText: "Deeeep.io",
        smallImageKey: gameInfo.gamemode.toLowerCase(),
        smallImageText: gameInfo.gamemode,
        startTimestamp,
        buttons
    });
}
;
rpc.login({ clientId: "1006552150807150594" });
rpc.on('ready', () => {
    if (settings.discordRichPresence)
        setDiscordActivity({
            gamemode: "Menu",
            url: ''
        });
});
// Await gameInfo IPC message to change RPC
let lastGameInfo = {
    gamemode: "Menu",
    url: ''
};
ipcMain.on("gameInfo", (_event, gameInfo) => {
    if (settings.discordRichPresence)
        setDiscordActivity(gameInfo);
    lastGameInfo = gameInfo;
});
// Reload Discord RPC
ipcMain.on("reloadDiscordRpc", () => {
    log.info("Discord RPC reloaded");
    if (settings.discordRichPresence)
        setDiscordActivity(lastGameInfo);
    else
        rpc.clearActivity();
});
// plugins
for (const i in settings.pluginsData) {
    if (settings.pluginsData[i].src.length == 0)
        continue;
    for (const j in settings.pluginsData[i].src) {
        if (settings.pluginsData[i].src[j].type == "startup") {
            eval(settings.pluginsData[i].src[j].src);
        }
    }
}
