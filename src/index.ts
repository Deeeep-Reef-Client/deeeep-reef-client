import { Widget } from "discord.js";

const { app, BrowserWindow, Menu, ipcMain, shell, session, globalShortcut, Notification } = require('electron');
const log = require('electron-log');
const path = require('path');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const { ElectronChromeExtensions } = require('electron-chrome-extensions');
const https = require('https');
const electronDl = require('electron-dl');
const spawnSync = require('child_process').spawnSync;
const fs = require('fs');

log.info('DRC starting...');

// stuff
const development = true;

// Auto update
let newUpdate = false;
let instUrl = "";
const versionId = "v0.8.0-beta";
let currentVersionId = "";

// Store!

interface SettingsTemplate {
    customTheme: boolean;
    docassets: boolean;
    v3ui: boolean;
    assetSwapper: boolean;
    assetSwapperConfig: Array<any>;
    lightTheme: boolean;
    userTheme: boolean;
    userThemeData: Array<any>;
    pluginsData: Array<any>;
    adBlocker: boolean;
    viewingGhosts: boolean;
    advancedProfanityFilter: boolean;
    gameName: string;
    gameAccounts: Array<any>;
}

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
            }
        }
    }
};
const store = new Store({ schema });

// Fetch settings
let settings: SettingsTemplate = store.get("settings");
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
        adBlocker: true,
        viewingGhosts: true,
        advancedProfanityFilter: true,
        gameName: "",
        gameAccounts: []
    };
    store.set("settings", settings);
}

// Save settings
ipcMain.on("saveSettings", (_event: Event, newSettings: SettingsTemplate) => {
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

    window.hide();

    const loadingWindow = new BrowserWindow({
        width: 960,
        height: 540,
    });
    loadingWindow.loadFile("src/loading.html");
    loadingWindow.removeMenu();
    window.webContents.once('did-finish-load', () => {
        loadingWindow.close();
        window.show();
    })
    // Loads blocky fish game :)... probably not
    // window.loadURL("https://deeeep.io");

    if (development) window.webContents.openDevTools();

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

    const extensions = new ElectronChromeExtensions()
    extensions.addTab(window.webContents, window)

    // Loads doc assets
    let docassetsOn = settings.docassets;
    if (docassetsOn === undefined) {
        settings.docassets = false;
        store.set("settings", settings);
        docassetsOn = false;
    };

    // Loads Adblocker
    let adBlockerOn = settings.adBlocker;
    if (adBlockerOn === undefined) {
        settings.adBlocker = true;
        store.set("settings", settings);
        adBlockerOn = true;
    };

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


    // Opens URLs in browser
    window.webContents.setWindowOpenHandler((details: any) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // init settings if undefined
    if (settings.customTheme === undefined) {
        settings.customTheme = true;
        store.set("settings", settings);
    };

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
    };

    if (settings.advancedProfanityFilter === undefined) {
        settings.advancedProfanityFilter = true;
        store.set("settings", settings);
    };

    if (settings.assetSwapperConfig === undefined) {
        settings.assetSwapperConfig = [];
        store.set("settings", settings);
    };

    if (settings.userThemeData === undefined) {
        settings.userThemeData = [];
        store.set("settings", settings);
    };

    if (settings.pluginsData === undefined) {
        settings.pluginsData = [];
        store.set("settings", settings);
    };

    // Loads settings
    window.webContents.send("settings", settings);

    ipcMain.on("evalInBrowserContext", (_event: Event, code: string) => {
        window.webContents.executeJavaScript(code);
    });

    window.webContents.on("console-message", (event: Event, level: Number, message: string, line: Number, sourceId: string) => {
        window.webContents.send("console-message", {
            level, message, line, sourceId
        });
    });

    interface ipcProxy {
        channel: string;
        data: any;
    }

    ipcMain.on("ipcProxy", (_event: Event, ipc: ipcProxy) => {
        window.webContents.send(
            ipc.channel,
            ipc.data
        )
    })

    // window.show();

    // listen for app path requests
    ipcMain.on("getPath", (_event: Event, path: string) => {
        window.webContents.send("gettedPath", app.getPath(path));
    });

    // toggle DevTools on request
    ipcMain.on("openDevTools", () => {
        window.webContents.openDevTools();
    });
};

app.on('ready', () => {
    // Check for updates
    log.info("Checking updates...");
    https.request({
        host: "deeeep-reef-client.netlify.app",
        path: "/api/versionid.txt"
    }, (res: any) => {
        res.on('data', (chunk: any) => {
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
    }, (res: any) => {
        res.on('data', (chunk: any) => {
            instUrl += chunk;
        });
        res.on('end', () => {
            log.info(`Installer URL: ${instUrl}`);
        });
    }).end();
    // Create window
    createWindow();
});

interface ElectronDlFile {
    filename: string;
    path: string;
    filesize: number;
    mimetype: string;
    url: string;
};

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
    if (development) {
        quitApp();
        return;
    }
    //delete updater
    if (fs.existsSync(app.getPath('downloads') + "\\drcupdater.exe")) {
        fs.unlink(app.getPath('downloads') + "\\drcupdater.exe", (err: Error) => {
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
            onCompleted: function (file: ElectronDlFile) {
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
                spawnSync(file.path, { detached: true });
                quitApp();
            }
        });
    } else quitApp();
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
function setDiscordActivity(gameInfo: { gamemode: string, url: string }) {
    type joinbtn = [{ label: string, url: string }] | undefined;
    let buttons: joinbtn = [{ label: "Join Game", url: gameInfo.url }];
    if (gameInfo.url == '') buttons = undefined;
    rpc.setActivity({
        details: "Playing Deeeep.io",
        largeImageKey: "favicon-big",
        largeImageText: "Deeeep.io",
        smallImageKey: gameInfo.gamemode.toLowerCase(),
        smallImageText: gameInfo.gamemode,
        startTimestamp,
        buttons
    })
};
rpc.login({ clientId: "1006552150807150594" });
rpc.on('ready', () => setDiscordActivity({
    gamemode: "Menu",
    url: ''
}));
// Await gameInfo IPC message to change RPC
ipcMain.on("gameInfo", (_event: Event, gameInfo: { gamemode: string, url: string }) => {
    setDiscordActivity(gameInfo);
})

// plugins
for (const i in settings.pluginsData) {
    if (settings.pluginsData[i].src.length == 0) continue;
    for (const j in settings.pluginsData[i].src) {
        if (settings.pluginsData[i].src[j].type == "startup") {
            eval(settings.pluginsData[i].src[j].src);
        }
    }
}



