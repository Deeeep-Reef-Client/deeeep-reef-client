"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, BrowserWindow, Menu, ipcMain, shell, session } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const { ElectronChromeExtensions } = require('electron-chrome-extensions');

const store = new Store();
ipcMain.on("saveSettings", (_event, settings) => {
    store.set("settings", settings);
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
                        window.webContents.toggleDevTools();
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
    var docassetsOn = store.get("settings.docassets")
    if (docassetsOn == undefined) {
        store.set("settings.docassets", true)
        docassetsOn = true
    }
    if (docassetsOn) {
        const extensions = new ElectronChromeExtensions();
        extensions.addTab(window.webContents, window);
        window.webContents.session.loadExtension(app.getAppPath() + "/extensions/docassets").then(() => {
            window.loadURL("https://deeeep.io");
            window.show();
        });
    }
    else {
        window.loadURL("https://deeeep.io");
        window.show();
    }
    // Loads settings
    window.webContents.send("settings", /*{
        customTheme: true
    }*/ 
    /* Commenting this for the time being */ store.get("settings"));
};
app.on('ready', () => {
    createWindow();
    // Await gameInfo IPC message to change RPC
    ipcMain.on("gameInfo", (_event, gameInfo) => {
        setDiscordActivity(gameInfo);
    });
});
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
let rpc = new RPC.Client({
    transport: 'ipc'
});
rpc.login({ clientId: "1006552150807150594" });
rpc.on('ready', () => setDiscordActivity({
    gamemode: "Menu",
    url: ''
}));
