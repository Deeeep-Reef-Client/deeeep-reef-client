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
const exec = require('child_process').execFile;
const fs = require('fs');
log.info('DRC starting...');
// Auto update
let newUpdate = false;
let instUrl = "";
const versionId = "v0.4.0-beta";
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
            }
        }
    }
};
const store = new Store({ schema });
// Fetch settings
let settings = store.get("settings");
if (settings === undefined) {
    settings = {
        customTheme: true,
        docassets: false,
        v3ui: false,
        assetSwapper: true,
        assetSwapperConfig: []
    };
    store.set("settings", settings);
}
// Save settings
ipcMain.on("saveSettings", (_event, newSettings) => {
    settings = newSettings;
    store.set("settings", newSettings);
});
// Create window
if (require('electron-squirrel-startup')) {
    app.quit();
}
const createWindow = () => {
    // Create the browser window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    // Loads blocky fish game :)... probably not
    // window.loadURL("https://deeeep.io");
    window.webContents.openDevTools();
    window.maximize();
    // Deletes menu and makes new menu
    window.removeMenu();
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
    if (docassetsOn) {
        window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/docassets").then(() => {
            // loads DRC modified js
            window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                window.loadURL("https://deeeep.io");
            });
        });
    }
    else {
        window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-as-copy").then(() => {
            // loads DRC modified js
            window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/drc-assetswapper").then(() => {
                window.loadURL("https://deeeep.io");
            });
        });
    }
    ;
    // Opens URLs in browser
    window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
    // init settings if undefined
    if (settings.assetSwapperConfig === undefined) {
        settings.assetSwapperConfig = [];
        store.set("settings", settings);
    }
    ;
    // Loads settings
    window.webContents.send("settings", settings);
    ipcMain.on("evalInBrowserContext", (_event, code) => {
        window.webContents.executeJavaScript(code);
    });
    // window.show();
};
app.on('ready', () => {
    // Check for updates
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
    // Auto update
    if (newUpdate) {
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
                }
                exec(file.path, (err, data) => {
                    if (err) {
                        log.info("An error occurred while downloading the installer");
                        console.error(err);
                        quitApp();
                        return;
                    }
                    console.log(data.toString());
                    if (fs.existsSync(app.getPath('downloads') + "\\drcupdater.exe")) {
                        fs.unlink(app.getPath('downloads') + "\\drcupdater.exe", (err) => {
                            if (err) {
                                log.info("An error occurred while deleting the installer. Please manually delete `drcupdater.exe` from your Downloads folder");
                                console.error(err);
                                quitApp();
                                return;
                            }
                            console.log("Installer successfully deleted");
                            quitApp();
                        });
                    }
                });
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
