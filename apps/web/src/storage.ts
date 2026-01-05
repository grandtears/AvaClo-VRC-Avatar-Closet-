import type { AvatarBaseMap, AvatarFavMap, AvatarTagMap, BodyBase, FavFolder } from "./types";

const BODY_BASES_KEY = "vam.bodyBases.v1";
export function loadBodyBases(): BodyBase[] {
    try {
        const raw = localStorage.getItem(BODY_BASES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
export function saveBodyBases(list: BodyBase[]) {
    localStorage.setItem(BODY_BASES_KEY, JSON.stringify(list));
}

const AVATAR_BASE_MAP_KEY = "vam.avatarBaseMap.v1";
export function loadAvatarBaseMap(): AvatarBaseMap {
    try {
        const raw = localStorage.getItem(AVATAR_BASE_MAP_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
export function saveAvatarBaseMap(map: AvatarBaseMap) {
    localStorage.setItem(AVATAR_BASE_MAP_KEY, JSON.stringify(map));
}

const FAV_FOLDERS_KEY = "vam.favFolders.v1";
export function loadFavFolders(): FavFolder[] {
    try {
        const raw = localStorage.getItem(FAV_FOLDERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
export function saveFavFolders(list: FavFolder[]) {
    localStorage.setItem(FAV_FOLDERS_KEY, JSON.stringify(list));
}

const AVATAR_FAV_MAP_KEY = "vam.avatarFavMap.v1";
export function loadAvatarFavMap(): AvatarFavMap {
    try {
        const raw = localStorage.getItem(AVATAR_FAV_MAP_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
export function saveAvatarFavMap(map: AvatarFavMap) {
    localStorage.setItem(AVATAR_FAV_MAP_KEY, JSON.stringify(map));
}

const AVATAR_TAG_MAP_KEY = "vam.avatarTagMap.v1";
export function loadAvatarTags(): AvatarTagMap {
    try {
        const raw = localStorage.getItem(AVATAR_TAG_MAP_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
export function saveAvatarTags(map: AvatarTagMap) {
    localStorage.setItem(AVATAR_TAG_MAP_KEY, JSON.stringify(map));
}

const CONFIRM_AVATAR_CHANGE_KEY = "vam.confirmAvatarChange.v1";
export function loadConfirmAvatarChange(): boolean {
    try {
        const raw = localStorage.getItem(CONFIRM_AVATAR_CHANGE_KEY);
        return raw === "true"; // default false if null
    } catch {
        return false;
    }
}
export function saveConfirmAvatarChange(enabled: boolean) {
    localStorage.setItem(CONFIRM_AVATAR_CHANGE_KEY, String(enabled));
}
