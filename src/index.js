"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, BrowserWindow, Menu, ipcMain, shell, session, globalShortcut, Notification } = require('electron');
const log = require('electron-log');
const path = require('path');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const { ElectronChromeExtensions } = require('electron-chrome-extensions');
const https = require('https');
const electronDl = require('electron-dl');
const spawn = require('child_process').spawn;
const fs = require('fs');
const Badge = require('electron-windows-badge');
log.info('DRC starting...');
// stuff
const development = true;
// Auto update
let newUpdate = false;
let instUrl = "";
const versionId = "v0.9.1-beta";
let currentVersionId = "";
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
            developer: {
                type: "boolean",
                default: false
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
    developer: false
};
Object.assign(settings, store.get("settings") ?? {});
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
        developer: false
    };
    store.set("settings", settings);
}
// Save settings
ipcMain.on("saveSettings", (_event, newSettings) => {
    settings = newSettings;
    store.set("settings", newSettings);
});
// Create window
const createWindow = () => {
    // Create the browser window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false
        }
    });
    const badgeOptions = {
        font: '20px arial'
    };
    new Badge(window, badgeOptions);
    window.hide();
    window.webContents.setBackgroundThrottling(false);
    let finishedLoad = false;
    const loadingWindow = new BrowserWindow({
        width: 960,
        height: 540,
    });
    loadingWindow.loadFile("src/loading.html");
    loadingWindow.removeMenu();
    loadingWindow.on("close", () => {
        if (!finishedLoad)
            window.close();
    });
    window.webContents.once('did-finish-load', () => {
        finishedLoad = true;
        loadingWindow.close();
        window.show();
    });
    window.webContents.once('did-fail-load', () => {
        loadingWindow.close();
        window.close();
        new Notification({
            title: "Failed to load the game",
            body: "Please check your internet and try again."
        }).show();
    });
    // Loads blocky fish game :)... probably not
    // window.loadURL("https://deeeep.io");
    if (settings.developer)
        window.webContents.openDevTools();
    window.maximize();
    // Deletes menu and makes new menu
    window.removeMenu();
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
    // Extensions
    const extensions = new ElectronChromeExtensions();
    extensions.addTab(window.webContents, window);
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
        if (docassetsOn)
            await window.webContents.session.loadExtension(app.getAppPath() + "/extensions/docassets");
        else
            await window.webContents.session.loadExtension(app.getAppPath() + "/extensions/drc-as-copy");
        if (adBlockerOn)
            await window.webContents.session.loadExtension(app.getAppPath() + "/extensions/ublock");
        else
            await window.webContents.session.loadExtension(app.getAppPath() + "/extensions/drc-assetswapper");
        await window.webContents.session.loadExtension(app.getAppPath() + "/extensions/drc-assetswapper");
        window.loadURL("https://deeeep.io");
        window.hide();
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
    window.webContents.setWindowOpenHandler((details) => {
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
    // Loads settings
    window.webContents.send("settings", settings);
    ipcMain.on("evalInBrowserContext", (_event, code) => {
        window.webContents.executeJavaScript(code);
    });
    window.webContents.on("console-message", (event, level, message, line, sourceId) => {
        window.webContents.send("console-message", {
            level, message, line, sourceId
        });
    });
    ipcMain.on("ipcProxy", (_event, ipc) => {
        window.webContents.send(ipc.channel, ipc.data);
    });
    ipcMain.on("sendKeyPress", (_event, keyCode) => {
        window.webContents.sendInputEvent({ type: "keyDown", keyCode });
        window.webContents.sendInputEvent({ type: "char", keyCode });
        window.webContents.sendInputEvent({ type: "keyUp", keyCode });
    });
    // window.show();
    // listen for app path requests
    ipcMain.handle("getPath", async (_event, path) => {
        return app.getPath(path);
    });
    // toggle DevTools on request
    ipcMain.on("openDevTools", () => {
        window.webContents.openDevTools();
    });
    // forum notification badge
    ipcMain.on("setBadge", (_event, count) => {
        app.setBadgeCount([count]);
    });
    // current version tag
    ipcMain.handle("getVersion", async () => {
        return currentVersionId;
    });
};
app.on('ready', () => {
    // Check for updates
    log.info("Checking updates...");
    https.request({
        host: "deeeep-reef-client.netlify.app",
        path: "/api/versionid.txt"
    }, (res) => {
        res.on('data', (chunk) => {
            currentVersionId += chunk;
        });
        res.on('end', () => {
            log.info(`Current version: ${currentVersionId}`);
            if (versionId != currentVersionId) {
                newUpdate = true;
                new Notification({
                    title: "New update detected!",
                    body: "The update will be automatically downloaded when you quit"
                }).show();
            }
        });
    }).end();
    https.request({
        host: "deeeep-reef-client.netlify.app",
        path: "/api/insturl.txt"
    }, (res) => {
        res.on('data', (chunk) => {
            instUrl += chunk;
        });
        res.on('end', () => {
            log.info(`Installer URL: ${instUrl}`);
        });
    }).end();
    // Create window
    createWindow();
});
;
function quitApp() {
    log.info("App has been quit");
    if (process.platform !== 'darwin') {
        app.quit();
    }
}
app.on('window-all-closed', () => {
    log.info("Window all closed");
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
            log.info("Installer deleted");
        });
    }
    // download installer
    if (newUpdate) {
        log.info("Downloading update installer");
        new Notification({
            title: "Downloading update",
            body: `The new update ${currentVersionId} is being downloaded`
        }).show();
        electronDl.download(new BrowserWindow({
            width: 0,
            height: 0,
            show: false,
        }), instUrl, {
            directory: app.getPath("downloads"),
            filename: "drcupdater.exe",
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
                spawn(file.path, { detached: true });
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
rpc.on('ready', () => setDiscordActivity({
    gamemode: "Menu",
    url: ''
}));
// Await gameInfo IPC message to change RPC
ipcMain.on("gameInfo", (_event, gameInfo) => {
    setDiscordActivity(gameInfo);
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
