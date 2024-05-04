export type SkinCategory =
    "real"
    | "unrealistic"
    | "season";

export type SkinSeason =
    "lunar"
    | "valentines"
    | "easter"
    | "hallooween"
    | "christmas";

export interface SkinData {
    id: number;
    approved: 1 | 0;
    asset: string;
    attributes: string | null;
    beta: 1 | 0;
    created_at: string;
    data: {
        offset: {
            x: number;
            y: number;
        };
    };
    depends_id: null;
    designer_id: null;
    fish_level: number;
    name: string;
    on_sale: 1 | 0;
    price: number;
    sales: number;
    updated_at: string;
    usable: 1 | 0;
    user_id: number;
    version: number;
    category: SkinCategory;
    season: SkinSeason | null;
    user_username: string;
    user_picture: string;
}

export async function loadAllSkinsFromAnimalId(API_URL: string, animalId: number): Promise<SkinData[]> {
    return await fetch(`${API_URL}/skins?animalId=${animalId}&cat=all`, { credentials: "include" })
        .then(res => res.json());
}

export async function loadSkinFromId(API_URL: string, skinId: number): Promise<SkinData> {
    return await fetch(`${API_URL}/skins/${skinId}`, { credentials: "include" })
        .then(res => res.json());
}