const { ipcRenderer } = require('electron');

window.addEventListener("load", () => {
    const btn = document.querySelector(".play");
    btn!.addEventListener("click", () => {
        const element = document.getElementById("app");
        const observer = new MutationObserver((mutations: MutationRecord[]) => {
            if (document.contains(document.getElementById("canvas-container"))) {
                observer.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: (document.querySelector('.block, .modes')!.querySelector('.selected')!.querySelector('.name') as HTMLElement)!.innerText,
                    url: window.location.href
                });
            }
        });
        observer.observe(element!, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    })
})