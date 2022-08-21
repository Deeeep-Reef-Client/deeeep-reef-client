const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
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

    // and load the index.html of the app.
    window.loadURL("https://deeeep.io");

    // Open the DevTools.
    window.webContents.openDevTools();
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let rpc = new RPC.Client({
    transport: 'ipc'
});
rpc.login({ clientId: "1006552150807150594" });
rpc.on('ready', () => {
    rpc.setActivity({
        details: "Playing Deeeep.io",
        largeImageKey: "favicon-big",
        largeImageText: "Deeeep.io",
        // smallImageKey: "ffa",
        // smallImageText: "Playing Unknown Gamemode",
        startTimestamp: new Date(),
      })
});