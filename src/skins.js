"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSkinFromId = exports.loadAllSkinsFromAnimalId = void 0;
async function loadAllSkinsFromAnimalId(API_URL, animalId) {
    return await fetch(`${API_URL}/skins?animalId=${animalId}&cat=all`, { credentials: "include" })
        .then(res => res.json());
}
exports.loadAllSkinsFromAnimalId = loadAllSkinsFromAnimalId;
async function loadSkinFromId(API_URL, skinId) {
    return await fetch(`${API_URL}/skins/${skinId}`, { credentials: "include" })
        .then(res => res.json());
}
exports.loadSkinFromId = loadSkinFromId;
