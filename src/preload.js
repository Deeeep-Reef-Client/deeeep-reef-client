"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ipcRenderer } = require('electron');
// @ts-ignore: I know better.
const object_observer_min_js_1 = require("./node_modules/object-observer/dist/object-observer.min.js");
let gameStarted = false;
window.addEventListener("load", () => {
    const oldThis = object_observer_min_js_1.Observable.from(this);
    object_observer_min_js_1.Observable.observe(oldThis, (changes) => {
        changes.forEach(change => {
            console.log(change);
        });
    });
    const btn = document.querySelector(".play");
    btn.addEventListener("click", () => {
        if (gameStarted)
            return;
        const element = document.getElementById("app");
        const openObserver = new MutationObserver((mutations) => {
            if (document.contains(document.getElementById("canvas-container"))) {
                gameStarted = true;
                openObserver.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: document.querySelector('.block, .modes').querySelector('.selected').querySelector('.name').innerText,
                    url: window.location.href
                });
                function onGameEnd() {
                    gameStarted = false;
                    closeObserver.disconnect();
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                }
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
});
