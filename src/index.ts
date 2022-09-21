import { Widget } from "discord.js";

const { app, BrowserWindow, Menu, ipcMain, shell, session } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const { ElectronChromeExtensions } = require('electron-chrome-extensions');

// Store!

interface SettingsTemplate {
    customTheme: boolean;
    docassets: boolean;
    v3ui: boolean;
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
        v3ui: false
    };
    store.set("settings", settings);
}

// Save settings
ipcMain.on("saveSettings", (_event: Event, newSettings: SettingsTemplate) => {
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
    // Loads blocky fish game :)
    window.loadURL("https://deeeep.io");

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
    Menu.setApplicationMenu(menu);

    // Loads doc assets
    let docassetsOn = settings.docassets;
    if (docassetsOn === undefined) {
        settings.docassets = false;
        store.set("settings", settings);
        docassetsOn = false;
    };
    if (docassetsOn) {
        const extensions = new ElectronChromeExtensions()
        extensions.addTab(window.webContents, window)
        window.webContents.session.loadExtension(app.getAppPath().substring(0, app.getAppPath().lastIndexOf("\\")) + "/extensions/docassets").then(() => {
            window.loadURL("https://deeeep.io");
            window.show();
        });
    } else {
        window.loadURL("https://deeeep.io");
        window.show();
    };


    // Loads settings
    window.webContents.send("settings", settings);
};

app.on('ready', () => {
    createWindow();
}
);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
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



