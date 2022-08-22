"use strict";
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');
if (require('electron-squirrel-startup')) {
    app.quit();
}
const createWindow = () => {
    // Create the browser window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    window.loadURL("https://deeeep.io");
    window.webContents.openDevTools();
    window.maximize();
    window.removeMenu();
    const menu = Menu.buildFromTemplate([
        {
            label: "Settings"
        },
        {
            label: "Discord"
        },
        {
            label: "Help"
        }
    ]);
    Menu.setApplicationMenu(menu);
};
app.on('ready', () => {
    createWindow();
    ipcMain.on("gameInfo", (event, gameInfo) => {
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
const startTimestamp = new Date();
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
