import { AnonymousGuild, Widget } from "discord.js";

const { app, BrowserWindow, Menu, ipcMain, shell, session, globalShortcut, Notification, dialog } = require('electron');
const log = require('electron-log');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const electronDl = require('electron-dl');
const Badge = require('electron-windows-badge');
const enhanceWebRequest = require('electron-better-web-request').default;
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
const versionId = "v0.9.1-beta";
let currentVersionId = "";


// DRC API
const DRC: any = {
    Main: {
        defaultSession: new Object()
    },
    WebRequestHandlers: {
        genericAssetswapperHandler: function (redirectTemplate: string, regex: RegExp, name: string, filenameKeys = ['filename']) {
            return (details: any, callback: Function) => {
                let redirectUrl = details.url;
                const m = regex.exec(details.url);
                if (m) {
                    //@ts-ignore: I know better!
                    const filenameArray = filenameKeys.map(key => m?.groups[key] || '');
                    const filename = filenameArray.join('');
                    let newRedirectUrl = redirectTemplate + filename;
                    const newRedirectUrlObject = new URL(newRedirectUrl);
                    if (!assetswapperAlreadyChecked.has(newRedirectUrl)) {
                        https.request({
                            host: newRedirectUrlObject.hostname,
                            path: newRedirectUrlObject.pathname,
                            method: 'GET'
                        }, (res: any) => {
                            assetswapperAlreadyChecked.add(newRedirectUrl);

                            if (res.statusCode === 200) {
                                redirectUrl = newRedirectUrl;
                            } else {
                                setTimeout(() => {
                                    assetswapperAlreadyChecked.delete(newRedirectUrl);

                                    // console.log(`${newRedirectUrl} removed from checked list`);
                                }, 5000);
                            }
                            callback({ redirectURL: redirectUrl });
                        }).end();
                    } else callback();
                } else callback();
            };
        }
    }
};

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
    pluginUserData: any;
    adBlocker: boolean;
    viewingGhosts: boolean;
    advancedProfanityFilter: boolean;
    gameName: string;
    gameAccounts: Array<any>;
    colourblind: boolean;
    developer: boolean;
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
            developer: {
                type: "boolean",
                default: false
            }
        }
    }
};
const store = new Store({ schema });

// Fetch settings
let settings: SettingsTemplate = {
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
        colourblind: false,
        developer: false
    };
    store.set("settings", settings);
}

// Save settings
ipcMain.on("saveSettings", (_event: Event, newSettings: SettingsTemplate) => {
    settings = newSettings;
    store.set("settings", newSettings);
});

// Random data
let gameStarted = false;

// Create window

const createWindow = () => {
    // Create the browser window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false
        }
    });

    // enhanceWebRequest(session.defaultSession);

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
        frame: false,
        resizable: false
    });
    loadingWindow.loadFile("src/loading.html");

    loadingWindow.removeMenu();

    loadingWindow.on("close", () => {
        if (!finishedLoad) window.close();
    });

    window.on("focus", () => {
        window.webContents.send("windowFocus");
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

    if (settings.developer) window.webContents.openDevTools();

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

    // Menu bar
    ipcMain.on("windowMinimise", () => {
        window.minimize();
    });

    ipcMain.on("windowMaximise", () => {
        window.maximize();
    });

    ipcMain.on("windowRestore", () => {
        window.unmaximize();
    });

    ipcMain.on("windowClose", () => {
        window.close();
    });

    window.on("maximize", () => {
        window.webContents.send("windowMaximise");
    });

    window.on("unmaximize", () => {
        window.webContents.send("windowRestore");
    });

    // Close confirmation
    window.on("close", (e: any) => {
        if (!gameStarted) return;

        let response = dialog.showMessageBoxSync(window, {
            type: "question",
            buttons: ["Exit", "Cancel"],
            title: "Exit Confirmation",
            message: "Are you sure you want to quit? You have an ongoing game."
        });

        if (response === 1) e.preventDefault();
    });

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

    (async () => {
        console.log(app.getAppPath());

        loadDrcAssetswapper();

        if (docassetsOn) loadDocassets();

        if (adBlockerOn) loadAdblocker();

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

    if (settings.colourblind === undefined) {
        settings.colourblind = false;
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
    });
    ipcMain.on("sendKeyPress", (_event: Event, keyCode: string) => {
        window.webContents.sendInputEvent({ type: "keyDown", keyCode });
        window.webContents.sendInputEvent({ type: "char", keyCode });
        window.webContents.sendInputEvent({ type: "keyUp", keyCode });
    });
    // window.show();

    // listen for app path requests
    ipcMain.handle("getPath", async (_event: Event, path: string) => {
        return app.getPath(path);
    });

    // toggle DevTools on request
    ipcMain.on("openDevTools", () => {
        window.webContents.openDevTools();
    });

    // forum notification badge
    ipcMain.on("setBadge", (_event: Event, count: number) => {
        app.setBadgeCount([count])
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
    ipcMain.on("captureScreenshot", () => {
        window.webContents.capturePage().then((image: any) => {
            try {
                fs.writeFileSync(`${app.getPath("downloads")}/drc_screenshot_${Math.random().toString(36).slice(2, 8)}.png`, image.toPNG());
                // file written successfully
            } catch (err) {
                console.error(err);
                new Notification({
                    title: "Something went wrong",
                    body: "An error occurred while taking a screenshot."
                }).show();
            }
        })
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
        if (settings.pluginsData[i].src.length == 0) continue;
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

    let instUrlPath = "";

    // Windows
    if (process.platform === "win32") {
        instUrlPath = "/api/insturl-win32.txt";
    } else {
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
        }, (res: any) => {
            res.on('data', (chunk: any) => {
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

// Copyright (c) 2023 Doctorpus <https://github.com/The-Doctorpus>
const assetswapperAlreadyChecked = new Set();

function loadDrcAssetswapper() {
    const MISC_REDIRECT_TEMPLATE = 'https://deeeep-reef-client.github.io/modded-assets/misc/'; // redirect URLs are all from this
    const MISC_SCHEME = '*://*.deeeep.io/assets/index.*.js'; // these urls will be redirected like ui sprites
    const MISC_REGEX = /.+\/assets\/(?<filename>[^/?]+)(?:\?.*)?$/ // might it be a valid ui sprite? 

    const miscHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(MISC_REDIRECT_TEMPLATE, MISC_REGEX, 'misc');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [MISC_SCHEME]
        },
        miscHandler
    );
}

function loadDocassets() {
    const ANIMATION_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/animations/';
    const ANIMATION_SCHEME = '*://*.deeeep.io/assets/animations/*';
    const ANIMATION_REGEX = /.+\/animations\/(?<filename>[^?]+)(?:\?.*)?$/

    const animationHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(ANIMATION_REDIRECT_TEMPLATE, ANIMATION_REGEX, 'animation');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [ANIMATION_SCHEME]
        },
        animationHandler
    );

    const CHAR_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/characters/'; // redirect URLs are all from this
    const CHAR_SCHEME = '*://*.deeeep.io/*assets/characters/*'; // these urls will be redirected like characters
    const CHAR_REGEX = /.+\/characters\/(?<filename>[^?]+)(?:\?.*)?$/ // might it be a valid character? 

    const charHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(CHAR_REDIRECT_TEMPLATE, CHAR_REGEX, 'character');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [CHAR_SCHEME]
        },
        charHandler
    );

    const SPRITESHEET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/spritesheets/'; // redirect URLs are all from this
    const SPRITESHEET_SCHEME = '*://*.deeeep.io/assets/spritesheets/*'; // these urls will be redirected like spritesheets
    const SPRITESHEET_REGEX = /.+\/spritesheets\/(?<filename>[^?]+)(?:\?.*)?$/ // might it be a valid spritesheet? 

    const spritesheetHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(SPRITESHEET_REDIRECT_TEMPLATE, SPRITESHEET_REGEX, 'spritesheet');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [SPRITESHEET_SCHEME]
        },
        spritesheetHandler
    );

    const MAP_SPRITESHEET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/default/mapmaker-asset-packs/'; // redirect URLs are all from this
    const MAP_SPRITESHEET_SCHEME = '*://*.deeeep.io/assets/packs/*'; // these urls will be redirected like map spritesheets
    const MAP_SPRITESHEET_REGEX = /.+\/packs\/(?<filename>[^?]+)(?:\?.*)?$/ // might it be a valid map spritesheet? 

    const mapSpritesheetHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(MAP_SPRITESHEET_REDIRECT_TEMPLATE, MAP_SPRITESHEET_REGEX, 'map spritesheet');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [MAP_SPRITESHEET_SCHEME]
        },
        mapSpritesheetHandler
    );

    const IMG_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/img/'; // redirect URLs are all from this
    const IMG_SCHEME = '*://*.deeeep.io/img/*'; // these urls will be redirected like ui sprites
    const IMG_REGEX = /.+\/img\/(?<filename>[^?]+)(?:\?.*)?$/ // might it be a valid ui sprite? 

    const imgSpriteHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(IMG_REDIRECT_TEMPLATE, IMG_REGEX, 'img spritesheet');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [IMG_SCHEME]
        },
        imgSpriteHandler
    );

    const PET_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/custom/pets/';
    const PET_SCHEME = '*://*.deeeep.io/custom/pets/*'
    const PET_REGEX = /.+\/pets\/(?<filename>[^?]+)(?:\?.*)?$/

    const petHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(PET_REDIRECT_TEMPLATE, PET_REGEX, 'pet');

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [PET_SCHEME]
        },
        petHandler
    );

    const SKIN_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/skans/'; // redirect URLs are all from this
    const CDN_SKIN_REDIRECT_TEMPLATE = 'https://the-doctorpus.github.io/doc-assets/images/skans/custom/'; // redirect URLs are all from this
    const SKIN_SCHEME = '*://*.deeeep.io/assets/skins/*'; // these urls will be redirected like skins
    const CDN_SKIN_SCHEME = '*://cdn.deeeep.io/custom/skins/*';
    const SKIN_REGEX = /.+\/skins\/(?<filename>[^?]+)(?:\?.*)?$/; // might it be a valid skin? 
    const CDN_REGEX = /skins\/(?:(?<skin_name>[A-Za-z]+)|(?:(?<skin_id>[0-9]+)(?<version>-[0-9]+)(?<post_version>(?<extra_asset_name>-[A-Za-z0-9-_]+)?)))(?<suffix>\.[a-zA-Z0-9]+)/;
    // skins submitted through Creators Center have a special scheme and must be stripped of their version number

    const nonCDNSkinHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(SKIN_REDIRECT_TEMPLATE, SKIN_REGEX, 'non-CDN skin');
    const CDNSkinHandler = DRC.WebRequestHandlers.genericAssetswapperHandler(CDN_SKIN_REDIRECT_TEMPLATE, CDN_REGEX, 'CDN skin', ['skin_name', 'skin_id', 'post_version', 'suffix']);

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [SKIN_SCHEME]
        },
        nonCDNSkinHandler
    );

    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [CDN_SKIN_SCHEME]
        },
        CDNSkinHandler
    );
}

function loadAdblocker() {
    DRC.Main.defaultSession.webRequest.onBeforeRequest(
        {
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
        },
        (details: any, callback: Function) => {
            callback({
                cancel: true
            });
        });
}

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
    if (settings.developer) {
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
                spawn(file.path, { detached: true });
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



