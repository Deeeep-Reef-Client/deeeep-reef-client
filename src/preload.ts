const { ipcRenderer } = require('electron');

// Prevent starting RPC when game already started
let gameStarted = false;

window.addEventListener("load", () => {

    // Watch for match start
    const btn = document.querySelector(".play");
    btn!.addEventListener("click", () => {
        if (gameStarted) return;
        const element = document.getElementById("app");

        // Wait until game finished loading to log URL for RPC
        const openObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (document.contains(document.querySelector(".playing"))) {
                gameStarted = true;
                openObserver.disconnect();
                ipcRenderer.send("gameInfo", {
                    gamemode: (document.querySelector('.block, .modes')!.querySelector('.selected')!.querySelector('.name') as HTMLElement)!.innerText,
                    url: window.location.href
                });

                // Function to be caled when game ends
                function onGameEnd() {
                    gameStarted = false;
                    closeObserver.disconnect();
                    ipcRenderer.send("gameInfo", {
                        gamemode: "Menu",
                        url: ''
                    });
                }
                
                // Watch for game end
                const closeObserver = new MutationObserver((mutations: MutationRecord[]) => {
                    if (document.contains(document.querySelector(".death-reason"))) onGameEnd();
                    mutations.forEach((mutation: MutationRecord)  => {
                        mutation.removedNodes.forEach((removedNode: Node) =>{
                            if((removedNode as HTMLElement)!.className == "game") onGameEnd();
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

