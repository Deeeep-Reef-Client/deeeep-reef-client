const { ipcRenderer } = require('electron');

let gameStarted = false;
window.addEventListener("load", () => {
    const btn = document.querySelector(".play");
    btn!.addEventListener("click", () => {
        if (gameStarted) return;
        const element = document.getElementById("app");
        const openObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (document.contains(document.getElementById("canvas-container"))) {
                gameStarted = true;
                openObserver.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: (document.querySelector('.block, .modes')!.querySelector('.selected')!.querySelector('.name') as HTMLElement)!.innerText,
                    url: window.location.href
                });
                function onGameEnd() {
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                }
                const closeObserver = new MutationObserver((mutations: MutationRecord[]) => {
                    if (document.contains(document.querySelector(".death-reason"))) {
                        closeObserver.disconnect();
                        onGameEnd();
                    }
                    mutations.forEach((mutation: MutationRecord)  => {
                        mutation.removedNodes.forEach((removedNode: Node) =>{
                            if((removedNode as HTMLElement)!.className == "game") {
                                closeObserver.disconnect();
                                onGameEnd();
                            }
                        });
                    });
                });
                closeObserver.observe(element!, { 
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                });
            }
        });
        openObserver.observe(element!, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    })
})

