const { ipcRenderer } = require('electron');

window.addEventListener("load", () => {
    const btn = document.querySelector(".play");
    const modes = document.querySelector('.block, .modes');
    btn.addEventListener("click", () => {
        ipcRenderer.send("gamemode", 
            document.querySelector('.block, .modes')
                .querySelector('.selected')
                .querySelector('.name').innerText
        );
    })
})